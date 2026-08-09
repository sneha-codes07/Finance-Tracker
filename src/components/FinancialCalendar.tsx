import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { UserData } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { getCalendarMonth } from '../lib/calendarService';

interface FinancialCalendarProps {
  data: UserData;
  onBack: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function FinancialCalendar({ data, onBack }: FinancialCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const calendarData = useMemo(
    () => getCalendarMonth(data.expenses, viewYear, viewMonth),
    [data.expenses, viewYear, viewMonth]
  );

  // Max spend in month for heat intensity
  const maxDaySpend = useMemo(() => {
    return Math.max(...calendarData.days.filter(d => d.isCurrentMonth).map(d => d.total), 1);
  }, [calendarData]);

  const goToPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
    setSelectedDay(null);
  };

  const goToNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
    setSelectedDay(null);
  };

  const selectedDayData = selectedDay !== null
    ? calendarData.days.find(d => d.isCurrentMonth && d.date === selectedDay)
    : null;

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
          <h2 className="text-3xl font-bold text-[var(--foreground)] editorial-title">Financial Calendar</h2>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between p-4 rounded-2xl glass-panel">
        <button
          onClick={goToPrev}
          className="p-2 rounded-lg hover:bg-[var(--surface-elevated)]/40 cursor-pointer transition-colors text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <h3 className="font-bold text-lg text-[var(--foreground)]">{calendarData.monthName}</h3>
          <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider font-mono">
            {formatCurrency(calendarData.monthTotal)} across {calendarData.spendingDays} day{calendarData.spendingDays !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={goToNext}
          className="p-2 rounded-lg hover:bg-[var(--surface-elevated)]/40 cursor-pointer transition-colors text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar Grid */}
      <section className="p-4 rounded-2xl glass-panel">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] py-1 font-mono">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.days.map((day, i) => {
            const intensity = day.total > 0 && maxDaySpend > 0 ? Math.min(day.total / maxDaySpend, 1) : 0;
            const isSelected = selectedDay === day.date && day.isCurrentMonth;
            
            return (
              <button
                key={i}
                disabled={!day.isCurrentMonth}
                onClick={() => day.isCurrentMonth && setSelectedDay(day.date === selectedDay ? null : day.date)}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition-all duration-200 relative cursor-pointer",
                  !day.isCurrentMonth && "opacity-20 cursor-default",
                  day.isCurrentMonth && "hover:ring-1 hover:ring-[var(--accent)]/30",
                  day.isToday && "ring-1.5 ring-[var(--accent)]",
                  isSelected && "ring-1.5 ring-[var(--accent)] bg-[var(--accent-light)]/20"
                )}
              >
                <span className={cn(
                  day.isCurrentMonth ? 'text-[var(--foreground)]' : 'text-[var(--muted)]',
                  day.isToday && 'text-[var(--accent)] font-bold'
                )}>
                  {day.date}
                </span>
                {day.total > 0 && day.isCurrentMonth && (
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-0.5"
                    style={{
                      backgroundColor: `var(--accent)`,
                      opacity: 0.3 + intensity * 0.7
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Day Detail */}
      {selectedDayData && selectedDayData.transactions.length > 0 && (
        <section className="space-y-3 animate-slide-in">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] border-b border-[var(--border)] pb-2 select-none font-mono">
            <CalendarDays size={12} className="inline mr-1.5 text-[var(--accent)]" />
            {new Date(viewYear, viewMonth, selectedDayData.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            <span className="float-right tabular-digits text-[var(--accent)]">{formatCurrency(selectedDayData.total)}</span>
          </h4>
          <div className="space-y-2">
            {selectedDayData.transactions.map(txn => (
              <div key={txn.id} className="p-3 rounded-xl glass-panel flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-[var(--foreground)]">{txn.merchant || txn.description}</p>
                  <p className="text-[10px] font-semibold text-[var(--muted)] mt-1">{txn.category}{txn.paymentMethod ? ` • ${txn.paymentMethod}` : ''}</p>
                </div>
                <span className="font-bold tabular-digits text-sm">{formatCurrency(txn.amount)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedDay !== null && selectedDayData && selectedDayData.transactions.length === 0 && (
        <div className="p-4 rounded-xl glass-panel text-center">
          <p className="text-sm text-[var(--muted)] font-medium">No transactions on this day</p>
        </div>
      )}

      {/* Heat Legend */}
      <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-[var(--muted)] select-none font-mono">
        <span>Less</span>
        {[0.15, 0.35, 0.55, 0.75, 1].map((op, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: 'var(--accent)', opacity: op }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
