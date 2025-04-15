import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { generateFinancialAdvice } from "./openai";
import { 
  insertBankAccountSchema, 
  insertTransactionSchema, 
  insertSavingGoalSchema, 
  insertJournalEntrySchema, 
  insertAiAdviceSchema,
  User,
  TransferData
} from "@shared/schema";
import { z } from "zod";

// Helper middleware to ensure user is authenticated
const ensureAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Bank Account Routes
  app.get("/api/accounts", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const accounts = await storage.getBankAccountsByUserId(user.id);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts", error: (error as Error).message });
    }
  });

  app.post("/api/accounts", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const parsedData = insertBankAccountSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const account = await storage.createBankAccount(parsedData);
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ message: "Failed to create account", error: (error as Error).message });
    }
  });

  // Transaction Routes
  app.get("/api/transactions", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const transactions = await storage.getTransactionsByUserId(user.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions", error: (error as Error).message });
    }
  });

  app.get("/api/accounts/:accountId/transactions", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const accountId = parseInt(req.params.accountId);
      
      // Verify that the account belongs to the user
      const accounts = await storage.getBankAccountsByUserId(user.id);
      const isUserAccount = accounts.some(account => account.id === accountId);
      
      if (!isUserAccount) {
        return res.status(403).json({ message: "You don't have access to this account" });
      }
      
      const transactions = await storage.getTransactionsByAccountId(accountId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions", error: (error as Error).message });
    }
  });

  app.post("/api/transactions", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const parsedData = insertTransactionSchema.parse(req.body);
      
      // Verify that the account belongs to the user
      const accounts = await storage.getBankAccountsByUserId(user.id);
      const isUserAccount = accounts.some(account => account.id === parsedData.accountId);
      
      if (!isUserAccount) {
        return res.status(403).json({ message: "You don't have access to this account" });
      }
      
      const transaction = await storage.createTransaction(parsedData);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Failed to create transaction", error: (error as Error).message });
    }
  });

  app.post("/api/transfer", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      
      const transferSchema = z.object({
        fromAccountId: z.number(),
        toAccountId: z.number(),
        amount: z.string(),
        description: z.string()
      });
      
      const parsedData = transferSchema.parse(req.body);
      
      // Verify that the accounts belong to the user
      const accounts = await storage.getBankAccountsByUserId(user.id);
      const isFromAccountUser = accounts.some(account => account.id === parsedData.fromAccountId);
      const isToAccountUser = accounts.some(account => account.id === parsedData.toAccountId);
      
      if (!isFromAccountUser || !isToAccountUser) {
        return res.status(403).json({ message: "You don't have access to one or both accounts" });
      }
      
      // Convert to TransferData
      const transferData: TransferData = {
        fromAccountId: parsedData.fromAccountId,
        toAccountId: parsedData.toAccountId,
        amount: parsedData.amount,
        description: parsedData.description
      };
      
      const result = await storage.transferFunds(transferData);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: "Failed to transfer funds", error: (error as Error).message });
    }
  });

  // Saving Goal Routes
  app.get("/api/goals", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const goals = await storage.getSavingGoalsByUserId(user.id);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals", error: (error as Error).message });
    }
  });

  app.post("/api/goals", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const parsedData = insertSavingGoalSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const goal = await storage.createSavingGoal(parsedData);
      res.status(201).json(goal);
    } catch (error) {
      res.status(400).json({ message: "Failed to create goal", error: (error as Error).message });
    }
  });

  app.patch("/api/goals/:goalId", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const goalId = parseInt(req.params.goalId);
      
      const schema = z.object({
        amount: z.string()
      });
      
      const { amount } = schema.parse(req.body);
      
      // Verify that the goal belongs to the user
      const goal = await storage.getSavingGoal(goalId);
      if (!goal || goal.userId !== user.id) {
        return res.status(403).json({ message: "You don't have access to this goal" });
      }
      
      const updatedGoal = await storage.updateSavingGoal(goalId, amount);
      res.json(updatedGoal);
    } catch (error) {
      res.status(400).json({ message: "Failed to update goal", error: (error as Error).message });
    }
  });

  // Journal Entry Routes
  app.get("/api/journal", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const entries = await storage.getJournalEntriesByUserId(user.id);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch journal entries", error: (error as Error).message });
    }
  });

  app.post("/api/journal", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const parsedData = insertJournalEntrySchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const entry = await storage.createJournalEntry(parsedData);
      res.status(201).json(entry);
    } catch (error) {
      res.status(400).json({ message: "Failed to create journal entry", error: (error as Error).message });
    }
  });

  // AI Advice Routes
  app.get("/api/ai/advice", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const advices = await storage.getAiAdvicesByUserId(user.id);
      res.json(advices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI advices", error: (error as Error).message });
    }
  });

  app.post("/api/ai/advice", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const parsedData = insertAiAdviceSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      // Get user's financial data for context
      const accounts = await storage.getBankAccountsByUserId(user.id);
      const transactions = await storage.getTransactionsByUserId(user.id);
      const goals = await storage.getSavingGoalsByUserId(user.id);
      const journalEntries = await storage.getJournalEntriesByUserId(user.id);
      
      // Generate AI advice
      const aiResponse = await generateFinancialAdvice(
        user,
        parsedData.query,
        {
          accounts,
          transactions,
          goals,
          journalEntries
        }
      );
      
      // Save advice to storage
      const advice = await storage.createAiAdvice({
        ...parsedData,
        response: aiResponse
      });
      
      res.status(201).json(advice);
    } catch (error) {
      res.status(400).json({ message: "Failed to generate AI advice", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
