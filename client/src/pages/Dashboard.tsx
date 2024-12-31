import { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { useTutor } from '@/hooks/use-tutor';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Loader2, BookOpen, MessageSquare, Brain, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const topicSchema = z.object({
  name: z.string().min(1, "トピック名は必須です"),
  description: z.string().min(1, "説明は必須です"),
});

type TopicForm = z.infer<typeof topicSchema>;

type Analysis = {
  weakAreas: Record<string, string>;
  recommendations: string[];
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const { topics = [], topicsLoading, createTopic, analysis, analysisLoading, deleteTopic } = useTutor();
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
    }
  };

  if (topicsLoading || analysisLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const typedAnalysis = analysis as Analysis | undefined;

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
                    <DialogClose />
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
                              <Input {...field} />
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
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false);
                            form.reset();
                          }}
                        >
                          キャンセル
                        </Button>
                        <Button type="submit">
                          トピックを作成
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <div className="space-y-4">
                {topics.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    まだトピックがありません。新しいトピックを作成してみましょう！
                  </p>
                ) : (
                  topics.map((topic) => (
                    <Card key={topic.id} className="cursor-pointer hover:bg-gray-50">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{topic.name}</h3>
                          <p className="text-sm text-gray-500">{topic.description}</p>
                        </div>
                        <div className="space-x-2 flex items-center">
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>トピックの削除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  「{topic.name}」を削除してもよろしいですか？
                                  この操作は取り消せません。関連するクイズ結果やチャット履歴も削除されます。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    try {
                                      await deleteTopic(topic.id);
                                      toast({
                                        title: "成功",
                                        description: `${topic.name}が削除されました`,
                                      });
                                    } catch (error) {
                                      console.error('Failed to delete topic:', error);
                                      toast({
                                        title: "エラー",
                                        description: "トピックの削除に失敗しました",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  削除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
              {typedAnalysis ? (
                <div className="prose">
                  <h4>改善が必要な分野：</h4>
                  <ul>
                    {Object.entries(typedAnalysis.weakAreas).map(([area, details]) => (
                      <li key={area}>
                        <strong>{area}:</strong> {details}
                      </li>
                    ))}
                  </ul>
                  <h4>推奨事項：</h4>
                  <ul>
                    {typedAnalysis.recommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
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