import { useState, useEffect } from 'react';
import { UserData, Expense, Investment, BorrowLend, RecurringExpense, Subscription, SavingGoal } from '../types';
import { supabase } from '../lib/supabase';

const INITIAL_DATA: UserData = {
  cashBalance: 0,
  bankBalance: 0,
  monthlySpendingLimit: 0,
  expenses: [],
  savings: [],
  investments: [],
  borrowLend: [],
  reminders: [],
  recurringExpenses: [],
  subscriptions: [],
  notificationsEnabled: false
};

export function useFinData(userId: string | null) {
  const [data, setData] = useState<UserData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    if (!supabase || !userId) {
      setData(INITIAL_DATA);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase.from('user_data')
      .select('data')
      .eq('id', userId)
      .single()
      .then(async ({ data: row, error }) => {
        if (error) {
          if (error.code === 'PGRST116') {
            // Document doesn't exist, create it with INITIAL_DATA
            await supabase.from('user_data').insert({ id: userId, data: INITIAL_DATA });
            setData(INITIAL_DATA);
          } else {
            console.error("Error fetching user data from Supabase:", error);
            setData(INITIAL_DATA);
          }
        } else if (row && row.data) {
          const fetchedData = row.data as UserData;
          // Ensure arrays exist
          if (!fetchedData.expenses) fetchedData.expenses = [];
          if (!fetchedData.savings) fetchedData.savings = [];
          if (!fetchedData.investments) fetchedData.investments = [];
          if (!fetchedData.borrowLend) fetchedData.borrowLend = [];
          if (!fetchedData.reminders) fetchedData.reminders = [];
          if (!fetchedData.recurringExpenses) fetchedData.recurringExpenses = [];
          if (!fetchedData.subscriptions) fetchedData.subscriptions = [];
          setData(fetchedData);
        } else {
          setData(INITIAL_DATA);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Exception loading user data from Supabase:", err);
        setData(INITIAL_DATA);
        setLoading(false);
      });
  }, [userId]);

  // Sync updates to Supabase
  useEffect(() => {
    if (!supabase || !userId || loading) return;

    supabase.from('user_data')
      .upsert({ id: userId, data: data })
      .then(({ error }) => {
        if (error) {
          console.error("Error writing user data to Supabase:", error);
        }
      })
      .catch((err) => {
        console.error("Exception writing user data to Supabase:", err);
      });
  }, [data, userId, loading]);

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

  const addSavingGoal = (title: string, targetAmount: number, initialAmount: number) => {
    const newGoal: SavingGoal = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      targetAmount,
      currentAmount: initialAmount,
      contributions: initialAmount > 0 ? [{ amount: initialAmount, date: new Date().toISOString() }] : []
    };
    setData(prev => ({
      ...prev,
      savings: [...prev.savings, newGoal]
    }));
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
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    addSavingGoal,
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
