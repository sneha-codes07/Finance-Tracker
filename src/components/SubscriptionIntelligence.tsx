import React, { useMemo, useState } from 'react';
import { ArrowLeft, Layers, Plus, Trash2, X, CreditCard, AlertCircle } from 'lucide-react';
import { UserData, Subscription } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { getSubscriptionInsights, detectSubscriptionsFromExpenses } from '../lib/subscriptionService';

interface SubscriptionIntelligenceProps {
  data: UserData;
  onBack: () => void;
  onAddSubscription: (item: Omit<Subscription, 'id'>) => void;
  onDeleteSubscription: (id: string) => void;
  onUpdateSubscription: (id: string, updated: Omit<Subscription, 'id'>) => void;
}

export function SubscriptionIntelligence({ data, onBack, onAddSubscription, onDeleteSubscription, onUpdateSubscription }: SubscriptionIntelligenceProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Entertainment');
  const [formFrequency, setFormFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const subscriptions = data.subscriptions || [];
  const insights = useMemo(() => getSubscriptionInsights(subscriptions), [subscriptions]);
  const detected = useMemo(() => detectSubscriptionsFromExpenses(data.expenses), [data.expenses]);

  const handleAdd = () => {
    if (!formName.trim() || !formAmount) return;
    onAddSubscription({
      name: formName.trim(),
      amount: parseFloat(formAmount),
      category: formCategory,
      frequency: formFrequency,
      isActive: true,
      note: ''
    });
    setFormName('');
    setFormAmount('');
    setFormCategory('Entertainment');
    setFormFrequency('monthly');
    setShowAddForm(false);
  };

  const toggleActive = (sub: Subscription) => {
    const { id, ...rest } = sub;
    onUpdateSubscription(id, { ...rest, isActive: !rest.isActive });
  };

  const frequencyLabel = (f: string) => {
    switch (f) {
      case 'monthly': return '/mo';
      case 'quarterly': return '/qtr';
      case 'yearly': return '/yr';
      default: return '';
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
          <h2 className="text-3xl font-bold text-[var(--foreground)] editorial-title">Subscription Intelligence</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 rounded-xl bg-[var(--accent)] text-[#080808] hover:opacity-90 cursor-pointer transition-opacity shadow-md"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl glass-panel">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1 font-mono">Monthly Cost</p>
          <p className="text-xl font-bold tabular-digits text-[var(--accent)]">{formatCurrency(insights.totalMonthly)}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1 font-mono">Yearly Cost</p>
          <p className="text-xl font-bold tabular-digits text-[var(--accent)]">{formatCurrency(insights.totalYearly)}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border-[var(--success)]/30 bg-[var(--success-light)]/15">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--success)] mb-1 font-mono">Active</p>
          <p className="text-xl font-bold text-[var(--success)]">{insights.activeCount}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border-[var(--border)]/60 bg-[var(--surface-elevated)]/30">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1 font-mono">Paused</p>
          <p className="text-xl font-bold text-[var(--muted)]">{insights.inactiveCount}</p>
        </div>
      </section>

      {/* Add Form */}
      {showAddForm && (
        <section className="p-5 rounded-2xl glass-panel border-[var(--accent)]/30 bg-[var(--accent-light)]/10 space-y-3.5 animate-slide-in">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--accent)] font-mono">Add Subscription</h4>
          <input
            type="text"
            placeholder="Service name (e.g. Netflix, Spotify)"
            value={formName}
            onChange={e => setFormName(e.target.value)}
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
              {['Entertainment', 'Productivity', 'Cloud', 'Music', 'News', 'Health', 'Education', 'Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={formFrequency}
              onChange={e => setFormFrequency(e.target.value as any)}
              className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={!formName.trim() || !formAmount}
            className="w-full p-3.5 rounded-xl bg-[var(--accent)] text-[#080808] font-bold text-xs hover:opacity-90 disabled:opacity-40 cursor-pointer transition-opacity shadow-md"
          >
            Add Subscription
          </button>
        </section>
      )}

      {/* Active Subscriptions */}
      {subscriptions.length > 0 && (
        <section className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] border-b border-[var(--border)] pb-2 select-none font-mono">
            Your Subscriptions
          </h4>
          <div className="space-y-2.5">
            {subscriptions.map(sub => (
              <div
                key={sub.id}
                className={cn(
                  "p-4 rounded-xl border flex items-center justify-between transition-all backdrop-blur-md",
                  sub.isActive
                    ? "glass-panel"
                    : "bg-[var(--surface-elevated)]/30 border-[var(--border)]/40 opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleActive(sub)}
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all",
                      sub.isActive
                        ? "border-[var(--success)] bg-[var(--success)]"
                        : "border-[var(--muted)]"
                    )}
                  >
                    {sub.isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#080808]" />
                    )}
                  </button>
                  <div>
                    <p className="font-bold text-sm text-[var(--foreground)]">{sub.name}</p>
                    <p className="text-[10px] font-semibold text-[var(--muted)] mt-1">{sub.category} • {sub.frequency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold tabular-digits text-sm">
                    {formatCurrency(sub.amount)}{frequencyLabel(sub.frequency)}
                  </span>
                  <button
                    onClick={() => onDeleteSubscription(sub.id)}
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

      {/* Category Breakdown */}
      {insights.byCategory.length > 0 && (
        <section className="p-5 rounded-2xl glass-panel space-y-3.5">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] select-none font-mono">By Category (Monthly)</h4>
          {insights.byCategory.map((cat, i) => (
            <div key={cat.name} className="flex justify-between items-center text-xs font-semibold py-0.5">
              <span className="text-[var(--foreground)]">{cat.name}</span>
              <span className="tabular-digits text-[var(--muted)]">{formatCurrency(cat.amount)} • {cat.count} sub{cat.count !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </section>
      )}

      {/* Auto-Detected */}
      {detected.length > 0 && (
        <section className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] border-b border-[var(--border)] pb-2 select-none flex items-center gap-1.5 font-mono">
            <AlertCircle size={12} className="text-[var(--accent)]" />
            Detected from Transactions
          </h4>
          <div className="space-y-2.5">
            {detected.map((item, i) => (
              <div key={i} className="p-4 rounded-xl glass-panel border-[var(--accent)]/30 bg-[var(--accent-light)]/10 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-[var(--foreground)]">{item.name}</p>
                  <p className="text-[10px] font-semibold text-[var(--muted)] mt-1">{item.category} • {item.occurrences} payment{item.occurrences !== 1 ? 's' : ''} detected</p>
                </div>
                <span className="font-bold tabular-digits text-sm text-[var(--accent)]">~{formatCurrency(item.amount)}/mo</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {subscriptions.length === 0 && detected.length === 0 && (
        <div className="p-6 rounded-xl glass-panel text-center">
          <CreditCard size={24} className="text-[var(--muted)] mx-auto mb-2" />
          <p className="text-sm text-[var(--muted)] font-medium">Track your subscriptions here. Tap + to add your first subscription.</p>
        </div>
      )}
    </div>
  );
}
