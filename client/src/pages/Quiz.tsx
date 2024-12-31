import { useState } from 'react';
import { useRoute } from 'wouter';
import { useTutor } from '@/hooks/use-tutor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
};

export default function Quiz() {
  const [, params] = useRoute('/quiz/:id');
  const { topics, createQuiz, submitQuiz } = useTutor();
  const [quiz, setQuiz] = useState<{ id: number; questions: Question[] } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const topic = topics?.find(t => t.id === Number(params?.id));

  const startQuiz = async () => {
    if (!topic) return;
    setIsLoading(true);
    try {
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

  const handleAnswer = (answer: number) => {
    setSelectedAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestion] = answer;
      return newAnswers;
    });
  };

  const nextQuestion = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!quiz) return;

    const score = selectedAnswers.reduce((acc, answer, index) => {
      return acc + (answer === quiz.questions[index].correctAnswer ? 1 : 0);
    }, 0);

    await submitQuiz({
      quizId: quiz.id,
      score,
      answers: selectedAnswers,
    });

    setShowResults(true);
  };

  if (!topic) {
    return <div>Topic not found</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

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
