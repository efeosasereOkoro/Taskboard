import React, { useState } from 'react';
import { Check, Trash2, GripVertical } from 'lucide-react';
import { SubTask } from '../types';

interface SubtaskItemProps {
  subtask: SubTask;
  onToggle: () => void;
  onDelete: () => void;
  onUpdateTitle: (title: string) => void;
}

export const SubtaskItem: React.FC<SubtaskItemProps> = ({
  subtask,
  onToggle,
  onDelete,
  onUpdateTitle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(subtask.title);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== subtask.title) {
      onUpdateTitle(editValue.trim());
    } else {
      setEditValue(subtask.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(subtask.title);
      setIsEditing(false);
    }
  };

  return (
    <div className="group/sub flex items-center justify-between gap-2 py-1 px-1.5 rounded hover:bg-neutral-50 text-xs transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          type="button"
          onClick={onToggle}
          className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-all shrink-0 ${
            subtask.completed
              ? 'bg-emerald-500 text-white'
              : 'border border-neutral-300 hover:border-neutral-400 bg-white'
          }`}
          aria-label={subtask.completed ? 'Mark subtask uncompleted' : 'Mark subtask completed'}
        >
          {subtask.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
        </button>

        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1 bg-white border border-blue-400 rounded px-1.5 py-0.5 text-xs text-neutral-800 outline-none"
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer truncate select-none ${
              subtask.completed ? 'line-through text-neutral-400' : 'text-neutral-700 hover:text-neutral-950'
            }`}
          >
            {subtask.title}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="opacity-0 group-hover/sub:opacity-100 text-neutral-300 hover:text-red-500 p-0.5 rounded transition-opacity"
        title="Delete subtask"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
};
