import { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { useTutor } from '@/hooks/use-tutor';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Loader2, BookOpen, MessageSquare, Brain } from 'lucide-react';

type TopicForm = {
  name: string;
  description: string;
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const { topics, topicsLoading, createTopic, analysis, analysisLoading } = useTutor();
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<TopicForm>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: TopicForm) => {
    setIsCreating(true);
    try {
      await createTopic(data);
      form.reset();
    } finally {
      setIsCreating(false);
    }
  };

  if (topicsLoading || analysisLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user?.username}!</h1>
        <Button variant="ghost" onClick={() => logout()}>Logout</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Your Learning Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full mb-4">Add New Topic</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Topic</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Topic Name</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isCreating} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} disabled={isCreating} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={isCreating}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Topic
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <div className="space-y-4">
                {topics?.map((topic) => (
                  <Card key={topic.id} className="cursor-pointer hover:bg-gray-50">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{topic.name}</h3>
                        <p className="text-sm text-gray-500">{topic.description}</p>
                      </div>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/chat/${topic.id}`)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/quiz/${topic.id}`)}
                        >
                          <Brain className="h-4 w-4 mr-1" />
                          Quiz
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis && (
                <div className="prose">
                  <h4>Areas for Improvement:</h4>
                  <ul>
                    {Object.entries(analysis).map(([area, details]) => (
                      <li key={area}>
                        <strong>{area}:</strong> {details}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
