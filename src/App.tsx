import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { NotificationProvider } from './components/NotificationContext';
import { SplashScreen } from './components/SplashScreen';
import { AppShell } from './components/AppShell';
import { Overview } from './components/Overview';
import { Transactions } from './components/Transactions';
import { Explore } from './components/Explore';
import { SavingsCorner } from './components/SavingsCorner';
import { AIAssistant } from './components/AIAssistant';
import { Settings } from './components/Settings';
import { AddExpense } from './components/AddExpense';
import { MoltenMetal } from './components/MoltenMetal';
import { CustomCursor } from './components/CustomCursor';

// Legacy components
import { InvestmentDashboard } from './components/InvestmentDashboard';
import { BorrowLend } from './components/BorrowLend';

import { useFinData } from './hooks/useFinData';
import { notificationService } from './lib/notificationService';

type View = 'overview' | 'transactions' | 'explore' | 'goals' | 'ai' | 'settings' | 'investments' | 'borrowLend';

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<View>('overview');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  
  const { 
    data, 
    addExpense,
    updateExpense,
    deleteExpense,
    addSavingContribution, 
    addInvestment, 
    addBorrowLend, 
    updateBalances, 
    setSpendingLimit,
    addRecurringExpense,
    deleteRecurringExpense,
    addSubscription,
    deleteSubscription,
    updateSubscription,
    setNotificationsEnabled,
    restoreBackup
  } = useFinData();

  // Periodically check and send notifications on state updates
  useEffect(() => {
    if (data && data.notificationsEnabled) {
      notificationService.checkRules(data);
    }
  }, [data]);

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return (
          <Overview 
            data={data} 
            onViewChange={(v) => setCurrentView(v as View)} 
            onAddExpenseClick={() => setIsAddExpenseOpen(true)}
          />
        );
      case 'transactions':
        return (
          <Transactions 
            expenses={data.expenses} 
            onUpdateExpense={updateExpense} 
            onDeleteExpense={deleteExpense} 
          />
        );
      case 'explore':
        return (
          <Explore 
            data={data} 
            onViewChange={(v) => setCurrentView(v as View)}
            onAddRecurring={addRecurringExpense}
            onDeleteRecurring={deleteRecurringExpense}
            onAddSubscription={addSubscription}
            onDeleteSubscription={deleteSubscription}
            onUpdateSubscription={updateSubscription}
          />
        );
      case 'goals':
        return (
          <SavingsCorner 
            savings={data.savings} 
            onAddContribution={addSavingContribution} 
          />
        );
      case 'ai':
        return (
          <AIAssistant 
            data={data} 
            onAddExpense={addExpense}
          />
        );
      case 'settings':
        return (
          <Settings 
            spendingLimit={data.monthlySpendingLimit} 
            onSetLimit={setSpendingLimit}
            onViewChange={(v) => setCurrentView(v as View)}
            data={data}
            onSetNotificationsEnabled={setNotificationsEnabled}
            onRestoreBackup={restoreBackup}
          />
        );
      case 'investments':
        return (
          <div className="space-y-6">
            <button 
              onClick={() => setCurrentView('settings')}
              className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer focus:outline-none"
            >
              &larr; Back to Settings
            </button>
            <InvestmentDashboard 
              investments={data.investments} 
              onAddInvestment={addInvestment} 
            />
          </div>
        );
      case 'borrowLend':
        return (
          <div className="space-y-6">
            <button 
              onClick={() => setCurrentView('settings')}
              className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer focus:outline-none"
            >
              &larr; Back to Settings
            </button>
            <BorrowLend 
              items={data.borrowLend} 
              onAddItem={addBorrowLend} 
            />
          </div>
        );
      default:
        return (
          <Overview 
            data={data} 
            onViewChange={(v) => setCurrentView(v as View)} 
            onAddExpenseClick={() => setIsAddExpenseOpen(true)}
          />
        );
    }
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <>
      <MoltenMetal speed={0.25} opacity={0.35} />
      <CustomCursor />
      <AppShell 
        currentView={currentView} 
        onViewChange={(v) => setCurrentView(v as View)}
        onAddExpenseClick={() => setIsAddExpenseOpen(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full relative z-10"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </AppShell>

      {/* Quick Add Expense Modal */}
      <AddExpense 
        isOpen={isAddExpenseOpen} 
        onClose={() => setIsAddExpenseOpen(false)} 
        onAddExpense={addExpense} 
      />
    </>
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
