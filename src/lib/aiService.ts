import { Expense, UserData } from '../types';
import { classifyFoodExpense } from './foodService';
import { getExpensesForMonth, getSpendingSummary, getMeaningfulChanges, getSpendingObservations } from './spendingService';
import { getAnalyticsSummary } from './analyticsService';
import { getSubscriptionInsights } from './subscriptionService';
import { getRecurringMonthlyCost, detectRecurringExpenses } from './recurringService';
import { formatCurrency } from './utils';

export interface AIAskResponse {
  answer: string;
  sourceExpenses?: Expense[];
  confidence: 'high' | 'medium' | 'low';
  parsedExpenseAction?: {
    amount: number;
    category: string;
    subcategory?: string;
    merchant: string;
    note?: string;
  };
}

export const aiService = {
  prepareFinancialContext(expenses: Expense[], userData: UserData): string {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentMonthName = today.toLocaleString('en-IN', { month: 'long' });

    // Authoritative Calculations
    const currentExpenses = getExpensesForMonth(expenses, currentMonth, currentYear);
    const summary = getSpendingSummary(expenses, today);
    const analytics = getAnalyticsSummary(expenses, today);
    const changes = getMeaningfulChanges(expenses, today);
    const observations = getSpendingObservations(expenses, today, userData.monthlySpendingLimit);

    // Food Intelligence calculations
    const foodExpenses = currentExpenses.filter(e => e.category.toLowerCase() === 'food');
    const foodTotal = foodExpenses.reduce((s, e) => s + e.amount, 0);
    const foodSums = { essential: 0, outside: 0, junk: 0, other: 0 };
    foodExpenses.forEach(e => {
      const g = classifyFoodExpense(e);
      foodSums[g] += e.amount;
    });

    // Subscriptions and Recurring
    const subs = userData.subscriptions || [];
    const subInsights = getSubscriptionInsights(subs);
    const recurring = userData.recurringExpenses || [];
    const recurringMonthly = getRecurringMonthlyCost(recurring);

    // Context format
    const context = {
      currentTime: today.toISOString(),
      currentMonth: currentMonthName,
      monthlySpendingLimit: userData.monthlySpendingLimit,
      totals: {
        spentThisMonth: summary.total,
        spentLastMonth: summary.previousMonthTotal,
        dailyAverage: analytics.dailyAverage
      },
      categorySpending: analytics.byCategory.map(c => ({
        category: c.name,
        amount: c.amount,
        percentage: c.percentage.toFixed(1) + '%'
      })),
      foodBreakdown: {
        totalFoodSpent: foodTotal,
        essentialFood: foodSums.essential,
        outsideFood: foodSums.outside,
        junkFood: foodSums.junk
      },
      meaningfulChanges: changes.map(c => ({
        category: c.category,
        percentageChange: c.percentageChange.toFixed(0) + '%',
        direction: c.direction,
        currentAmount: c.currentAmount,
        previousAmount: c.previousAmount
      })),
      spendingObservations: observations.map(o => ({
        title: o.title,
        message: o.message,
        type: o.type
      })),
      subscriptions: {
        activeCount: subInsights.activeCount,
        monthlyTotal: subInsights.totalMonthly,
        list: subs.filter(s => s.isActive).map(s => `${s.name} (₹${s.amount}/${s.frequency})`)
      },
      recurringExpenses: {
        count: recurring.length,
        monthlyTotal: recurringMonthly,
        list: recurring.map(r => `${r.merchant} (₹${r.amount}/${r.frequency})`)
      },
      savingGoals: userData.savings.map(g => ({
        title: g.title,
        target: g.targetAmount,
        saved: g.currentAmount,
        percentage: ((g.currentAmount / g.targetAmount) * 100).toFixed(0) + '%'
      })),
      recentTransactions: expenses.slice(0, 15).map(e => ({
        date: e.date,
        merchant: e.merchant || e.description,
        amount: e.amount,
        category: e.category,
        subcategory: e.subcategory || 'none',
        paymentMethod: e.paymentMethod || 'Bank'
      }))
    };

    return JSON.stringify(context, null, 2);
  },

  async askQuestion(
    query: string,
    expenses: Expense[],
    userData: UserData,
    history: { role: 'user' | 'assistant'; content: string }[] = []
  ): Promise<AIAskResponse> {
    try {
      const contextText = this.prepareFinancialContext(expenses, userData);

      const systemInstruction = `
You are Antigravity, a personal spending assistant for the Finance Tracker V2 application.
You are conversational, intelligent, and concise. You never judge or shame the user.
You are given a comprehensive JSON "Context" representing the user's actual, computed financial statistics (which are authoritative and computed locally by application code).
You must NEVER invent numbers. Only refer to the numbers present in the Context. If a query requires calculations or numbers not in the Context, explain that you don't have that information but present the closest relevant statistic.

Intents you handle:
1. General conversational messages (greetings, thanks, general checks).
2. Answering spending queries using the totals, category break downs, food intelligence, and subscription data.
3. Transaction requests (e.g. "I spent 450 on Swiggy today" or "Netflix 649 monthly").

TRANSACTION REQUESTS SPECIAL INSTRUCTION:
If the user expresses intent to add or log an expense, you must parse it and return a special JSON block at the VERY end of your response, starting with "JSON_EXPENSE_ACTION:" followed by a valid JSON object.
The JSON object must have keys:
{
  "amount": number (required),
  "merchant": string (required),
  "category": string (required - choose from: Food, Transport, Entertainment, Utilities, Health, Education, Rent, Other),
  "subcategory": string (optional),
  "note": string (optional)
}
Example response:
"Sure, I can log that Swiggy order of ₹450 under Food for you. Please confirm below to add it.
JSON_EXPENSE_ACTION: { "amount": 450, "merchant": "Swiggy", "category": "Food", "subcategory": "delivery" }"

If the input is missing amount or merchant/category, ask the user to clarify instead of returning the JSON_EXPENSE_ACTION block.

Context:
${contextText}
      `;

      // Call secure server endpoint
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: query,
          systemInstruction,
          history
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      const text = data.text || '';
      
      // Parse out transaction action if present
      let parsedExpenseAction: any = undefined;
      let cleanText = text;
      const marker = 'JSON_EXPENSE_ACTION:';
      const markerIndex = text.indexOf(marker);
      
      if (markerIndex !== -1) {
        cleanText = text.substring(0, markerIndex).trim();
        const jsonPart = text.substring(markerIndex + marker.length).trim();
        try {
          parsedExpenseAction = JSON.parse(jsonPart);
        } catch (e) {
          console.warn('Failed to parse transaction action from response:', e);
        }
      }

      return {
        answer: cleanText,
        confidence: 'high',
        parsedExpenseAction
      };
    } catch (err: any) {
      console.error('Server AI request failed:', err);
      // Return clear error state to frontend
      return {
        answer: `AI Service is currently unavailable. ${err.message || 'Check server configuration.'}`,
        confidence: 'low'
      };
    }
  },

  async parseNaturalLanguageInput(input: string) {
    const trimmed = input.trim();
    const numFirstMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    const textFirstMatch = trimmed.match(/^(.+?)\s+(\d+(?:\.\d+)?)$/);
    
    let amount: number | undefined;
    let text = '';
    
    if (numFirstMatch) {
      amount = parseFloat(numFirstMatch[1]);
      text = numFirstMatch[2].trim();
    } else if (textFirstMatch) {
      amount = parseFloat(textFirstMatch[2]);
      text = textFirstMatch[1].trim();
    } else {
      const numMatch = trimmed.match(/\d+(?:\.\d+)?/);
      if (numMatch) {
        amount = parseFloat(numMatch[0]);
      }
    }
    
    let category = 'Other';
    let subcategory: string | undefined;
    let merchant: string | undefined;
    let note: string | undefined;
    
    const lowerText = text.toLowerCase();
    
    if (/swiggy|zomato|ubereats|restaurant|dominos|pizza|burger/i.test(lowerText)) {
      category = 'Food';
      subcategory = 'delivery';
      merchant = text;
    } else if (/grocery|market|spencer|supermarket/i.test(lowerText)) {
      category = 'Food';
      subcategory = 'groceries';
      merchant = text;
    } else if (/cafe|coffee|starbucks/i.test(lowerText)) {
      category = 'Food';
      subcategory = 'cafe';
      merchant = text;
    } else if (/uber|ola|auto|cab|train|metro|petrol|fuel/i.test(lowerText)) {
      category = 'Transport';
      merchant = text;
    } else if (/netflix|spotify|movie|pvr|game/i.test(lowerText)) {
      category = 'Entertainment';
      merchant = text;
    } else if (text) {
      note = text;
    }
    
    return {
      amount,
      category,
      subcategory,
      merchant,
      note,
      confidence: amount ? 0.8 : 0.2
    };
  }
};
