import React, { useState, useEffect } from 'react';
import { Task, User } from '../types';
import { Plus, Calendar, CheckCircle2, Circle, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlannerProps {
  user: User;
}

export default function Planner({ user }: PlannerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    fetchTasks();
  }, [user.id]);

  const fetchTasks = () => {
    fetch(`/api/tasks/${user.id}`)
      .then(res => res.json())
      .then(setTasks);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject || !deadline) return;

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, name, subject, deadline, priority })
    });

    if (res.ok) {
      setName('');
      setSubject('');
      setDeadline('');
      setShowAdd(false);
      fetchTasks();
    }
  };

  const toggleComplete = async (task: Task) => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed })
    });
    if (res.ok) fetchTasks();
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Study Planner</h1>
          <p className="text-slate-500">Manage your academic schedule.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Plus size={24} />
        </button>
      </header>

      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAddTask}
            className="card space-y-4 overflow-hidden"
          >
            <h3 className="font-bold text-primary">Add New Task</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Task Name"
                className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Subject"
                className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className="p-3 rounded-xl border border-slate-200 text-sm"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
                <select
                  className="p-3 rounded-xl border border-slate-200 text-sm bg-white"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <button type="submit" className="btn-primary w-full text-sm py-2">Save Task</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <motion.div
              layout
              key={task.id}
              className={`card flex items-center gap-4 transition-opacity ${task.completed ? 'opacity-60' : ''}`}
            >
              <button onClick={() => toggleComplete(task)} className="text-primary">
                {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} className="text-slate-300" />}
              </button>
              <div className="flex-1">
                <h3 className={`font-semibold text-sm ${task.completed ? 'line-through' : ''}`}>{task.name}</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{task.subject} • Due {new Date(task.deadline).toLocaleDateString()}</p>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                task.priority === 'high' ? 'bg-red-500' : 
                task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
              }`} />
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Calendar size={32} />
            </div>
            <p className="text-slate-400 italic text-sm">No tasks added yet. Start planning!</p>
          </div>
        )}
      </div>
    </div>
  );
}
