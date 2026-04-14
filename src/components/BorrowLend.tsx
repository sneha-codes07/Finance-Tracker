import React, { useState } from 'react';
import { Plus, User, Calendar, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { BorrowLend as BorrowLendType } from '../types';
import { formatCurrency, cn } from '../lib/utils';

interface BorrowLendProps {
  items: BorrowLendType[];
  onAddItem: (item: Omit<BorrowLendType, 'id'>) => void;
}

export function BorrowLend({ items, onAddItem }: BorrowLendProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ 
    type: 'Lend' as const, 
    personName: '', 
    amount: '', 
    dueDate: '', 
    notes: '' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.personName || !formData.amount) return;
    onAddItem({
      type: formData.type,
      personName: formData.personName,
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate || undefined,
      notes: formData.notes || undefined,
      date: new Date().toISOString(),
      isSettled: false
    });
    setFormData({ type: 'Lend', personName: '', amount: '', dueDate: '', notes: '' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Borrow & Lend</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-2 rounded-full bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  item.type === 'Lend' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {item.type === 'Lend' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                </div>
                <div>
                  <p className="font-bold">{item.personName}</p>
                  <p className="text-[10px] opacity-60">
                    {item.type === 'Lend' ? 'You lent' : 'You borrowed'} • {new Date(item.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-bold",
                  item.type === 'Lend' ? "text-green-500" : "text-red-500"
                )}>
                  {formatCurrency(item.amount)}
                </p>
                {item.dueDate && (
                  <p className="text-[10px] opacity-60">Due: {new Date(item.dueDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center opacity-40">
            <p>No transactions recorded.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center" onClick={() => setIsAdding(false)}>
          <div 
            className="w-full max-w-md bg-[var(--card-bg)] rounded-t-3xl p-6 space-y-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold">Record Transaction</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(['Lend', 'Borrow'] as const).map(type => (
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
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60 uppercase">Person Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
                  <input 
                    autoFocus
                    type="text" 
                    value={formData.personName}
                    onChange={e => setFormData({ ...formData, personName: e.target.value })}
                    className="w-full p-4 pl-12 rounded-2xl bg-black/5 border-none focus:ring-2 focus:ring-[var(--accent)]"
                    placeholder="Who is this?"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60 uppercase">Amount (₹)</label>
                <input 
                  type="number" 
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-black/5 border-none focus:ring-2 focus:ring-[var(--accent)] text-2xl font-bold"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60 uppercase">Due Date (Optional)</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
                  <input 
                    type="date" 
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-4 pl-12 rounded-2xl bg-black/5 border-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60 uppercase">Notes (Optional)</label>
                <div className="relative">
                  <FileText size={16} className="absolute left-4 top-4 opacity-40" />
                  <textarea 
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-4 pl-12 rounded-2xl bg-black/5 border-none focus:ring-2 focus:ring-[var(--accent)] min-h-[80px]"
                    placeholder="Any details?"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full p-4 rounded-2xl bg-[var(--accent)] text-white font-bold shadow-lg shadow-[var(--accent)]/20"
              >
                Save Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
