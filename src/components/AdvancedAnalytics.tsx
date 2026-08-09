import React, { useMemo } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight, Minus, Activity } from 'lucide-react';
import { UserData } from '../types';
import { formatCurrency } from '../lib/utils';
import { getAnalyticsSummary } from '../lib/analyticsService';

interface AdvancedAnalyticsProps {
  data: UserData;
  onBack: () => void;
}

export function AdvancedAnalytics({ data, onBack }: AdvancedAnalyticsProps) {
  const today = new Date();
  const currentMonthName = today.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  
  const summary = useMemo(() => getAnalyticsSummary(data.expenses, today), [data.expenses]);

  const maxBarValue = useMemo(() => {
    return Math.max(...summary.byMonth.map(m => m.total), 1);
  }, [summary.byMonth]);

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
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] font-mono">Explore Module</span>
          <h2 className="text-3xl font-bold text-[var(--foreground)] editorial-title">Advanced Analytics</h2>
        </div>
      </div>

      {/* Hero Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Spent',
            value: formatCurrency(summary.totalSpending),
            sub: currentMonthName,
            icon: <BarChart3 size={14} />
          },
          {
            label: 'Transactions',
            value: summary.transactionCount.toString(),
            sub: `${formatCurrency(summary.averageTransaction)} avg`,
            icon: <Activity size={14} />
          },
          {
            label: 'Daily Average',
            value: formatCurrency(summary.dailyAverage),
            sub: `${today.getDate()} days elapsed`,
            icon: <TrendingUp size={14} />
          },
          {
            label: 'vs Last Month',
            value: summary.monthOverMonthChange !== null ? `${summary.monthOverMonthChange > 0 ? '+' : ''}${summary.monthOverMonthChange.toFixed(0)}%` : '—',
            sub: summary.monthOverMonthChange !== null ? (summary.monthOverMonthChange > 0 ? 'Higher' : 'Lower') : 'No data',
            icon: summary.monthOverMonthChange !== null && summary.monthOverMonthChange > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />
          }
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-2xl glass-panel">
            <div className="flex items-center gap-1.5 text-[var(--muted)] mb-2">
              <span className="text-[var(--accent)]">{stat.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-[var(--foreground)] tabular-digits">{stat.value}</p>
            <p className="text-[10px] font-medium text-[var(--muted)] mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </section>

      {/* 6-Month Trend */}
      <section className="p-6 rounded-2xl glass-panel">
        <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] mb-6 select-none font-mono">6-Month Spending Trend</h4>
        {summary.byMonth.some(m => m.total > 0) ? (
          <div className="flex items-end gap-2" style={{ height: '160px' }}>
            {summary.byMonth.map((m, i) => {
              const height = maxBarValue > 0 ? (m.total / maxBarValue) * 100 : 0;
              const isCurrentMonth = i === summary.byMonth.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[9px] font-bold tabular-digits text-[var(--muted)]">
                    {m.total > 0 ? formatCurrency(m.total) : ''}
                  </span>
                  <div className="w-full flex items-end" style={{ height: '120px' }}>
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max(height, 2)}%`,
                        backgroundColor: isCurrentMonth ? 'var(--accent)' : 'var(--border)',
                        opacity: m.total > 0 ? 1 : 0.4
                      }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${isCurrentMonth ? 'text-[var(--accent)] font-bold' : 'text-[var(--muted)]'}`}>
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)] font-medium">Add expenses to see your spending trend over time.</p>
        )}
      </section>

      {/* Category Breakdown */}
      <section className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] border-b border-[var(--border)] pb-2 select-none font-mono">
          Category Breakdown — {currentMonthName}
        </h4>
        {summary.byCategory.length > 0 ? (
          <div className="space-y-3">
            {summary.byCategory.map((cat, i) => {
              const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
              const color = colors[i % colors.length];
              return (
                <div key={cat.name} className="p-4 rounded-xl glass-panel">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-[var(--foreground)]">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[var(--muted)]">{cat.percentage.toFixed(0)}%</span>
                      <span className="font-bold text-sm tabular-digits">{formatCurrency(cat.amount)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)] font-medium p-4 rounded-xl glass-panel">
            No expenses logged this month. Add transactions to see your category breakdown.
          </p>
        )}
      </section>

      {/* Highest Transaction */}
      {summary.highestTransaction && (
        <section className="p-5 rounded-2xl glass-panel border-[var(--accent)]/30 shadow-[0_4px_20px_rgba(214,168,95,0.04)]">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--accent)] mb-2 select-none font-mono">Largest Transaction This Month</h4>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-[var(--foreground)]">{summary.highestTransaction.merchant || summary.highestTransaction.description}</p>
              <p className="text-[11px] text-[var(--muted)] font-semibold mt-1">{summary.highestTransaction.category} • {new Date(summary.highestTransaction.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            </div>
            <p className="text-xl font-bold tabular-digits text-[var(--accent)]">{formatCurrency(summary.highestTransaction.amount)}</p>
          </div>
        </section>
      )}
    </div>
  );
}
