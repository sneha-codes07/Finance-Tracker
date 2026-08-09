import { Expense } from '../types';

export interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  transactions: Expense[];
  total: number;
}

export interface CalendarMonth {
  year: number;
  month: number;
  monthName: string;
  days: CalendarDay[];
  monthTotal: number;
  spendingDays: number;
}

export function getCalendarMonth(expenses: Expense[], year: number, month: number): CalendarMonth {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0=Sun

  const monthName = firstDay.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  // Build a map of date -> expenses
  const dateMap: Record<number, Expense[]> = {};
  expenses.forEach(e => {
    const d = new Date(e.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!dateMap[day]) dateMap[day] = [];
      dateMap[day].push(e);
    }
  });

  const days: CalendarDay[] = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: prevMonthLastDay - i,
      isCurrentMonth: false,
      isToday: false,
      transactions: [],
      total: 0
    });
  }

  // Current month days
  let monthTotal = 0;
  let spendingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const txns = dateMap[d] || [];
    const total = txns.reduce((s, e) => s + e.amount, 0);
    if (total > 0) spendingDays++;
    monthTotal += total;
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: d === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
      transactions: txns,
      total
    });
  }

  // Next month padding to fill grid
  const remaining = 42 - days.length; // 6 rows * 7
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: i,
      isCurrentMonth: false,
      isToday: false,
      transactions: [],
      total: 0
    });
  }

  return { year, month, monthName, days, monthTotal, spendingDays };
}
