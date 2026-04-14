import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Briefcase, PieChart } from 'lucide-react';
import { Investment } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useNotification } from './NotificationContext';
import { RippleEffect } from './RippleEffect';

interface InvestmentDashboardProps {
  investments: Investment[];
  onAddInvestment: (investment: Omit<Investment, 'id'>) => void;
}

export function InvestmentDashboard({ investments, onAddInvestment }: InvestmentDashboardProps) {
  const { showNotification } = useNotification();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'Mutual Fund' as const, amount: '' });

  const totalInvested = investments.reduce((sum, i) => sum + i.investedAmount, 0);
  const currentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const totalProfit = currentValue - totalInvested;
  const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;
    onAddInvestment({
      name: formData.name,
      type: formData.type,
      investedAmount: parseFloat(formData.amount),
      currentValue: parseFloat(formData.amount), // Initial current value same as invested
      date: new Date().toISOString()
    });
    setFormData({ name: '', type: 'Mutual Fund', amount: '' });
    setIsAdding(false);
    showNotification('Investment logged!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Investments</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-2 rounded-full bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Summary Card */}
      <div className="p-6 rounded-3xl bg-[var(--accent)] text-white space-y-4 shadow-xl shadow-[var(--accent)]/20">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Current Value</p>
            <h3 className="text-3xl font-bold">{formatCurrency(currentValue)}</h3>
          </div>
          <div className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1",
            totalProfit >= 0 ? "bg-white/20" : "bg-red-500/20"
          )}>
            {totalProfit >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(profitPercentage).toFixed(1)}%
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-[10px] font-bold opacity-60 uppercase">Invested</p>
            <p className="font-bold">{formatCurrency(totalInvested)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold opacity-60 uppercase">Profit/Loss</p>
            <p className="font-bold">{totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}</p>
          </div>
        </div>
      </div>

      {/* Investment List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold opacity-60 uppercase tracking-wider">Your Portfolio</h3>
        {investments.length > 0 ? (
          investments.map((inv) => {
            const profit = inv.currentValue - inv.investedAmount;
            return (
              <div key={inv.id} className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center text-[var(--accent)]">
                    {inv.type === 'Mutual Fund' ? <PieChart size={20} /> : <Briefcase size={20} />}
                  </div>
                  <div>
                    <p className="font-bold">{inv.name}</p>
                    <p className="text-[10px] opacity-60">{inv.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(inv.currentValue)}</p>
                  <p className={cn(
                    "text-[10px] font-bold",
                    profit >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center opacity-40">
            <p>No investments logged yet.</p>
          </div>
        )}
      </div>

      {/* Add Investment Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center" onClick={() => setIsAdding(false)}>
          <div 
            className="w-full max-w-md bg-[var(--card-bg)] rounded-t-3xl p-6 space-y-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold">New Investment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 field-backlight rounded-2xl p-1">
                <label className="text-xs font-bold opacity-60 uppercase ml-3">Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-4 rounded-xl bg-black/5 border-none focus:ring-0"
                  placeholder="e.g. HDFC Index Fund"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60 uppercase">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Mutual Fund', 'Stock'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={cn(
                        "p-3 rounded-xl border text-xs font-bold transition-all",
                        formData.type === type 
                          ? "bg-[var(--accent)] text-white border-[var(--accent)]" 
                          : "bg-transparent border-[var(--border)] opacity-60"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 field-backlight rounded-2xl p-1">
                <label className="text-xs font-bold opacity-60 uppercase ml-3">Amount Invested (₹)</label>
                <input 
                  type="number" 
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full p-4 rounded-xl bg-black/5 border-none focus:ring-0 text-2xl font-bold"
                  placeholder="0.00"
                />
              </div>
              <RippleEffect className="rounded-2xl">
                <button 
                  type="submit"
                  className="w-full p-4 bg-[var(--accent)] text-white font-bold shadow-lg shadow-[var(--accent)]/20"
                >
                  Log Investment
                </button>
              </RippleEffect>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
