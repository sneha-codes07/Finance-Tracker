/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, TrendingUp, PiggyBank, Briefcase, Users, Settings as SettingsIcon } from 'lucide-react';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { NotificationProvider } from './components/NotificationContext';
import { SplashScreen } from './components/SplashScreen';
import { Dashboard } from './components/Dashboard';
import { ExpenseTracker } from './components/ExpenseTracker';
import { SavingsCorner } from './components/SavingsCorner';
import { InvestmentDashboard } from './components/InvestmentDashboard';
import { BorrowLend } from './components/BorrowLend';
import { Settings } from './components/Settings';
import { useFinData } from './hooks/useFinData';
import { cn } from './lib/utils';

type View = 'home' | 'expenses' | 'savings' | 'investments' | 'borrowLend' | 'settings';

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<View>('home');
  const { theme } = useTheme();
  const { 
    data, 
    addExpense, 
    addSavingContribution, 
    addInvestment, 
    addBorrowLend, 
    updateBalances, 
    setSpendingLimit 
  } = useFinData();

  const renderView = () => {
    if (showSplash) {
      return <SplashScreen onComplete={() => setShowSplash(false)} />;
    }
    switch (currentView) {
      case 'home':
        return (
          <Dashboard 
            data={data} 
            onSectionClick={(s) => setCurrentView(s as View)} 
            onUpdateBalances={updateBalances}
          />
        );
      case 'expenses':
        return <ExpenseTracker expenses={data.expenses} onAddExpense={addExpense} />;
      case 'savings':
        return <SavingsCorner savings={data.savings} onAddContribution={addSavingContribution} />;
      case 'investments':
        return <InvestmentDashboard investments={data.investments} onAddInvestment={addInvestment} />;
      case 'borrowLend':
        return <BorrowLend items={data.borrowLend} onAddItem={addBorrowLend} />;
      case 'settings':
        return (
          <Settings 
            spendingLimit={data.monthlySpendingLimit} 
            onSetLimit={setSpendingLimit}
          />
        );
      default:
        return (
          <Dashboard 
            data={data} 
            onSectionClick={(s) => setCurrentView(s as View)} 
            onUpdateBalances={updateBalances}
          />
        );
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--accent)] selection:text-white transition-colors duration-500",
      theme === 'GenZ' && "glitter-bg"
    )}>
      <main className="max-w-md mx-auto px-6 pt-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={showSplash ? 'splash' : currentView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)]/80 backdrop-blur-xl border-t border-[var(--border)] z-50">
        <div className="max-w-md mx-auto px-6 py-3 flex justify-between items-center">
          <NavButton 
            active={currentView === 'home'} 
            onClick={() => setCurrentView('home')} 
            icon={<Home size={22} />} 
            label="Home" 
          />
          <NavButton 
            active={currentView === 'expenses'} 
            onClick={() => setCurrentView('expenses')} 
            icon={<TrendingUp size={22} />} 
            label="Expenses" 
          />
          <NavButton 
            active={currentView === 'savings'} 
            onClick={() => setCurrentView('savings')} 
            icon={<PiggyBank size={22} />} 
            label="Savings" 
          />
          <NavButton 
            active={currentView === 'investments'} 
            onClick={() => setCurrentView('investments')} 
            icon={<Briefcase size={22} />} 
            label="Invest" 
          />
          <NavButton 
            active={currentView === 'borrowLend'} 
            onClick={() => setCurrentView('borrowLend')} 
            icon={<Users size={22} />} 
            label="Social" 
          />
          <NavButton 
            active={currentView === 'settings'} 
            onClick={() => setCurrentView('settings')} 
            icon={<SettingsIcon size={22} />} 
            label="Settings" 
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300",
        active ? "text-[var(--accent)] scale-110" : "text-[var(--text)] opacity-40 hover:opacity-100"
      )}
    >
      <div className={cn(
        "p-1 rounded-xl transition-all",
        active && "bg-[var(--accent)]/10"
      )}>
        {icon}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ThemeProvider>
  );
}
