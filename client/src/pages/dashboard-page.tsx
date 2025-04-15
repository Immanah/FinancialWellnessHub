import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { AccountCard } from "@/components/dashboard/account-card";
import { GoalCard, CreateGoalCard } from "@/components/dashboard/goal-card";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { AiChat } from "@/components/dashboard/ai-chat";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { MoodTracker } from "@/components/dashboard/mood-tracker";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { BankAccount, SavingGoal } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Fetch accounts data
  const { 
    data: accounts, 
    isLoading: isLoadingAccounts 
  } = useQuery<BankAccount[]>({
    queryKey: ["/api/accounts"],
  });

  // Fetch goals data
  const { 
    data: goals, 
    isLoading: isLoadingGoals 
  } = useQuery<SavingGoal[]>({
    queryKey: ["/api/goals"],
  });

  const handleNewGoal = () => {
    setLocation("/goals");
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Good {getTimeOfDay()}, {user?.name?.split(' ')[0] || 'there'}
                </h1>
                <p className="text-muted-foreground mt-1">Here's your financial overview</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Button 
                  variant="outline" 
                  className="flex items-center space-x-2"
                  onClick={() => setLocation("/accounts")}
                >
                  <ArrowUpIcon className="h-4 w-4" />
                  <span>Transfer</span>
                </Button>
                <Button 
                  className="flex items-center space-x-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                  onClick={() => setLocation("/accounts")}
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>New Payment</span>
                </Button>
              </div>
            </div>
          </header>
          
          {/* Accounts Summary */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Your Accounts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoadingAccounts ? (
                <>
                  <Skeleton className="h-36 rounded-2xl" />
                  <Skeleton className="h-36 rounded-2xl" />
                </>
              ) : accounts && accounts.length > 0 ? (
                accounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))
              ) : (
                <div className="col-span-2 p-6 text-center bg-white rounded-2xl shadow-card">
                  <p className="text-muted-foreground">No accounts found</p>
                  <Button 
                    className="mt-2"
                    onClick={() => setLocation("/accounts")}
                  >
                    Add Account
                  </Button>
                </div>
              )}
            </div>
          </section>
          
          {/* Saving Goals */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">Saving Goals</h2>
              <Button 
                variant="link" 
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center"
                onClick={() => setLocation("/goals")}
              >
                <span>View All</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoadingGoals ? (
                <>
                  <Skeleton className="h-44 rounded-2xl" />
                  <Skeleton className="h-44 rounded-2xl" />
                  <Skeleton className="h-44 rounded-2xl" />
                </>
              ) : goals && goals.length > 0 ? (
                <>
                  {goals.slice(0, 2).map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                  <CreateGoalCard onClick={handleNewGoal} />
                </>
              ) : (
                <>
                  <div className="col-span-2 p-6 text-center bg-white rounded-2xl shadow-card">
                    <p className="text-muted-foreground">No savings goals found</p>
                    <Button 
                      className="mt-2"
                      onClick={handleNewGoal}
                    >
                      Create a Goal
                    </Button>
                  </div>
                  <CreateGoalCard onClick={handleNewGoal} />
                </>
              )}
            </div>
          </section>
          
          {/* Recent Transactions & AI Assistant */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <section className="lg:col-span-2">
              <div className="bg-white shadow-card rounded-2xl p-5">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
                  <Button 
                    variant="link" 
                    className="text-sm font-medium text-primary hover:text-primary/80"
                    onClick={() => setLocation("/accounts")}
                  >
                    View All
                  </Button>
                </div>
                
                <TransactionList />
              </div>
            </section>
            
            {/* AI Assistant */}
            <section className="lg:col-span-1">
              <div className="bg-white shadow-card rounded-2xl h-full p-5 flex flex-col">
                <h2 className="text-lg font-semibold text-foreground mb-4">Financial Assistant</h2>
                <AiChat />
              </div>
            </section>
          </div>
          
          {/* Monthly Overview & Mood Tracker */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <SpendingChart />
            <MoodTracker />
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper function to get time of day for greeting
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
