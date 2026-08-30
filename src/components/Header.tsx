import React from 'react';
import { Plus, Search, FolderKanban, RotateCcw, CheckCircle2, SlidersHorizontal, Sparkles, Eye, EyeOff, Layers } from 'lucide-react';
import { Category, Timing } from '../types';

interface HeaderProps {
  categories: Category[];
  selectedCategoryId: string | null;
  selectedSubCategoryId: string | null;
  onSelectCategory: (catId: string | null, subId?: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewTask: (timing?: Timing) => void;
  onOpenCategoryManager: () => void;
  onResetDefaults: () => void;
  timingCounts: {
    now: number;
    next: number;
    later: number;
    completed: number;
  };
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  visibleColumns: { now: boolean; next: boolean; later: boolean };
  onToggleColumnVisibility: (col: 'next' | 'later') => void;
}

export const Header: React.FC<HeaderProps> = ({
  categories,
  selectedCategoryId,
  selectedSubCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOpenNewTask,
  onOpenCategoryManager,
  onResetDefaults,
  timingCounts,
  showCompleted,
  onToggleShowCompleted,
  focusMode,
  onToggleFocusMode,
  visibleColumns,
  onToggleColumnVisibility,
}) => {
  const currentCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1868F2] flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="6" height="6" rx="1.5" />
                <rect x="15" y="5" width="6" height="6" rx="1.5" />
                <rect x="3" y="15" width="6" height="6" rx="1.5" />
                <path d="m15 17 2 2 4-4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-neutral-900">Taskboard</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-[#1868F2] border border-blue-100">
                  Minimal
                </span>
              </div>
            </div>
          </div>

          {/* Search bar & quick actions */}
          <div className="flex items-center gap-2 flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                id="search-tasks-input"
                type="text"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search tasks, subtasks, categories..."
                className="w-full pl-9 pr-8 py-1.5 text-sm bg-neutral-100/80 hover:bg-neutral-100 focus:bg-white text-neutral-900 rounded-lg border border-transparent focus:border-[#1868F2]/30 focus:ring-2 focus:ring-[#1868F2]/20 transition-all placeholder:text-neutral-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs w-4 h-4 rounded-full flex items-center justify-center hover:bg-neutral-200"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Focus Mode Highlight Button */}
            <button
              id="focus-mode-main-toggle"
              onClick={onToggleFocusMode}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                focusMode
                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/40'
                  : 'text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 active:bg-neutral-200'
              }`}
              title={focusMode ? 'Exit Focus Mode (Show Next & Later)' : 'Focus Mode: Only show NOW tasks'}
            >
              <Sparkles className={`w-4 h-4 ${focusMode ? 'text-white fill-white' : 'text-amber-500'}`} />
              <span className="hidden sm:inline">{focusMode ? 'Focus: ON' : 'Focus Mode'}</span>
            </button>

            <button
              id="open-categories-btn"
              onClick={onOpenCategoryManager}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 active:bg-neutral-200 rounded-lg transition-colors"
              title="Organize Categories & Subcategories"
            >
              <FolderKanban className="w-4 h-4 text-neutral-600" />
              <span className="hidden sm:inline">Categories</span>
            </button>

            <button
              id="new-task-main-btn"
              onClick={() => onOpenNewTask('now')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-white bg-[#1868F2] hover:bg-[#1456ca] active:bg-[#0f44a3] rounded-lg shadow-sm shadow-blue-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Category Filter Bar & Column Toggles */}
        <div className="py-2.5 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar border-t border-neutral-100">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <button
              id="filter-all-categories"
              onClick={() => onSelectCategory(null, null)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all whitespace-nowrap ${
                selectedCategoryId === null
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
              }`}
            >
              All Categories
            </button>

            {categories.map(cat => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`filter-cat-${cat.id}`}
                  onClick={() => onSelectCategory(isSelected ? null : cat.id, null)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#1868F2] text-white shadow-sm shadow-blue-500/20'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 hover:text-neutral-900'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: isSelected ? '#FFFFFF' : (cat.color || '#1868F2') }}
                  />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Visibility Controls for Next & Later + Completed */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Hide / Show Pills */}
            <div className="hidden sm:flex items-center gap-1 bg-neutral-100/90 p-1 rounded-lg border border-neutral-200/60 text-xs font-medium">
              <span className="text-[10px] text-neutral-400 uppercase font-bold px-1">Columns:</span>
              <button
                id="toggle-next-column-btn"
                onClick={() => onToggleColumnVisibility('next')}
                className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                  visibleColumns.next && !focusMode
                    ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                    : 'text-neutral-400 line-through bg-transparent hover:text-neutral-600'
                }`}
                title="Click to hide or show the 'Next' column"
              >
                {visibleColumns.next && !focusMode ? <Eye className="w-3 h-3 text-indigo-600" /> : <EyeOff className="w-3 h-3 text-neutral-400" />}
                <span>Next ({timingCounts.next})</span>
              </button>
              <button
                id="toggle-later-column-btn"
                onClick={() => onToggleColumnVisibility('later')}
                className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                  visibleColumns.later && !focusMode
                    ? 'bg-white text-neutral-800 font-semibold shadow-2xs'
                    : 'text-neutral-400 line-through bg-transparent hover:text-neutral-600'
                }`}
                title="Click to hide or show the 'Later' column"
              >
                {visibleColumns.later && !focusMode ? <Eye className="w-3 h-3 text-neutral-600" /> : <EyeOff className="w-3 h-3 text-neutral-400" />}
                <span>Later ({timingCounts.later})</span>
              </button>
            </div>

            <button
              id="toggle-completed-visibility"
              onClick={onToggleShowCompleted}
              className={`text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                showCompleted
                  ? 'text-neutral-700 bg-neutral-200/80'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
              }`}
              title="Show or hide completed tasks"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Completed ({timingCounts.completed})</span>
            </button>
          </div>
        </div>

        {/* Subcategories Filter Bar (if category selected and has subcategories) */}
        {currentCategory && currentCategory.subcategories.length > 0 && (
          <div className="pb-2.5 pt-0.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mr-1">
              Subcategory:
            </span>
            <button
              onClick={() => onSelectCategory(currentCategory.id, null)}
              className={`px-2.5 py-0.5 text-xs rounded-md transition-all whitespace-nowrap ${
                selectedSubCategoryId === null
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All in {currentCategory.name}
            </button>
            {currentCategory.subcategories.map(sub => {
              const isSubSelected = selectedSubCategoryId === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => onSelectCategory(currentCategory.id, isSubSelected ? null : sub.id)}
                  className={`px-2.5 py-0.5 text-xs rounded-md transition-all whitespace-nowrap ${
                    isSubSelected
                      ? 'bg-blue-600 text-white font-medium shadow-xs'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
