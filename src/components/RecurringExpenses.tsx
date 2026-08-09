import React, { useMemo, useState } from 'react';
import { ArrowLeft, RefreshCw, Plus, Trash2, X } from 'lucide-react';
import { UserData, RecurringExpense as RecurringExpenseType } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { detectRecurringExpenses, getRecurringMonthlyCost } from '../lib/recurringService';

interface RecurringExpensesProps {
  data: UserData;
  onBack: () => void;
  onAddRecurring: (item: Omit<RecurringExpenseType, 'id'>) => void;
  onDeleteRecurring: (id: string) => void;
}

export function RecurringExpenses({ data, onBack, onAddRecurring, onDeleteRecurring }: RecurringExpensesProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formMerchant, setFormMerchant] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Other');
  const [formFrequency, setFormFrequency] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');

  const detected = useMemo(() => detectRecurringExpenses(data.expenses), [data.expenses]);
  const userRecurring = data.recurringExpenses || [];
  const monthlyCost = useMemo(() => getRecurringMonthlyCost(userRecurring), [userRecurring]);

  const handleAdd = () => {
    if (!formMerchant.trim() || !formAmount) return;
    onAddRecurring({
      merchant: formMerchant.trim(),
      amount: parseFloat(formAmount),
      category: formCategory,
      frequency: formFrequency,
      isInferred: false,
      note: ''
    });
    setFormMerchant('');
    setFormAmount('');
    setFormCategory('Other');
    setFormFrequency('monthly');
    setShowAddForm(false);
  };

  const frequencyLabel = (f: string) => {
    switch (f) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      default: return f;
    }
  };

  return (
    <div className="space-y-8 animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-4 select-none">
        <button
          onClick={onBack}
          className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)] cursor-pointer transition-colors"
          aria-label="Back to Explore"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] font-mono">Explore Module</span>
          <h2 className="text-3xl font-bold text-[var(--foreground)] editorial-title">Recurring Expenses</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 rounded-xl bg-[var(--accent)] text-[#080808] hover:opacity-90 cursor-pointer transition-opacity shadow-md"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {/* Monthly Cost Summary */}
      <section className="p-6 rounded-2xl glass-panel select-none">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1 font-mono">Estimated Monthly Commitment</p>
        <h3 className="text-4xl font-black text-[var(--accent)] editorial-number">{formatCurrency(monthlyCost)}</h3>
        <p className="text-xs font-semibold text-[var(--muted)] mt-1.5">{userRecurring.length} tracked recurring expense{userRecurring.length !== 1 ? 's' : ''}</p>
      </section>

      {/* Add Form */}
      {showAddForm && (
        <section className="p-5 rounded-2xl glass-panel border-[var(--accent)]/30 bg-[var(--accent-light)]/10 space-y-3.5 animate-slide-in">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--accent)] font-mono">Add Recurring Expense</h4>
          <input
            type="text"
            placeholder="Merchant / Name"
            value={formMerchant}
            onChange={e => setFormMerchant(e.target.value)}
            className="w-full p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              placeholder="Amount"
              value={formAmount}
              onChange={e => setFormAmount(e.target.value)}
              className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono"
            />
            <select
              value={formCategory}
              onChange={e => setFormCategory(e.target.value)}
              className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
            >
              {['Food', 'Transport', 'Entertainment', 'Utilities', 'Health', 'Education', 'Rent', 'Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={formFrequency}
              onChange={e => setFormFrequency(e.target.value as any)}
              className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={!formMerchant.trim() || !formAmount}
            className="w-full p-3.5 rounded-xl bg-[var(--accent)] text-[#080808] font-bold text-xs hover:opacity-90 disabled:opacity-40 cursor-pointer transition-opacity shadow-md"
          >
            Add Recurring Expense
          </button>
        </section>
      )}

      {/* User-Tracked Recurring */}
      {userRecurring.length > 0 && (
        <section className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] border-b border-[var(--border)] pb-2 select-none font-mono">
            Your Tracked Recurring
          </h4>
          <div className="space-y-2.5">
            {userRecurring.map(item => (
              <div key={item.id} className="p-4 rounded-xl glass-panel flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/15">
                    <RefreshCw size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[var(--foreground)]">{item.merchant}</p>
                    <p className="text-[10px] font-semibold text-[var(--muted)] mt-1">{item.category} • {frequencyLabel(item.frequency)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold tabular-digits text-sm">{formatCurrency(item.amount)}</span>
                  <button
                    onClick={() => onDeleteRecurring(item.id)}
                    className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-light)]/20 cursor-pointer transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Auto-Detected Recurring */}
      <section className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] border-b border-[var(--border)] pb-2 select-none font-mono">
          Auto-Detected Patterns
        </h4>
        {detected.length > 0 ? (
          <div className="space-y-2.5">
            {detected.map((item, i) => (
              <div key={i} className="p-4 rounded-xl glass-panel flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-[var(--foreground)]">{item.merchant}</p>
                  <p className="text-[10px] font-semibold text-[var(--muted)] mt-1">
                    {item.category} • ~{frequencyLabel(item.estimatedFrequency)} • {item.occurrences} occurrence{item.occurrences !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="font-bold tabular-digits text-sm text-[var(--muted)] font-mono">~{formatCurrency(item.averageAmount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl glass-panel text-center">
            <RefreshCw size={20} className="text-[var(--muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--muted)] font-medium">Add more transactions to detect recurring patterns automatically.</p>
          </div>
        )}
      </section>
    </div>
  );
}
