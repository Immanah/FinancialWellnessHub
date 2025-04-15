import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bank Account schema
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  accountNumber: text("account_number").notNull(),
  balance: numeric("balance").notNull().default("0"),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transaction schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  amount: numeric("amount").notNull(),
  description: text("description").notNull(),
  category: text("category"),
  merchant: text("merchant"),
  date: timestamp("date").defaultNow(),
  type: text("type").notNull(), // 'debit' or 'credit'
});

// Saving Goal schema
export const savingGoals = pgTable("saving_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount").notNull(),
  currentAmount: numeric("current_amount").notNull().default("0"),
  deadline: timestamp("deadline"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Journal Entry schema
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  entry: text("entry").notNull(),
  mood: text("mood").notNull(), // 'sad', 'neutral', 'happy', 'very-happy'
  date: timestamp("date").defaultNow(),
});

// AI Advice schema
export const aiAdvices = pgTable("ai_advices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  query: text("query").notNull(),
  response: text("response").notNull(),
  date: timestamp("date").defaultNow(),
});

// Zod schemas for input validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).pick({
  userId: true,
  name: true,
  accountNumber: true,
  balance: true,
  type: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  accountId: true,
  amount: true,
  description: true,
  category: true,
  merchant: true,
  type: true,
});

export const insertSavingGoalSchema = createInsertSchema(savingGoals).pick({
  userId: true,
  name: true,
  targetAmount: true,
  deadline: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).pick({
  userId: true,
  entry: true,
  mood: true,
});

export const insertAiAdviceSchema = createInsertSchema(aiAdvices).pick({
  userId: true,
  query: true,
});

// Export types for input validation
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertSavingGoal = z.infer<typeof insertSavingGoalSchema>;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type InsertAiAdvice = z.infer<typeof insertAiAdviceSchema>;

// Export types for database queries
export type User = typeof users.$inferSelect;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type SavingGoal = typeof savingGoals.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type AiAdvice = typeof aiAdvices.$inferSelect;

// Additional types for API requests
export type LoginData = Pick<InsertUser, "username" | "password">;
export type TransferData = {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  description: string;
};
