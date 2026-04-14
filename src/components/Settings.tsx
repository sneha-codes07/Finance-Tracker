import React from 'react';
import { Palette, Bell, Shield, ChevronRight, CreditCard, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { ThemeType } from '../types';
import { cn } from '../lib/utils';

interface SettingsProps {
  spendingLimit: number;
  onSetLimit: (limit: number) => void;
}

const THEMES: { id: ThemeType; name: string; colors: string[] }[] = [
  { id: 'GenZ', name: 'Gen Z', colors: ['#0a0a0a', '#ffd700', '#ffec8b'] },
  { id: 'Millennial', name: 'Millennial', colors: ['#f5f5f0', '#e2a285', '#333333'] },
  { id: 'Teen', name: 'Teen', colors: ['#16181D', '#21B257', '#25272D'] },
  { id: 'Classic', name: 'Classic', colors: ['#ffffff', '#4b5563', '#1a1a1a'] },
];

export function Settings({ spendingLimit, onSetLimit }: SettingsProps) {
  const { theme, setTheme, mode, toggleMode } = useTheme();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Settings</h2>
        <button 
          onClick={toggleMode}
          className="p-2 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] text-[var(--accent)]"
        >
          {mode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {/* Theme Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 opacity-60">
          <Palette size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">Appearance</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all text-left space-y-3",
                theme === t.id ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border)] bg-[var(--card-bg)]"
              )}
            >
              <div className="flex gap-1">
                {t.colors.map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="font-bold text-sm">{t.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Spending Limit */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 opacity-60">
          <CreditCard size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">Financials</span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] space-y-3">
          <div className="flex justify-between items-center">
            <p className="font-bold text-sm">Monthly Spending Limit</p>
            <p className="font-bold text-[var(--accent)]">₹{spendingLimit}</p>
          </div>
          <input 
            type="range" 
            min="1000" 
            max="100000" 
            step="1000"
            value={spendingLimit}
            onChange={(e) => onSetLimit(parseInt(e.target.value))}
            className="w-full h-2 bg-black/5 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
          />
        </div>
      </div>

      {/* General Settings */}
      <div className="space-y-2">
        <SettingItem icon={<Bell size={18} />} label="Notifications" />
        <SettingItem icon={<Shield size={18} />} label="Security & Privacy" />
      </div>

      <div className="pt-8 text-center opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">FinDiary v1.0.0</p>
        <p className="text-[10px] italic-highlight mt-1">Crafted for your financial freedom</p>
      </div>
    </div>
  );
}

function SettingItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="w-full p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="opacity-60">{icon}</div>
        <span className="font-bold text-sm">{label}</span>
      </div>
      <ChevronRight size={18} className="opacity-40 group-hover:translate-x-1 transition-transform" />
    </button>
  );
}
