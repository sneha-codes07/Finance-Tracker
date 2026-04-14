import React from 'react';
import { motion } from 'motion/react';
import { Wallet } from 'lucide-react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1, delay: 2 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[100] bg-[var(--bg)] flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 100 }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-3xl bg-[var(--accent)] flex items-center justify-center text-white shadow-2xl shadow-[var(--accent)]/40">
          <Wallet size={48} />
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-4 border-4 border-dashed border-[var(--accent)] rounded-full opacity-20"
        />
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <h1 className="text-4xl font-bold tracking-tighter text-[var(--text)]">FinDiary</h1>
        <p className="text-sm opacity-60 italic-highlight mt-2">Your Financial Story, Simplified.</p>
      </motion.div>

      <motion.div
        className="absolute bottom-12 w-48 h-1 bg-black/10 rounded-full overflow-hidden"
      >
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full bg-[var(--accent)]"
        />
      </motion.div>
    </motion.div>
  );
}
