import React from 'react';
import { motion } from 'motion/react';
import { Wallet } from 'lucide-react';
import { DepthText } from './DepthText';
import { MoltenMetal } from './MoltenMetal';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.8, delay: 3.5 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[100] bg-[#080808] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Immersive molten background behind splash */}
      <MoltenMetal speed={0.4} opacity={0.8} mouseStrength={0.2} grainIntensity={0.03} />

      <div className="flex flex-col items-center justify-center space-y-12">
        
        {/* Animated Brand Core Emblem */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 80 }}
          className="relative"
        >
          <div className="w-20 h-20 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-[#080808] shadow-[0_0_50px_rgba(214,168,95,0.25)]">
            <Wallet size={36} />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border-2 border-dashed border-[var(--accent)] rounded-full opacity-30"
          />
        </motion.div>
        
        {/* Premium DepthText brand reveal */}
        <motion.div
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center space-y-3 px-4"
        >
          <DepthText text="FINANCE V2" layers={20} depth={1.8} tilt={5} orbitSpeed={0.15} />
          <p className="text-[10px] select-none font-sans font-bold uppercase tracking-[0.25em] text-[var(--muted)] pt-2">
            Personal Spending Intelligence
          </p>
        </motion.div>

        {/* Brand progress loader */}
        <motion.div
          className="w-48 h-0.5 bg-white/5 rounded-full overflow-hidden relative"
        >
          <motion.div
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent"
          />
        </motion.div>

      </div>
    </motion.div>
  );
}
