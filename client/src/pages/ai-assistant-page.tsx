import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiChat } from "@/components/dashboard/ai-chat";
import { useQuery } from "@tanstack/react-query";
import { BrainCircuitIcon, LineChartIcon, PiggyBankIcon, SparklesIcon } from "lucide-react";
import type { AiAdvice } from "@shared/schema";
import { format } from "date-fns";

export default function AiAssistantPage() {
  // Fetch previous AI advice
  const { data: advices } = useQuery<AiAdvice[]>({
    queryKey: ["/api/ai/advice"],
  });

  const categorizeAdvice = (advices: AiAdvice[] | undefined) => {
    if (!advices) return {
      financial: [],
      savings: [],
      insights: [],
      all: []
    };

    return {
      financial: advices.filter(advice => 
        advice.query.toLowerCase().includes("budget") || 
        advice.query.toLowerCase().includes("spend") ||
        advice.query.toLowerCase().includes("money") ||
        advice.query.toLowerCase().includes("finance")
      ),
      savings: advices.filter(advice => 
        advice.query.toLowerCase().includes("save") || 
        advice.query.toLowerCase().includes("goal") ||
        advice.query.toLowerCase().includes("invest")
      ),
      insights: advices.filter(advice => 
        advice.query.toLowerCase().includes("suggest") || 
        advice.query.toLowerCase().includes("help") ||
        advice.query.toLowerCase().includes("improve") ||
        advice.query.toLowerCase().includes("optimize")
      ),
      all: advices
    };
  };

  const categorizedAdvice = categorizeAdvice(advices);

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Financial Assistant</h1>
              <p className="text-muted-foreground mt-1">Your personal advisor for financial wellness</p>
            </div>
          </header>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Section */}
            <div className="lg:col-span-2">
              <Card className="h-[600px]">
                <CardHeader>
                  <CardTitle>Ask anything about your finances</CardTitle>
                  <CardDescription>
                    I can help with budgeting, saving goals, investment advice, and more
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[500px]">
                  <AiChat />
                </CardContent>
              </Card>
            </div>
            
            {/* Suggested Questions & History */}
            <div className="lg:col-span-1">
              <Card className="h-[600px]">
                <CardHeader>
                  <CardTitle>Quick Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="suggestions" className="h-[460px]">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="suggestions" className="space-y-4 overflow-auto h-[420px] pr-2">
                      <SuggestedQuestionCard 
                        icon={<LineChartIcon className="h-5 w-5 text-primary" />}
                        title="Budgeting Analysis"
                        questions={[
                          "How can I improve my monthly budget?",
                          "Where am I spending too much money?",
                          "Can you analyze my spending patterns?",
                          "What's my biggest unnecessary expense?"
                        ]}
                      />
                      
                      <SuggestedQuestionCard 
                        icon={<PiggyBankIcon className="h-5 w-5 text-green-500" />}
                        title="Savings Optimization"
                        questions={[
                          "How much should I save each month?",
                          "What's the best way to reach my savings goals?",
                          "Can I afford to save more?",
                          "What savings strategy works best for my income?"
                        ]}
                      />
                      
                      <SuggestedQuestionCard 
                        icon={<SparklesIcon className="h-5 w-5 text-purple-500" />}
                        title="Financial Wellness"
                        questions={[
                          "How can I reduce financial stress?",
                          "What habits would improve my financial health?",
                          "How does my spending affect my mood?",
                          "What's a healthy money mindset?"
                        ]}
                      />
                      
                      <SuggestedQuestionCard 
                        icon={<BrainCircuitIcon className="h-5 w-5 text-blue-500" />}
                        title="Smart Planning"
                        questions={[
                          "What should I do with extra money this month?",
                          "Is now a good time to make a big purchase?",
                          "How can I balance multiple financial goals?",
                          "What expenses should I prioritize?"
                        ]}
                      />
                    </TabsContent>
                    
                    <TabsContent value="history" className="overflow-auto h-[420px] pr-2">
                      <div className="space-y-4">
                        {categorizedAdvice.all.length > 0 ? (
                          categorizedAdvice.all.map((advice) => (
                            <div key={advice.id} className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="font-medium text-foreground">{advice.query}</h3>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(advice.date), "MMM d, yyyy")}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {advice.response.replace(/<[^>]*>?/gm, '')}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No conversation history yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Ask a question to get started
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Recent Advice Categories */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdviceCategoryCard 
              title="Financial Advice" 
              icon={<LineChartIcon className="h-5 w-5 text-primary" />}
              advices={categorizedAdvice.financial}
            />
            
            <AdviceCategoryCard 
              title="Savings Strategies" 
              icon={<PiggyBankIcon className="h-5 w-5 text-green-500" />}
              advices={categorizedAdvice.savings}
            />
            
            <AdviceCategoryCard 
              title="Personal Insights" 
              icon={<SparklesIcon className="h-5 w-5 text-purple-500" />}
              advices={categorizedAdvice.insights}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

interface SuggestedQuestionCardProps {
  icon: React.ReactNode;
  title: string;
  questions: string[];
}

function SuggestedQuestionCard({ icon, title, questions }: SuggestedQuestionCardProps) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        {icon}
        <h3 className="font-medium">{title}</h3>
      </div>
      <ul className="space-y-2">
        {questions.map((question, index) => (
          <li key={index}>
            <button className="text-sm text-left w-full text-muted-foreground hover:text-primary transition-colors py-1 px-2 rounded-md hover:bg-muted/50">
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface AdviceCategoryCardProps {
  title: string;
  icon: React.ReactNode;
  advices: AiAdvice[];
}

function AdviceCategoryCard({ title, icon, advices }: AdviceCategoryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {advices.length > 0 ? (
          <div className="space-y-2">
            {advices.slice(0, 3).map((advice) => (
              <div key={advice.id} className="border-b border-border pb-2 last:border-0">
                <p className="text-sm font-medium">{advice.query}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(advice.date), "MMM d, yyyy")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No advice in this category yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
