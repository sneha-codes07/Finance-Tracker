import { Expense } from '../types';
import { getExpensesForMonth } from './spendingService';

export interface AnalyticsSummary {
  totalSpending: number;
  transactionCount: number;
  averageTransaction: number;
  highestTransaction: Expense | null;
  topCategory: { name: string; amount: number } | null;
  byCategory: { name: string; amount: number; percentage: number }[];
  byMonth: { month: string; year: number; monthIdx: number; total: number }[];
  monthOverMonthChange: number | null;
  dailyAverage: number;
}

export function getAnalyticsSummary(expenses: Expense[], targetDate: Date): AnalyticsSummary {
  const currentMonth = targetDate.getMonth();
  const currentYear = targetDate.getFullYear();
  const currentExpenses = getExpensesForMonth(expenses, currentMonth, currentYear);

  const totalSpending = currentExpenses.reduce((s, e) => s + e.amount, 0);
  const transactionCount = currentExpenses.length;
  const averageTransaction = transactionCount > 0 ? totalSpending / transactionCount : 0;

  // Highest transaction
  let highestTransaction: Expense | null = null;
  if (currentExpenses.length > 0) {
    highestTransaction = currentExpenses.reduce((max, e) => e.amount > max.amount ? e : max, currentExpenses[0]);
  }

  // By category
  const catMap: Record<string, number> = {};
  currentExpenses.forEach(e => {
    const cat = e.category || 'Other';
    catMap[cat] = (catMap[cat] || 0) + e.amount;
  });
  const byCategory = Object.entries(catMap)
    .map(([name, amount]) => ({ name, amount, percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);

  const topCategory = byCategory.length > 0 ? { name: byCategory[0].name, amount: byCategory[0].amount } : null;

  // By month (last 6 months)
  const byMonth: { month: string; year: number; monthIdx: number; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthExpenses = getExpensesForMonth(expenses, m, y);
    const total = monthExpenses.reduce((s, e) => s + e.amount, 0);
    byMonth.push({
      month: d.toLocaleString('en-IN', { month: 'short' }),
      year: y,
      monthIdx: m,
      total
    });
  }

  // Month-over-month change
  const prevDate = new Date(currentYear, currentMonth - 1, 1);
  const prevExpenses = getExpensesForMonth(expenses, prevDate.getMonth(), prevDate.getFullYear());
  const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);
  let monthOverMonthChange: number | null = null;
  if (prevTotal > 0) {
    monthOverMonthChange = ((totalSpending - prevTotal) / prevTotal) * 100;
  }

  // Daily average
  const dayOfMonth = targetDate.getDate();
  const dailyAverage = dayOfMonth > 0 ? totalSpending / dayOfMonth : 0;

  return {
    totalSpending,
    transactionCount,
    averageTransaction,
    highestTransaction,
    topCategory,
    byCategory,
    byMonth,
    monthOverMonthChange,
    dailyAverage
  };
}
