import React, { useState, useEffect } from 'react';
import { User } from './types';
import Login from './components/Login';
import Home from './components/Home';
import AssignmentHelper from './components/AssignmentHelper';
import ResearchAssistant from './components/ResearchAssistant';
import StudyExplainer from './components/StudyExplainer';
import Planner from './components/Planner';
import Profile from './components/Profile';
import UpgradeScreen from './components/UpgradeScreen';
import { Home as HomeIcon, BookOpen, Search, Calendar, User as UserIcon, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PremiumFeatureGate } from './components/UsageGuard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Load user from local storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('studymate_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('studymate_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('studymate_user');
    setActiveTab('home');
    setShowUpgrade(false);
  };

  const handleUpgrade = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('studymate_user', JSON.stringify(updatedUser));
    setShowUpgrade(false);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (showUpgrade) {
    return <UpgradeScreen user={user} onUpgrade={handleUpgrade} onBack={() => setShowUpgrade(false)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Home user={user} onNavigate={setActiveTab} />;
      case 'assignments': return <AssignmentHelper user={user} onUpgrade={() => setShowUpgrade(true)} />;
      case 'research': return <ResearchAssistant user={user} onUpgrade={() => setShowUpgrade(true)} />;
      case 'explainer': return <StudyExplainer user={user} onUpgrade={() => setShowUpgrade(true)} />;
      case 'planner': return (
        <PremiumFeatureGate user={user} onUpgrade={() => setShowUpgrade(true)}>
          <Planner user={user} />
        </PremiumFeatureGate>
      );
      case 'profile': return <Profile user={user} onLogout={handleLogout} onUpgrade={() => setShowUpgrade(true)} />;
      default: return <Home user={user} onNavigate={setActiveTab} />;
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'assignments', label: 'Assignments', icon: BookOpen },
    { id: 'research', label: 'Research', icon: Search },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto relative overflow-hidden shadow-2xl">
      {user.subscription === 'free' && (
        <div className="bg-accent text-primary text-[10px] font-bold py-1 px-4 flex items-center justify-between">
          <span>Daily Limit: {user.request_count}/5 requests used</span>
          <button onClick={() => setShowUpgrade(true)} className="flex items-center gap-1 underline">
            <Crown size={10} />
            Upgrade
          </button>
        </div>
      )}
      
      <main className="min-h-screen overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100 flex items-center justify-around py-3 px-2 z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center space-y-1 transition-colors ${
              activeTab === item.id ? 'text-primary' : 'text-slate-400'
            }`}
          >
            <item.icon size={22} className={activeTab === item.id ? 'fill-primary/10' : ''} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            {activeTab === item.id && (
              <motion.div
                layoutId="nav-indicator"
                className="w-1 h-1 bg-primary rounded-full"
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
