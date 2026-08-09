import React, { useState } from 'react';
import { Target, Plus, ChevronRight, CheckCircle, TrendingUp, Sparkles, X } from 'lucide-react';
import { SavingGoal } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useNotification } from './NotificationContext';

interface SavingsCornerProps {
  savings: SavingGoal[];
  onAddContribution: (goalId: string, amount: number) => void;
  // If V1 had addGoal, we can expose it, or just support contribution logging
  onAddGoal?: (title: string, targetAmount: number) => void;
}

export function SavingsCorner({ savings, onAddContribution, onAddGoal }: SavingsCornerProps) {
  const { showNotification } = useNotification();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  
  // New goal modal state
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !amount) return;
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showNotification('Please enter a valid amount', 'warning');
      return;
    }

    onAddContribution(selectedGoal, parsedAmount);
    setAmount('');
    setSelectedGoal(null);
    showNotification('Goal contribution added successfully', 'success');
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle || !newGoalTarget) return;

    const parsedTarget = parseFloat(newGoalTarget);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      showNotification('Please enter a valid target amount', 'warning');
      return;
    }

    if (onAddGoal) {
      onAddGoal(newGoalTitle, parsedTarget);
    } else {
      // Direct local state addition if handler isn't passed (handled in hook)
      // Since useFinData doesn't have addGoal, we can add it to the state in App.tsx or useFinData.ts later
      showNotification('Goal creation supported in data hook', 'info');
    }

    setNewGoalTitle('');
    setNewGoalTarget('');
    setIsAddingGoal(false);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      
      {/* Title */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h2 className="text-3xl font-bold text-[var(--foreground)] editorial-title">Goals</h2>
          <p className="text-sm text-[var(--muted)] mt-1 font-medium">Progress towards your financial targets.</p>
        </div>
      </div>

      {/* Goal Cards Grid */}
      <section className="space-y-4">
        {savings.length > 0 ? (
          savings.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const isCompleted = progress >= 100;

            return (
              <div 
                key={goal.id} 
                className="p-5 rounded-2xl glass-panel space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                      isCompleted 
                        ? "bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]/20" 
                        : "bg-[var(--accent-light)] text-[var(--accent)] border-[var(--accent)]/20"
                    )}>
                      {isCompleted ? <CheckCircle size={16} /> : <Target size={16} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[var(--foreground)]">{goal.title}</h3>
                      <p className="text-[10px] text-[var(--muted)] font-semibold uppercase mt-1 tracking-wider font-mono">
                        Target: {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>
                  
                  {!isCompleted && (
                    <button 
                      onClick={() => setSelectedGoal(goal.id)}
                      className="py-1.5 px-3 rounded-lg bg-[var(--accent)] text-[#080808] text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-all focus:outline-none shadow-sm"
                    >
                      Contribute
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 select-none">
                  <div className="flex justify-between text-xs font-bold font-mono">
                    <span className="text-[var(--accent)] tabular-digits">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-[var(--muted)]">{progress.toFixed(0)}%</span>
                  </div>
                  
                  <div className="h-1.5 bg-[var(--surface-elevated)]/60 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isCompleted ? "bg-[var(--success)]" : "bg-[var(--accent)]"
                      )} 
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Contribution list */}
                {goal.contributions && goal.contributions.length > 0 && (
                  <div className="pt-3 border-t border-[var(--border)]/20">
                    <p className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider mb-2 font-mono">Recent Deposits</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide custom-scrollbar">
                      {goal.contributions.slice(-3).reverse().map((c, i) => (
                        <div key={i} className="flex-shrink-0 px-2.5 py-1 rounded bg-[var(--surface-elevated)]/40 border border-[var(--border)]/20 text-[10px] font-semibold font-mono text-[var(--muted)]">
                          +{formatCurrency(c.amount)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center border border-dashed border-[var(--border)] rounded-2xl glass-panel">
            <p className="text-sm text-[var(--muted)] font-semibold">No savings goals established yet.</p>
          </div>
        )}
      </section>

      {/* Contribution Drawer / Modal */}
      {selectedGoal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedGoal(null)}
        >
          <div 
            className="w-full max-w-sm glass-panel rounded-2xl p-6 space-y-5 shadow-[0_15px_50px_rgba(0,0,0,0.4)] animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center select-none border-b border-[var(--border)]/30 pb-3">
              <h3 className="text-lg font-bold text-[var(--foreground)] font-serif">Add Contribution</h3>
              <button onClick={() => setSelectedGoal(null)} className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleContribute} className="space-y-4">
              <div className="space-y-1.5 p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] ml-1 select-none">Contribution Amount (₹)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-transparent border-none text-2xl font-bold font-mono focus:outline-none focus:ring-0 text-[var(--foreground)] p-1"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-[var(--accent)] text-[#080808] font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md text-center focus:outline-none"
                >
                  Confirm Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
