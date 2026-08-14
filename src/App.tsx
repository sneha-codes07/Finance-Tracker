import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Profile } from './types';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { useNotification } from './components/NotificationContext';
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

function AppContent({ 
  user,
  onLogout
}: { 
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
    isGuest?: boolean;
  };
  onLogout: () => void | Promise<void>;
  key?: string;
}) {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<View>('overview');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const { 
    data, 
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    addSavingGoal,
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
  } = useFinData(user.id);

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
            onUpdateBalances={updateBalances}
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
            onAddGoal={addSavingGoal}
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
            onUpdateBalances={updateBalances}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-[var(--muted)] font-mono uppercase tracking-wider">Synchronizing Ledger...</p>
        </div>
      </div>
    );
  }

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
        activeProfileName={user.user_metadata?.full_name || user.email || 'User'}
        onProfileClick={() => setIsProfileModalOpen(true)}
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

      {/* Profile Management Modal */}
      {isProfileModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setIsProfileModalOpen(false)}
        >
          <div 
            className="w-full max-w-sm glass-panel rounded-2xl p-6 space-y-5 shadow-[0_15px_50px_rgba(0,0,0,0.4)] animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center select-none border-b border-[var(--border)]/30 pb-3">
              <h3 className="text-lg font-bold text-[var(--foreground)] font-serif">Account Profile</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer focus:outline-none">
                <X size={18} />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface-elevated)]/40 border border-[var(--border)]/50 select-none">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)] text-[#080808] flex items-center justify-center font-bold text-lg font-mono uppercase">
                {user.isGuest ? 'GU' : (user.user_metadata?.full_name || user.email || 'U').substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[var(--foreground)] truncate leading-none">{user.isGuest ? 'Guest User' : (user.user_metadata?.full_name || 'Google User')}</p>
                <p className="text-[10px] text-[var(--muted)] font-semibold mt-1.5 truncate leading-none">{user.isGuest ? 'Local Sandbox Session' : user.email}</p>
              </div>
            </div>

            <div className="text-xs text-[var(--muted)] font-medium leading-relaxed select-none">
              <p>
                {user.isGuest 
                  ? 'Your financial data is stored locally in this browser\'s localStorage. It is isolated from Supabase and will not sync across devices.'
                  : 'Your financial data is securely isolated in Supabase PostgreSQL database and mapped to this authenticated Google account.'}
              </p>
            </div>

            {/* Logout Action */}
            <div className="pt-2 border-t border-[var(--border)]/30">
              <button 
                onClick={() => {
                  onLogout();
                  setIsProfileModalOpen(false);
                }}
                className="w-full py-3 px-4 rounded-xl bg-[var(--danger-light)] hover:bg-[var(--danger-light)]/85 text-[var(--danger)] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-[var(--danger)]/20 focus:outline-none"
              >
                {user.isGuest ? 'Exit Guest Mode' : 'Sign Out Google Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LoginScreen({ onContinueAsGuest }: { onContinueAsGuest: () => void }) {
  const [loggingIn, setLoggingIn] = useState(false);
  const { showNotification } = useNotification();

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    setLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Sign in failed:", err);
      showNotification("Authentication failed. Please try again.", "error");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 relative overflow-hidden">
      <MoltenMetal speed={0.25} opacity={0.35} />
      <div className="w-full max-w-sm glass-panel rounded-3xl p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-slide-in relative z-10 text-center">
        <div className="space-y-2 select-none">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--copper)] text-[#080808] flex items-center justify-center font-bold font-serif text-2xl mx-auto shadow-md">
            F
          </div>
          <h1 className="text-3xl font-black text-[var(--foreground)] editorial-title mt-2">Welcome to FinDiary</h1>
          <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-[0.1em] font-mono">Financial Intelligence Tracker</p>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-[var(--muted)] font-medium leading-relaxed">
            Please sign in to access your isolated personal spending reports, savings goals, and AI financial assistant.
          </p>

          <div className="space-y-3">
            <button 
              onClick={handleGoogleSignIn}
              disabled={loggingIn}
              className="w-full py-4 px-6 rounded-2xl bg-[var(--accent)] text-[#080808] font-bold text-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg text-center flex items-center justify-center gap-3 focus:outline-none disabled:opacity-50 font-sans tracking-wide uppercase"
            >
              {loggingIn ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.5 1.7l2.4-2.4C17.3 1.7 14.9 1 12.24 1c-5.5 0-10 4.5-10 10s4.5 10 10 10c5.8 0 9.7-4.1 9.7-9.9 0-.6-.1-1.2-.2-1.7H12.24z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <button 
              onClick={onContinueAsGuest}
              disabled={loggingIn}
              className="w-full py-4 px-6 rounded-2xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 text-[var(--foreground)] font-bold text-xs active:scale-[0.98] transition-all cursor-pointer border border-[var(--border)] text-center flex items-center justify-center gap-3 focus:outline-none disabled:opacity-50 font-sans tracking-wide uppercase"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupabaseConfigRequiredScreen() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 relative overflow-hidden">
      <MoltenMetal speed={0.25} opacity={0.35} />
      <div className="w-full max-w-lg glass-panel rounded-3xl p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10">
        <div className="text-center space-y-2 select-none">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--danger)] to-[var(--accent)] text-[#080808] flex items-center justify-center font-bold font-serif text-2xl mx-auto shadow-md">
            !
          </div>
          <h1 className="text-2xl font-black text-[var(--foreground)] editorial-title mt-2">Supabase Setup Required</h1>
          <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-[0.1em] font-mono text-[var(--danger)]">Configuration Missing</p>
        </div>

        <div className="space-y-4 text-xs font-medium text-[var(--muted)] leading-relaxed">
          <p>
            This application requires a Supabase project configuration to enable Google Sign-In and database isolation.
          </p>
          <p className="font-bold text-[var(--foreground)] uppercase font-mono tracking-wider">Instructions:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Create a project in the <strong>Supabase Dashboard</strong> (free tier).</li>
            <li>Configure Google OAuth in your Supabase project under <strong>Authentication &gt; Providers &gt; Google</strong>.</li>
            <li>Execute the SQL schema rules in the Supabase **SQL Editor** to create the <code>user_data</code> table and set up Row Level Security.</li>
            <li>Create a file named <code>.env.local</code> in the root folder of this project and add the following variables:</li>
          </ol>

          <pre className="bg-[var(--surface-elevated)] p-4 rounded-xl text-left text-[11px] font-mono text-[var(--foreground)] border border-[var(--border)] overflow-x-auto select-all">
{`VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key`}
          </pre>
        </div>
      </div>
    </div>
  );
}

const GUEST_USER = {
  id: 'guest',
  email: 'guest@findiary.local',
  user_metadata: {
    full_name: 'Guest User'
  },
  isGuest: true
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('findiary_is_guest') === 'true';
  });

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (isGuest) {
      localStorage.removeItem('findiary_is_guest');
      setIsGuest(false);
    } else if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem('findiary_is_guest', 'true');
    setIsGuest(true);
  };

  return (
    <ThemeProvider>
      <NotificationProvider>
        {!supabase ? (
          <SupabaseConfigRequiredScreen />
        ) : authLoading ? (
          <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-[var(--muted)] font-mono uppercase tracking-wider">Loading FinDiary...</p>
            </div>
          </div>
        ) : (!user && !isGuest) ? (
          <LoginScreen onContinueAsGuest={handleContinueAsGuest} />
        ) : (
          <AppContent 
            key={isGuest ? 'guest' : user!.id} 
            user={isGuest ? GUEST_USER : user!} 
            onLogout={handleLogout} 
          />
        )}
      </NotificationProvider>
    </ThemeProvider>
  );
}
