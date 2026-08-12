export type ThemeType = 'light' | 'dark' | 'system';

export interface Profile {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory?: string;
  description: string; // Keeps compatibility with V1
  merchant?: string;
  note?: string;
  paymentMethod?: 'Cash' | 'Bank';
  date: string;
}


export interface SavingGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  contributions: { amount: number; date: string }[];
}

export interface Investment {
  id: string;
  type: 'Mutual Fund' | 'Stock' | 'Other';
  name: string;
  investedAmount: number;
  currentValue: number;
  date: string;
}

export interface BorrowLend {
  id: string;
  type: 'Borrow' | 'Lend';
  personName: string;
  amount: number;
  dueDate?: string;
  notes?: string;
  date: string;
  isSettled: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  isRecurring: boolean;
}

export interface RecurringExpense {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  lastDate?: string;
  nextExpectedDate?: string;
  note?: string;
  isInferred: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  category: string;
  nextBillingDate?: string;
  isActive: boolean;
  note?: string;
}

export interface UserData {
  cashBalance: number;
  bankBalance: number;
  monthlySpendingLimit: number;
  expenses: Expense[];
  savings: SavingGoal[];
  investments: Investment[];
  borrowLend: BorrowLend[];
  reminders: Reminder[];
  recurringExpenses?: RecurringExpense[];
  subscriptions?: Subscription[];
  notificationsEnabled?: boolean;
}
