import React, { useState } from 'react';
import { Difficulty, User } from '../types';
import { getStudyExplanation } from '../services/geminiService';
import { Loader2, GraduationCap, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import UsageGuard, { AdPlaceholder } from './UsageGuard';

interface StudyExplainerProps {
  user: User;
  onUpgrade: () => void;
}

export default function StudyExplainer({ user, onUpgrade }: StudyExplainerProps) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('detailed');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleExplain = async (checkUsage: () => Promise<boolean>) => {
    if (!topic) return;
    
    const canRequest = await checkUsage();
    if (!canRequest) return;

    setLoading(true);
    try {
      const text = await getStudyExplanation(topic, difficulty);
      setExplanation(text || null);
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'explainer',
          query: `${topic} (${difficulty})`,
          response: text
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
            <h1 className="text-2xl font-bold text-primary">Study Explainer</h1>
            <p className="text-slate-500">Complex topics made easy to understand.</p>
          </header>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">What do you want to learn?</label>
              <input
                type="text"
                placeholder="e.g. Photosynthesis, Black Holes, French Revolution"
                className="w-full p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/20"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Explanation Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(['simple', 'detailed', 'advanced'] as Difficulty[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                      difficulty === level 
                        ? 'bg-accent text-primary border-2 border-accent' 
                        : 'bg-slate-50 text-slate-500 border-2 border-transparent'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleExplain(checkUsage)}
              disabled={loading || !topic}
              className="btn-accent w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              Explain Topic
            </button>
          </div>

          {user.subscription === 'free' && <AdPlaceholder />}

          {explanation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card prose prose-sm max-w-none"
            >
              <div className="flex items-center gap-2 mb-4 text-primary font-bold border-b pb-2">
                <GraduationCap size={20} />
                AI Explanation
              </div>
              <div className="markdown-body text-slate-700 leading-relaxed">
                <Markdown>{explanation}</Markdown>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </UsageGuard>
  );
}
