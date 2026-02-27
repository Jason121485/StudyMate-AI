import React, { useState } from 'react';
import { User } from '../types';
import { getResearchAssistant } from '../services/geminiService';
import { Loader2, Search, BookOpen, ListTree, Microscope } from 'lucide-react';
import { motion } from 'motion/react';
import UsageGuard, { AdPlaceholder } from './UsageGuard';

interface ResearchAssistantProps {
  user: User;
  onUpgrade: () => void;
}

export default function ResearchAssistant({ user, onUpgrade }: ResearchAssistantProps) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    titles: string[];
    questions: string[];
    outline: { chapter: string; description: string }[];
    methodology: string;
  } | null>(null);

  const handleResearch = async (checkUsage: () => Promise<boolean>) => {
    if (!topic) return;
    
    const canRequest = await checkUsage();
    if (!canRequest) return;

    setLoading(true);
    try {
      const data = await getResearchAssistant(topic);
      setResult(data);
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'research',
          query: topic,
          response: JSON.stringify(data)
        })
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UsageGuard user={user} onUpgrade={onUpgrade}>
      {(checkUsage) => (
        <div className="p-6 space-y-6 pb-24">
          <header>
            <h1 className="text-2xl font-bold text-primary">Research Assistant</h1>
            <p className="text-slate-500">Structure your research papers and projects.</p>
          </header>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter your research topic..."
                className="w-full p-4 pr-12 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-sm"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <button
                onClick={() => handleResearch(checkUsage)}
                disabled={loading || !topic}
                className="absolute right-2 top-2 bottom-2 bg-secondary text-white p-2 rounded-xl disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
              </button>
            </div>
          </div>

          {user.subscription === 'free' && <AdPlaceholder />}

          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <section className="card space-y-3">
                <h3 className="font-bold text-primary flex items-center gap-2">
                  <BookOpen size={18} />
                  Suggested Titles
                </h3>
                <ul className="space-y-2">
                  {result.titles.map((title, i) => (
                    <li key={i} className="text-sm p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 italic">
                      "{title}"
                    </li>
                  ))}
                </ul>
              </section>

              <section className="card space-y-3">
                <h3 className="font-bold text-primary flex items-center gap-2">
                  <Search size={18} />
                  Research Questions
                </h3>
                <ul className="space-y-2">
                  {result.questions.map((q, i) => (
                    <li key={i} className="text-sm flex gap-2 text-slate-700">
                      <span className="text-secondary font-bold">•</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="card space-y-4">
                <h3 className="font-bold text-primary flex items-center gap-2">
                  <ListTree size={18} />
                  Proposed Outline
                </h3>
                <div className="space-y-4">
                  {result.outline.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800">{item.chapter}</h4>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card space-y-3">
                <h3 className="font-bold text-primary flex items-center gap-2">
                  <Microscope size={18} />
                  Methodology Suggestions
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  {result.methodology}
                </p>
              </section>
            </motion.div>
          )}
        </div>
      )}
    </UsageGuard>
  );
}
