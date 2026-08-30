import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit3,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Task, Category, Timing, Priority } from '../types';
import { SubtaskItem } from './SubtaskItem';

interface TaskCardProps {
  task: Task;
  categories: Category[];
  onToggleComplete: (id: string) => void;
  onToggleSubTask: (taskId: string, subtaskId: string) => void;
  onAddSubTask: (taskId: string, title: string) => void;
  onDeleteSubTask: (taskId: string, subtaskId: string) => void;
  onUpdateSubTask: (taskId: string, subtaskId: string, title: string) => void;
  onSetTiming: (taskId: string, timing: Timing) => void;
  onSetPriority: (taskId: string, priority: Priority) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  categories,
  onToggleComplete,
  onToggleSubTask,
  onAddSubTask,
  onDeleteSubTask,
  onUpdateSubTask,
  onSetTiming,
  onSetPriority,
  onEditTask,
  onDeleteTask,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const category = categories.find(c => c.id === task.categoryId);
  const subCategory = category?.subcategories.find(s => s.id === task.subCategoryId);

  const completedSubtasksCount = task.subtasks.filter(s => s.completed).length;
  const totalSubtasksCount = task.subtasks.length;
  const hasSubtasks = totalSubtasksCount > 0;

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      onAddSubTask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setShowSubtaskInput(true);
      setIsExpanded(true);
    }
  };

  const priorityStyles: Record<Priority, { label: string; dot: string; bg: string; text: string }> = {
    high: {
      label: 'High',
      dot: 'bg-rose-500',
      bg: 'bg-rose-50 border-rose-200/60',
      text: 'text-rose-700',
    },
    medium: {
      label: 'Medium',
      dot: 'bg-amber-500',
      bg: 'bg-amber-50 border-amber-200/60',
      text: 'text-amber-700',
    },
    low: {
      label: 'Low',
      dot: 'bg-slate-400',
      bg: 'bg-slate-50 border-slate-200/60',
      text: 'text-slate-600',
    },
  };

  const timingLabels: Record<Timing, { label: string; sub: string; badge: string }> = {
    now: { label: 'Now', sub: 'This week', badge: 'bg-blue-50 text-[#1868F2] border-blue-200/80' },
    next: { label: 'Next', sub: 'From next week', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80' },
    later: { label: 'Later', sub: 'Next month+', badge: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      id={`task-card-${task.id}`}
      className={`group relative bg-white rounded-xl border transition-all duration-200 shadow-xs hover:shadow-md ${
        task.completed
          ? 'border-neutral-200/60 bg-neutral-50/70 opacity-75'
          : 'border-neutral-200/90 hover:border-neutral-300'
      }`}
    >
      <div className="p-3.5 sm:p-4">
        {/* Top meta row: Category badge, Priority, Timing pill */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Category & Subcategory Pill */}
            {category && (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium text-[11px] border"
                style={{
                  backgroundColor: `${category.color || '#1868F2'}10`,
                  borderColor: `${category.color || '#1868F2'}30`,
                  color: category.color || '#1868F2',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: category.color || '#1868F2' }}
                />
                <span className="font-semibold">{category.name}</span>
                {subCategory && (
                  <>
                    <span className="text-neutral-300">•</span>
                    <span className="text-neutral-700 font-normal">{subCategory.name}</span>
                  </>
                )}
              </span>
            )}

            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                priorityStyles[task.priority].bg
              } ${priorityStyles[task.priority].text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityStyles[task.priority].dot}`} />
              <span>{priorityStyles[task.priority].label}</span>
            </span>
          </div>

          {/* Quick Timing Switcher dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors ${
                timingLabels[task.timing].badge
              }`}
              title="Move when to do this task"
            >
              <Clock className="w-3 h-3" />
              <span>{timingLabels[task.timing].label}</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>

            {showMoveMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMoveMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-30 w-36 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Move timing:
                  </div>
                  {(['now', 'next', 'later'] as Timing[]).map(t => (
                    <button
                      key={t}
                      onClick={() => {
                        onSetTiming(task.id, t);
                        setShowMoveMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 flex items-center justify-between hover:bg-neutral-100 transition-colors ${
                        task.timing === t ? 'text-[#1868F2] font-semibold bg-blue-50/50' : 'text-neutral-700'
                      }`}
                    >
                      <span>{timingLabels[t].label}</span>
                      <span className="text-[10px] text-neutral-400">{timingLabels[t].sub}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Task Main Content: Checkbox + Title + Description */}
        <div className="flex items-start gap-3">
          {/* Main Task Checkbox (Apple Circle Style) */}
          <button
            id={`toggle-task-${task.id}`}
            type="button"
            onClick={() => onToggleComplete(task.id)}
            className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
              task.completed
                ? 'bg-[#1868F2] border-[#1868F2] text-white shadow-xs'
                : 'border-neutral-300 hover:border-[#1868F2] hover:bg-blue-50/30 bg-white'
            }`}
            aria-label={task.completed ? 'Mark task incomplete' : 'Mark task completed'}
          >
            {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <h3
              onClick={() => onEditTask(task)}
              className={`text-sm font-semibold leading-snug cursor-pointer transition-colors ${
                task.completed
                  ? 'line-through text-neutral-400 font-normal'
                  : 'text-neutral-900 hover:text-[#1868F2]'
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          {/* Action Menu button */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEditTask(task)}
              className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded"
              title="Edit Task"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteTask(task.id)}
              className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subtasks Section & Progress */}
        {(hasSubtasks || showSubtaskInput) && (
          <div className="mt-3 pt-2.5 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                <span>
                  Subtasks ({completedSubtasksCount}/{totalSubtasksCount})
                </span>
              </button>

              {/* Progress mini bar */}
              {totalSubtasksCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round((completedSubtasksCount / totalSubtasksCount) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {Math.round((completedSubtasksCount / totalSubtasksCount) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Expanded subtask list */}
            <AnimatePresence initial={false}>
              {(isExpanded || showSubtaskInput) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-0.5 overflow-hidden"
                >
                  {task.subtasks.map(subtask => (
                    <SubtaskItem
                      key={subtask.id}
                      subtask={subtask}
                      onToggle={() => onToggleSubTask(task.id, subtask.id)}
                      onDelete={() => onDeleteSubTask(task.id, subtask.id)}
                      onUpdateTitle={title => onUpdateSubTask(task.id, subtask.id, title)}
                    />
                  ))}

                  {/* Inline quick add subtask input */}
                  {showSubtaskInput ? (
                    <form onSubmit={handleAddSubtaskSubmit} className="flex items-center gap-1.5 mt-1 pt-1">
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={e => setNewSubtaskTitle(e.target.value)}
                        placeholder="Add subtask and press Enter..."
                        autoFocus
                        className="flex-1 text-xs px-2 py-1 bg-neutral-50 border border-blue-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        className="text-xs px-2 py-1 bg-[#1868F2] text-white rounded hover:bg-blue-700"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSubtaskInput(false);
                          setNewSubtaskTitle('');
                        }}
                        className="text-xs px-1.5 py-1 text-neutral-400 hover:text-neutral-600"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowSubtaskInput(true);
                        setIsExpanded(true);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-[#1868F2] pt-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add subtask</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* If no subtasks yet, show subtle inline "+ Subtask" on hover */}
        {!hasSubtasks && !showSubtaskInput && (
          <div className="mt-2 pt-1 border-t border-neutral-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => {
                setShowSubtaskInput(true);
                setIsExpanded(true);
              }}
              className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-[#1868F2] transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add subtasks</span>
            </button>
            <span className="text-[10px] text-neutral-300">
              {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
