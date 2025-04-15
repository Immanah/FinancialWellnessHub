import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend,
} from "recharts";
import type { Transaction } from "@shared/schema";

interface SpendingChartProps {
  className?: string;
}

export function SpendingChart({ className }: SpendingChartProps) {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-64" />
          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare monthly data
  const getMonthlyData = () => {
    if (!transactions) return [];

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Initialize monthly data for the past 7 months
    const monthlyData = months
      .map((month, index) => ({ 
        month, 
        spending: 0,
        income: 0,
        savings: 0,
        active: index === currentMonth
      }))
      .slice(currentMonth - 6 < 0 ? 12 + (currentMonth - 6) : currentMonth - 6, currentMonth + 1);
    
    // Collect spending and income data from transactions
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const transactionMonth = transactionDate.getMonth();
      const transactionYear = transactionDate.getFullYear();
      
      // Skip transactions from different years or not in our range
      if (transactionYear !== currentYear) return;
      
      const monthIndex = monthlyData.findIndex(m => m.month === months[transactionMonth]);
      if (monthIndex === -1) return;
      
      const amount = parseFloat(transaction.amount.toString());
      
      if (transaction.type === 'debit') {
        monthlyData[monthIndex].spending += amount;
      } else {
        monthlyData[monthIndex].income += amount;
      }
    });
    
    // Calculate savings for each month
    monthlyData.forEach(month => {
      month.savings = month.income - month.spending;
      if (month.savings < 0) month.savings = 0;
    });
    
    return monthlyData;
  };

  const monthlyData = getMonthlyData();
  
  // Calculate totals for the current month
  const currentMonthData = monthlyData.find(m => m.active) || {
    spending: 0,
    income: 0,
    savings: 0
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Monthly Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              />
              <YAxis 
                hide={true}
                domain={[0, 'dataMax + 500']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
                formatter={(value) => [formatCurrency(value as number), '']}
              />
              <Legend />
              <Bar dataKey="spending" name="Spending" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.active ? 'var(--primary)' : 'var(--muted)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
              <span className="text-sm text-muted-foreground">Spending</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {formatCurrency(currentMonthData.spending)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-muted-foreground">Income</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {formatCurrency(currentMonthData.income)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-secondary mr-2"></div>
              <span className="text-sm text-muted-foreground">Savings</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {formatCurrency(currentMonthData.savings)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
