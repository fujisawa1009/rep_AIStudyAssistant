import { useState } from 'react';
import { useRoute } from 'wouter';
import { useTutor } from '@/hooks/use-tutor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

// クイズの問題の型定義
type Question = {
  question: string;     // 問題文
  options: string[];    // 選択肢のリスト
  correctAnswer: number; // 正解のインデックス
};

export default function Quiz() {
  // URLからトピックIDを取得
  const [, params] = useRoute('/quiz/:id');
  // チューター関連の機能を取得
  const { topics, createQuiz, submitQuiz } = useTutor();
  // クイズの状態管理
  const [quiz, setQuiz] = useState<{ id: number; questions: Question[] } | null>(null);
  // 現在の問題番号
  const [currentQuestion, setCurrentQuestion] = useState(0);
  // ユーザーの回答履歴
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  // ローディング状態
  const [isLoading, setIsLoading] = useState(false);
  // 結果表示状態
  const [showResults, setShowResults] = useState(false);

  // トピックIDに基づいてトピックを取得
  const topic = topics?.find(t => t.id === Number(params?.id));

  // クイズの開始処理
  const startQuiz = async () => {
    if (!topic) return;
    setIsLoading(true);
    try {
      // 新しいクイズを作成
      const newQuiz = await createQuiz(topic.id);
      setQuiz(newQuiz);
      setSelectedAnswers([]);
      setCurrentQuestion(0);
      setShowResults(false);
    } catch (error) {
      console.error('Failed to create quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 回答選択時の処理
  const handleAnswer = (answer: number) => {
    setSelectedAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestion] = answer;
      return newAnswers;
    });
  };

  // 次の問題へ進む処理
  const nextQuestion = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  // クイズ終了時の処理
  const finishQuiz = async () => {
    if (!quiz) return;

    // スコアの計算
    const score = selectedAnswers.reduce((acc, answer, index) => {
      return acc + (answer === quiz.questions[index].correctAnswer ? 1 : 0);
    }, 0);

    // 結果を送信
    await submitQuiz({
      quizId: quiz.id,
      score,
      answers: selectedAnswers,
    });

    setShowResults(true);
  };

  // トピックが見つからない場合のエラー表示
  if (!topic) {
    return <div>Topic not found</div>;
  }

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // クイズ開始前の表示
  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Start Quiz: {topic.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Test your knowledge of {topic.name} with a quick quiz!</p>
            <Button onClick={startQuiz}>Start Quiz</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // クイズ結果の表示
  if (showResults) {
    const score = selectedAnswers.reduce((acc, answer, index) => {
      return acc + (answer === quiz.questions[index].correctAnswer ? 1 : 0);
    }, 0);

    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-lg">
                Your score: {score} out of {quiz.questions.length}
              </p>
              <Progress value={(score / quiz.questions.length) * 100} />
              <Button onClick={startQuiz}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // クイズ問題の表示
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>
            Question {currentQuestion + 1} of {quiz.questions.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-lg font-medium">{quiz.questions[currentQuestion].question}</p>
            <RadioGroup
              value={selectedAnswers[currentQuestion]?.toString()}
              onValueChange={(value) => handleAnswer(parseInt(value))}
            >
              {quiz.questions[currentQuestion].options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            <Button
              onClick={nextQuestion}
              disabled={selectedAnswers[currentQuestion] === undefined}
            >
              {currentQuestion < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}