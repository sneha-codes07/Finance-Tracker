import { useState, useEffect } from 'react';
import { UserData, Expense, Investment, BorrowLend, RecurringExpense, Subscription } from '../types';

const INITIAL_DATA: UserData = {
  cashBalance: 5000,
  bankBalance: 45000,
  monthlySpendingLimit: 20000,
  expenses: [],
  savings: [
    {
      id: '1',
      title: 'New Car',
      targetAmount: 800000,
      currentAmount: 150000,
      contributions: [{ amount: 150000, date: new Date().toISOString() }]
    }
  ],
  investments: [],
  borrowLend: [],
  reminders: [],
  recurringExpenses: [],
  subscriptions: [],
  notificationsEnabled: false
};

export function useFinData() {
  const [data, setData] = useState<UserData>(() => {
    const saved = localStorage.getItem('findiary-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.recurringExpenses) parsed.recurringExpenses = [];
        if (!parsed.subscriptions) parsed.subscriptions = [];
        if (parsed.notificationsEnabled === undefined) parsed.notificationsEnabled = false;
        return parsed;
      } catch (e) {
        return INITIAL_DATA;
      }
    }
    return INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem('findiary-data', JSON.stringify(data));
  }, [data]);

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: Math.random().toString(36).substr(2, 9) };
    setData(prev => {
      const isCash = expense.paymentMethod === 'Cash';
      return {
        ...prev,
        expenses: [newExpense, ...prev.expenses],
        bankBalance: isCash ? prev.bankBalance : prev.bankBalance - expense.amount,
        cashBalance: isCash ? prev.cashBalance - expense.amount : prev.cashBalance
      };
    });
  };

  const updateExpense = (id: string, updated: Omit<Expense, 'id'>) => {
    setData(prev => {
      const old = prev.expenses.find(e => e.id === id);
      if (!old) return prev;
      const wasCash = old.paymentMethod === 'Cash';
      let bankAdjustment = wasCash ? 0 : old.amount;
      let cashAdjustment = wasCash ? old.amount : 0;
      const isCash = updated.paymentMethod === 'Cash';
      bankAdjustment -= isCash ? 0 : updated.amount;
      cashAdjustment -= isCash ? updated.amount : 0;
      return {
        ...prev,
        expenses: prev.expenses.map(e => e.id === id ? { ...updated, id } : e),
        bankBalance: prev.bankBalance + bankAdjustment,
        cashBalance: prev.cashBalance + cashAdjustment
      };
    });
  };

  const deleteExpense = (id: string) => {
    setData(prev => {
      const old = prev.expenses.find(e => e.id === id);
      if (!old) return prev;
      const wasCash = old.paymentMethod === 'Cash';
      return {
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== id),
        bankBalance: wasCash ? prev.bankBalance : prev.bankBalance + old.amount,
        cashBalance: wasCash ? prev.cashBalance + old.amount : prev.cashBalance
      };
    });
  };

  const addSavingContribution = (goalId: string, amount: number) => {
    setData(prev => ({
      ...prev,
      savings: prev.savings.map(goal =>
        goal.id === goalId
          ? { ...goal, currentAmount: goal.currentAmount + amount, contributions: [...goal.contributions, { amount, date: new Date().toISOString() }] }
          : goal
      ),
      bankBalance: prev.bankBalance - amount
    }));
  };

  const addInvestment = (investment: Omit<Investment, 'id'>) => {
    const newInv = { ...investment, id: Math.random().toString(36).substr(2, 9) };
    setData(prev => ({
      ...prev,
      investments: [newInv, ...prev.investments],
      bankBalance: prev.bankBalance - investment.investedAmount
    }));
  };

  const addBorrowLend = (item: Omit<BorrowLend, 'id'>) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    setData(prev => ({
      ...prev,
      borrowLend: [newItem, ...prev.borrowLend]
    }));
  };

  const updateBalances = (cash: number, bank: number) => {
    setData(prev => ({ ...prev, cashBalance: cash, bankBalance: bank }));
  };

  const setSpendingLimit = (limit: number) => {
    setData(prev => ({ ...prev, monthlySpendingLimit: limit }));
  };

  const addRecurringExpense = (item: Omit<RecurringExpense, 'id'>) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    setData(prev => ({
      ...prev,
      recurringExpenses: [newItem, ...(prev.recurringExpenses || [])]
    }));
  };

  const updateRecurringExpense = (id: string, updated: Omit<RecurringExpense, 'id'>) => {
    setData(prev => ({
      ...prev,
      recurringExpenses: (prev.recurringExpenses || []).map(r => r.id === id ? { ...updated, id } : r)
    }));
  };

  const deleteRecurringExpense = (id: string) => {
    setData(prev => ({
      ...prev,
      recurringExpenses: (prev.recurringExpenses || []).filter(r => r.id !== id)
    }));
  };

  const addSubscription = (item: Omit<Subscription, 'id'>) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    setData(prev => ({
      ...prev,
      subscriptions: [newItem, ...(prev.subscriptions || [])]
    }));
  };

  const updateSubscription = (id: string, updated: Omit<Subscription, 'id'>) => {
    setData(prev => ({
      ...prev,
      subscriptions: (prev.subscriptions || []).map(s => s.id === id ? { ...updated, id } : s)
    }));
  };

  const deleteSubscription = (id: string) => {
    setData(prev => ({
      ...prev,
      subscriptions: (prev.subscriptions || []).filter(s => s.id !== id)
    }));
  };

  const setNotificationsEnabled = (enabled: boolean) => {
    setData(prev => ({ ...prev, notificationsEnabled: enabled }));
  };

  const restoreBackup = (backup: UserData) => {
    setData(backup);
  };

  return {
    data,
    addExpense,
    updateExpense,
    deleteExpense,
    addSavingContribution,
    addInvestment,
    addBorrowLend,
    updateBalances,
    setSpendingLimit,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    setNotificationsEnabled,
    restoreBackup
  };
}
