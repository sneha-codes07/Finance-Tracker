import { UserData } from '../types';

// Store already notified events in-memory AND persist to localStorage so they don't trigger repeatedly on reload.
const NOTIFIED_KEY = 'findiary-notified-events';

const getNotifiedEvents = (): Set<string> => {
  try {
    const saved = localStorage.getItem(NOTIFIED_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
};

const saveNotifiedEvents = (set: Set<string>) => {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error('Failed to save notified events:', err);
  }
};

export const notificationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'default';
    return Notification.permission;
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'default';
    try {
      const res = await Notification.requestPermission();
      return res;
    } catch {
      return 'default';
    }
  },

  notify(title: string, options?: NotificationOptions) {
    if (!this.isSupported()) return;
    if (Notification.permission !== 'granted') return;

    try {
      new Notification(title, {
        icon: '/favicon.ico',
        ...options
      });
    } catch (e) {
      console.warn('Failed to display browser notification:', e);
    }
  },

  checkRules(data: UserData) {
    if (!this.isSupported() || Notification.permission !== 'granted') return;
    if (!data.notificationsEnabled) return;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const todayStr = today.toISOString().split('T')[0];

    const notifiedEvents = getNotifiedEvents();
    let updated = false;

    // 1. Spending limit reached or warning (80%)
    const currentMonthExpenses = data.expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const limit = data.monthlySpendingLimit;

    if (limit > 0) {
      if (totalSpent >= limit) {
        const eventId = `limit-exceeded-${currentMonth}-${currentYear}`;
        if (!notifiedEvents.has(eventId)) {
          this.notify('Spending Limit Exceeded', {
            body: `You have spent ₹${totalSpent.toLocaleString('en-IN')}, which exceeds your limit of ₹${limit.toLocaleString('en-IN')}.`,
            tag: 'spending-limit'
          });
          notifiedEvents.add(eventId);
          updated = true;
        }
      } else if (totalSpent >= limit * 0.8) {
        const eventId = `limit-warn-${currentMonth}-${currentYear}`;
        if (!notifiedEvents.has(eventId)) {
          this.notify('Approaching Spending Limit', {
            body: `You have spent ₹${totalSpent.toLocaleString('en-IN')} (${((totalSpent / limit) * 100).toFixed(0)}% of your ₹${limit.toLocaleString('en-IN')} limit).`,
            tag: 'spending-limit'
          });
          notifiedEvents.add(eventId);
          updated = true;
        }
      }
    }

    // 2. Subscriptions due within 2 days
    const subs = data.subscriptions || [];
    subs.forEach(sub => {
      if (sub.isActive && sub.nextBillingDate) {
        const nextBilling = new Date(sub.nextBillingDate);
        const diffTime = nextBilling.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 2) {
          const eventId = `sub-due-${sub.id}-${sub.nextBillingDate}`;
          if (!notifiedEvents.has(eventId)) {
            this.notify('Subscription Due Soon', {
              body: `Your subscription to ${sub.name} (₹${sub.amount.toLocaleString('en-IN')}) is due on ${sub.nextBillingDate}.`,
              tag: `sub-${sub.id}`
            });
            notifiedEvents.add(eventId);
            updated = true;
          }
        }
      }
    });

    // 3. Recurring expenses due within 2 days
    const recurring = data.recurringExpenses || [];
    recurring.forEach(rec => {
      if (rec.nextExpectedDate) {
        const nextDate = new Date(rec.nextExpectedDate);
        const diffTime = nextDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 2) {
          const eventId = `rec-due-${rec.id}-${rec.nextExpectedDate}`;
          if (!notifiedEvents.has(eventId)) {
            this.notify('Recurring Expense Due Soon', {
              body: `Your recurring payment to ${rec.merchant} (₹${rec.amount.toLocaleString('en-IN')}) is expected on ${rec.nextExpectedDate}.`,
              tag: `rec-${rec.id}`
            });
            notifiedEvents.add(eventId);
            updated = true;
          }
        }
      }
    });

    if (updated) {
      saveNotifiedEvents(notifiedEvents);
    }
  }
};
