import { Expense, Subscription } from '../types';

export interface SubscriptionInsight {
  totalMonthly: number;
  totalYearly: number;
  activeCount: number;
  inactiveCount: number;
  byCategory: { name: string; amount: number; count: number }[];
  mostExpensive: Subscription | null;
}

/**
 * Get subscription intelligence summary.
 */
export function getSubscriptionInsights(subscriptions: Subscription[]): SubscriptionInsight {
  const active = subscriptions.filter(s => s.isActive);
  const inactive = subscriptions.filter(s => !s.isActive);

  // Normalize all to monthly cost
  const monthlyTotal = active.reduce((total, s) => {
    switch (s.frequency) {
      case 'monthly': return total + s.amount;
      case 'quarterly': return total + s.amount / 3;
      case 'yearly': return total + s.amount / 12;
      default: return total + s.amount;
    }
  }, 0);

  // By category
  const catMap: Record<string, { amount: number; count: number }> = {};
  active.forEach(s => {
    const cat = s.category || 'Other';
    if (!catMap[cat]) catMap[cat] = { amount: 0, count: 0 };
    let monthly = s.amount;
    if (s.frequency === 'quarterly') monthly = s.amount / 3;
    if (s.frequency === 'yearly') monthly = s.amount / 12;
    catMap[cat].amount += monthly;
    catMap[cat].count += 1;
  });
  const byCategory = Object.entries(catMap)
    .map(([name, { amount, count }]) => ({ name, amount, count }))
    .sort((a, b) => b.amount - a.amount);

  // Most expensive (monthly normalized)
  let mostExpensive: Subscription | null = null;
  let highestMonthly = 0;
  active.forEach(s => {
    let monthly = s.amount;
    if (s.frequency === 'quarterly') monthly = s.amount / 3;
    if (s.frequency === 'yearly') monthly = s.amount / 12;
    if (monthly > highestMonthly) {
      highestMonthly = monthly;
      mostExpensive = s;
    }
  });

  return {
    totalMonthly: Math.round(monthlyTotal),
    totalYearly: Math.round(monthlyTotal * 12),
    activeCount: active.length,
    inactiveCount: inactive.length,
    byCategory,
    mostExpensive
  };
}

/**
 * Detect potential subscriptions from expense history.
 * Looks for entertainment, streaming, and known subscription merchants.
 */
export function detectSubscriptionsFromExpenses(expenses: Expense[]): { name: string; amount: number; category: string; occurrences: number }[] {
  const subscriptionKeywords = /netflix|spotify|amazon prime|hotstar|youtube|disney|hbo|apple music|google one|icloud|dropbox|notion|figma|adobe|canva|chatgpt|openai|github|linkedin|grammarly|medium|audible/i;

  const groups: Record<string, { expenses: Expense[] }> = {};
  expenses.forEach(e => {
    const text = `${e.merchant || ''} ${e.description || ''} ${e.note || ''}`.toLowerCase();
    const match = text.match(subscriptionKeywords);
    if (match) {
      const key = match[0];
      if (!groups[key]) groups[key] = { expenses: [] };
      groups[key].expenses.push(e);
    }
  });

  return Object.entries(groups)
    .filter(([, { expenses }]) => expenses.length >= 1)
    .map(([name, { expenses: exps }]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      amount: Math.round(exps.reduce((s, e) => s + e.amount, 0) / exps.length),
      category: exps[0].category,
      occurrences: exps.length
    }))
    .sort((a, b) => b.amount - a.amount);
}
