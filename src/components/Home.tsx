import React, { useState, useEffect } from 'react';
import { User, Task } from '../types';
import { BookOpen, Search, GraduationCap, Calendar, User as UserIcon, Plus, CheckCircle2, Circle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  user: User;
  onNavigate: (tab: string) => void;
}

export default function Home({ user, onNavigate }: HomeProps) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch(`/api/tasks/${user.id}`)
      .then(res => res.json())
      .then(data => setTasks(data.filter((t: Task) => !t.completed).slice(0, 3)));
  }, [user.id]);

  const actions = [
    { id: 'assignments', name: 'Assignment Help', icon: BookOpen, color: 'bg-primary' },
    { id: 'research', name: 'Research Assistant', icon: Search, color: 'bg-secondary' },
    { id: 'explainer', name: 'Explain Topic', icon: GraduationCap, color: 'bg-accent', textColor: 'text-primary' },
    { id: 'planner', name: 'Study Planner', icon: Calendar, color: 'bg-slate-800' },
  ];

  return (
    <div className="p-6 space-y-8 pb-24">
      <header>
        <h1 className="text-2xl font-bold text-primary">Hi, {user.name}!</h1>
        <p className="text-slate-500">Ready to study today?</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <motion.button
            key={action.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate(action.id)}
            className={`${action.color} ${action.textColor || 'text-white'} p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center space-y-3 text-center h-40`}
          >
            <action.icon size={32} />
            <span className="font-semibold text-sm leading-tight">{action.name}</span>
          </motion.button>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Upcoming Deadlines
          </h2>
          <button onClick={() => onNavigate('planner')} className="text-sm text-secondary font-medium">View All</button>
        </div>

        <div className="space-y-3">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id} className="card flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{task.name}</h3>
                  <p className="text-xs text-slate-500">{task.subject} • {new Date(task.deadline).toLocaleDateString()}</p>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                  task.priority === 'high' ? 'bg-red-100 text-red-600' : 
                  task.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {task.priority}
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-8 text-slate-400 italic">
              No upcoming deadlines. Great job!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
