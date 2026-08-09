import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, ArrowDownRight, ArrowRight, ChevronRight, Utensils, ShoppingBag, Landmark, Landmark as TransportIcon, HelpCircle, AlertCircle, Sparkles, Plus, Wallet } from 'lucide-react';
import { UserData, Expense } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  getSpendingSummary, 
  getMeaningfulChanges, 
  getSpendingObservations,
  getExpensesForMonth
} from '../lib/spendingService';
import { classifyFoodExpense, FOOD_GROUPS } from '../lib/foodService';

interface OverviewProps {
  data: UserData;
  onViewChange: (view: string) => void;
  onAddExpenseClick: () => void;
}

export function Overview({ data, onViewChange, onAddExpenseClick }: OverviewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const today = new Date();
  const currentMonthName = today.toLocaleString('en-IN', { month: 'long' }).toUpperCase();
  const previousMonthName = new Date(today.getFullYear(), today.getMonth() - 1, 1).toLocaleString('en-IN', { month: 'long' });

  // Get spending metrics from service
  const summary = getSpendingSummary(data.expenses, today);
  const changes = getMeaningfulChanges(data.expenses, today);
  const observations = getSpendingObservations(data.expenses, today, data.monthlySpendingLimit);

  // Group current month's expenses
  const currentMonthExpenses = getExpensesForMonth(data.expenses, today.getMonth(), today.getFullYear());

  // Category Icons Map
  const categoryIcons: Record<string, React.ReactNode> = {
    'Food': <Utensils size={16} />,
    'Shopping': <ShoppingBag size={16} />,
    'Entertainment': <Sparkles size={16} />,
    'Education': <HelpCircle size={16} />,
    'Transport': <TransportIcon size={16} />,
    'Bills': <Landmark size={16} />,
  };

  const defaultIcon = <HelpCircle size={16} />;

  // Handler for category details
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  // Detailed info for expanded category
  const renderCategoryDetails = (category: string, amount: number) => {
    const categoryExpenses = currentMonthExpenses.filter(e => e.category.toLowerCase() === category.toLowerCase());
    
    if (category.toLowerCase() === 'food') {
      // Calculate food subgroups
      let essentialSum = 0;
      let outsideSum = 0;
      let junkSum = 0;
      
      categoryExpenses.forEach(e => {
        const group = classifyFoodExpense(e);
        if (group === 'essential') essentialSum += e.amount;
        else if (group === 'outside') outsideSum += e.amount;
        else if (group === 'junk') junkSum += e.amount;
      });

      return (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 pl-4 border-l-2 border-[var(--border)] space-y-2 text-sm"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Food Spending Breakdown</div>
          <div className="flex justify-between items-center py-1">
            <span className="text-[var(--muted)] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FOOD_GROUPS.essential.color }} />
              Essential Food (Groceries, Cooking)
            </span>
            <span className="font-semibold tabular-digits">{formatCurrency(essentialSum)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-[var(--muted)] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FOOD_GROUPS.outside.color }} />
              Outside Food (Delivery, Restaurants)
            </span>
            <span className="font-semibold tabular-digits">{formatCurrency(outsideSum)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-[var(--muted)] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FOOD_GROUPS.junk.color }} />
              Junk & Treats (Snacks, Desserts)
            </span>
            <span className="font-semibold tabular-digits">{formatCurrency(junkSum)}</span>
          </div>
          <div className="pt-2">
            <button 
              onClick={() => onViewChange('explore')}
              className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer focus:outline-none"
            >
              Open Food Intelligence explorer <ArrowRight size={12} />
            </button>
          </div>
        </motion.div>
      );
    }

    // Default category detail - list top merchants
    const merchantTotals: Record<string, number> = {};
    categoryExpenses.forEach(e => {
      const merchant = e.merchant || e.description || 'Other';
      merchantTotals[merchant] = (merchantTotals[merchant] || 0) + e.amount;
    });

    const topMerchants = Object.entries(merchantTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return (
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-3 pl-4 border-l-2 border-[var(--border)] space-y-2 text-sm"
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Top spending areas</div>
        {topMerchants.length > 0 ? (
          topMerchants.map(([name, val]) => (
            <div key={name} className="flex justify-between items-center py-0.5">
              <span className="text-[var(--muted)] truncate pr-4">{name}</span>
              <span className="font-semibold tabular-digits">{formatCurrency(val)}</span>
            </div>
          ))
        ) : (
          <div className="text-xs text-[var(--muted)] italic">No merchant details logged yet.</div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-10 animate-slide-in">
      
      {/* Editorial Monthly Summary */}
      <section className="space-y-4 select-none">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--muted)] font-mono">Report for {currentMonthName}</span>
          <h2 className="text-5xl font-black mt-1.5 text-[var(--accent)] editorial-title tracking-tight">
            {formatCurrency(summary.total)}
          </h2>
          <p className="text-xs text-[var(--muted)] mt-2 flex items-center gap-1.5 font-medium font-sans">
            {summary.percentageDiff !== 0 && (
              <span className="inline-flex items-center">
                {summary.percentageDiff > 0 ? (
                  <ArrowUpRight size={15} className="text-[var(--danger)]" />
                ) : (
                  <ArrowDownRight size={15} className="text-[var(--success)]" />
                )}
              </span>
            )}
            <span>{summary.compareText}</span>
          </p>
        </div>

        {/* Quick Balance Readouts */}
        <div className="grid grid-cols-2 gap-4 max-w-sm pt-3">
          <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]/45 backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center shrink-0">
              <Wallet size={15} />
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold tracking-wider text-[var(--muted)]">Cash balance</p>
              <p className="text-xs font-bold tabular-digits">{formatCurrency(data.cashBalance)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]/45 backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center shrink-0">
              <Landmark size={15} />
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold tracking-wider text-[var(--muted)]">Bank balance</p>
              <p className="text-xs font-bold tabular-digits">{formatCurrency(data.bankBalance)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Where Your Money Goes Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] border-b border-[var(--border)] pb-2">
          Where your money goes
        </h3>
        
        {Object.keys(summary.byCategory).length > 0 ? (
          <div className="space-y-1">
            {Object.entries(summary.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount], idx) => {
                const percentage = (amount / summary.total) * 100;
                const isExpanded = selectedCategory === cat;
                const icon = categoryIcons[cat] || defaultIcon;

                return (
                  <div key={cat} className="py-2 border-b border-[var(--border)]/30 last:border-b-0">
                    <button
                      onClick={() => handleCategoryClick(cat)}
                      className="w-full flex items-center justify-between text-left py-1 hover:opacity-85 cursor-pointer focus:outline-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--muted)] shrink-0">
                          {icon}
                        </div>
                        <span className="font-semibold text-base truncate">{cat}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-bold tabular-digits">{formatCurrency(amount)}</p>
                          <p className="text-[10px] text-[var(--muted)] font-medium">{percentage.toFixed(0)}% of total</p>
                        </div>
                        <ChevronRight 
                          size={16} 
                          className={cn(
                            "text-[var(--muted)] transition-transform duration-200", 
                            isExpanded && "rotate-90"
                          )} 
                        />
                      </div>
                    </button>

                    {/* Editorial Inline Progress Visualization */}
                    <div className="h-1 bg-[var(--surface-elevated)] rounded-full overflow-hidden mt-1 mx-1">
                      <div 
                        className="h-full bg-[var(--accent)] rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <AnimatePresence>
                      {isExpanded && renderCategoryDetails(cat, amount)}
                    </AnimatePresence>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="py-12 text-center border border-dashed border-[var(--border)] rounded-2xl p-6 bg-[var(--surface)]">
            <p className="text-sm text-[var(--muted)] font-medium mb-4">Your spending story starts here.</p>
            <button 
              onClick={onAddExpenseClick}
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm cursor-pointer shadow-sm hover:opacity-90 transition-all focus:outline-none"
            >
              <Plus size={16} />
              Log your first expense
            </button>
          </div>
        )}
      </section>

      {/* What Changed Section */}
      {currentMonthExpenses.length > 0 && changes.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] border-b border-[var(--border)] pb-2">
            What changed
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {changes.map((delta, idx) => {
              const isIncrease = delta.direction === 'up';
              return (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl glass-panel flex items-center justify-between select-none"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs text-[var(--muted)] font-bold uppercase tracking-wider">{delta.category}</p>
                    <p className="text-sm font-semibold">
                      {isIncrease ? 'Increased spending' : 'Reduced spending'}
                    </p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 font-bold text-sm px-2.5 py-1 rounded-lg tabular-digits",
                    isIncrease 
                      ? "text-[var(--danger)] bg-[var(--danger-light)]/15 border border-[var(--danger)]/25" 
                      : "text-[var(--success)] bg-[var(--success-light)]/15 border border-[var(--success)]/25"
                  )}>
                    {isIncrease ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(delta.percentageChange).toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Something Worth Knowing Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)] border-b border-[var(--border)] pb-2">
          Something worth knowing
        </h3>
        <div className="space-y-3">
          {observations.map((obs) => {
            return (
              <div 
                key={obs.id} 
                className={cn(
                  "p-5 rounded-2xl border transition-all flex items-start gap-4 select-none backdrop-blur-md",
                  obs.type === 'warning' && "bg-[var(--danger-light)]/15 border-[var(--danger)]/30",
                  obs.type === 'positive' && "bg-[var(--success-light)]/15 border-[var(--success)]/30",
                  obs.type === 'info' && "bg-[var(--accent-light)]/15 border-[var(--accent)]/30"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl mt-0.5 shrink-0",
                  obs.type === 'warning' && "bg-[var(--danger-light)] text-[var(--danger)]",
                  obs.type === 'positive' && "bg-[var(--success-light)] text-[var(--success)]",
                  obs.type === 'info' && "bg-[var(--accent-light)] text-[var(--accent)]"
                )}>
                  {obs.type === 'warning' ? <AlertCircle size={16} /> : <Sparkles size={16} />}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm leading-tight text-[var(--foreground)]">{obs.title}</h4>
                  <p className="text-xs text-[var(--muted)] leading-relaxed font-medium">{obs.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Activity Section */}
      {currentMonthExpenses.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
              Recent activity
            </h3>
            <button 
              onClick={() => onViewChange('transactions')}
              className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer focus:outline-none"
            >
              See ledger <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="space-y-2">
            {currentMonthExpenses.slice(0, 3).map((e) => {
              const icon = categoryIcons[e.category] || defaultIcon;
              return (
                <div 
                  key={e.id}
                  className="flex items-center justify-between p-3.5 rounded-xl glass-panel text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--surface-elevated)]/60 border border-[var(--border)]/30 flex items-center justify-center text-[var(--muted)] shrink-0">
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate text-[var(--foreground)]">{e.merchant || e.description || e.category}</p>
                      <p className="text-[10px] text-[var(--muted)] font-semibold mt-0.5">{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <p className="font-bold text-[var(--danger)] tabular-digits">-{formatCurrency(e.amount)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
