import { 
  users, User, InsertUser, 
  bankAccounts, BankAccount, InsertBankAccount,
  transactions, Transaction, InsertTransaction,
  savingGoals, SavingGoal, InsertSavingGoal,
  journalEntries, JournalEntry, InsertJournalEntry,
  aiAdvices, AiAdvice, InsertAiAdvice,
  TransferData
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Bank Account methods
  getBankAccount(id: number): Promise<BankAccount | undefined>;
  getBankAccountsByUserId(userId: number): Promise<BankAccount[]>;
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccountBalance(id: number, balance: string): Promise<BankAccount | undefined>;

  // Transaction methods
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByAccountId(accountId: number): Promise<Transaction[]>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  transferFunds(transferData: TransferData): Promise<{ sourceTransaction: Transaction, targetTransaction: Transaction }>;

  // Saving Goal methods
  getSavingGoal(id: number): Promise<SavingGoal | undefined>;
  getSavingGoalsByUserId(userId: number): Promise<SavingGoal[]>;
  createSavingGoal(goal: InsertSavingGoal): Promise<SavingGoal>;
  updateSavingGoal(id: number, amount: string): Promise<SavingGoal | undefined>;

  // Journal Entry methods
  getJournalEntry(id: number): Promise<JournalEntry | undefined>;
  getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;

  // AI Advice methods
  getAiAdvice(id: number): Promise<AiAdvice | undefined>;
  getAiAdvicesByUserId(userId: number): Promise<AiAdvice[]>;
  createAiAdvice(advice: InsertAiAdvice & { response: string }): Promise<AiAdvice>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Bank Account methods
  async getBankAccount(id: number): Promise<BankAccount | undefined> {
    const [account] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return account;
  }

  async getBankAccountsByUserId(userId: number): Promise<BankAccount[]> {
    return await db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId));
  }

  async createBankAccount(insertAccount: InsertBankAccount): Promise<BankAccount> {
    const [account] = await db.insert(bankAccounts).values(insertAccount).returning();
    return account;
  }

  async updateBankAccountBalance(id: number, balance: string): Promise<BankAccount | undefined> {
    const [account] = await db
      .update(bankAccounts)
      .set({ balance })
      .where(eq(bankAccounts.id, id))
      .returning();
    return account;
  }

  // Transaction methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async getTransactionsByAccountId(accountId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.accountId, accountId))
      .orderBy(desc(transactions.date));
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    const userAccounts = await this.getBankAccountsByUserId(userId);
    
    if (userAccounts.length === 0) {
      return [];
    }
    
    // Get all transactions for each account and combine them
    const allTransactions: Transaction[] = [];
    
    for (const account of userAccounts) {
      const accountTransactions = await this.getTransactionsByAccountId(account.id);
      allTransactions.push(...accountTransactions);
    }
    
    // Sort by date (descending)
    return allTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    // Start a transaction to ensure data consistency
    const [transaction] = await db.transaction(async (tx) => {
      // Insert the transaction
      const [newTransaction] = await tx
        .insert(transactions)
        .values(insertTransaction)
        .returning();
      
      // Update account balance
      const [account] = await tx
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.id, insertTransaction.accountId));
      
      if (account) {
        const currentBalance = parseFloat(account.balance.toString());
        let newBalance: number;
        
        if (insertTransaction.type === 'debit') {
          newBalance = currentBalance - parseFloat(insertTransaction.amount.toString());
        } else {
          newBalance = currentBalance + parseFloat(insertTransaction.amount.toString());
        }
        
        await tx
          .update(bankAccounts)
          .set({ balance: newBalance.toString() })
          .where(eq(bankAccounts.id, account.id));
      }
      
      return [newTransaction];
    });
    
    return transaction;
  }

  async transferFunds(transferData: TransferData): Promise<{ sourceTransaction: Transaction, targetTransaction: Transaction }> {
    const { fromAccountId, toAccountId, amount, description } = transferData;
    
    return await db.transaction(async (tx) => {
      // Validate accounts and balance
      const [sourceAccount] = await tx
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.id, fromAccountId));
      
      const [targetAccount] = await tx
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.id, toAccountId));
      
      if (!sourceAccount || !targetAccount) {
        throw new Error("One or both accounts do not exist");
      }
      
      const sourceBalance = parseFloat(sourceAccount.balance.toString());
      const transferAmount = parseFloat(amount.toString());
      
      if (sourceBalance < transferAmount) {
        throw new Error("Insufficient funds for transfer");
      }
      
      // Create debit transaction
      const [sourceTransaction] = await tx
        .insert(transactions)
        .values({
          accountId: fromAccountId,
          amount: transferAmount.toString(),
          description: `Transfer: ${description}`,
          type: 'debit',
          category: 'Transfer',
          merchant: 'NeuroBank'
        })
        .returning();
      
      // Create credit transaction
      const [targetTransaction] = await tx
        .insert(transactions)
        .values({
          accountId: toAccountId,
          amount: transferAmount.toString(),
          description: `Transfer from account ${sourceAccount.accountNumber.substring(sourceAccount.accountNumber.length - 4)}`,
          type: 'credit',
          category: 'Transfer',
          merchant: 'NeuroBank'
        })
        .returning();
      
      // Update source account balance
      await tx
        .update(bankAccounts)
        .set({ 
          balance: (sourceBalance - transferAmount).toString() 
        })
        .where(eq(bankAccounts.id, fromAccountId));
      
      // Update target account balance
      const targetBalance = parseFloat(targetAccount.balance.toString());
      await tx
        .update(bankAccounts)
        .set({ 
          balance: (targetBalance + transferAmount).toString() 
        })
        .where(eq(bankAccounts.id, toAccountId));
      
      return { sourceTransaction, targetTransaction };
    });
  }

  // Saving Goal methods
  async getSavingGoal(id: number): Promise<SavingGoal | undefined> {
    const [goal] = await db.select().from(savingGoals).where(eq(savingGoals.id, id));
    return goal;
  }

  async getSavingGoalsByUserId(userId: number): Promise<SavingGoal[]> {
    return await db.select().from(savingGoals).where(eq(savingGoals.userId, userId));
  }

  async createSavingGoal(insertGoal: InsertSavingGoal): Promise<SavingGoal> {
    const goalData = {
      ...insertGoal,
      currentAmount: "0", 
      completed: false,
    };
    
    const [goal] = await db.insert(savingGoals).values(goalData).returning();
    return goal;
  }

  async updateSavingGoal(id: number, amount: string): Promise<SavingGoal | undefined> {
    return await db.transaction(async (tx) => {
      const [goal] = await tx
        .select()
        .from(savingGoals)
        .where(eq(savingGoals.id, id));
      
      if (!goal) return undefined;
      
      const currentAmount = parseFloat(goal.currentAmount.toString());
      const additionalAmount = parseFloat(amount);
      const newAmount = currentAmount + additionalAmount;
      const targetAmount = parseFloat(goal.targetAmount.toString());
      
      const [updatedGoal] = await tx
        .update(savingGoals)
        .set({ 
          currentAmount: newAmount.toString(),
          completed: newAmount >= targetAmount
        })
        .where(eq(savingGoals.id, id))
        .returning();
      
      return updatedGoal;
    });
  }

  // Journal Entry methods
  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    return entry;
  }

  async getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.date));
  }

  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const [entry] = await db.insert(journalEntries).values(insertEntry).returning();
    return entry;
  }

  // AI Advice methods
  async getAiAdvice(id: number): Promise<AiAdvice | undefined> {
    const [advice] = await db.select().from(aiAdvices).where(eq(aiAdvices.id, id));
    return advice;
  }

  async getAiAdvicesByUserId(userId: number): Promise<AiAdvice[]> {
    return await db
      .select()
      .from(aiAdvices)
      .where(eq(aiAdvices.userId, userId))
      .orderBy(desc(aiAdvices.date));
  }

  async createAiAdvice(insertAdvice: InsertAiAdvice & { response: string }): Promise<AiAdvice> {
    const [advice] = await db.insert(aiAdvices).values(insertAdvice).returning();
    return advice;
  }
}

export const storage = new DatabaseStorage();
