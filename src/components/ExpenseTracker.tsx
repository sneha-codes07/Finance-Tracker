import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Plus, Utensils, Film, GraduationCap, ShoppingBag, MoreHorizontal } from 'lucide-react';
import { Expense } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useNotification } from './NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { RippleEffect } from './RippleEffect';

interface ExpenseTrackerProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
}

const CATEGORIES = [
  { name: 'Food', icon: <Utensils size={16} />, color: '#ef4444' },
  { name: 'Entertainment', icon: <Film size={16} />, color: '#3b82f6' },
  { name: 'Education', icon: <GraduationCap size={16} />, color: '#10b981' },
  { name: 'Shopping', icon: <ShoppingBag size={16} />, color: '#f59e0b' },
  { name: 'Other', icon: <MoreHorizontal size={16} />, color: '#6b7280' },
];

export function ExpenseTracker({ expenses, onAddExpense }: ExpenseTrackerProps) {
  const { showNotification } = useNotification();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ amount: '', category: 'Food', description: '' });

  const categoryTotals = CATEGORIES.map(cat => {
    const total = expenses
      .filter(e => e.category === cat.name)
      .reduce((sum, e) => sum + e.amount, 0);
    return { name: cat.name, value: total, color: cat.color };
  }).filter(c => c.value > 0);

  const totalExpenses = categoryTotals.reduce((sum, c) => sum + c.value, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return;
    onAddExpense({
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: new Date().toISOString()
    });
    setFormData({ amount: '', category: 'Food', description: '' });
    setIsAdding(false);
    showNotification('Expense logged successfully!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Expense Breakdown</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-2 rounded-full bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20"
        >
          <Plus size={20} />
        </button>
      </div>

      {expenses.length > 0 ? (
        <>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryTotals}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryTotals.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {categoryTotals.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-medium">{cat.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(cat.value)}</p>
                  <p className="text-[10px] opacity-60">{((cat.value / totalExpenses) * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="py-12 text-center opacity-40">
          <p>No expenses logged yet.</p>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold opacity-60 uppercase tracking-wider">Recent Transactions</h3>
        <div className="space-y-2">
          {expenses.slice(0, 5).map((e) => (
            <motion.div 
              key={e.id}
              drag="x"
              dragConstraints={{ left: -100, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50) {
                  showNotification('Swipe actions coming soon!', 'info');
                }
              }}
              className="flex items-center justify-between p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] touch-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                  {CATEGORIES.find(c => c.name === e.category)?.icon}
                </div>
                <div>
                  <p className="font-bold">{e.description || e.category}</p>
                  <p className="text-[10px] opacity-60">{new Date(e.date).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="font-bold text-red-500">-{formatCurrency(e.amount)}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Expense Modal Content */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center" onClick={() => setIsAdding(false)}>
          <div 
            className="w-full max-w-md bg-[var(--card-bg)] rounded-t-3xl p-6 space-y-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold">Add Expense</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 field-backlight rounded-2xl p-1">
                <label className="text-xs font-bold opacity-60 uppercase ml-3">Amount (₹)</label>
                <input 
                  autoFocus
                  type="number" 
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full p-4 rounded-xl bg-black/5 border-none focus:ring-0 text-2xl font-bold"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60 uppercase">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.name })}
                      className={cn(
                        "p-3 rounded-xl border text-xs font-bold transition-all",
                        formData.category === cat.name 
                          ? "bg-[var(--accent)] text-white border-[var(--accent)]" 
                          : "bg-transparent border-[var(--border)] opacity-60"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 field-backlight rounded-2xl p-1">
                <label className="text-xs font-bold opacity-60 uppercase ml-3">Description</label>
                <input 
                  type="text" 
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-4 rounded-xl bg-black/5 border-none focus:ring-0"
                  placeholder="What was this for?"
                />
              </div>
              <RippleEffect className="rounded-2xl">
                <button 
                  type="submit"
                  className="w-full p-4 bg-[var(--accent)] text-white font-bold shadow-lg shadow-[var(--accent)]/20"
                >
                  Log Expense
                </button>
              </RippleEffect>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
