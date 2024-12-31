import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { Topic, Quiz, ChatHistory } from '@db/schema';

export function useTutor() {
  const { toast } = useToast();

  const { data: topics, isLoading: topicsLoading } = useQuery<Topic[]>({
    queryKey: ['/api/topics'],
  });

  const createTopicMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Topic created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const createQuizMutation = useMutation({
    mutationFn: async (topicId: number) => {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json() as Promise<Quiz>;
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (data: { quizId: number; score: number; answers: any[] }) => {
      const response = await fetch('/api/quiz-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { topicId: number; message: string }) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json() as Promise<ChatHistory>;
    },
  });

  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['/api/analysis'],
  });

  return {
    topics,
    topicsLoading,
    createTopic: createTopicMutation.mutateAsync,
    createQuiz: createQuizMutation.mutateAsync,
    submitQuiz: submitQuizMutation.mutateAsync,
    sendMessage: sendMessageMutation.mutateAsync,
    analysis,
    analysisLoading,
  };
}
