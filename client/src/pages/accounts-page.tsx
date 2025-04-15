import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowUpIcon, BanknoteIcon, CreditCardIcon, PlusIcon, RefreshCwIcon } from "lucide-react";
import type { BankAccount } from "@shared/schema";

// Form schemas
const transferSchema = z.object({
  fromAccountId: z.string(),
  toAccountId: z.string(),
  amount: z.string()
    .refine(val => !isNaN(Number(val)), { message: "Amount must be a number" })
    .refine(val => Number(val) > 0, { message: "Amount must be greater than 0" }),
  description: z.string().min(3, "Description must be at least 3 characters")
});

const paymentSchema = z.object({
  accountId: z.string(),
  amount: z.string()
    .refine(val => !isNaN(Number(val)), { message: "Amount must be a number" })
    .refine(val => Number(val) > 0, { message: "Amount must be greater than 0" }),
  description: z.string().min(3, "Description must be at least 3 characters"),
  merchant: z.string().min(2, "Merchant name must be at least 2 characters"),
  category: z.string().min(2, "Category must be at least 2 characters")
});

const depositSchema = z.object({
  accountId: z.string(),
  amount: z.string()
    .refine(val => !isNaN(Number(val)), { message: "Amount must be a number" })
    .refine(val => Number(val) > 0, { message: "Amount must be greater than 0" }),
  description: z.string().min(3, "Description must be at least 3 characters")
});

export default function AccountsPage() {
  const { toast } = useToast();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Fetch accounts data
  const { 
    data: accounts, 
    isLoading: isLoadingAccounts 
  } = useQuery<BankAccount[]>({
    queryKey: ["/api/accounts"],
    onSuccess: (data) => {
      if (data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(data[0].id.toString());
      }
    }
  });

  // Form setup
  const transferForm = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: "",
      toAccountId: "",
      amount: "",
      description: ""
    }
  });

  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      accountId: "",
      amount: "",
      description: "",
      merchant: "",
      category: ""
    }
  });

  const depositForm = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      accountId: "",
      amount: "",
      description: ""
    }
  });

  // Reset forms when accounts data is loaded
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const firstAccountId = accounts[0].id.toString();
      
      transferForm.setValue("fromAccountId", firstAccountId);
      if (accounts.length > 1) {
        transferForm.setValue("toAccountId", accounts[1].id.toString());
      }
      
      paymentForm.setValue("accountId", firstAccountId);
      depositForm.setValue("accountId", firstAccountId);
    }
  }, [accounts]);

  // Format account balance
  const formatBalance = (balance: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(balance));
  };

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (data: z.infer<typeof transferSchema>) => {
      return await apiRequest("POST", "/api/transfer", {
        fromAccountId: Number(data.fromAccountId),
        toAccountId: Number(data.toAccountId),
        amount: data.amount,
        description: data.description
      });
    },
    onSuccess: () => {
      toast({
        title: "Transfer successful",
        description: "Funds have been transferred between accounts"
      });
      setIsTransferModalOpen(false);
      transferForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error) => {
      toast({
        title: "Transfer failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentSchema>) => {
      return await apiRequest("POST", "/api/transactions", {
        accountId: Number(data.accountId),
        amount: data.amount,
        description: data.description,
        merchant: data.merchant,
        category: data.category,
        type: "debit"
      });
    },
    onSuccess: () => {
      toast({
        title: "Payment successful",
        description: "Your payment has been processed"
      });
      setIsPaymentModalOpen(false);
      paymentForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error) => {
      toast({
        title: "Payment failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (data: z.infer<typeof depositSchema>) => {
      return await apiRequest("POST", "/api/transactions", {
        accountId: Number(data.accountId),
        amount: data.amount,
        description: data.description,
        merchant: "Deposit",
        category: "Income",
        type: "credit"
      });
    },
    onSuccess: () => {
      toast({
        title: "Deposit successful",
        description: "Funds have been added to your account"
      });
      setIsDepositModalOpen(false);
      depositForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error) => {
      toast({
        title: "Deposit failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  // Handle form submissions
  const onTransferSubmit = (data: z.infer<typeof transferSchema>) => {
    if (data.fromAccountId === data.toAccountId) {
      toast({
        title: "Invalid accounts",
        description: "Cannot transfer to the same account",
        variant: "destructive"
      });
      return;
    }
    transferMutation.mutate(data);
  };

  const onPaymentSubmit = (data: z.infer<typeof paymentSchema>) => {
    paymentMutation.mutate(data);
  };

  const onDepositSubmit = (data: z.infer<typeof depositSchema>) => {
    depositMutation.mutate(data);
  };

  // Find selected account
  const selectedAccount = accounts?.find(account => account.id.toString() === selectedAccountId);

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
                <p className="text-muted-foreground mt-1">Manage your bank accounts and transactions</p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  className="flex items-center space-x-2"
                  onClick={() => setIsTransferModalOpen(true)}
                >
                  <ArrowUpIcon className="h-4 w-4" />
                  <span>Transfer</span>
                </Button>
                <Button 
                  variant="outline"
                  className="flex items-center space-x-2"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  <CreditCardIcon className="h-4 w-4" />
                  <span>New Payment</span>
                </Button>
                <Button 
                  className="flex items-center space-x-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                  onClick={() => setIsDepositModalOpen(true)}
                >
                  <BanknoteIcon className="h-4 w-4" />
                  <span>Deposit</span>
                </Button>
              </div>
            </div>
          </header>
          
          {/* Account Selector */}
          {isLoadingAccounts ? (
            <Skeleton className="h-12 mb-8" />
          ) : accounts && accounts.length > 0 ? (
            <div className="mb-8">
              <Label htmlFor="account-select">Select Account</Label>
              <Select
                value={selectedAccountId || undefined}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger id="account-select" className="w-full md:w-80">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} ({formatBalance(account.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-border">
              <p className="text-muted-foreground">No accounts found. Please contact support to add an account.</p>
            </div>
          )}
          
          {/* Account Details & Transactions */}
          {selectedAccount ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Account Details */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>{selectedAccount.name}</CardTitle>
                  <CardDescription>Account Details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="text-2xl font-bold">{formatBalance(selectedAccount.balance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account Number</p>
                      <p className="font-medium">{selectedAccount.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{selectedAccount.type}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center space-x-2"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
                      toast({
                        title: "Refreshed",
                        description: "Account data has been refreshed"
                      });
                    }}
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                    <span>Refresh</span>
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Transactions */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Activity for this account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TransactionList />
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-white rounded-lg shadow-sm border border-border">
              <p className="text-muted-foreground">Please select an account to view details.</p>
            </div>
          )}
        </div>
      </main>

      {/* Transfer Modal */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Funds</DialogTitle>
            <DialogDescription>
              Transfer money between your accounts.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...transferForm}>
            <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-4">
              <FormField
                control={transferForm.control}
                name="fromAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Account</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name} ({formatBalance(account.balance)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={transferForm.control}
                name="toAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Account</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name} ({formatBalance(account.balance)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={transferForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={transferForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Transfer reason" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsTransferModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={transferMutation.isPending}
                >
                  {transferMutation.isPending ? "Processing..." : "Transfer Funds"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make a Payment</DialogTitle>
            <DialogDescription>
              Create a new payment from your account.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Account</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name} ({formatBalance(account.balance)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={paymentForm.control}
                name="merchant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merchant</FormLabel>
                    <FormControl>
                      <Input placeholder="Recipient name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={paymentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={paymentForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Shopping">Shopping</SelectItem>
                        <SelectItem value="Food & Drink">Food & Drink</SelectItem>
                        <SelectItem value="Transportation">Transportation</SelectItem>
                        <SelectItem value="Entertainment">Entertainment</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Housing">Housing</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Travel">Travel</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={paymentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Payment details" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={paymentMutation.isPending}
                >
                  {paymentMutation.isPending ? "Processing..." : "Make Payment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Deposit Modal */}
      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit Funds</DialogTitle>
            <DialogDescription>
              Add money to your account.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...depositForm}>
            <form onSubmit={depositForm.handleSubmit(onDepositSubmit)} className="space-y-4">
              <FormField
                control={depositForm.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Account</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name} ({formatBalance(account.balance)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={depositForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={depositForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Deposit reason" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDepositModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={depositMutation.isPending}
                >
                  {depositMutation.isPending ? "Processing..." : "Deposit Funds"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Fix for react-hook-form with useEffect
import { useEffect } from "react";
