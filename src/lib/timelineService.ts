import { Expense, UserData } from '../types';
import { getExpensesForMonth } from './spendingService';

export interface TimelineEntry {
  month: string;
  year: number;
  monthIdx: number;
  totalSpent: number;
  transactionCount: number;
  topCategory: string | null;
  cashSpent: number;
  bankSpent: number;
}

export interface TimelineSummary {
  entries: TimelineEntry[];
  totalAllTime: number;
  highestMonth: TimelineEntry | null;
  lowestMonth: TimelineEntry | null;
  averageMonthly: number;
}

export function getTimeline(expenses: Expense[], monthsBack: number = 12): TimelineSummary {
  const today = new Date();
  const entries: TimelineEntry[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthExpenses = getExpensesForMonth(expenses, m, y);

    const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const cashSpent = monthExpenses.filter(e => e.paymentMethod === 'Cash').reduce((s, e) => s + e.amount, 0);
    const bankSpent = monthExpenses.filter(e => e.paymentMethod !== 'Cash').reduce((s, e) => s + e.amount, 0);

    // Top category
    const catMap: Record<string, number> = {};
    monthExpenses.forEach(e => {
      const cat = e.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + e.amount;
    });
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const topCategory = sorted.length > 0 ? sorted[0][0] : null;

    entries.push({
      month: d.toLocaleString('en-IN', { month: 'short' }),
      year: y,
      monthIdx: m,
      totalSpent,
      transactionCount: monthExpenses.length,
      topCategory,
      cashSpent,
      bankSpent
    });
  }

  const withData = entries.filter(e => e.totalSpent > 0);
  const totalAllTime = withData.reduce((s, e) => s + e.totalSpent, 0);
  const averageMonthly = withData.length > 0 ? totalAllTime / withData.length : 0;
  const highestMonth = withData.length > 0 ? withData.reduce((max, e) => e.totalSpent > max.totalSpent ? e : max, withData[0]) : null;
  const lowestMonth = withData.length > 0 ? withData.reduce((min, e) => e.totalSpent < min.totalSpent ? e : min, withData[0]) : null;

  return { entries, totalAllTime, highestMonth, lowestMonth, averageMonthly };
}
