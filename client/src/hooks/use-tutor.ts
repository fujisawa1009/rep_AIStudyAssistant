// チューター機能に関連するカスタムフック
// トピックの管理、クイズ、チャット、学習分析などの機能を提供
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { Topic, Quiz, ChatHistory } from '@db/schema';

// 学習分析結果の型定義
type Analysis = {
  weakAreas: Record<string, string>;  // 改善が必要な分野とその詳細
  recommendations: string[];          // 推奨される学習方法のリスト
};

export function useTutor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // トピック一覧の取得
  // GET /api/topics エンドポイントからユーザーの学習トピックを取得
  const { data: topics, isLoading: topicsLoading } = useQuery<Topic[]>({
    queryKey: ['/api/topics'],
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: `トピックの取得に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // トピックの作成
  // POST /api/topics エンドポイントで新しいトピックを作成
  const createTopicMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      return response.json() as Promise<Topic>;
    },
    onSuccess: () => {
      // 作成成功後、トピック一覧を更新
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      toast({
        title: "成功",
        description: "トピックが作成されました",
      });
    },
  });

  // トピックの削除
  // DELETE /api/topics/:id エンドポイントで指定されたトピックを削除
  const deleteTopicMutation = useMutation({
    mutationFn: async (topicId: number) => {
      const response = await fetch(`/api/topics/${topicId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      return response.json();
    },
    onSuccess: () => {
      // 削除成功後、トピック一覧を更新
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      toast({
        title: "成功",
        description: "トピックが削除されました",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: `トピックの削除に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // クイズの作成
  // POST /api/quizzes エンドポイントで新しいクイズを作成
  const createQuizMutation = useMutation({
    mutationFn: async (topicId: number) => {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      return response.json() as Promise<Quiz>;
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: `クイズの作成に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // クイズ結果の送信
  // POST /api/quiz-results エンドポイントでクイズの結果を保存
  const submitQuizMutation = useMutation({
    mutationFn: async (data: { quizId: number; score: number; answers: any[] }) => {
      const response = await fetch('/api/quiz-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      return response.json();
    },
    onSuccess: () => {
      // 結果送信成功後、分析データを更新
      queryClient.invalidateQueries({ queryKey: ['/api/analysis'] });
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: `クイズの結果送信に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // チャットメッセージの送信
  // POST /api/chat エンドポイントでメッセージを送信し、AIの応答を取得
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { topicId: number; message: string }) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      return response.json() as Promise<ChatHistory>;
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: `メッセージの送信に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // 学習分析データの取得
  // GET /api/analysis エンドポイントから学習進捗の分析結果を取得
  const { data: analysis, isLoading: analysisLoading } = useQuery<Analysis>({
    queryKey: ['/api/analysis'],
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: `分析データの取得に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // 各機能をオブジェクトとしてエクスポート
  return {
    topics,                  // トピック一覧
    topicsLoading,          // トピック読み込み状態
    createTopic: createTopicMutation.mutateAsync,    // トピック作成
    deleteTopic: deleteTopicMutation.mutateAsync,    // トピック削除
    createQuiz: createQuizMutation.mutateAsync,      // クイズ作成
    submitQuiz: submitQuizMutation.mutateAsync,      // クイズ結果送信
    sendMessage: sendMessageMutation.mutateAsync,    // チャットメッセージ送信
    analysis,               // 学習分析結果
    analysisLoading,        // 分析データ読み込み状態
  };
}