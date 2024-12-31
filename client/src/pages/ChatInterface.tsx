import { useState, useRef, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useTutor } from '@/hooks/use-tutor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, ArrowLeft } from 'lucide-react';

// チャットメッセージの型定義
type ChatMessage = {
  content: string;  // メッセージの内容
  isAi: boolean;    // AIからのメッセージかどうか
};

// カリキュラムのセクション型定義
type Section = {
  title: string;          // セクションのタイトル
  description: string;    // セクションの説明
  objectives: string[];   // 学習目標のリスト
  resources: string[];    // 学習リソースのリスト
};

// カリキュラム全体の型定義
type Curriculum = {
  sections: Section[];              // セクションのリスト
  estimatedDuration: string;        // 予定所要時間
  prerequisites: string[];          // 前提条件のリスト
};

export default function ChatInterface() {
  // URLからトピックIDを取得
  const [, params] = useRoute('/chat/:id');
  // ページ遷移用のフック
  const [, setLocation] = useLocation();
  // チューター関連の機能を取得
  const { topics, sendMessage } = useTutor();
  // チャットメッセージの状態管理
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // 入力欄の状態管理
  const [input, setInput] = useState('');
  // 送信中状態の管理
  const [isLoading, setIsLoading] = useState(false);
  // スクロール位置の管理用ref
  const scrollRef = useRef<HTMLDivElement>(null);

  // トピックIDに基づいてトピックを取得
  const topic = topics?.find(t => t.id === Number(params?.id));
  // トピックのカリキュラムを取得
  const curriculum = topic?.curriculum as Curriculum | undefined;

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // メッセージ送信処理
  const handleSubmit = async () => {
    if (!input.trim() || !topic?.id) return;

    setIsLoading(true);
    // ユーザーのメッセージを追加
    setMessages(prev => [...prev, { content: input, isAi: false }]);
    const currentInput = input;
    setInput('');

    try {
      // AIからのレスポンスを取得
      const response = await sendMessage({
        topicId: topic.id,
        message: currentInput,
      });

      if (response) {
        // AIの返答をメッセージリストに追加
        setMessages(prev => [...prev, { content: response.message, isAi: true }]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // エラー時は入力を復元
      setMessages(prev => prev.slice(0, -1));
      setInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  };

  // トピックが見つからない場合のエラー表示
  if (!topic) {
    return <div>トピックが見つかりません</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ダッシュボードに戻るボタン */}
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => setLocation('/')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        ダッシュボードに戻る
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* カリキュラム部分（左側） */}
        <Card className="h-[80vh]">
          <CardContent className="p-4">
            <h2 className="text-2xl font-bold mb-4">{topic.name} - カリキュラム</h2>
            <ScrollArea className="h-[calc(80vh-8rem)]">
              {curriculum ? (
                <div className="space-y-6">
                  {/* 前提条件の表示 */}
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

                  {/* 予定所要時間の表示 */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">予定所要時間</h3>
                    <p>{curriculum.estimatedDuration}</p>
                  </div>

                  {/* セクション一覧の表示 */}
                  <div className="space-y-4">
                    {curriculum.sections.map((section, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                        <p className="text-gray-600 mb-3">{section.description}</p>

                        {/* 学習目標の表示 */}
                        <div className="mb-3">
                          <h4 className="font-medium mb-1">学習目標</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {section.objectives.map((obj, j) => (
                              <li key={j}>{obj}</li>
                            ))}
                          </ul>
                        </div>

                        {/* 学習リソースの表示 */}
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
            {/* チャットヘッダー */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold">{topic.name} - チャット</h2>
              <p className="text-gray-500">{topic.description}</p>
            </div>

            {/* メッセージ表示エリア */}
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

            {/* メッセージ入力エリア */}
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