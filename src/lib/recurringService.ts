import { Expense, RecurringExpense } from '../types';

export interface DetectedRecurring {
  merchant: string;
  category: string;
  averageAmount: number;
  occurrences: number;
  dates: string[];
  estimatedFrequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

/**
 * Detect recurring expenses from transaction history by analyzing
 * merchants/descriptions that appear multiple times with similar amounts.
 */
export function detectRecurringExpenses(expenses: Expense[]): DetectedRecurring[] {
  // Group by merchant or description (as a proxy for recurring identification)
  const groups: Record<string, Expense[]> = {};
  expenses.forEach(e => {
    const key = (e.merchant || e.description || 'Unknown').toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  const results: DetectedRecurring[] = [];

  Object.entries(groups).forEach(([key, items]) => {
    if (items.length < 2) return; // Need at least 2 occurrences

    // Check if amounts are roughly similar (within 20%)
    const amounts = items.map(e => e.amount);
    const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const allSimilar = amounts.every(a => Math.abs(a - avgAmount) / avgAmount < 0.3);

    if (!allSimilar) return;

    // Estimate frequency from date gaps
    const sortedDates = items.map(e => new Date(e.date).getTime()).sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < sortedDates.length; i++) {
      gaps.push((sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24)); // days
    }
    const avgGap = gaps.length > 0 ? gaps.reduce((s, g) => s + g, 0) / gaps.length : 0;

    let estimatedFrequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly';
    if (avgGap < 10) estimatedFrequency = 'weekly';
    else if (avgGap < 45) estimatedFrequency = 'monthly';
    else if (avgGap < 120) estimatedFrequency = 'quarterly';
    else estimatedFrequency = 'yearly';

    results.push({
      merchant: items[0].merchant || items[0].description || 'Unknown',
      category: items[0].category,
      averageAmount: Math.round(avgAmount),
      occurrences: items.length,
      dates: items.map(e => e.date).sort(),
      estimatedFrequency
    });
  });

  return results.sort((a, b) => b.averageAmount - a.averageAmount);
}

/**
 * Get the total estimated monthly cost of recurring commitments.
 */
export function getRecurringMonthlyCost(items: RecurringExpense[]): number {
  return items.reduce((total, item) => {
    switch (item.frequency) {
      case 'weekly': return total + item.amount * 4.33;
      case 'monthly': return total + item.amount;
      case 'quarterly': return total + item.amount / 3;
      case 'yearly': return total + item.amount / 12;
      default: return total + item.amount;
    }
  }, 0);
}
