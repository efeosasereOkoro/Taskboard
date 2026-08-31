import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { Task, Category, Timing, Priority } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    description?: string;
    timing: Timing;
    priority: Priority;
    categoryId: string;
    subCategoryId?: string;
    subtasks?: string[];
  }) => void;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
  editingTask?: Task | null;
  categories: Category[];
  initialTiming?: Timing;
  initialCategoryId?: string | null;
  initialSubCategoryId?: string | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editingTask,
  categories,
  initialTiming = 'now',
  initialCategoryId,
  initialSubCategoryId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timing, setTiming] = useState<Timing>(initialTiming);
  const [priority, setPriority] = useState<Priority>('medium');
  const [categoryId, setCategoryId] = useState<string>('');
  const [subCategoryId, setSubCategoryId] = useState<string>('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setTiming(editingTask.timing);
      setPriority(editingTask.priority);
      setCategoryId(editingTask.categoryId);
      setSubCategoryId(editingTask.subCategoryId || '');
      setSubtasks(editingTask.subtasks.map(s => s.title));
    } else {
      setTitle('');
      setDescription('');
      setTiming(initialTiming);
      setPriority('medium');
      const defaultCat = initialCategoryId || (categories.length > 0 ? categories[0].id : '');
      setCategoryId(defaultCat);
      setSubCategoryId(initialSubCategoryId || '');
      setSubtasks([]);
    }
    setNewSubtaskInput('');
  }, [editingTask, isOpen, initialTiming, initialCategoryId, initialSubCategoryId, categories]);

  if (!isOpen) return null;

  const currentCategory = categories.find(c => c.id === categoryId);

  const handleAddSubtask = () => {
    if (newSubtaskInput.trim()) {
      setSubtasks(prev => [...prev, newSubtaskInput.trim()]);
      setNewSubtaskInput('');
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;

    if (editingTask && onUpdate) {
      onUpdate(editingTask.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        timing,
        priority,
        categoryId,
        subCategoryId: subCategoryId || undefined,
      });
    } else {
      onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        timing,
        priority,
        categoryId,
        subCategoryId: subCategoryId || undefined,
        subtasks,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Keep it simple, focused, and organized.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Finalize consulting slide deck..."
              autoFocus
              className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 hover:bg-white focus:bg-white rounded-xl border border-neutral-200 focus:border-[#1868F2] focus:ring-2 focus:ring-[#1868F2]/20 transition-all font-medium text-neutral-900 placeholder:text-neutral-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add key notes, context, or links..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-neutral-50 hover:bg-white focus:bg-white rounded-xl border border-neutral-200 focus:border-[#1868F2] focus:ring-2 focus:ring-[#1868F2]/20 transition-all text-neutral-800 placeholder:text-neutral-400 resize-none"
            />
          </div>

          {/* Timing Section (Now, Next, Later) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              When to do it
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTiming('today')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  timing === 'today'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-700 ring-2 ring-emerald-500/20'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                }`}
              >
                <div className="text-xs font-bold">Today</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">Doing today</div>
              </button>

              <button
                type="button"
                onClick={() => setTiming('now')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  timing === 'now'
                    ? 'border-[#1868F2] bg-blue-50/70 text-[#1868F2] ring-2 ring-[#1868F2]/20'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                }`}
              >
                <div className="text-xs font-bold">Now</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">This week</div>
              </button>

              <button
                type="button"
                onClick={() => setTiming('next')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  timing === 'next'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                }`}
              >
                <div className="text-xs font-bold">Next</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">From next week</div>
              </button>

              <button
                type="button"
                onClick={() => setTiming('later')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  timing === 'later'
                    ? 'border-neutral-800 bg-neutral-100 text-neutral-900 ring-2 ring-neutral-700/20'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                }`}
              >
                <div className="text-xs font-bold">Later</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">Next month+</div>
              </button>
            </div>
          </div>

          {/* Category & Subcategory Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={e => {
                  setCategoryId(e.target.value);
                  setSubCategoryId('');
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-neutral-50 hover:bg-white focus:bg-white rounded-xl border border-neutral-200 focus:border-[#1868F2] focus:ring-2 focus:ring-[#1868F2]/20 transition-all font-medium text-neutral-900"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Subcategory (Optional)
              </label>
              <select
                value={subCategoryId}
                onChange={e => setSubCategoryId(e.target.value)}
                disabled={!currentCategory || currentCategory.subcategories.length === 0}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-neutral-50 hover:bg-white focus:bg-white rounded-xl border border-neutral-200 focus:border-[#1868F2] focus:ring-2 focus:ring-[#1868F2]/20 transition-all font-medium text-neutral-900 disabled:opacity-50 disabled:bg-neutral-100"
              >
                <option value="">None</option>
                {currentCategory?.subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <div className="flex items-center gap-2">
              {(['high', 'medium', 'low'] as Priority[]).map(p => {
                const isSelected = priority === p;
                const colors = {
                  high: isSelected ? 'bg-rose-50 border-rose-400 text-rose-700' : 'text-neutral-700',
                  medium: isSelected ? 'bg-amber-50 border-amber-400 text-amber-700' : 'text-neutral-700',
                  low: isSelected ? 'bg-slate-100 border-slate-400 text-slate-800' : 'text-neutral-700',
                };
                const dotColors = {
                  high: 'bg-rose-500',
                  medium: 'bg-amber-500',
                  low: 'bg-slate-400',
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected ? `${colors[p]} border-2` : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${dotColors[p]}`} />
                    <span className="capitalize">{p}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtasks Builder */}
          {!editingTask && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Subtasks (Optional)
              </label>
              <div className="space-y-1.5 mb-2">
                {subtasks.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-neutral-50 px-2.5 py-1.5 rounded-lg text-xs">
                    <span className="text-neutral-800 font-medium truncate">• {st}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="text-neutral-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newSubtaskInput}
                  onChange={e => setNewSubtaskInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add a subtask..."
                  className="flex-1 px-3 py-1.5 text-xs bg-neutral-50 rounded-lg border border-neutral-200 focus:bg-white focus:outline-none focus:border-[#1868F2]"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-2.5 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#1868F2] hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm shadow-blue-500/20 transition-all"
            >
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
