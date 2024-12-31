import { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

// 認証フォームのバリデーションスキーマ
const authSchema = z.object({
  username: z.string().min(3, 'ユーザー名は3文字以上である必要があります'),
  password: z.string().min(6, 'パスワードは6文字以上である必要があります'),
});

type AuthForm = z.infer<typeof authSchema>;

export default function AuthPage() {
  const { login, register } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const form = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: AuthForm) => {
    setIsLoading(true);
    try {
      if (isRegister) {
        await register(data);
      } else {
        await login(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>{isRegister ? '新規登録' : 'ログイン'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ユーザー名</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>パスワード</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isRegister ? '登録' : 'ログイン'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsRegister(!isRegister)}
                  disabled={isLoading}
                >
                  {isRegister ? 'アカウントをお持ちの方はこちら' : 'アカウントをお持ちでない方はこちら'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}