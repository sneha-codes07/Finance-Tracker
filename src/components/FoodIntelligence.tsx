import React from 'react';
import { ArrowLeft, Utensils, ShoppingBag, Landmark, Landmark as TransportIcon, HelpCircle, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import { UserData, Expense } from '../types';
import { formatCurrency } from '../lib/utils';
import { getExpensesForMonth } from '../lib/spendingService';
import { classifyFoodExpense, FOOD_GROUPS, FoodGroup } from '../lib/foodService';

interface FoodIntelligenceProps {
  data: UserData;
  onBack: () => void;
}

export function FoodIntelligence({ data, onBack }: FoodIntelligenceProps) {
  const today = new Date();
  
  // Calculate date variables
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonth = prevDate.getMonth();
  const prevYear = prevDate.getFullYear();

  const currentMonthName = today.toLocaleString('en-IN', { month: 'long' });
  const prevMonthName = prevDate.toLocaleString('en-IN', { month: 'long' });

  // Get current and previous food expenses
  const currentFoodExpenses = getExpensesForMonth(data.expenses, currentMonth, currentYear)
    .filter(e => e.category.toLowerCase() === 'food');
  
  const prevFoodExpenses = getExpensesForMonth(data.expenses, prevMonth, prevYear)
    .filter(e => e.category.toLowerCase() === 'food');

  // Ratios and Sums current month
  let curTotal = 0;
  const curSums: Record<FoodGroup, number> = { essential: 0, outside: 0, junk: 0, other: 0 };
  
  currentFoodExpenses.forEach(e => {
    const group = classifyFoodExpense(e);
    curSums[group] += e.amount;
    curTotal += e.amount;
  });

  // Sums previous month
  let prevTotal = 0;
  const prevSums: Record<FoodGroup, number> = { essential: 0, outside: 0, junk: 0, other: 0 };
  
  prevFoodExpenses.forEach(e => {
    const group = classifyFoodExpense(e);
    prevSums[group] += e.amount;
    prevTotal += e.amount;
  });

  // Calculate percentage deltas
  const getPercentageChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const foodGroupsData: { id: FoodGroup; label: string; description: string; current: number; previous: number; color: string }[] = [
    {
      id: 'essential',
      label: FOOD_GROUPS.essential.label,
      description: FOOD_GROUPS.essential.description,
      current: curSums.essential,
      previous: prevSums.essential,
      color: FOOD_GROUPS.essential.color
    },
    {
      id: 'outside',
      label: FOOD_GROUPS.outside.label,
      description: FOOD_GROUPS.outside.description,
      current: curSums.outside,
      previous: prevSums.outside,
      color: FOOD_GROUPS.outside.color
    },
    {
      id: 'junk',
      label: FOOD_GROUPS.junk.label,
      description: FOOD_GROUPS.junk.description,
      current: curSums.junk,
      previous: prevSums.junk,
      color: FOOD_GROUPS.junk.color
    }
  ];

  // Helper for trend display
  const renderTrend = (curr: number, prev: number) => {
    const diff = getPercentageChange(curr, prev);
    if (diff === 0 && prev === 0) return null;
    const isIncrease = diff > 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border ${isIncrease ? 'text-[var(--danger)] bg-[var(--danger-light)]/15 border-[var(--danger)]/25' : 'text-[var(--success)] bg-[var(--success-light)]/15 border-[var(--success)]/25'}`}>
        {isIncrease ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {Math.abs(diff).toFixed(0)}%
      </span>
    );
  };

  // Observations generator
  const getObservations = () => {
    const items: string[] = [];
    
    if (curTotal === 0) {
      return ['No food expenses logged for this month yet.'];
    }

    const outsideRatio = curSums.outside / curTotal;
    const essentialRatio = curSums.essential / curTotal;
    
    if (outsideRatio > 0.5) {
      items.push(`Outside dining and delivery constitutes the majority (${(outsideRatio * 100).toFixed(0)}%) of your food spending this month.`);
    } else if (essentialRatio > 0.6) {
      items.push(`Groceries and essentials make up the bulk (${(essentialRatio * 100).toFixed(0)}%) of your food budget. Cooking at home is your primary driver.`);
    }

    const junkRatio = curSums.junk / curTotal;
    if (junkRatio > 0.15) {
      items.push(`Junk and treats account for ${(junkRatio * 100).toFixed(0)}% of food purchases. If you trimmed this slightly, you could redirect savings to other goals.`);
    }

    const totalChange = getPercentageChange(curTotal, prevTotal);
    if (prevTotal > 0 && Math.abs(totalChange) > 10) {
      const direction = totalChange > 0 ? 'increased' : 'decreased';
      items.push(`Overall food spending has ${direction} by ${Math.abs(totalChange).toFixed(0)}% compared to ${prevMonthName}.`);
    }

    if (items.length === 0) {
      items.push("Your food spending distribution is balanced this month.");
    }

    return items;
  };

  return (
    <div className="space-y-8 animate-slide-in">
      
      {/* Header with Back button */}
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
          <h2 className="text-3xl font-bold text-[var(--foreground)] editorial-title">Food Intelligence</h2>
        </div>
      </div>

      {/* Hero spending stats */}
      <section className="p-6 rounded-2xl glass-panel select-none">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Food spending for {currentMonthName}</p>
            <h3 className="text-4xl font-black mt-1.5 text-[var(--accent)] editorial-number">{formatCurrency(curTotal)}</h3>
          </div>
          {prevTotal > 0 && (
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">vs {prevMonthName}</p>
              <p className="font-semibold text-sm mt-1.5 flex items-center justify-end gap-1 select-none">
                {getPercentageChange(curTotal, prevTotal) > 0 ? (
                  <span className="text-[var(--danger)] flex items-center gap-0.5 font-bold"><ArrowUpRight size={14} /> +{getPercentageChange(curTotal, prevTotal).toFixed(0)}%</span>
                ) : (
                  <span className="text-[var(--success)] flex items-center gap-0.5 font-bold"><ArrowDownRight size={14} /> {getPercentageChange(curTotal, prevTotal).toFixed(0)}%</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Triple Split Bar Visualization */}
        {curTotal > 0 && (
          <div className="mt-6 space-y-1.5">
            <div className="h-3 w-full bg-[var(--surface-elevated)] rounded-full flex overflow-hidden">
              {foodGroupsData.map((group) => {
                const ratio = group.current / curTotal;
                if (ratio === 0) return null;
                return (
                  <div 
                    key={group.id}
                    className="h-full transition-all"
                    style={{ 
                      width: `${ratio * 100}%`,
                      backgroundColor: group.color
                    }}
                    title={`${group.label}: ${(ratio * 100).toFixed(0)}%`}
                  />
                );
              })}
            </div>
            
            {/* Custom Legend */}
            <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase text-[var(--muted)] pt-1">
              {foodGroupsData.map(group => (
                <div key={group.id} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                  <span>{group.label} ({((group.current / curTotal) * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Breakdown categories */}
      <section className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] border-b border-[var(--border)] pb-2 select-none">
          Spending categories
        </h4>
        <div className="space-y-3">
          {foodGroupsData.map((group) => {
            const ratio = curTotal > 0 ? (group.current / curTotal) * 100 : 0;
            return (
              <div 
                key={group.id}
                className="p-5 rounded-2xl glass-panel space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-sm text-[var(--foreground)]">{group.label}</h5>
                    <p className="text-[11px] text-[var(--muted)] leading-relaxed font-semibold mt-0.5">{group.description}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-lg tabular-digits">{formatCurrency(group.current)}</p>
                    <div className="flex items-center justify-end gap-1.5 select-none">
                      <span className="text-[10px] text-[var(--muted)] font-bold">{ratio.toFixed(0)}% of total</span>
                      {renderTrend(group.current, group.previous)}
                    </div>
                  </div>
                </div>

                <div className="h-1 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${ratio}%`, 
                      backgroundColor: group.color 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Observations (Observant, not judgmental) */}
      <section className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] border-b border-[var(--border)] pb-2 select-none">
          Observations
        </h4>
        <div className="space-y-3">
          {getObservations().map((obs, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-xl bg-[var(--surface-elevated)]/30 border border-[var(--border)] flex items-start gap-3 select-none text-xs font-semibold text-[var(--muted)] leading-relaxed"
            >
              <div className="p-1 rounded bg-[var(--accent-light)] text-[var(--accent)] mt-0.5">
                <Sparkles size={12} />
              </div>
              <p className="mt-0.5">{obs}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
