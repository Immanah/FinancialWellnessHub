import OpenAI from "openai";
import { 
  User, 
  BankAccount, 
  Transaction, 
  SavingGoal, 
  JournalEntry 
} from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-development" });

interface FinancialContext {
  accounts: BankAccount[];
  transactions: Transaction[];
  goals: SavingGoal[];
  journalEntries: JournalEntry[];
}

export async function generateFinancialAdvice(
  user: User,
  query: string,
  context: FinancialContext
): Promise<string> {
  try {
    // Prepare recent transactions data
    const recentTransactions = context.transactions.slice(0, 10).map(transaction => ({
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category,
      merchant: transaction.merchant,
      date: transaction.date,
      type: transaction.type
    }));

    // Prepare recent journal entries to understand emotional context
    const recentJournalEntries = context.journalEntries.slice(0, 5).map(entry => ({
      mood: entry.mood,
      date: entry.date
    }));

    // Calculate spending by category
    const spendingByCategory: Record<string, number> = {};
    context.transactions.forEach(transaction => {
      if (transaction.type === 'debit' && transaction.category) {
        const category = transaction.category;
        const amount = parseFloat(transaction.amount.toString());
        spendingByCategory[category] = (spendingByCategory[category] || 0) + amount;
      }
    });

    // Calculate total balance
    const totalBalance = context.accounts.reduce(
      (sum, account) => sum + parseFloat(account.balance.toString()),
      0
    );

    // Calculate savings progress
    const savingsProgress = context.goals.map(goal => {
      const targetAmount = parseFloat(goal.targetAmount.toString());
      const currentAmount = parseFloat(goal.currentAmount.toString());
      const progressPercentage = (currentAmount / targetAmount) * 100;
      
      return {
        name: goal.name,
        targetAmount,
        currentAmount,
        progressPercentage,
        deadline: goal.deadline
      };
    });

    // Detect primary emotional state from journal entries
    let primaryMood = "neutral";
    if (recentJournalEntries.length > 0) {
      const moodCounts: Record<string, number> = {};
      recentJournalEntries.forEach(entry => {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      });
      
      let maxCount = 0;
      for (const [mood, count] of Object.entries(moodCounts)) {
        if (count > maxCount) {
          maxCount = count;
          primaryMood = mood;
        }
      }
    }

    // Construct prompt for the AI
    const prompt = `
      You are a compassionate and intelligent financial advisor for NeuroBank, a financial wellness platform. 
      You're helping ${user.name} with their finances.
      
      User's question: "${query}"
      
      USER FINANCIAL CONTEXT:
      - Total account balance: $${totalBalance.toFixed(2)}
      - Recent emotional state: ${primaryMood}
      - Top spending categories: ${Object.entries(spendingByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, amount]) => `${category} ($${amount.toFixed(2)})`)
        .join(', ')}
      - Savings goals: ${savingsProgress.map(goal => 
        `${goal.name} (${goal.progressPercentage.toFixed(1)}% complete, $${goal.currentAmount} of $${goal.targetAmount})`
      ).join(', ')}
      
      Please provide personalized financial advice based on the user's question and financial context.
      Your response should be:
      1. Empathetic and considerate of their emotional state
      2. Specific to their financial situation
      3. Actionable with clear next steps
      4. Supportive and encouraging
      5. Concise yet thorough
      
      If the query relates to mental wellness, emphasize the connection between financial and emotional wellbeing.
      
      Respond in JSON format with the following structure:
      {
        "message": "Your main response message",
        "suggestedActions": ["1-3 specific actionable steps"],
        "emotionalSupport": "A supportive statement based on their mood"
      }
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    // Extract and format the AI's response
    const aiResponse = JSON.parse(response.choices[0].message.content);
    
    // Format response as HTML for better display in the chat interface
    return `
      <p>${aiResponse.message}</p>
      
      <p><strong>Suggested actions:</strong></p>
      <ul>
        ${aiResponse.suggestedActions.map((action: string) => `<li>${action}</li>`).join('')}
      </ul>
      
      <p><em>${aiResponse.emotionalSupport}</em></p>
    `;
  } catch (error) {
    console.error("Error generating AI advice:", error);
    return "I'm sorry, I wasn't able to provide financial advice at this moment. Please try again later.";
  }
}
