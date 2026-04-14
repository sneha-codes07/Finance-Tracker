import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wallet, Landmark, TrendingUp, PiggyBank, Briefcase, Users, ArrowUpRight, ArrowDownRight, Save, Bell } from 'lucide-react';
import { UserData } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { RippleEffect } from './RippleEffect';
import { SlideUpPanel } from './SlideUpPanel';
import { useNotification } from './NotificationContext';

interface DashboardProps {
  data: UserData;
  onSectionClick: (section: string) => void;
  onUpdateBalances: (cash: number, bank: number) => void;
}

export function Dashboard({ data, onSectionClick, onUpdateBalances }: DashboardProps) {
  const { showNotification } = useNotification();
  const [isBalancesOpen, setIsBalancesOpen] = useState(false);
  const [balanceForm, setBalanceForm] = useState({ cash: data.cashBalance.toString(), bank: data.bankBalance.toString() });
  const totalBalance = data.cashBalance + data.bankBalance;
  const monthlyExpenses = data.expenses
    .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + e.amount, 0);
  
  const limitPercentage = Math.min((monthlyExpenses / data.monthlySpendingLimit) * 100, 100);
  const isNearLimit = limitPercentage > 80;

  const suggestions = [
    monthlyExpenses > data.monthlySpendingLimit * 0.8 ? "You are approaching your monthly spending limit." : null,
    data.expenses.length > 5 ? "You've logged several expenses this week. Consider reviewing your entertainment category." : null,
    data.savings.some(s => s.currentAmount / s.targetAmount < 0.1) ? "Great start on your savings! Keep contributing to reach your goals." : null
  ].filter(Boolean);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">FinDiary</h1>
          <p className="text-sm opacity-60 italic-highlight">Welcome back, your finances at a glance.</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">
          S
        </div>
      </div>

      {/* Cash & Bank Overview */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsBalancesOpen(true)}
          className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] space-y-2 cursor-pointer"
        >
          <div className="flex items-center gap-2 opacity-60">
            <Wallet size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Cash</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(data.cashBalance)}</p>
        </motion.div>
        <motion.div 
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsBalancesOpen(true)}
          className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] space-y-2 cursor-pointer"
        >
          <div className="flex items-center gap-2 opacity-60">
            <Landmark size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Bank</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(data.bankBalance)}</p>
        </motion.div>
      </div>

      {/* Spending Limit Tracker */}
      <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--border)] space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-medium opacity-60 uppercase tracking-wider">Monthly Spending</span>
            <p className="text-2xl font-bold">{formatCurrency(monthlyExpenses)}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium opacity-60 uppercase tracking-wider">Limit</span>
            <p className="text-sm font-semibold">{formatCurrency(data.monthlySpendingLimit)}</p>
          </div>
        </div>
        <div className="h-3 bg-black/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${limitPercentage}%` }}
            className={cn(
              "h-full transition-colors duration-500",
              isNearLimit ? "bg-red-500" : "bg-[var(--accent)]"
            )}
          />
        </div>
        {isNearLimit && (
          <p className="text-xs text-red-500 font-medium">⚠️ You've used {limitPercentage.toFixed(0)}% of your limit!</p>
        )}
      </div>

      {/* Main Categories */}
      <div className="grid grid-cols-1 gap-4">
        <CategoryCard 
          title="Expenses" 
          icon={<TrendingUp className="text-red-500" />}
          value={formatCurrency(monthlyExpenses)}
          subtitle="Food, Entertainment, etc."
          onClick={() => onSectionClick('expenses')}
        />
        <CategoryCard 
          title="Savings" 
          icon={<PiggyBank className="text-green-500" />}
          value={formatCurrency(data.savings.reduce((sum, s) => sum + s.currentAmount, 0))}
          subtitle={`${data.savings.length} Active Goals`}
          onClick={() => onSectionClick('savings')}
        />
        <CategoryCard 
          title="Investments" 
          icon={<Briefcase className="text-blue-500" />}
          value={formatCurrency(data.investments.reduce((sum, i) => sum + i.currentValue, 0))}
          subtitle="Stocks, Mutual Funds"
          onClick={() => onSectionClick('investments')}
        />
        <CategoryCard 
          title="Borrow & Lend" 
          icon={<Users className="text-purple-500" />}
          value={formatCurrency(data.borrowLend.reduce((sum, i) => sum + (i.type === 'Lend' ? i.amount : -i.amount), 0))}
          subtitle="Track dues"
          onClick={() => onSectionClick('borrowLend')}
        />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold opacity-60 uppercase tracking-wider px-1">Smart Suggestions</h3>
          {suggestions.map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-sm font-medium"
            >
              {s}
            </motion.div>
          ))}
        </div>
      )}

      {/* Reminders */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold opacity-60 uppercase tracking-wider px-1">Upcoming Reminders</h3>
        <div className="p-4 rounded-3xl bg-[var(--card-bg)] border border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <Bell size={16} />
              </div>
              <div>
                <p className="text-sm font-bold">Mutual Fund SIP</p>
                <p className="text-[10px] opacity-60">Due in 2 days</p>
              </div>
            </div>
            <p className="text-sm font-bold">₹5,000</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Bell size={16} />
              </div>
              <div>
                <p className="text-sm font-bold">Rent Payment</p>
                <p className="text-[10px] opacity-60">Due tomorrow</p>
              </div>
            </div>
            <p className="text-sm font-bold">₹15,000</p>
          </div>
        </div>
      </div>

      {/* Balances Update Panel */}
      <SlideUpPanel 
        isOpen={isBalancesOpen} 
        onClose={() => setIsBalancesOpen(false)} 
        title="Update Balances"
      >
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            onUpdateBalances(parseFloat(balanceForm.cash), parseFloat(balanceForm.bank));
            setIsBalancesOpen(false);
            showNotification('Balances updated successfully!', 'success');
          }}
          className="space-y-6"
        >
          <div className="space-y-4">
            <div className="space-y-2 field-backlight rounded-2xl p-1">
              <label className="text-xs font-bold opacity-60 uppercase ml-3">Cash in Hand (₹)</label>
              <input 
                type="number" 
                value={balanceForm.cash}
                onChange={e => setBalanceForm({ ...balanceForm, cash: e.target.value })}
                className="w-full p-4 rounded-xl bg-black/5 border-none focus:ring-0 text-xl font-bold"
              />
            </div>
            <div className="space-y-2 field-backlight rounded-2xl p-1">
              <label className="text-xs font-bold opacity-60 uppercase ml-3">Bank Balance (₹)</label>
              <input 
                type="number" 
                value={balanceForm.bank}
                onChange={e => setBalanceForm({ ...balanceForm, bank: e.target.value })}
                className="w-full p-4 rounded-xl bg-black/5 border-none focus:ring-0 text-xl font-bold"
              />
            </div>
          </div>
          <RippleEffect className="rounded-2xl">
            <button 
              type="submit"
              className="w-full p-4 bg-[var(--accent)] text-white font-bold flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Save Balances
            </button>
          </RippleEffect>
        </form>
      </SlideUpPanel>
    </div>
  );
}

function CategoryCard({ title, icon, value, subtitle, onClick }: { title: string, icon: React.ReactNode, value: string, subtitle: string, onClick: () => void }) {
  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-5 rounded-3xl bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-between group cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-xs opacity-60">{subtitle}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg">{value}</p>
        <div className="flex items-center justify-end gap-1 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-bold uppercase">View</span>
          <ArrowUpRight size={12} />
        </div>
      </div>
    </motion.div>
  );
}
