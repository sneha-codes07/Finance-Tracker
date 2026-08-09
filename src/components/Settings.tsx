import React, { useState, useEffect } from 'react';
import { Sun, Moon, Laptop, Palette, CreditCard, ChevronRight, Briefcase, Users, Bell, Shield } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { ThemeType, UserData } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { notificationService } from '../lib/notificationService';
import { useNotification } from './NotificationContext';

interface SettingsProps {
  spendingLimit: number;
  onSetLimit: (limit: number) => void;
  onViewChange: (view: string) => void;
  data: UserData;
  onSetNotificationsEnabled: (enabled: boolean) => void;
  onRestoreBackup: (backup: UserData) => void;
}

export function Settings({
  spendingLimit,
  onSetLimit,
  onViewChange,
  data,
  onSetNotificationsEnabled,
  onRestoreBackup
}: SettingsProps) {
  const { theme, setTheme } = useTheme();
  const { showNotification } = useNotification();
  // Permission state tracking
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(notificationService.isSupported());
    setPermission(notificationService.getPermission());
  }, []);

  const handleNotificationToggle = async () => {
    if (!isSupported) {
      showNotification('Notifications are not supported in this browser.', 'error');
      return;
    }

    if (data.notificationsEnabled) {
      // Disabling is always allowed
      onSetNotificationsEnabled(false);
      showNotification('System notifications disabled.', 'info');
      return;
    }

    // Request or check permission
    let currentPermission = notificationService.getPermission();
    if (currentPermission === 'default') {
      currentPermission = await notificationService.requestPermission();
      setPermission(currentPermission);
    }

    if (currentPermission === 'granted') {
      onSetNotificationsEnabled(true);
      showNotification('System notifications enabled successfully.', 'success');
      // Send a test notification
      notificationService.notify('System Notifications Active', {
        body: 'Finance Tracker V2 will alert you for spending limit limits and upcoming bills.'
      });
    } else {
      onSetNotificationsEnabled(false);
      if (currentPermission === 'denied') {
        showNotification('Notification permission denied. Enable it in browser settings.', 'error');
      }
    }
  };

  const handleExport = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const backupObj = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          cashBalance: data.cashBalance,
          bankBalance: data.bankBalance,
          monthlySpendingLimit: data.monthlySpendingLimit,
          expenses: data.expenses,
          savings: data.savings,
          investments: data.investments,
          borrowLend: data.borrowLend,
          reminders: data.reminders,
          recurringExpenses: data.recurringExpenses || [],
          subscriptions: data.subscriptions || [],
          notificationsEnabled: data.notificationsEnabled
        }
      };

      const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance-tracker-backup-${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification('Data exported successfully.', 'success');
    } catch (err) {
      showNotification('Failed to export backup.', 'error');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.version !== 1 || !parsed.data) {
          showNotification('Invalid backup file format or version.', 'error');
          return;
        }

        const backupData = parsed.data;
        if (
          typeof backupData.cashBalance !== 'number' ||
          typeof backupData.bankBalance !== 'number' ||
          !Array.isArray(backupData.expenses)
        ) {
          showNotification('Invalid backup data structure.', 'error');
          return;
        }

        const confirmRestore = window.confirm('Importing this backup will replace your current Finance Tracker data. Continue?');
        if (confirmRestore) {
          onRestoreBackup(backupData);
          showNotification('Backup restored successfully!', 'success');
        }
      } catch (err) {
        showNotification('Failed to parse backup JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const themesList: { id: ThemeType; name: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'light', name: 'Light', icon: <Sun size={18} />, desc: 'Editorial ink and warm paper' },
    { id: 'dark', name: 'Dark', icon: <Moon size={18} />, desc: 'Obsidian charcoal reader' },
    { id: 'system', name: 'System', icon: <Laptop size={18} />, desc: 'Match system preferences' },
  ];

  return (
    <div className="space-y-8 animate-slide-in">
      
      {/* Title */}
      <div className="select-none">
        <h2 className="text-3xl font-bold text-[var(--foreground)] editorial-title">Settings</h2>
        <p className="text-sm text-[var(--muted)] mt-1 font-medium font-sans">Manage preferences and archive features.</p>
      </div>

      {/* Theme Toggles */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-[var(--muted)] select-none">
          <Palette size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">Appearance</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themesList.map((t) => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "p-4 rounded-xl border-2 text-left space-y-2 cursor-pointer transition-all duration-200 focus:outline-none",
                  isActive 
                    ? "border-[var(--accent)] bg-[var(--accent-light)]/20 shadow-sm" 
                    : "border-[var(--border)] glass-panel hover:bg-[var(--surface-elevated)]/30"
                )}
              >
                <div className={cn("p-2 rounded-lg w-fit", isActive ? "bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/15" : "bg-[var(--surface-elevated)]/60 text-[var(--muted)] border border-[var(--border)]/20")}>
                  {t.icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--foreground)]">{t.name}</h4>
                  <p className="text-[10px] text-[var(--muted)] font-medium leading-normal mt-0.5">{t.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Financial Limits */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-[var(--muted)] select-none">
          <CreditCard size={16} className="text-[var(--accent)]" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Financial limits</span>
        </div>
        
        <div className="p-5 rounded-2xl glass-panel space-y-4">
          <div className="flex justify-between items-center select-none">
            <div>
              <p className="font-bold text-sm text-[var(--foreground)]">Monthly spending limit</p>
              <p className="text-xs text-[var(--muted)] font-semibold mt-1">Alerts when spending exceeds this value.</p>
            </div>
            <p className="font-black text-lg text-[var(--accent)] tabular-digits font-mono">{formatCurrency(spendingLimit)}</p>
          </div>
          
          <input 
            type="range" 
            min="5000" 
            max="150000" 
            step="5000"
            value={spendingLimit}
            onChange={(e) => onSetLimit(parseInt(e.target.value))}
            className="w-full h-1 bg-[var(--border)]/65 rounded-lg appearance-none cursor-pointer accent-[var(--accent)] focus:outline-none"
          />
        </div>
      </section>

      {/* System Notifications Setting */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-[var(--muted)] select-none">
          <Bell size={16} className="text-[var(--accent)]" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Notifications</span>
        </div>
        
        <div className="p-5 rounded-2xl glass-panel space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-[var(--foreground)]">System Notifications</h4>
              <p className="text-xs text-[var(--muted)] font-semibold leading-relaxed max-w-md mt-1">
                {!isSupported
                  ? 'Notifications are not supported in your browser.'
                  : permission === 'denied'
                    ? 'Browser notification permission is currently blocked. Please unblock it in browser settings to enable.'
                    : 'Get notified of approaching spending limits, upcoming subscriptions, and recurring payments.'}
              </p>
            </div>

            <button
              onClick={handleNotificationToggle}
              disabled={!isSupported}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0",
                data.notificationsEnabled && permission === 'granted' ? "bg-[var(--accent)]" : "bg-[var(--border)]/50"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-[#080808] absolute top-1 transition-all",
                  data.notificationsEnabled && permission === 'granted' ? "left-6" : "left-1 bg-white"
                )}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Data Backup Setting */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-[var(--muted)] select-none">
          <Shield size={16} className="text-[var(--accent)]" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Security & Data Backup</span>
        </div>
        
        <div className="p-5 rounded-2xl glass-panel space-y-4">
          <div>
            <h4 className="font-bold text-sm text-[var(--foreground)]">Export & Import Ledger</h4>
            <p className="text-xs text-[var(--muted)] font-semibold mt-1 max-w-md leading-relaxed">
              Backup your transactions, budgets, goals, active subscriptions, and recurring expense configurations locally.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2.5 rounded-xl bg-[var(--accent)] text-[#080808] text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer focus:outline-none shadow-sm"
            >
              Export Data
            </button>
            <label className="px-4 py-2.5 rounded-xl bg-[var(--surface-elevated)]/60 border border-[var(--border)] text-[var(--foreground)] text-xs font-bold hover:bg-[var(--border)]/35 transition-colors cursor-pointer flex items-center justify-center select-none">
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </section>

      {/* Legacy Archives Portals */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-[var(--muted)] select-none">
          <Briefcase size={16} className="text-[var(--accent)]" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Archive & Legacy tools</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button 
            onClick={() => onViewChange('investments')}
            className="p-4 rounded-xl glass-panel flex items-center justify-between text-left cursor-pointer hover:bg-[var(--surface-elevated)]/30 transition-colors focus:outline-none group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--surface-elevated)]/60 border border-[var(--border)]/20 text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:bg-[var(--accent-light)] transition-colors">
                <Briefcase size={16} />
              </div>
              <div>
                <span className="font-bold text-sm text-[var(--foreground)]">Investments Portfolio</span>
                <p className="text-[10px] text-[var(--muted)] font-semibold mt-1">V1 Stocks and Mutual Funds tracker</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[var(--muted)] shrink-0" />
          </button>

          <button 
            onClick={() => onViewChange('borrowLend')}
            className="p-4 rounded-xl glass-panel flex items-center justify-between text-left cursor-pointer hover:bg-[var(--surface-elevated)]/30 transition-colors focus:outline-none group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--surface-elevated)]/60 border border-[var(--border)]/20 text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:bg-[var(--accent-light)] transition-colors">
                <Users size={16} />
              </div>
              <div>
                <span className="font-bold text-sm text-[var(--foreground)]">Borrow & Lend Ledger</span>
                <p className="text-[10px] text-[var(--muted)] font-semibold mt-1">V1 Personal loans and dues tracker</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[var(--muted)] shrink-0" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <div className="pt-8 text-center select-none opacity-45">
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] font-mono">Finance Tracker V2.0.0</p>
        <p className="text-[9px] italic mt-1 font-serif">Observant, not judgmental.</p>
      </div>

    </div>
  );
}
