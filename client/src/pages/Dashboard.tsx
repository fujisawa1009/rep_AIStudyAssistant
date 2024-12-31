import { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { useTutor } from '@/hooks/use-tutor';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Loader2, BookOpen, MessageSquare, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const topicSchema = z.object({
  name: z.string().min(1, "トピック名は必須です"),
  description: z.string().min(1, "説明は必須です"),
});

type TopicForm = z.infer<typeof topicSchema>;

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const { topics, topicsLoading, createTopic, analysis, analysisLoading } = useTutor();
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<TopicForm>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: TopicForm) => {
    setIsCreating(true);
    try {
      await createTopic(data);
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "成功",
        description: "トピックが作成されました",
      });
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message || "トピックの作成に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (topicsLoading || analysisLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">ようこそ、{user?.username}さん！</h1>
        <Button variant="ghost" onClick={() => logout()}>ログアウト</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                学習トピック
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full mb-4">新しいトピックを追加</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新しいトピックの作成</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>トピック名</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isCreating} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>説明</FormLabel>
                            <FormControl>
                              <Textarea {...field} disabled={isCreating} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={isCreating}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        トピックを作成
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <div className="space-y-4">
                {topics?.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    まだトピックがありません。新しいトピックを作成してみましょう！
                  </p>
                ) : (
                  topics?.map((topic) => (
                    <Card key={topic.id} className="cursor-pointer hover:bg-gray-50">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{topic.name}</h3>
                          <p className="text-sm text-gray-500">{topic.description}</p>
                        </div>
                        <div className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/chat/${topic.id}`)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            チャット
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/quiz/${topic.id}`)}
                          >
                            <Brain className="h-4 w-4 mr-1" />
                            クイズ
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>学習の進捗</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis ? (
                <div className="prose">
                  <h4>改善が必要な分野：</h4>
                  <ul>
                    {Object.entries(analysis as Record<string, string>).map(([area, details]) => (
                      <li key={area}>
                        <strong>{area}:</strong> {details}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  クイズを受けて学習の進捗を確認しましょう！
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}