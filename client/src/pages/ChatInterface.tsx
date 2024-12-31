import { useState, useRef, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useTutor } from '@/hooks/use-tutor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';

export default function ChatInterface() {
  const [, params] = useRoute('/chat/:id');
  const { topics, sendMessage } = useTutor();
  const [messages, setMessages] = useState<Array<{ content: string; isAi: boolean }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const topic = topics?.find(t => t.id === Number(params?.id));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || !topic) return;

    setIsLoading(true);
    setMessages(prev => [...prev, { content: input, isAi: false }]);
    setInput('');

    try {
      const response = await sendMessage({
        topicId: topic.id,
        message: input,
      });
      setMessages(prev => [...prev, { content: response.message, isAi: true }]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!topic) {
    return <div>Topic not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="h-[80vh] flex flex-col">
        <CardContent className="flex-1 p-4 flex flex-col">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">{topic.name}</h2>
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
              placeholder="Ask your tutor a question..."
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
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
  );
}
