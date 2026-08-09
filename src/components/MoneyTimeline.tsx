import React, { useMemo } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { UserData } from '../types';
import { formatCurrency } from '../lib/utils';
import { getTimeline } from '../lib/timelineService';

interface MoneyTimelineProps {
  data: UserData;
  onBack: () => void;
}

export function MoneyTimeline({ data, onBack }: MoneyTimelineProps) {
  const timeline = useMemo(() => getTimeline(data.expenses, 12), [data.expenses]);

  const maxTotal = useMemo(() => Math.max(...timeline.entries.map(e => e.totalSpent), 1), [timeline]);

  const activeEntries = timeline.entries.filter(e => e.totalSpent > 0);

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
          <h2 className="text-3xl font-bold text-[var(--foreground)] editorial-title">Money Timeline</h2>
        </div>
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl glass-panel">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1 font-mono">All-Time Spent</p>
          <p className="text-xl font-bold tabular-digits text-[var(--accent)]">{formatCurrency(timeline.totalAllTime)}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1 font-mono">Monthly Average</p>
          <p className="text-xl font-bold tabular-digits text-[var(--accent)]">{formatCurrency(timeline.averageMonthly)}</p>
        </div>
        {timeline.highestMonth && (
          <div className="p-4 rounded-2xl glass-panel border-[var(--danger)]/30 bg-[var(--danger-light)]/15">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--danger)] mb-1 font-mono">Highest Month</p>
            <p className="text-xl font-bold tabular-digits text-[var(--danger)]">{formatCurrency(timeline.highestMonth.totalSpent)}</p>
            <p className="text-[10px] font-semibold text-[var(--muted)] mt-1">{timeline.highestMonth.month} {timeline.highestMonth.year}</p>
          </div>
        )}
        {timeline.lowestMonth && (
          <div className="p-4 rounded-2xl glass-panel border-[var(--success)]/30 bg-[var(--success-light)]/15">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--success)] mb-1 font-mono">Lowest Month</p>
            <p className="text-xl font-bold tabular-digits text-[var(--success)]">{formatCurrency(timeline.lowestMonth.totalSpent)}</p>
            <p className="text-[10px] font-semibold text-[var(--muted)] mt-1">{timeline.lowestMonth.month} {timeline.lowestMonth.year}</p>
          </div>
        )}
      </section>

      {/* Timeline Visual */}
      <section className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] border-b border-[var(--border)] pb-2 select-none font-mono">
          12-Month History
        </h4>
        {activeEntries.length > 0 ? (
          <div className="space-y-2.5">
            {timeline.entries.map((entry, i) => {
              const width = maxTotal > 0 ? (entry.totalSpent / maxTotal) * 100 : 0;
              const isCurrentMonth = i === timeline.entries.length - 1;
              const prevEntry = i > 0 ? timeline.entries[i - 1] : null;
              let trend: 'up' | 'down' | 'flat' = 'flat';
              if (prevEntry && prevEntry.totalSpent > 0) {
                const diff = ((entry.totalSpent - prevEntry.totalSpent) / prevEntry.totalSpent) * 100;
                if (diff > 5) trend = 'up';
                else if (diff < -5) trend = 'down';
              }

              return (
                <div
                  key={`${entry.month}-${entry.year}`}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrentMonth
                      ? 'bg-[var(--accent-light)] border-[var(--accent)]/30 shadow-[0_2px_15px_rgba(214,168,95,0.04)] backdrop-blur-md'
                      : 'glass-panel'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${isCurrentMonth ? 'text-[var(--accent)] font-bold' : 'text-[var(--foreground)]'}`}>
                        {entry.month} {entry.year}
                      </span>
                      {isCurrentMonth && (
                        <span className="text-[8px] font-bold bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 px-1.5 py-0.5 rounded uppercase tracking-wider">Current</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {trend === 'up' && <ArrowUpRight size={13} className="text-[var(--danger)]" />}
                      {trend === 'down' && <ArrowDownRight size={13} className="text-[var(--success)]" />}
                      {trend === 'flat' && entry.totalSpent > 0 && <Minus size={13} className="text-[var(--muted)]" />}
                      <span className="font-bold text-sm tabular-digits">{formatCurrency(entry.totalSpent)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[var(--surface-elevated)]/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(width, entry.totalSpent > 0 ? 2 : 0)}%`,
                        backgroundColor: isCurrentMonth ? 'var(--accent)' : 'var(--chart-2)'
                      }}
                    />
                  </div>
                  {entry.totalSpent > 0 && (
                    <div className="flex justify-between mt-2 font-sans select-none">
                      <span className="text-[10px] font-semibold text-[var(--muted)]">
                        {entry.transactionCount} txn{entry.transactionCount !== 1 ? 's' : ''}
                        {entry.topCategory ? ` • Top: ${entry.topCategory}` : ''}
                      </span>
                      <span className="text-[10px] font-semibold text-[var(--muted)]">
                        Cash: {formatCurrency(entry.cashSpent)} • Bank: {formatCurrency(entry.bankSpent)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-xl glass-panel text-center">
            <Clock size={24} className="text-[var(--muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--muted)] font-medium">No spending history yet. Add transactions to build your money timeline.</p>
          </div>
        )}
      </section>
    </div>
  );
}
