import { Switch, Route } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ChatInterface from "./pages/ChatInterface";
import Quiz from "./pages/Quiz";

function App() {
  const { user, isLoading } = useUser();

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // 未認証の場合は認証ページを表示
  if (!user) {
    return <AuthPage />;
  }

  // 認証済みの場合はアプリケーションのルーティングを表示
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/chat/:id" component={ChatInterface} />
      <Route path="/quiz/:id" component={Quiz} />
      <Route>
        {/* 404ページ */}
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">404 - Page Not Found</h1>
            <p className="text-gray-600">The page you're looking for doesn't exist.</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

export default App;