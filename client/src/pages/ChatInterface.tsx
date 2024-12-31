import { useState, useRef, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useTutor } from '@/hooks/use-tutor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';

type ChatMessage = {
  content: string;
  isAi: boolean;
};

type Section = {
  title: string;
  description: string;
  objectives: string[];
  resources: string[];
};

type Curriculum = {
  sections: Section[];
  estimatedDuration: string;
  prerequisites: string[];
};

export default function ChatInterface() {
  const [, params] = useRoute('/chat/:id');
  const { topics, sendMessage } = useTutor();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const topic = topics?.find(t => t.id === Number(params?.id));
  const curriculum = topic?.curriculum as Curriculum | undefined;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || !topic?.id) return;

    setIsLoading(true);
    setMessages(prev => [...prev, { content: input, isAi: false }]);
    const currentInput = input;
    setInput('');

    try {
      const response = await sendMessage({
        topicId: topic.id,
        message: currentInput,
      });

      if (response) {
        setMessages(prev => [...prev, { content: response.message, isAi: true }]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.slice(0, -1));
      setInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  };

  if (!topic) {
    return <div>トピックが見つかりません</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* カリキュラム部分（左側） */}
        <Card className="h-[80vh]">
          <CardContent className="p-4">
            <h2 className="text-2xl font-bold mb-4">{topic.name} - カリキュラム</h2>
            <ScrollArea className="h-[calc(80vh-8rem)]">
              {curriculum ? (
                <div className="space-y-6">
                  {curriculum.prerequisites.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">前提条件</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {curriculum.prerequisites.map((prereq, i) => (
                          <li key={i}>{prereq}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold mb-2">予定所要時間</h3>
                    <p>{curriculum.estimatedDuration}</p>
                  </div>

                  <div className="space-y-4">
                    {curriculum.sections.map((section, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                        <p className="text-gray-600 mb-3">{section.description}</p>

                        <div className="mb-3">
                          <h4 className="font-medium mb-1">学習目標</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {section.objectives.map((obj, j) => (
                              <li key={j}>{obj}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium mb-1">学習リソース</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {section.resources.map((res, j) => (
                              <li key={j}>{res}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  カリキュラムが読み込まれていません
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* チャット部分（右側） */}
        <Card className="h-[80vh] flex flex-col">
          <CardContent className="flex-1 p-4 flex flex-col">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">{topic.name} - チャット</h2>
              <p className="text-gray-500">{topic.description}</p>
            </div>

            <ScrollArea ref={scrollRef} className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.isAi ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.isAi
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-4 flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="チューターに質問してみましょう..."
                className="resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="px-8"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}