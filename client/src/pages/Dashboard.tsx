// ダッシュボードページのメインコンポーネント
// ユーザーの学習トピックと進捗状況を表示し、トピックの作成・管理を行う
import { useState } from 'react';
// ユーザー認証状態を管理するカスタムフック
import { useUser } from '@/hooks/use-user';
// チューター関連のAPI呼び出しとデータ管理を行うカスタムフック
import { useTutor } from '@/hooks/use-tutor';
// URLの管理を行うフック
import { useLocation } from 'wouter';
// カードコンポーネント
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// ボタンコンポーネント
import { Button } from '@/components/ui/button';
// 入力欄コンポーネント
import { Input } from '@/components/ui/input';
// テキストエリアコンポーネント
import { Textarea } from '@/components/ui/textarea';
// ダイアログコンポーネント
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
// フォームコンポーネント
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
// React Hook Formライブラリ
import { useForm } from 'react-hook-form';
// アイコンライブラリ
import { Loader2, BookOpen, MessageSquare, Brain, Trash2 } from 'lucide-react';
// トースト通知を行うカスタムフック
import { useToast } from '@/hooks/use-toast';
// データバリデーションライブラリ
import { z } from 'zod';
// React Hook FormとZodの連携ライブラリ
import { zodResolver } from '@hookform/resolvers/zod';
// データベーススキーマからのTopic型
import type { Topic } from '@db/schema';
// アラートダイアログコンポーネント
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

// トピック作成フォームのバリデーションスキーマ
// name: 必須項目、最小文字数1
// description: 必須項目、最小文字数1
const topicSchema = z.object({
  name: z.string().min(1, "トピック名は必須です"),
  description: z.string().min(1, "説明は必須です"),
});

// TopicSchemaから推論された型
type TopicForm = z.infer<typeof topicSchema>;

// 学習分析結果の型定義
// weakAreas: 弱点領域とその説明
// recommendations: 推奨事項の配列
type Analysis = {
  weakAreas: Record<string, string>;
  recommendations: string[];
};

export default function Dashboard() {
  // ページ遷移のためのフック、setLocationでURLを変更するが、ここでは使用しないため、アンダースコアで無視
  const [, setLocation] = useLocation();
  // ユーザー情報とログアウト関数を取得
  const { user, logout } = useUser();
  // トピック一覧、トピック作成、分析結果、削除機能などを取得
  const { topics = [], topicsLoading, createTopic, analysis, analysisLoading, deleteTopic } = useTutor();
  // トピック作成ダイアログの表示状態を管理
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // トースト通知用のフック
  const { toast } = useToast();

  // トピック作成フォームの定義
  // zodResolverでバリデーション、defaultValuesで初期値を設定
  const form = useForm<TopicForm>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // トピック作成フォームの送信処理
  // createTopicでAPI呼び出し、成功・失敗でトースト通知
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

  // ローディング中の表示
  if (topicsLoading || analysisLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー部分：ユーザー名とログアウトボタン */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">ようこそ、{user?.username}さん！</h1>
        <Button variant="ghost" onClick={() => logout()}>ログアウト</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 左側：学習トピック一覧 */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                学習トピック
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* トピック作成ダイアログ */}
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

              {/* トピック一覧の表示 */}
              <div className="grid gap-4">
                {(topics as Topic[]).length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    まだトピックがありません。新しいトピックを作成してみましょう！
                  </p>
                ) : (
                  (topics as Topic[]).map((topic) => (
                    <Card key={topic.id} className="hover:bg-gray-50">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div>
                            <h3 className="font-medium text-lg">{topic.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">{topic.description}</p>
                          </div>
                          {/* トピックに対するアクションボタン */}
                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/chat/${topic.id}`)}
                              className="flex-1"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              チャット
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/quiz/${topic.id}`)}
                              className="flex-1"
                            >
                              <Brain className="h-4 w-4 mr-1" />
                              クイズ
                            </Button>
                            {/* トピック削除の確認ダイアログ */}
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
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 右側：学習進捗の表示 */}
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
                    {Object.entries((analysis as Analysis).weakAreas).map(([area, details]) => (
                      <li key={area}>
                        <strong>{area}:</strong> {details}
                      </li>
                    ))}
                  </ul>
                  <h4>推奨事項：</h4>
                  <ul>
                    {(analysis as Analysis).recommendations.map((recommendation, index) => (
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