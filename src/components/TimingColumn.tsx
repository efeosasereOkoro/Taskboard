import React, { useState } from 'react';
import { Clock, GripVertical } from 'lucide-react';
import { Task, Category, Timing, Priority } from '../types';
import { TaskCard } from './TaskCard';

interface TimingColumnProps {
  timing: Timing;
  title: string;
  subtitle: string;
  badgeColor: string;
  tasks: Task[];
  categories: Category[];
  selectedCategoryId: string | null;
  selectedSubCategoryId: string | null;
  onToggleComplete: (id: string) => void;
  onToggleSubTask: (taskId: string, subtaskId: string) => void;
  onAddSubTask: (taskId: string, title: string) => void;
  onDeleteSubTask: (taskId: string, subtaskId: string) => void;
  onUpdateSubTask: (taskId: string, subtaskId: string, title: string) => void;
  onSetTiming: (taskId: string, timing: Timing) => void;
  onSetPriority: (taskId: string, priority: Priority) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onQuickAddTask: (timing: Timing, title: string, categoryId?: string, subCategoryId?: string) => void;
  onReorderTask: (activeId: string, targetId: string | null, targetTiming?: Timing, position?: 'before' | 'after') => void;
  // Optional extras passed by App; not all columns use them.
  onMoveToTop?: (taskId: string) => void;
  onMoveToBottom?: (taskId: string) => void;
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
  onHideColumn?: () => void;
}

export const TimingColumn: React.FC<TimingColumnProps> = ({
  timing,
  title,
  subtitle,
  badgeColor,
  tasks,
  categories,
  selectedCategoryId,
  selectedSubCategoryId,
  onToggleComplete,
  onToggleSubTask,
  onAddSubTask,
  onDeleteSubTask,
  onUpdateSubTask,
  onSetTiming,
  onSetPriority,
  onEditTask,
  onDeleteTask,
  onQuickAddTask,
  onReorderTask,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [, setIsInputActive] = useState(false);

  // Drag-and-drop state (native HTML5 DnD).
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('before');
  const [isColumnDragOver, setIsColumnDragOver] = useState(false);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTitle.trim()) {
      const catId = selectedCategoryId || (categories.length > 0 ? categories[0].id : '');
      onQuickAddTask(timing, quickTitle.trim(), catId, selectedSubCategoryId || undefined);
      setQuickTitle('');
    }
  };

  const clearDragState = () => {
    setDraggingId(null);
    setDragOverId(null);
    setIsColumnDragOver(false);
  };

  const handleCardDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(taskId);
  };

  const handleCardDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const position = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    setDragOverId(taskId);
    setDropPosition(position);
  };

  const handleCardDrop = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const activeId = e.dataTransfer.getData('text/plain');
    if (activeId && activeId !== taskId) {
      onReorderTask(activeId, taskId, timing, dropPosition);
    }
    clearDragState();
  };

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsColumnDragOver(true);
  };

  const handleColumnDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const activeId = e.dataTransfer.getData('text/plain');
    // Dropped in the column but not on a specific card: append to the end.
    if (activeId) {
      onReorderTask(activeId, null, timing, 'after');
    }
    clearDragState();
  };

  return (
    <div
      id={`timing-column-${timing}`}
      className={`flex flex-col rounded-2xl p-3 sm:p-4 border h-full min-h-[500px] transition-colors ${
        isColumnDragOver
          ? 'bg-blue-50/60 border-[#1868F2]/40'
          : 'bg-neutral-100/60 border-neutral-200/70'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-start justify-between mb-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base tracking-tight text-neutral-900 flex items-center gap-2">
              <span>{title}</span>
            </h2>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}
            >
              {tasks.length}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleQuickSubmit} className="mb-3">
        <div className="relative group">
          <input
            id={`quick-input-${timing}`}
            type="text"
            value={quickTitle}
            onChange={e => setQuickTitle(e.target.value)}
            onFocus={() => setIsInputActive(true)}
            onBlur={() => !quickTitle && setIsInputActive(false)}
            placeholder={`+ Add task to ${title}...`}
            className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm bg-white hover:bg-neutral-50 focus:bg-white text-neutral-900 rounded-xl border border-neutral-200 focus:border-[#1868F2] focus:ring-2 focus:ring-[#1868F2]/20 transition-all placeholder:text-neutral-400 shadow-2xs"
          />
          {quickTitle && (
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-[#1868F2] text-white flex items-center justify-center hover:bg-blue-700 transition-colors text-xs font-bold"
            >
              ↵
            </button>
          )}
        </div>
      </form>

      {/* Task List (drop zone for moving tasks into this column) */}
      <div
        className="flex-1 space-y-2.5 overflow-y-auto pr-0.5"
        onDragOver={handleColumnDragOver}
        onDragLeave={() => setIsColumnDragOver(false)}
        onDrop={handleColumnDrop}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4 rounded-xl border border-dashed border-neutral-200 bg-white/50">
            <Clock className="w-6 h-6 text-neutral-300 mb-2 stroke-[1.5]" />
            <p className="text-xs font-medium text-neutral-500">No tasks in {title}</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Type above, or drag a task here
            </p>
          </div>
        ) : (
          tasks.map(task => {
            const showBefore = dragOverId === task.id && dropPosition === 'before';
            const showAfter = dragOverId === task.id && dropPosition === 'after';
            return (
              <div
                key={task.id}
                draggable
                onDragStart={e => handleCardDragStart(e, task.id)}
                onDragEnd={clearDragState}
                onDragOver={e => handleCardDragOver(e, task.id)}
                onDrop={e => handleCardDrop(e, task.id)}
                className={`group/drag relative cursor-grab active:cursor-grabbing transition-opacity ${
                  draggingId === task.id ? 'opacity-40' : 'opacity-100'
                }`}
              >
                {/* Drop indicator (before) */}
                {showBefore && (
                  <div className="absolute -top-1.5 left-0 right-0 h-0.5 bg-[#1868F2] rounded-full z-10" />
                )}

                {/* Drag handle affordance */}
                <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/drag:opacity-100 transition-opacity pointer-events-none">
                  <GripVertical className="w-3.5 h-3.5 text-neutral-300" />
                </div>

                <TaskCard
                  task={task}
                  categories={categories}
                  onToggleComplete={onToggleComplete}
                  onToggleSubTask={onToggleSubTask}
                  onAddSubTask={onAddSubTask}
                  onDeleteSubTask={onDeleteSubTask}
                  onUpdateSubTask={onUpdateSubTask}
                  onSetTiming={onSetTiming}
                  onSetPriority={onSetPriority}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                />

                {/* Drop indicator (after) */}
                {showAfter && (
                  <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#1868F2] rounded-full z-10" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
