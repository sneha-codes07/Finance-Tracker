export type ThemeType = 'GenZ' | 'Millennial' | 'Teen' | 'Classic';

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
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

export interface UserData {
  cashBalance: number;
  bankBalance: number;
  monthlySpendingLimit: number;
  expenses: Expense[];
  savings: SavingGoal[];
  investments: Investment[];
  borrowLend: BorrowLend[];
  reminders: Reminder[];
}
