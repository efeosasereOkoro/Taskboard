import { useState, useEffect, useCallback } from 'react';
import { Task, Category, Timing, Priority, SubTask } from '../types';
import { INITIAL_CATEGORIES, INITIAL_TASKS } from '../data/initialData';

const STORAGE_KEYS = {
  TASKS: 'taskboard_tasks_v1',
  CATEGORIES: 'taskboard_categories_v1',
};

export function useTaskManager() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories', e);
    }
  }, [categories]);

  // Task Operations
  const addTask = useCallback((taskData: {
    title: string;
    description?: string;
    timing: Timing;
    priority: Priority;
    categoryId: string;
    subCategoryId?: string;
    subtasks?: string[];
  }) => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || undefined,
      completed: false,
      timing: taskData.timing,
      priority: taskData.priority,
      categoryId: taskData.categoryId,
      subCategoryId: taskData.subCategoryId || undefined,
      subtasks: (taskData.subtasks || []).filter(s => s.trim().length > 0).map((s, idx) => ({
        id: `subtask-${Date.now()}-${idx}`,
        title: s.trim(),
        completed: false,
      })),
      createdAt: Date.now(),
    };

    setTasks(prev => [newTask, ...prev]);
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === id) {
          const updated = { ...task, ...updates };
          if (updates.completed !== undefined) {
            updated.completedAt = updates.completed ? Date.now() : undefined;
          }
          return updated;
        }
        return task;
      })
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTaskComplete = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === id) {
          const isCompleted = !task.completed;
          // Also toggle all subtasks if completing the main task
          const updatedSubtasks = isCompleted
            ? task.subtasks.map(st => ({ ...st, completed: true }))
            : task.subtasks;
          return {
            ...task,
            completed: isCompleted,
            completedAt: isCompleted ? Date.now() : undefined,
            subtasks: updatedSubtasks,
          };
        }
        return task;
      })
    );
  }, []);

  const setTaskTiming = useCallback((id: string, timing: Timing) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, timing } : t))
    );
  }, []);

  // Reorder task within a column or across columns
  const reorderTask = useCallback((activeId: string, targetId: string | null, targetTiming?: Timing, position: 'before' | 'after' = 'before') => {
    setTasks(prev => {
      const activeIndex = prev.findIndex(t => t.id === activeId);
      if (activeIndex === -1) return prev;

      const activeTask = { ...prev[activeIndex] };
      if (targetTiming && activeTask.timing !== targetTiming) {
        activeTask.timing = targetTiming;
      }

      const filtered = prev.filter(t => t.id !== activeId);

      if (!targetId) {
        // Moving to the top or bottom of a target timing column
        if (position === 'before') {
          return [activeTask, ...filtered];
        } else {
          return [...filtered, activeTask];
        }
      }

      const targetIndex = filtered.findIndex(t => t.id === targetId);
      if (targetIndex === -1) {
        return [activeTask, ...filtered];
      }

      const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
      return [...filtered.slice(0, insertIndex), activeTask, ...filtered.slice(insertIndex)];
    });
  }, []);

  // Subtask Operations
  const toggleSubTask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          // If all subtasks completed, option to check main task or keep as is
          const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
          return {
            ...task,
            subtasks: updatedSubtasks,
            completed: allCompleted ? true : task.completed,
            completedAt: allCompleted ? (task.completedAt || Date.now()) : task.completedAt,
          };
        }
        return task;
      })
    );
  }, []);

  const addSubTask = useCallback((taskId: string, title: string) => {
    if (!title.trim()) return;
    const newSub: SubTask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      completed: false,
    };
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: [...task.subtasks, newSub],
          };
        }
        return task;
      })
    );
  }, []);

  const deleteSubTask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: task.subtasks.filter(st => st.id !== subtaskId),
          };
        }
        return task;
      })
    );
  }, []);

  const updateSubTaskTitle = useCallback((taskId: string, subtaskId: string, title: string) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: task.subtasks.map(st =>
              st.id === subtaskId ? { ...st, title: title.trim() } : st
            ),
          };
        }
        return task;
      })
    );
  }, []);

  // Category Operations
  const addCategory = useCallback((name: string, color: string = '#1868F2') => {
    if (!name.trim()) return null;
    const newCat: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      color,
      subcategories: [],
    };
    setCategories(prev => [...prev, newCat]);
    return newCat;
  }, []);

  const updateCategory = useCallback((id: string, name: string, color?: string) => {
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, name: name.trim(), color: color || cat.color } : cat))
    );
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
    // Reassign orphaned tasks to first available category or unassigned
    setTasks(prev => {
      const remainingCats = categories.filter(c => c.id !== id);
      const fallbackId = remainingCats.length > 0 ? remainingCats[0].id : '';
      return prev.map(t => (t.categoryId === id ? { ...t, categoryId: fallbackId, subCategoryId: undefined } : t));
    });
  }, [categories]);

  const addSubCategory = useCallback((categoryId: string, name: string) => {
    if (!name.trim()) return;
    const newSub = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
    };
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            subcategories: [...cat.subcategories, newSub],
          };
        }
        return cat;
      })
    );
  }, []);

  const updateSubCategory = useCallback((categoryId: string, subId: string, name: string) => {
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            subcategories: cat.subcategories.map(s => (s.id === subId ? { ...s, name: name.trim() } : s)),
          };
        }
        return cat;
      })
    );
  }, []);

  const deleteSubCategory = useCallback((categoryId: string, subId: string) => {
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            subcategories: cat.subcategories.filter(s => s.id !== subId),
          };
        }
        return cat;
      })
    );
    // Clear subcategoryId on tasks that had it
    setTasks(prev =>
      prev.map(t => (t.subCategoryId === subId ? { ...t, subCategoryId: undefined } : t))
    );
  }, []);

  const resetToDefaults = useCallback(() => {
    setCategories(INITIAL_CATEGORIES);
    setTasks(INITIAL_TASKS);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  }, []);

  return {
    tasks,
    categories,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    setTaskTiming,
    reorderTask,
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
  };
}
