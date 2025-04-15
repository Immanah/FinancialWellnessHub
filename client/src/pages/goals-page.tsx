import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { GoalCard, CreateGoalCard } from "@/components/dashboard/goal-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CheckCircleIcon, LineChartIcon, TargetIcon } from "lucide-react";
import type { SavingGoal } from "@shared/schema";

// Create goal form schema
const createGoalSchema = z.object({
  name: z.string().min(3, "Goal name must be at least 3 characters"),
  targetAmount: z.string()
    .refine(val => !isNaN(Number(val)), { message: "Target amount must be a number" })
    .refine(val => Number(val) > 0, { message: "Target amount must be greater than 0" }),
  deadline: z.string().optional(),
});

export default function GoalsPage() {
  const { toast } = useToast();
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
  
  // Fetch goals data
  const { 
    data: goals, 
    isLoading: isLoadingGoals 
  } = useQuery<SavingGoal[]>({
    queryKey: ["/api/goals"],
  });

  // Form setup
  const createGoalForm = useForm<z.infer<typeof createGoalSchema>>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      name: "",
      targetAmount: "",
      deadline: "",
    }
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createGoalSchema>) => {
      const goalData = {
        name: data.name,
        targetAmount: data.targetAmount,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined
      };
      
      return await apiRequest("POST", "/api/goals", goalData);
    },
    onSuccess: () => {
      toast({
        title: "Goal created",
        description: "Your savings goal has been created successfully"
      });
      setIsCreateGoalOpen(false);
      createGoalForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create goal",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const onCreateGoalSubmit = (data: z.infer<typeof createGoalSchema>) => {
    createGoalMutation.mutate(data);
  };

  // Filter goals by status
  const filterGoals = (goals: SavingGoal[] | undefined) => {
    if (!goals) return { active: [], completed: [] };
    
    return {
      active: goals.filter(goal => !goal.completed),
      completed: goals.filter(goal => goal.completed)
    };
  };

  const { active: activeGoals, completed: completedGoals } = filterGoals(goals);

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (!goals || goals.length === 0) return 0;
    
    const totalTargetAmount = goals.reduce((sum, goal) => 
      sum + parseFloat(goal.targetAmount.toString()), 0);
    
    const totalCurrentAmount = goals.reduce((sum, goal) => 
      sum + parseFloat(goal.currentAmount.toString()), 0);
    
    return Math.min(Math.round((totalCurrentAmount / totalTargetAmount) * 100), 100);
  };

  // Format currency
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(amount));
  };

  const overallProgress = calculateOverallProgress();

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Savings Goals</h1>
                <p className="text-muted-foreground mt-1">Track your progress towards financial freedom</p>
              </div>
              <div className="mt-4 md:mt-0">
                <Button 
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                  onClick={() => setIsCreateGoalOpen(true)}
                >
                  Create New Goal
                </Button>
              </div>
            </div>
          </header>
          
          {/* Overall Progress */}
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle>Overall Savings Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingGoals ? (
                <Skeleton className="h-4 w-full mb-2" />
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Progress: {overallProgress}%</span>
                    <span className="text-sm font-medium">
                      {goals && goals.length > 0 ? (
                        <>
                          {formatCurrency(goals.reduce((sum, goal) => sum + parseFloat(goal.currentAmount.toString()), 0))}
                          {" / "}
                          {formatCurrency(goals.reduce((sum, goal) => sum + parseFloat(goal.targetAmount.toString()), 0))}
                        </>
                      ) : "No goals yet"}
                    </span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Goals Tabs */}
          <Tabs defaultValue="active" className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="active" className="flex items-center gap-1">
                <TargetIcon className="h-4 w-4" />
                <span>Active Goals ({activeGoals?.length || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-1">
                <CheckCircleIcon className="h-4 w-4" />
                <span>Completed ({completedGoals?.length || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-1">
                <LineChartIcon className="h-4 w-4" />
                <span>Insights</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              {isLoadingGoals ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Skeleton className="h-44 rounded-2xl" />
                  <Skeleton className="h-44 rounded-2xl" />
                  <Skeleton className="h-44 rounded-2xl" />
                </div>
              ) : activeGoals.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                  <CreateGoalCard onClick={() => setIsCreateGoalOpen(true)} />
                </div>
              ) : (
                <div className="text-center py-12">
                  <TargetIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active goals</h3>
                  <p className="text-muted-foreground mb-6">
                    Start saving towards your dreams by creating your first goal
                  </p>
                  <Button 
                    onClick={() => setIsCreateGoalOpen(true)}
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    Create Your First Goal
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed">
              {isLoadingGoals ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Skeleton className="h-44 rounded-2xl" />
                  <Skeleton className="h-44 rounded-2xl" />
                </div>
              ) : completedGoals.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No completed goals yet</h3>
                  <p className="text-muted-foreground">
                    Your completed savings goals will appear here
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="insights">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Savings Breakdown</CardTitle>
                    <CardDescription>
                      How your savings are distributed across goals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingGoals ? (
                      <Skeleton className="h-40 w-full" />
                    ) : goals && goals.length > 0 ? (
                      <div className="space-y-4">
                        {goals.map((goal) => {
                          const percentage = parseFloat(goal.currentAmount.toString()) / 
                            goals.reduce((sum, g) => sum + parseFloat(g.currentAmount.toString()), 0) * 100;
                          
                          return (
                            <div key={goal.id}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">{goal.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {formatCurrency(goal.currentAmount)} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          Create goals to see your savings breakdown
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Contribution</CardTitle>
                    <CardDescription>
                      Recommended monthly savings to reach your goals on time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingGoals ? (
                      <Skeleton className="h-40 w-full" />
                    ) : activeGoals && activeGoals.length > 0 ? (
                      <div className="space-y-4">
                        {activeGoals.map((goal) => {
                          const targetAmount = parseFloat(goal.targetAmount.toString());
                          const currentAmount = parseFloat(goal.currentAmount.toString());
                          const remaining = targetAmount - currentAmount;
                          
                          let monthlyContribution = 0;
                          if (goal.deadline) {
                            const today = new Date();
                            const deadline = new Date(goal.deadline);
                            const monthsDiff = (deadline.getFullYear() - today.getFullYear()) * 12 + 
                              (deadline.getMonth() - today.getMonth());
                            
                            if (monthsDiff > 0) {
                              monthlyContribution = remaining / monthsDiff;
                            } else {
                              monthlyContribution = remaining;
                            }
                          }
                          
                          return (
                            <div key={goal.id} className="flex justify-between items-center">
                              <span className="text-sm font-medium">{goal.name}</span>
                              <span className="text-sm font-bold">
                                {monthlyContribution > 0 
                                  ? formatCurrency(monthlyContribution.toFixed(2)) + "/mo"
                                  : goal.deadline 
                                    ? "Past deadline" 
                                    : "No deadline set"
                                }
                              </span>
                            </div>
                          );
                        })}
                        
                        <div className="pt-4 border-t border-border">
                          <div className="flex justify-between items-center font-bold">
                            <span>Total Monthly Required</span>
                            <span className="text-primary">
                              {formatCurrency(
                                activeGoals.reduce((sum, goal) => {
                                  const targetAmount = parseFloat(goal.targetAmount.toString());
                                  const currentAmount = parseFloat(goal.currentAmount.toString());
                                  const remaining = targetAmount - currentAmount;
                                  
                                  let monthlyContribution = 0;
                                  if (goal.deadline) {
                                    const today = new Date();
                                    const deadline = new Date(goal.deadline);
                                    const monthsDiff = (deadline.getFullYear() - today.getFullYear()) * 12 + 
                                      (deadline.getMonth() - today.getMonth());
                                    
                                    if (monthsDiff > 0) {
                                      monthlyContribution = remaining / monthsDiff;
                                    } else if (remaining > 0) {
                                      monthlyContribution = remaining;
                                    }
                                  }
                                  
                                  return sum + monthlyContribution;
                                }, 0).toFixed(2)
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          Create goals with deadlines to see recommended contributions
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Goal Ideas */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Goal Ideas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <GoalIdeaCard 
                title="Emergency Fund" 
                description="3-6 months of expenses for unexpected costs"
                suggestedAmount="$10,000"
              />
              <GoalIdeaCard 
                title="Vacation" 
                description="Save for your dream getaway"
                suggestedAmount="$3,000"
              />
              <GoalIdeaCard 
                title="Down Payment" 
                description="Save for your future home"
                suggestedAmount="$30,000"
              />
              <GoalIdeaCard 
                title="New Vehicle" 
                description="Replace or upgrade your transportation"
                suggestedAmount="$15,000"
              />
            </div>
          </section>
        </div>
      </main>

      {/* Create Goal Dialog */}
      <Dialog open={isCreateGoalOpen} onOpenChange={setIsCreateGoalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Savings Goal</DialogTitle>
            <DialogDescription>
              Define a target amount and deadline for your new financial goal.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createGoalForm}>
            <form onSubmit={createGoalForm.handleSubmit(onCreateGoalSubmit)} className="space-y-4">
              <FormField
                control={createGoalForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Vacation Fund" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createGoalForm.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>
                      How much do you need to save in total?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createGoalForm.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      When do you want to achieve this goal?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateGoalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createGoalMutation.isPending}
                >
                  {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface GoalIdeaCardProps {
  title: string;
  description: string;
  suggestedAmount: string;
}

function GoalIdeaCard({ title, description, suggestedAmount }: GoalIdeaCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-sm font-medium mt-2">Average goal: {suggestedAmount}</p>
      </CardContent>
      <CardFooter>
        <Button variant="link" className="p-0 h-auto text-primary">
          Create this goal →
        </Button>
      </CardFooter>
    </Card>
  );
}
