import React from 'react';
import { Home, History, Compass, Target, Sparkles, Settings, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface AppShellProps {
  currentView: string;
  onViewChange: (view: string) => void;
  children: React.ReactNode;
  onAddExpenseClick: () => void;
}

export function AppShell({ currentView, onViewChange, children, onAddExpenseClick }: AppShellProps) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: <Home size={18} /> },
    { id: 'transactions', label: 'Transactions', icon: <History size={18} /> },
    { id: 'explore', label: 'Explore', icon: <Compass size={18} /> },
    { id: 'goals', label: 'Goals', icon: <Target size={18} /> },
    { id: 'ai', label: 'AI Assistant', icon: <Sparkles size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-transparent text-[var(--foreground)] transition-colors duration-300 relative z-10">
      
      {/* Desktop Sidebar (translucent glass design) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl p-6 space-y-8 select-none shrink-0 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--copper)] text-[#080808] flex items-center justify-center font-bold font-serif text-lg shadow-sm">
            F
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight editorial-title">Finance V2</h1>
            <p className="text-[9px] text-[var(--muted)] uppercase tracking-[0.2em] font-mono font-bold">Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer text-left focus:outline-none",
                  isActive 
                    ? "bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/15" 
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)]/30"
                )}
              >
                <span className={cn(isActive ? "text-[var(--accent)]" : "text-[var(--muted)]")}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-[var(--border)]">
          <button
            onClick={onAddExpenseClick}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--accent)] text-[#080808] font-bold text-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_15px_rgba(214,168,95,0.15)] focus:outline-none"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-[#080808] flex items-center justify-center text-xs font-bold font-serif shadow-sm">
            F
          </div>
          <span className="font-bold text-base leading-none editorial-title">Finance V2</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onViewChange('ai')}
            className={cn(
              "p-2.5 rounded-xl transition-colors cursor-pointer",
              currentView === 'ai' ? "text-[var(--accent)] bg-[var(--accent-light)]" : "text-[var(--muted)] hover:bg-[var(--surface-elevated)]/30"
            )}
            aria-label="AI Assistant"
          >
            <Sparkles size={18} />
          </button>
          <button 
            onClick={() => onViewChange('settings')}
            className={cn(
              "p-2.5 rounded-xl transition-colors cursor-pointer",
              currentView === 'settings' ? "text-[var(--accent)] bg-[var(--accent-light)]" : "text-[var(--muted)] hover:bg-[var(--surface-elevated)]/30"
            )}
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        <div className="flex-1 p-5 md:p-10 max-w-4xl w-full mx-auto pb-24 md:pb-10">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl z-40 select-none pb-safe">
        <div className="flex justify-around items-center px-2 py-2">
          {navItems.filter(item => ['overview', 'transactions', 'explore', 'goals'].includes(item.id)).map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-center transition-all cursor-pointer focus:outline-none",
                  isActive ? "text-[var(--accent)]" : "text-[var(--muted)]"
                )}
              >
                <div className={cn("p-1.5 rounded-lg transition-all", isActive && "bg-[var(--accent-light)]")}>
                  {item.icon}
                </div>
                <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
              </button>
            );
          })}
          
          {/* Mobile Quick Add Button */}
          <button
            onClick={onAddExpenseClick}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent)] text-[#080808] shadow-md shadow-[var(--accent)]/15 active:scale-95 transition-all cursor-pointer focus:outline-none"
            aria-label="Add Expense"
          >
            <Plus size={20} />
          </button>
        </div>
      </nav>
    </div>
  );
}
