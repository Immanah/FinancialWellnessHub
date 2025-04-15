import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import type { SavingGoal } from "@shared/schema";

interface GoalCardProps {
  goal: SavingGoal;
  className?: string;
}

export function GoalCard({ goal, className }: GoalCardProps) {
  const { toast } = useToast();
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);

  // Calculate progress percentage
  const targetAmount = parseFloat(goal.targetAmount.toString());
  const currentAmount = parseFloat(goal.currentAmount.toString());
  const progressPercent = Math.min(Math.round((currentAmount / targetAmount) * 100), 100);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate days left
  const calculateDaysLeft = () => {
    if (!goal.deadline) return 'No deadline';
    
    const today = new Date();
    const deadlineDate = new Date(goal.deadline);
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed';
  };

  // Add funds form schema
  const addFundsSchema = z.object({
    amount: z.string()
      .refine(val => !isNaN(Number(val)), { message: "Amount must be a number" })
      .refine(val => Number(val) > 0, { message: "Amount must be greater than 0" })
  });

  const form = useForm<z.infer<typeof addFundsSchema>>({
    resolver: zodResolver(addFundsSchema),
    defaultValues: {
      amount: ""
    },
  });

  // Add funds mutation
  const addFundsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addFundsSchema>) => {
      return await apiRequest("PATCH", `/api/goals/${goal.id}`, {
        amount: data.amount
      });
    },
    onSuccess: () => {
      toast({
        title: "Funds added",
        description: `You've successfully added funds to your ${goal.name} goal.`,
      });
      setIsAddFundsOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add funds",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof addFundsSchema>) => {
    addFundsMutation.mutate(data);
  };

  // Progress color based on completion percentage
  const getProgressColor = () => {
    if (progressPercent >= 75) return "bg-green-500";
    if (progressPercent >= 50) return "bg-blue-500";
    if (progressPercent >= 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <>
      <Card className={cn("bubble-card p-5 hover:translate-y-[-4px] transition-all", className)}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-foreground">{goal.name}</h3>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary-light/20 text-primary">
            {progressPercent}% Complete
          </span>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">{formatCurrency(currentAmount)} saved</span>
            <span className="text-foreground">{formatCurrency(targetAmount)} goal</span>
          </div>
          <Progress 
            value={progressPercent} 
            className="h-2 w-full bg-muted"
          />
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">{calculateDaysLeft()}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary font-medium hover:text-primary-dark hover:bg-primary/10"
            onClick={() => setIsAddFundsOpen(true)}
          >
            Add funds
          </Button>
        </div>
      </Card>

      {/* Add Funds Dialog */}
      <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add funds to {goal.name}</DialogTitle>
            <DialogDescription>
              You're currently at {formatCurrency(currentAmount)} of your {formatCurrency(targetAmount)} goal.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0.00" 
                        {...field} 
                        type="number" 
                        step="0.01"
                        min="0.01"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddFundsOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addFundsMutation.isPending}
                >
                  {addFundsMutation.isPending ? "Adding..." : "Add Funds"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CreateGoalCardProps {
  onClick: () => void;
}

export function CreateGoalCard({ onClick }: CreateGoalCardProps) {
  return (
    <Card 
      className="bubble-card p-5 flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <PlusIcon className="h-6 w-6 text-muted-foreground" />
      </div>
      <span className="text-muted-foreground font-medium">Create New Goal</span>
    </Card>
  );
}
