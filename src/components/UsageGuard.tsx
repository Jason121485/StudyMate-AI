import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { AlertCircle, Crown, Lock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UsageGuardProps {
  user: User;
  onUpgrade: () => void;
  children: (checkUsage: () => Promise<boolean>) => React.ReactNode;
}

export default function UsageGuard({ user, onUpgrade, children }: UsageGuardProps) {
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usage, setUsage] = useState<{ count: number; limit: number } | null>(null);

  const checkUsage = async (): Promise<boolean> => {
    if (user.subscription === 'premium') return true;

    try {
      const res = await fetch('/api/usage/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      setUsage({ count: data.count, limit: data.limit });

      if (!data.canRequest) {
        setShowLimitModal(true);
        return false;
      }

      // Increment usage
      await fetch('/api/usage/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  return (
    <>
      {children(checkUsage)}

      <AnimatePresence>
        {showLimitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm space-y-6 relative"
            >
              <button 
                onClick={() => setShowLimitModal(false)}
                className="absolute right-4 top-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-800">Daily Limit Reached</h3>
                <p className="text-sm text-slate-500">
                  You've used all {usage?.limit} of your free AI requests for today. 
                  Upgrade to Premium for unlimited access!
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowLimitModal(false);
                    onUpgrade();
                  }}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Crown size={18} className="text-accent" />
                  Upgrade to Premium
                </button>
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="w-full py-3 text-sm font-bold text-slate-400"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export function AdPlaceholder() {
  return (
    <div className="w-full p-4 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-2 my-4">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sponsored</span>
      <div className="w-full h-24 bg-slate-200 rounded-lg flex items-center justify-center">
        <p className="text-xs text-slate-400 italic">Advertisement Placeholder</p>
      </div>
    </div>
  );
}

export function PremiumFeatureGate({ user, onUpgrade, children }: { user: User; onUpgrade: () => void; children: React.ReactNode }) {
  if (user.subscription === 'premium') return <>{children}</>;

  return (
    <div className="relative group">
      <div className="blur-sm pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-2xl p-6 text-center space-y-4">
        <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
          <Lock size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-slate-800">Premium Feature</h4>
          <p className="text-[10px] text-slate-500">Upgrade to unlock advanced study tools.</p>
        </div>
        <button
          onClick={onUpgrade}
          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-md active:scale-95 transition-transform"
        >
          Unlock Now
        </button>
      </div>
    </div>
  );
}
