import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Target, TrendingUp, Car, Bike, Plane, Home } from 'lucide-react';
import { SavingGoal } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useNotification } from './NotificationContext';
import { RippleEffect } from './RippleEffect';

interface SavingsCornerProps {
  savings: SavingGoal[];
  onAddContribution: (goalId: string, amount: number) => void;
}

const GOAL_ICONS = {
  'Car': <Car size={20} />,
  'Bike': <Bike size={20} />,
  'Travel': <Plane size={20} />,
  'Home': <Home size={20} />,
  'Default': <Target size={20} />
};

export function SavingsCorner({ savings, onAddContribution }: SavingsCornerProps) {
  const { showNotification } = useNotification();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !amount) return;
    onAddContribution(selectedGoal, parseFloat(amount));
    setAmount('');
    setSelectedGoal(null);
    showNotification('Contribution added!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Savings Corner</h2>
        <button className="p-2 rounded-full bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20">
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {savings.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const icon = Object.entries(GOAL_ICONS).find(([key]) => goal.title.includes(key))?.[1] || GOAL_ICONS.Default;

          return (
            <div key={goal.id} className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--border)] space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-bold">{goal.title}</h3>
                    <p className="text-xs opacity-60">Target: {formatCurrency(goal.targetAmount)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedGoal(goal.id)}
                  className="px-3 py-1 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-wider"
                >
                  Add
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>{formatCurrency(goal.currentAmount)}</span>
                  <span className="opacity-60">{progress.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-[var(--accent)]"
                  />
                </div>
              </div>

              {goal.contributions.length > 0 && (
                <div className="pt-2 border-t border-[var(--border)]">
                  <p className="text-[10px] font-bold opacity-40 uppercase mb-2">Recent Contributions</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {goal.contributions.slice(-3).reverse().map((c, i) => (
                      <div key={i} className="flex-shrink-0 px-3 py-1 rounded-lg bg-black/5 text-[10px] font-medium">
                        +{formatCurrency(c.amount)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Contribution Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center" onClick={() => setSelectedGoal(null)}>
          <div 
            className="w-full max-w-md bg-[var(--card-bg)] rounded-t-3xl p-6 space-y-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold">Add Contribution</h3>
            <form onSubmit={handleContribute} className="space-y-4">
              <div className="space-y-2 field-backlight rounded-2xl p-1">
                <label className="text-xs font-bold opacity-60 uppercase ml-3">Amount (₹)</label>
                <input 
                  autoFocus
                  type="number" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full p-4 rounded-xl bg-black/5 border-none focus:ring-0 text-2xl font-bold"
                  placeholder="0.00"
                />
              </div>
              <RippleEffect className="rounded-2xl">
                <button 
                  type="submit"
                  className="w-full p-4 bg-[var(--accent)] text-white font-bold shadow-lg shadow-[var(--accent)]/20"
                >
                  Confirm Contribution
                </button>
              </RippleEffect>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
