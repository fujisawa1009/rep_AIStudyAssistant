import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { Topic, Quiz, ChatHistory } from '@db/schema';

export function useTutor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      toast({
        title: "成功",
        description: "トピックが作成されました",
      });
    },
  });

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

  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['/api/analysis'],
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: `分析データの取得に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  return {
    topics,
    topicsLoading,
    createTopic: createTopicMutation.mutateAsync,
    deleteTopic: deleteTopicMutation.mutateAsync,
    createQuiz: createQuizMutation.mutateAsync,
    submitQuiz: submitQuizMutation.mutateAsync,
    sendMessage: sendMessageMutation.mutateAsync,
    analysis,
    analysisLoading,
  };
}