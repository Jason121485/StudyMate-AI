import React, { useState } from 'react';
import { GradeLevel, User } from '../types';
import { getAssignmentHelp } from '../services/geminiService';
import { Loader2, Send } from 'lucide-react';
import { motion } from 'motion/react';
import UsageGuard, { AdPlaceholder } from './UsageGuard';

interface AssignmentHelperProps {
  user: User;
  onUpgrade: () => void;
}

export default function AssignmentHelper({ user, onUpgrade }: AssignmentHelperProps) {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('college');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ explanation: string; steps: string[]; example: string } | null>(null);

  const handleGenerate = async (checkUsage: () => Promise<boolean>) => {
    if (!subject || !topic || !instructions) return;
    
    const canRequest = await checkUsage();
    if (!canRequest) return;

    setLoading(true);
    try {
      const data = await getAssignmentHelp(subject, topic, instructions, gradeLevel);
      setResult(data);
      // Save to history
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'assignment',
          query: `${subject}: ${topic}`,
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
            <h1 className="text-2xl font-bold text-primary">Assignment Helper</h1>
            <p className="text-slate-500">Get step-by-step help with your homework.</p>
          </header>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Subject</label>
              <input
                type="text"
                placeholder="e.g. Mathematics, History"
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Topic</label>
              <input
                type="text"
                placeholder="e.g. Quadratic Equations"
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Instructions</label>
              <textarea
                placeholder="Paste the assignment instructions here..."
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 h-32"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Grade Level</label>
              <select
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
              >
                <option value="elementary">Elementary</option>
                <option value="high school">High School</option>
                <option value="college">College</option>
                <option value="graduate">Graduate</option>
              </select>
            </div>

            <button
              onClick={() => handleGenerate(checkUsage)}
              disabled={loading || !subject || !topic || !instructions}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              Generate Help
            </button>
          </div>

          {user.subscription === 'free' && <AdPlaceholder />}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 mt-8"
            >
              <section className="card space-y-2">
                <h3 className="font-bold text-primary border-b pb-2">Explanation</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{result.explanation}</p>
              </section>

              <section className="card space-y-3">
                <h3 className="font-bold text-primary border-b pb-2">Step-by-Step Solution</h3>
                <ol className="space-y-3">
                  {result.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </span>
                      <span className="text-slate-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="card space-y-2">
                <h3 className="font-bold text-primary border-b pb-2">Example Answer</h3>
                <div className="bg-slate-50 p-4 rounded-xl text-sm font-mono text-slate-600 whitespace-pre-wrap">
                  {result.example}
                </div>
              </section>
            </motion.div>
          )}
        </div>
      )}
    </UsageGuard>
  );
}
