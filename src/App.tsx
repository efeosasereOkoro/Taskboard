import React, { useState, useMemo } from 'react';
import { useTaskManager } from './hooks/useTaskManager';
import { Header } from './components/Header';
import { TimingColumn } from './components/TimingColumn';
import { TaskModal } from './components/TaskModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { Task, Timing, Priority } from './types';
import { Clock, Calendar, Compass, Plus, CheckCircle2, Sparkles, Filter } from 'lucide-react';

export default function App() {
  const {
    tasks,
    categories,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    setTaskTiming,
    toggleSubTask,
    addSubTask,
    deleteSubTask,
    updateSubTaskTitle,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    resetToDefaults,
  } = useTaskManager();

  // Navigation & Filter State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);

  // Mobile active tab (Now / Next / Later / All)
  const [mobileTab, setMobileTab] = useState<Timing | 'all'>('all');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialModalTiming, setInitialModalTiming] = useState<Timing>('now');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Category selection handler
  const handleSelectCategory = (catId: string | null, subId: string | null = null) => {
    setSelectedCategoryId(catId);
    setSelectedSubCategoryId(subId);
  };

  // Filtered Tasks calculation
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Completed filter
      if (!showCompleted && task.completed) {
        return false;
      }

      // Category filter
      if (selectedCategoryId && task.categoryId !== selectedCategoryId) {
        return false;
      }

      // Subcategory filter
      if (selectedSubCategoryId && task.subCategoryId !== selectedSubCategoryId) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q) || false;
        const cat = categories.find(c => c.id === task.categoryId);
        const matchesCat = cat?.name.toLowerCase().includes(q) || false;
        const sub = cat?.subcategories.find(s => s.id === task.subCategoryId);
        const matchesSub = sub?.name.toLowerCase().includes(q) || false;
        const matchesSubtasks = task.subtasks.some(st => st.title.toLowerCase().includes(q));

        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesSub && !matchesSubtasks) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, selectedCategoryId, selectedSubCategoryId, searchQuery, showCompleted, categories]);

  // Tasks grouped by timing
  const nowTasks = useMemo(() => filteredTasks.filter(t => t.timing === 'now'), [filteredTasks]);
  const nextTasks = useMemo(() => filteredTasks.filter(t => t.timing === 'next'), [filteredTasks]);
  const laterTasks = useMemo(() => filteredTasks.filter(t => t.timing === 'later'), [filteredTasks]);

  // Timing counts (unfiltered by search for header stats)
  const timingCounts = useMemo(() => {
    const active = tasks.filter(t => !t.completed);
    return {
      now: active.filter(t => t.timing === 'now').length,
      next: active.filter(t => t.timing === 'next').length,
      later: active.filter(t => t.timing === 'later').length,
      completed: tasks.filter(t => t.completed).length,
    };
  }, [tasks]);

  // Quick Add handler
  const handleQuickAdd = (timing: Timing, title: string, categoryId?: string, subCategoryId?: string) => {
    const defaultCat = categoryId || (categories.length > 0 ? categories[0].id : '');
    addTask({
      title,
      timing,
      priority: 'medium',
      categoryId: defaultCat,
      subCategoryId,
    });
  };

  // Open modal for new task
  const handleOpenNewTask = (timing: Timing = 'now') => {
    setEditingTask(null);
    setInitialModalTiming(timing);
    setIsTaskModalOpen(true);
  };

  // Open modal to edit existing task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const currentCategoryObj = categories.find(c => c.id === selectedCategoryId);
  const currentSubCategoryObj = currentCategoryObj?.subcategories.find(s => s.id === selectedSubCategoryId);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-neutral-900">
      {/* Header */}
      <Header
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        selectedSubCategoryId={selectedSubCategoryId}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNewTask={handleOpenNewTask}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onResetDefaults={resetToDefaults}
        timingCounts={timingCounts}
        showCompleted={showCompleted}
        onToggleShowCompleted={() => setShowCompleted(!showCompleted)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Active Filter Indicator / Context Banner if filtering */}
        {(selectedCategoryId || searchQuery) && (
          <div className="mb-4 flex items-center justify-between bg-blue-50/60 border border-blue-100 px-3.5 py-2 rounded-xl text-xs text-neutral-700">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#1868F2]" />
              <span>
                Showing:{' '}
                {currentCategoryObj && (
                  <strong className="text-neutral-900">
                    {currentCategoryObj.name}
                    {currentSubCategoryObj ? ` › ${currentSubCategoryObj.name}` : ''}
                  </strong>
                )}
                {searchQuery && (
                  <span>
                    {' '}matching &ldquo;<strong>{searchQuery}</strong>&rdquo;
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedCategoryId(null);
                setSelectedSubCategoryId(null);
                setSearchQuery('');
              }}
              className="text-[#1868F2] hover:underline font-semibold"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Mobile Tab Switcher (Visible on small screens) */}
        <div className="md:hidden flex items-center justify-between p-1 bg-neutral-200/70 rounded-xl mb-4 text-xs font-semibold">
          <button
            onClick={() => setMobileTab('all')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mobileTab === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
            }`}
          >
            All Columns
          </button>
          <button
            onClick={() => setMobileTab('now')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
              mobileTab === 'now' ? 'bg-[#1868F2] text-white shadow-xs' : 'text-neutral-600'
            }`}
          >
            <span>Now</span>
            <span className="text-[10px] opacity-80">({nowTasks.length})</span>
          </button>
          <button
            onClick={() => setMobileTab('next')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
              mobileTab === 'next' ? 'bg-indigo-600 text-white shadow-xs' : 'text-neutral-600'
            }`}
          >
            <span>Next</span>
            <span className="text-[10px] opacity-80">({nextTasks.length})</span>
          </button>
          <button
            onClick={() => setMobileTab('later')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
              mobileTab === 'later' ? 'bg-neutral-800 text-white shadow-xs' : 'text-neutral-600'
            }`}
          >
            <span>Later</span>
            <span className="text-[10px] opacity-80">({laterTasks.length})</span>
          </button>
        </div>

        {/* 3-Column Timing Board (Now / Next / Later) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-start">
          {/* NOW: This week */}
          <div className={`${mobileTab === 'all' || mobileTab === 'now' ? 'block' : 'hidden md:block'}`}>
            <TimingColumn
              timing="now"
              title="Now"
              subtitle="This week"
              badgeColor="bg-blue-50 text-[#1868F2] border-blue-200"
              tasks={nowTasks}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              selectedSubCategoryId={selectedSubCategoryId}
              onToggleComplete={toggleTaskComplete}
              onToggleSubTask={toggleSubTask}
              onAddSubTask={addSubTask}
              onDeleteSubTask={deleteSubTask}
              onUpdateSubTask={updateSubTaskTitle}
              onSetTiming={setTaskTiming}
              onSetPriority={(id, p) => updateTask(id, { priority: p })}
              onEditTask={handleEditTask}
              onDeleteTask={deleteTask}
              onQuickAddTask={handleQuickAdd}
            />
          </div>

          {/* NEXT: From next week */}
          <div className={`${mobileTab === 'all' || mobileTab === 'next' ? 'block' : 'hidden md:block'}`}>
            <TimingColumn
              timing="next"
              title="Next"
              subtitle="From next week"
              badgeColor="bg-indigo-50 text-indigo-700 border-indigo-200"
              tasks={nextTasks}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              selectedSubCategoryId={selectedSubCategoryId}
              onToggleComplete={toggleTaskComplete}
              onToggleSubTask={toggleSubTask}
              onAddSubTask={addSubTask}
              onDeleteSubTask={deleteSubTask}
              onUpdateSubTask={updateSubTaskTitle}
              onSetTiming={setTaskTiming}
              onSetPriority={(id, p) => updateTask(id, { priority: p })}
              onEditTask={handleEditTask}
              onDeleteTask={deleteTask}
              onQuickAddTask={handleQuickAdd}
            />
          </div>

          {/* LATER: From next month onwards */}
          <div className={`${mobileTab === 'all' || mobileTab === 'later' ? 'block' : 'hidden md:block'}`}>
            <TimingColumn
              timing="later"
              title="Later"
              subtitle="From next month onwards"
              badgeColor="bg-neutral-100 text-neutral-700 border-neutral-200"
              tasks={laterTasks}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              selectedSubCategoryId={selectedSubCategoryId}
              onToggleComplete={toggleTaskComplete}
              onToggleSubTask={toggleSubTask}
              onAddSubTask={addSubTask}
              onDeleteSubTask={deleteSubTask}
              onUpdateSubTask={updateSubTaskTitle}
              onSetTiming={setTaskTiming}
              onSetPriority={(id, p) => updateTask(id, { priority: p })}
              onEditTask={handleEditTask}
              onDeleteTask={deleteTask}
              onQuickAddTask={handleQuickAdd}
            />
          </div>
        </div>
      </main>

      {/* Mobile Floating Action Button */}
      <div className="fixed right-5 bottom-5 md:hidden z-40">
        <button
          onClick={() => handleOpenNewTask(mobileTab !== 'all' ? mobileTab : 'now')}
          className="w-14 h-14 rounded-full bg-[#1868F2] text-white flex items-center justify-center shadow-lg shadow-blue-500/40 active:scale-95 transition-transform"
          aria-label="Create new task"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Task Creation / Editing Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={addTask}
        onUpdate={updateTask}
        editingTask={editingTask}
        categories={categories}
        initialTiming={initialModalTiming}
        initialCategoryId={selectedCategoryId}
        initialSubCategoryId={selectedSubCategoryId}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        onAddSubCategory={addSubCategory}
        onUpdateSubCategory={updateSubCategory}
        onDeleteSubCategory={deleteSubCategory}
        onResetDefaults={resetToDefaults}
      />
    </div>
  );
}
