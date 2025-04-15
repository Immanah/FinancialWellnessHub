import { ArrowUpIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BankAccount } from "@shared/schema";

interface AccountCardProps {
  account: BankAccount;
  className?: string;
}

export function AccountCard({ account, className }: AccountCardProps) {
  // Format account balance
  const balanceNum = parseFloat(account.balance.toString());
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(balanceNum);

  // Last 4 digits of account number
  const lastFourDigits = account.accountNumber.substring(account.accountNumber.length - 4);

  return (
    <Card 
      className={cn(
        "bg-white shadow-card hover:shadow-card-hover transition-shadow p-5", 
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{account.name}</h3>
          <p className="text-2xl font-bold text-foreground">{formattedBalance}</p>
        </div>
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          account.type === 'checking' 
            ? "bg-gradient-to-r from-primary to-secondary" 
            : "bg-secondary"
        )}>
          {account.type === 'checking' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center text-sm">
        <p className="text-muted-foreground">**** {lastFourDigits}</p>
        <div className="flex items-center text-green-500">
          <ArrowUpIcon className="h-4 w-4 mr-1" />
          <span>{account.type === 'checking' ? "+2.1%" : "+3.5%"}</span>
        </div>
      </div>
    </Card>
  );
}
