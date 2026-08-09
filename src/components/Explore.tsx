import React, { useState, useMemo } from 'react';
import { Utensils, BarChart3, Calendar, Compass, RefreshCw, Layers, ChevronRight } from 'lucide-react';
import { FoodIntelligence } from './FoodIntelligence';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { FinancialCalendar } from './FinancialCalendar';
import { MoneyTimeline } from './MoneyTimeline';
import { RecurringExpenses } from './RecurringExpenses';
import { SubscriptionIntelligence } from './SubscriptionIntelligence';
import { UserData, RecurringExpense, Subscription } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { getExpensesForMonth } from '../lib/spendingService';
import { classifyFoodExpense } from '../lib/foodService';
import { getAnalyticsSummary } from '../lib/analyticsService';
import { getTimeline } from '../lib/timelineService';
import { getRecurringMonthlyCost, detectRecurringExpenses } from '../lib/recurringService';
import { getSubscriptionInsights, detectSubscriptionsFromExpenses } from '../lib/subscriptionService';

type ExploreTab = 'menu' | 'food' | 'analytics' | 'calendar' | 'timeline' | 'recurring' | 'subscriptions';

interface ExploreProps {
  data: UserData;
  onViewChange: (view: string) => void;
  onAddRecurring?: (item: Omit<RecurringExpense, 'id'>) => void;
  onDeleteRecurring?: (id: string) => void;
  onAddSubscription?: (item: Omit<Subscription, 'id'>) => void;
  onDeleteSubscription?: (id: string) => void;
  onUpdateSubscription?: (id: string, updated: Omit<Subscription, 'id'>) => void;
}

export function Explore({
  data,
  onViewChange,
  onAddRecurring,
  onDeleteRecurring,
  onAddSubscription,
  onDeleteSubscription,
  onUpdateSubscription
}: ExploreProps) {
  const [activeTab, setActiveTab] = useState<ExploreTab>('menu');
  const today = new Date();

  // Compute live summaries for each card
  const summaries = useMemo(() => {
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthExpenses = getExpensesForMonth(data.expenses, currentMonth, currentYear);

    // Food Intelligence summary
    const foodExpenses = monthExpenses.filter(e => e.category.toLowerCase() === 'food');
    const foodTotal = foodExpenses.reduce((s, e) => s + e.amount, 0);
    let foodGroupSummary = '';
    if (foodExpenses.length > 0) {
      const groups: Record<string, number> = { essential: 0, outside: 0, junk: 0 };
      foodExpenses.forEach(e => {
        const g = classifyFoodExpense(e);
        if (g in groups) groups[g] += e.amount;
      });
      const top = Object.entries(groups).sort((a, b) => b[1] - a[1])[0];
      const topLabel = top[0] === 'essential' ? 'Groceries' : top[0] === 'outside' ? 'Dining out' : 'Treats';
      foodGroupSummary = `${topLabel} leads at ${formatCurrency(top[1])}`;
    }

    // Analytics summary
    const analytics = getAnalyticsSummary(data.expenses, today);
    const analyticsLine = analytics.transactionCount > 0
      ? `${analytics.transactionCount} txns, ${formatCurrency(analytics.averageTransaction)} avg`
      : 'No data yet';

    // Calendar summary
    const spendingDays = new Set(monthExpenses.map(e => new Date(e.date).getDate())).size;
    const calendarLine = monthExpenses.length > 0
      ? `${spendingDays} active day${spendingDays !== 1 ? 's' : ''} this month`
      : 'No spending days yet';

    // Timeline summary
    const timeline = getTimeline(data.expenses, 6);
    const activeMonths = timeline.entries.filter(e => e.totalSpent > 0).length;
    const timelineLine = activeMonths > 0
      ? `${activeMonths} month${activeMonths !== 1 ? 's' : ''} of data, ${formatCurrency(timeline.averageMonthly)} avg`
      : 'Start adding expenses';

    // Recurring summary
    const userRecurring = data.recurringExpenses || [];
    const detectedRecurring = detectRecurringExpenses(data.expenses);
    const monthlyCost = getRecurringMonthlyCost(userRecurring);
    const recurringLine = userRecurring.length > 0
      ? `${userRecurring.length} tracked, ${formatCurrency(monthlyCost)}/mo`
      : detectedRecurring.length > 0
        ? `${detectedRecurring.length} pattern${detectedRecurring.length !== 1 ? 's' : ''} detected`
        : 'No recurring expenses yet';

    // Subscription summary
    const subs = data.subscriptions || [];
    const subInsights = getSubscriptionInsights(subs);
    const detectedSubs = detectSubscriptionsFromExpenses(data.expenses);
    const subLine = subs.length > 0
      ? `${subInsights.activeCount} active, ${formatCurrency(subInsights.totalMonthly)}/mo`
      : detectedSubs.length > 0
        ? `${detectedSubs.length} possible sub${detectedSubs.length !== 1 ? 's' : ''} found`
        : 'No subscriptions tracked';

    return {
      food: { total: foodTotal, detail: foodGroupSummary, count: foodExpenses.length },
      analytics: { total: analytics.totalSpending, detail: analyticsLine },
      calendar: { detail: calendarLine, spendingDays },
      timeline: { detail: timelineLine, avgMonthly: timeline.averageMonthly },
      recurring: { detail: recurringLine, monthlyCost },
      subscriptions: { detail: subLine, monthlyTotal: subInsights.totalMonthly }
    };
  }, [data]);

  const exploreItems = [
    {
      id: 'food' as ExploreTab,
      title: 'Food Intelligence',
      description: 'Breakdown of groceries, food delivery, cafes, and treats.',
      icon: <Utensils size={20} />,
      liveValue: summaries.food.count > 0 ? formatCurrency(summaries.food.total) : null,
      liveDetail: summaries.food.detail || `${summaries.food.count} food transactions`,
      color: '#86B88A'
    },
    {
      id: 'analytics' as ExploreTab,
      title: 'Advanced Analytics',
      description: 'Interactive spending patterns and category breakdown.',
      icon: <BarChart3 size={20} />,
      liveValue: summaries.analytics.total > 0 ? formatCurrency(summaries.analytics.total) : null,
      liveDetail: summaries.analytics.detail,
      color: '#D6A85F'
    },
    {
      id: 'calendar' as ExploreTab,
      title: 'Financial Calendar',
      description: 'Visual map of daily spending patterns.',
      icon: <Calendar size={20} />,
      liveValue: null,
      liveDetail: summaries.calendar.detail,
      color: '#A9653F'
    },
    {
      id: 'timeline' as ExploreTab,
      title: 'Money Timeline',
      description: 'Historical view of cash flows and monthly trends.',
      icon: <Compass size={20} />,
      liveValue: summaries.timeline.avgMonthly > 0 ? formatCurrency(summaries.timeline.avgMonthly) : null,
      liveDetail: summaries.timeline.detail,
      color: '#641E2A'
    },
    {
      id: 'recurring' as ExploreTab,
      title: 'Recurring Expenses',
      description: 'Fixed commitments, utilities, and tracked recurring.',
      icon: <RefreshCw size={20} />,
      liveValue: summaries.recurring.monthlyCost > 0 ? formatCurrency(summaries.recurring.monthlyCost) : null,
      liveDetail: summaries.recurring.detail,
      color: '#D6A85F'
    },
    {
      id: 'subscriptions' as ExploreTab,
      title: 'Subscription Intelligence',
      description: 'Track, manage, and analyze your subscriptions.',
      icon: <Layers size={20} />,
      liveValue: summaries.subscriptions.monthlyTotal > 0 ? formatCurrency(summaries.subscriptions.monthlyTotal) : null,
      liveDetail: summaries.subscriptions.detail,
      color: '#A9653F'
    }
  ];

  // Render submodules
  if (activeTab === 'food') {
    return <FoodIntelligence data={data} onBack={() => setActiveTab('menu')} />;
  }
  if (activeTab === 'analytics') {
    return <AdvancedAnalytics data={data} onBack={() => setActiveTab('menu')} />;
  }
  if (activeTab === 'calendar') {
    return <FinancialCalendar data={data} onBack={() => setActiveTab('menu')} />;
  }
  if (activeTab === 'timeline') {
    return <MoneyTimeline data={data} onBack={() => setActiveTab('menu')} />;
  }
  if (activeTab === 'recurring') {
    return (
      <RecurringExpenses
        data={data}
        onBack={() => setActiveTab('menu')}
        onAddRecurring={onAddRecurring || (() => {})}
        onDeleteRecurring={onDeleteRecurring || (() => {})}
      />
    );
  }
  if (activeTab === 'subscriptions') {
    return (
      <SubscriptionIntelligence
        data={data}
        onBack={() => setActiveTab('menu')}
        onAddSubscription={onAddSubscription || (() => {})}
        onDeleteSubscription={onDeleteSubscription || (() => {})}
        onUpdateSubscription={onUpdateSubscription || (() => {})}
      />
    );
  }

  return (
    <div className="space-y-8 animate-slide-in">
      
      {/* Editorial Title */}
      <div className="select-none">
        <h2 className="text-3xl font-bold text-[var(--foreground)] editorial-title">Explore</h2>
        <p className="text-sm text-[var(--muted)] mt-1 font-medium">Secondary features and spending micro-experiences.</p>
      </div>

      {/* Grid Menu of Features */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exploreItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="p-5 rounded-2xl glass-panel text-left flex items-start gap-4 transition-all duration-200 select-none hover:border-[var(--accent)]/45 cursor-pointer group"
          >
            <div
              className="p-3 rounded-xl shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-105"
              style={{ backgroundColor: `${item.color}20`, color: item.color }}
            >
              {item.icon}
            </div>

            <div className="space-y-1.5 pr-6 relative flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[var(--foreground)]">{item.title}</span>
                <span className="text-[9px] font-bold bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/15 px-1.5 py-0.5 rounded uppercase tracking-wider">Active</span>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed font-medium">{item.description}</p>
              
              {/* Live data summary */}
              <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]/30 mt-1">
                {item.liveValue && (
                  <span className="text-sm font-bold tabular-digits text-[var(--foreground)]">{item.liveValue}</span>
                )}
                <span className="text-[10px] font-semibold text-[var(--muted)] truncate">{item.liveDetail}</span>
              </div>
            </div>
            
            <ChevronRight size={16} className="text-[var(--muted)] self-center opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </section>

    </div>
  );
}
