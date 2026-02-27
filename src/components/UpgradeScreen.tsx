import React, { useState } from 'react';
import { User } from '../types';
import { Check, Crown, Zap, Shield, Infinity, Star, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface UpgradeScreenProps {
  user: User;
  onUpgrade: (updatedUser: User) => void;
  onBack: () => void;
}

export default function UpgradeScreen({ user, onUpgrade, onBack }: UpgradeScreenProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plan: billingCycle })
      });
      const updatedUser = await res.json();
      onUpgrade(updatedUser);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Infinity, title: 'Unlimited AI Requests', desc: 'No daily limits on any AI tool.' },
    { icon: Zap, title: 'Advanced AI Models', desc: 'Access to more powerful reasoning.' },
    { icon: Shield, title: 'No Advertisements', desc: 'Distraction-free study experience.' },
    { icon: Star, title: 'Priority Support', desc: 'Get help faster from our team.' },
  ];

  return (
    <div className="min-h-screen bg-white p-6 space-y-8 pb-12">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-primary">Upgrade to Premium</h1>
      </header>

      <div className="text-center space-y-2">
        <div className="w-20 h-20 bg-accent/20 rounded-3xl flex items-center justify-center mx-auto text-accent mb-4">
          <Crown size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Unlock Your Full Potential</h2>
        <p className="text-slate-500 text-sm">Join thousands of students excelling with StudyMate AI Premium.</p>
      </div>

      <div className="space-y-4">
        {benefits.map((benefit, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <benefit.icon size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">{benefit.title}</h3>
              <p className="text-xs text-slate-500">{benefit.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 p-1 rounded-2xl flex">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
            billingCycle === 'monthly' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all relative ${
            billingCycle === 'yearly' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'
          }`}
        >
          Yearly
          <span className="absolute -top-2 -right-2 bg-accent text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
            -20%
          </span>
        </button>
      </div>

      <div className="text-center space-y-1">
        <div className="text-4xl font-bold text-primary">
          {billingCycle === 'yearly' ? '$79.99' : '$9.99'}
          <span className="text-sm text-slate-400 font-normal">/{billingCycle === 'yearly' ? 'year' : 'mo'}</span>
        </div>
        {billingCycle === 'yearly' && (
          <p className="text-xs text-secondary font-medium">Equivalent to $6.67/month</p>
        )}
      </div>

      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="btn-primary w-full py-4 text-lg shadow-xl shadow-primary/20"
      >
        {loading ? 'Processing...' : 'Start Premium Plan'}
      </button>

      <p className="text-center text-[10px] text-slate-400 px-8">
        By upgrading, you agree to our Terms of Service and Privacy Policy. Cancel anytime.
      </p>
    </div>
  );
}
