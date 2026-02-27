import React, { useState, useEffect } from 'react';
import { User, HistoryItem } from '../types';
import { User as UserIcon, Settings, LogOut, Crown, History, ChevronRight, BookOpen, Search, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileProps {
  user: User;
  onLogout: () => void;
  onUpgrade: () => void;
}

export default function Profile({ user, onLogout, onUpgrade }: ProfileProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetch(`/api/history/${user.id}`)
      .then(res => res.json())
      .then(setHistory);
  }, [user.id]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'assignment': return <BookOpen size={16} />;
      case 'research': return <Search size={16} />;
      case 'explainer': return <GraduationCap size={16} />;
      default: return <History size={16} />;
    }
  };

  return (
    <div className="p-6 space-y-8 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Profile</h1>
        <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <LogOut size={24} />
        </button>
      </header>

      <div className="flex flex-col items-center space-y-4">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary border-4 border-white shadow-sm">
          <UserIcon size={48} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <div className={`px-4 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
          user.subscription === 'premium' ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'
        }`}>
          {user.subscription} Plan
        </div>
      </div>

      {user.subscription === 'free' ? (
        <section className="card space-y-4 bg-gradient-to-br from-primary to-blue-800 text-white border-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Crown size={24} className="text-accent" />
            </div>
            <div>
              <h3 className="font-bold">Upgrade to Premium</h3>
              <p className="text-xs text-white/70">Unlimited AI usage & advanced tools.</p>
            </div>
          </div>
          <button 
            onClick={onUpgrade}
            className="w-full bg-accent text-primary font-bold py-2 rounded-xl text-sm shadow-lg active:scale-95 transition-transform"
          >
            Upgrade Now
          </button>
        </section>
      ) : (
        <section className="card space-y-4 bg-gradient-to-br from-accent to-yellow-600 text-primary border-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/40 rounded-lg">
              <Crown size={24} />
            </div>
            <div>
              <h3 className="font-bold">Premium Member</h3>
              <p className="text-xs text-primary/70">Enjoying unlimited AI access.</p>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <History size={20} className="text-primary" />
          Recent Activity
        </h3>
        <div className="space-y-2">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="card flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">{item.query}</h4>
                    <p className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400 italic text-sm">
              No activity yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
