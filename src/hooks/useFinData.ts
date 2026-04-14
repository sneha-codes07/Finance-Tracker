import { useState, useEffect } from 'react';
import { UserData, Expense, SavingGoal, Investment, BorrowLend, Reminder } from '../types';

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
  reminders: []
};

export function useFinData() {
  const [data, setData] = useState<UserData>(() => {
    const saved = localStorage.getItem('findiary-data');
    if (saved) {
      try {
        return JSON.parse(saved);
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
    setData(prev => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
      bankBalance: prev.bankBalance - expense.amount // Default to bank for now
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

  return {
    data,
    addExpense,
    addSavingContribution,
    addInvestment,
    addBorrowLend,
    updateBalances,
    setSpendingLimit
  };
}
