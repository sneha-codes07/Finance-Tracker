import { Expense } from '../types';
import { classifyFoodExpense } from './foodService';

export interface SpendingSummary {
  total: number;
  byCategory: Record<string, number>;
  previousMonthTotal: number;
  percentageDiff: number;
  compareText: string;
}

export interface SpendDelta {
  category: string;
  currentAmount: number;
  previousAmount: number;
  percentageChange: number;
  direction: 'up' | 'down' | 'flat';
}

export interface SpendObservation {
  id: string;
  type: 'info' | 'positive' | 'warning';
  title: string;
  message: string;
}

// Get expenses filtered by month and year
export function getExpensesForMonth(expenses: Expense[], month: number, year: number): Expense[] {
  return expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

// Calculate the summary for a specific month
export function getSpendingSummary(expenses: Expense[], targetDate: Date): SpendingSummary {
  const currentMonth = targetDate.getMonth();
  const currentYear = targetDate.getFullYear();
  
  const prevDate = new Date(targetDate);
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonth = prevDate.getMonth();
  const prevYear = prevDate.getFullYear();
  
  const currentExpenses = getExpensesForMonth(expenses, currentMonth, currentYear);
  const prevExpenses = getExpensesForMonth(expenses, prevMonth, prevYear);
  
  const total = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const previousMonthTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const byCategory: Record<string, number> = {};
  currentExpenses.forEach(e => {
    const cat = e.category || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + e.amount;
  });
  
  let percentageDiff = 0;
  let compareText = 'compared to last month';
  if (previousMonthTotal > 0) {
    percentageDiff = ((total - previousMonthTotal) / previousMonthTotal) * 100;
    const direction = percentageDiff >= 0 ? 'higher than' : 'lower than';
    compareText = `${Math.abs(percentageDiff).toFixed(1)}% ${direction} last month`;
  } else {
    compareText = 'No previous month data';
  }
  
  return {
    total,
    byCategory,
    previousMonthTotal,
    percentageDiff,
    compareText
  };
}

// Identify meaningful changes between current and previous month
export function getMeaningfulChanges(expenses: Expense[], targetDate: Date): SpendDelta[] {
  const currentMonth = targetDate.getMonth();
  const currentYear = targetDate.getFullYear();
  
  const prevDate = new Date(targetDate);
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonth = prevDate.getMonth();
  const prevYear = prevDate.getFullYear();
  
  const currentExpenses = getExpensesForMonth(expenses, currentMonth, currentYear);
  const prevExpenses = getExpensesForMonth(expenses, prevMonth, prevYear);
  
  const currentCats: Record<string, number> = {};
  currentExpenses.forEach(e => {
    const cat = e.category || 'Other';
    currentCats[cat] = (currentCats[cat] || 0) + e.amount;
  });
  
  const prevCats: Record<string, number> = {};
  prevExpenses.forEach(e => {
    const cat = e.category || 'Other';
    prevCats[cat] = (prevCats[cat] || 0) + e.amount;
  });
  
  // Aggregate all unique categories from both lists
  const allCategories = Array.from(new Set([...Object.keys(currentCats), ...Object.keys(prevCats)]));
  
  const deltas: SpendDelta[] = [];
  
  allCategories.forEach(cat => {
    const curVal = currentCats[cat] || 0;
    const prevVal = prevCats[cat] || 0;
    
    if (curVal === 0 && prevVal === 0) return;
    
    let pct = 0;
    let dir: 'up' | 'down' | 'flat' = 'flat';
    
    if (prevVal > 0) {
      pct = ((curVal - prevVal) / prevVal) * 100;
      if (pct > 5) dir = 'up';
      else if (pct < -5) dir = 'down';
    } else if (curVal > 0) {
      pct = 100; // 100% increase from zero
      dir = 'up';
    }
    
    if (dir !== 'flat' && Math.abs(curVal - prevVal) > 100) {
      deltas.push({
        category: cat,
        currentAmount: curVal,
        previousAmount: prevVal,
        percentageChange: pct,
        direction: dir
      });
    }
  });
  
  return deltas;
}

// Generate deterministic insights (Something Worth Knowing)
export function getSpendingObservations(expenses: Expense[], targetDate: Date, limit: number): SpendObservation[] {
  const currentMonth = targetDate.getMonth();
  const currentYear = targetDate.getFullYear();
  const currentExpenses = getExpensesForMonth(expenses, currentMonth, currentYear);
  
  const total = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const observations: SpendObservation[] = [];
  
  if (expenses.length === 0) {
    observations.push({
      id: 'no-data',
      type: 'info',
      title: 'Your spending story starts here',
      message: 'Add some expenses to get observations on your spending patterns.'
    });
    return observations;
  }
  
  // 1. Check if near or exceeding spending limit
  if (limit > 0) {
    const ratio = total / limit;
    if (ratio >= 1.0) {
      observations.push({
        id: 'limit-exceeded',
        type: 'warning',
        title: 'Monthly limit reached',
        message: `You spent ${((ratio - 1) * 100).toFixed(0)}% more than your monthly limit of ₹${limit.toLocaleString('en-IN')}.`
      });
    } else if (ratio > 0.8) {
      observations.push({
        id: 'limit-approaching',
        type: 'warning',
        title: 'Approaching monthly limit',
        message: `You have used ${(ratio * 100).toFixed(0)}% of your monthly spending limit of ₹${limit.toLocaleString('en-IN')}.`
      });
    }
  }
  
  // 2. Food analytics: Outside Food vs Essential Food
  const foodExpenses = currentExpenses.filter(e => e.category.toLowerCase() === 'food');
  if (foodExpenses.length > 0) {
    let essentialSum = 0;
    let outsideSum = 0;
    let junkSum = 0;
    
    foodExpenses.forEach(e => {
      const cls = classifyFoodExpense(e);
      if (cls === 'essential') essentialSum += e.amount;
      else if (cls === 'outside') outsideSum += e.amount;
      else if (cls === 'junk') junkSum += e.amount;
    });
    
    const foodTotal = essentialSum + outsideSum + junkSum;
    if (foodTotal > 0 && outsideSum > essentialSum) {
      const ratio = (outsideSum / foodTotal) * 100;
      observations.push({
        id: 'food-outside-heavy',
        type: 'info',
        title: 'Dining out is active',
        message: `Outside food and delivery make up ${ratio.toFixed(0)}% of your food spending this month.`
      });
    }
  }
  
  // 3. Weekend vs Weekday spending
  let weekendSum = 0;
  let weekdaySum = 0;
  currentExpenses.forEach(e => {
    const day = new Date(e.date).getDay();
    const isWeekend = day === 0 || day === 6; // Sunday or Saturday
    if (isWeekend) weekendSum += e.amount;
    else weekdaySum += e.amount;
  });
  
  if (weekendSum > weekdaySum && weekendSum > 1000) {
    observations.push({
      id: 'weekend-heavy',
      type: 'info',
      title: 'Weekend active spending',
      message: `Weekend spending (₹${weekendSum.toLocaleString('en-IN')}) is higher than weekdays (₹${weekdaySum.toLocaleString('en-IN')}).`
    });
  }
  
  if (observations.length === 0) {
    observations.push({
      id: 'on-track',
      type: 'positive',
      title: 'Stable patterns',
      message: 'Your spending matches your usual patterns and is within normal ranges for this month.'
    });
  }
  
  return observations;
}
