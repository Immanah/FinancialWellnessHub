import { useQuery } from "@tanstack/react-query";
import { CreditCardIcon, ArrowDownIcon, ShoppingCartIcon, CoffeeIcon, BriefcaseIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import type { Transaction } from "@shared/schema";

export function TransactionList() {
  const { data: transactions, isLoading, error } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  if (isLoading) {
    return <TransactionListSkeleton />;
  }

  if (error || !transactions) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Failed to load transactions</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}

interface TransactionItemProps {
  transaction: Transaction;
}

function TransactionItem({ transaction }: TransactionItemProps) {
  // Format the amount with currency sign
  const amount = parseFloat(transaction.amount.toString());
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);

  // Determine the transaction icon based on category
  const getTransactionIcon = () => {
    const category = transaction.category?.toLowerCase();
    
    if (category === 'income' || transaction.type === 'credit') {
      return (
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
          <ArrowDownIcon className="h-5 w-5 text-green-500" />
        </div>
      );
    }
    
    if (category === 'shopping') {
      return (
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
          <ShoppingCartIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      );
    }
    
    if (category === 'food & drink') {
      return (
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
          <CoffeeIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      );
    }
    
    if (category === 'transportation') {
      return (
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-6a3 3 0 00-.77-2l-2.62-2.62A3 3 0 0015.38 2H12V1a1 1 0 00-1-1H9a1 1 0 00-1 1v1H4a1 1 0 00-1 1z" />
          </svg>
        </div>
      );
    }
    
    return (
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
        <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  };

  // Format the date
  const formatDate = (date: Date | string) => {
    const transactionDate = new Date(date);
    return formatDistanceToNow(transactionDate, { addSuffix: true });
  };

  return (
    <div className="transaction-item px-2 py-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center">
        {getTransactionIcon()}
        <div className="flex-grow">
          <div className="flex justify-between">
            <p className="font-medium text-foreground">
              {transaction.merchant || transaction.description}
            </p>
            <p className={`font-medium ${transaction.type === 'credit' ? 'text-green-500' : 'text-foreground'}`}>
              {transaction.type === 'credit' ? `+ ${formattedAmount}` : `- ${formattedAmount}`}
            </p>
          </div>
          <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground">{transaction.category || 'Uncategorized'}</p>
            <p className="text-muted-foreground">{formatDate(transaction.date)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="px-2 py-3 rounded-lg">
          <div className="flex items-center">
            <Skeleton className="w-10 h-10 rounded-full mr-3" />
            <div className="flex-grow">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex justify-between items-center mt-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
