import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, Category, SubCategory, Timing, Priority, SubTask } from '../types';
import { INITIAL_CATEGORIES, INITIAL_TASKS } from '../data/initialData';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEYS = {
  TASKS: 'taskboard_tasks_v1',
  CATEGORIES: 'taskboard_categories_v1',
};

// Database mapper helpers
function mapDbTaskToTask(db: any): Task {
  return {
    id: db.id,
    title: db.title,
    description: db.description || undefined,
    completed: Boolean(db.completed),
    timing: db.timing as Timing,
    priority: db.priority as Priority,
    categoryId: db.category_id || '',
    subCategoryId: db.sub_category_id || undefined,
    subtasks: Array.isArray(db.subtasks) ? db.subtasks : [],
    createdAt: Number(db.created_at) || Date.now(),
    completedAt: db.completed_at ? Number(db.completed_at) : undefined,
    order: db.order != null ? Number(db.order) : undefined,
  };
}

function mapTaskToDb(task: Task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description || null,
    completed: task.completed,
    timing: task.timing,
    priority: task.priority,
    category_id: task.categoryId || null,
    sub_category_id: task.subCategoryId || null,
    subtasks: task.subtasks || [],
    created_at: task.createdAt,
    completed_at: task.completedAt || null,
    order: task.order != null ? task.order : null,
  };
}

// Sort a task list by explicit order (ascending), falling back to newest-first
// for tasks that have never been reordered.
function sortByOrder(list: Task[]): Task[] {
  return [...list].sort((a, b) => {
    const ao = a.order ?? Number.MAX_SAFE_INTEGER;
    const bo = b.order ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return b.createdAt - a.createdAt;
  });
}

function mapDbCategoryToCategory(db: any): Category {
  return {
    id: db.id,
    name: db.name,
    color: db.color || undefined,
    subcategories: Array.isArray(db.subcategories) ? db.subcategories : [],
  };
}

function mapCategoryToDb(cat: Category) {
  return {
    id: cat.id,
    name: cat.name,
    color: cat.color || null,
    subcategories: cat.subcategories || [],
  };
}

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

  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Sync with Supabase on mount and listen to realtime changes if configured
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) {
      setIsCloudConnected(false);
      return;
    }

    setIsCloudConnected(true);
    let isSubscribed = true;

    async function loadCloudData() {
      try {
        setIsSyncing(true);
        if (!supabase) return;

        // 1. Always ensure categories exist in database first
        const currentCats = categories.length > 0 ? categories : INITIAL_CATEGORIES;
        for (const cat of currentCats) {
          await supabase.from('categories').upsert(mapCategoryToDb(cat));
        }

        // 2. Fetch categories from Supabase
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });

        if (!catError && catData && catData.length > 0 && isSubscribed) {
          setCategories(catData.map(mapDbCategoryToCategory));
        }

        // 3. Check tasks table in Supabase
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!taskError && taskData && taskData.length > 0 && isSubscribed) {
          // If remote tasks exist, load them and merge with any existing local tasks
          const remoteTasks = taskData.map(mapDbTaskToTask);
          const remoteIds = new Set(remoteTasks.map(t => t.id));

          // If there are local tasks not yet in remote, push them automatically
          const localTasksToPush = tasks.filter(t => !remoteIds.has(t.id));
          for (const localTask of localTasksToPush) {
            await supabase.from('tasks').upsert(mapTaskToDb(localTask));
          }

          setTasks(sortByOrder([...localTasksToPush, ...remoteTasks]));
        } else {
          // Supabase tasks table is empty: automatically push all current tasks
          const initialTasksToPush = tasks.length > 0 ? tasks : INITIAL_TASKS;
          for (const task of initialTasksToPush) {
            await supabase.from('tasks').upsert(mapTaskToDb(task));
          }
          if (isSubscribed) {
            setTasks(initialTasksToPush);
          }
        }

        if (isSubscribed) {
          setLastSyncedAt(new Date());
        }
      } catch (err) {
        console.warn('Supabase automatic sync error:', err);
      } finally {
        if (isSubscribed) {
          setIsSyncing(false);
        }
      }
    }

    loadCloudData();

    // Subscribe to realtime updates
    const tasksChannel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        payload => {
          if (payload.eventType === 'INSERT') {
            const newTask = mapDbTaskToTask(payload.new);
            setTasks(prev => (prev.some(t => t.id === newTask.id) ? prev : [newTask, ...prev]));
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapDbTaskToTask(payload.new);
            setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const categoriesChannel = supabase
      .channel('categories-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        payload => {
          if (payload.eventType === 'INSERT') {
            const newCat = mapDbCategoryToCategory(payload.new);
            setCategories(prev => (prev.some(c => c.id === newCat.id) ? prev : [...prev, newCat]));
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapDbCategoryToCategory(payload.new);
            setCategories(prev => prev.map(c => (c.id === updated.id ? updated : c)));
          } else if (payload.eventType === 'DELETE') {
            setCategories(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, []);

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

    // Push automatically to Supabase if connected
    const supabase = getSupabase();
    if (supabase) {
      // Ensure category exists in database first
      const cat = categories.find(c => c.id === newTask.categoryId);
      if (cat) {
        supabase.from('categories').upsert(mapCategoryToDb(cat)).then(() => {
          supabase.from('tasks').upsert(mapTaskToDb(newTask)).then(({ error }) => {
            if (error) console.error('Auto-sync insert task failed:', error);
          });
        });
      } else {
        supabase.from('tasks').upsert(mapTaskToDb(newTask)).then(({ error }) => {
          if (error) console.error('Auto-sync insert task failed:', error);
        });
      }
    }

    return newTask;
  }, [categories]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    let updatedTaskObj: Task | null = null;

    setTasks(prev =>
      prev.map(task => {
        if (task.id === id) {
          const updated = { ...task, ...updates };
          if (updates.completed !== undefined) {
            updated.completedAt = updates.completed ? Date.now() : undefined;
          }
          updatedTaskObj = updated;
          return updated;
        }
        return task;
      })
    );

    const supabase = getSupabase();
    if (supabase && updatedTaskObj) {
      supabase.from('tasks').upsert(mapTaskToDb(updatedTaskObj)).then(({ error }) => {
        if (error) console.error('Auto-sync update task failed:', error);
      });
    }
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('tasks').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Auto-sync delete task failed:', error);
      });
    }
  }, []);

  const toggleTaskComplete = useCallback((id: string) => {
    let changedTasks: Task[] = [];

    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx === -1) return prev;

      const task = prev[idx];
      const isCompleted = !task.completed;
      const updated: Task = {
        ...task,
        completed: isCompleted,
        completedAt: isCompleted ? Date.now() : undefined,
        // Completing a task also ticks off all its subtasks.
        subtasks: isCompleted ? task.subtasks.map(st => ({ ...st, completed: true })) : task.subtasks,
      };

      if (!isCompleted) {
        // Re-opening a task: update in place, keep its position and order.
        changedTasks = [updated];
        return prev.map(t => (t.id === id ? updated : t));
      }

      // Completing: move the task to the bottom of its timing column.
      const remaining = prev.filter(t => t.id !== id);
      let lastSameTimingIndex = -1;
      for (let i = remaining.length - 1; i >= 0; i--) {
        if (remaining[i].timing === updated.timing) {
          lastSameTimingIndex = i;
          break;
        }
      }
      const moved = lastSameTimingIndex === -1
        ? [...remaining, updated]
        : [...remaining.slice(0, lastSameTimingIndex + 1), updated, ...remaining.slice(lastSameTimingIndex + 1)];

      // Re-stamp order so the new position survives a reload (including from Supabase).
      const withOrder = moved.map((t, i) => ({ ...t, order: i }));
      const prevById = new Map<string, Task>(prev.map(t => [t.id, t] as [string, Task]));
      changedTasks = withOrder.filter(t => {
        const old = prevById.get(t.id);
        return !old || old.order !== t.order || old.completed !== t.completed;
      });
      return withOrder;
    });

    const supabase = getSupabase();
    if (supabase) {
      for (const t of changedTasks) {
        supabase.from('tasks').upsert(mapTaskToDb(t)).then(({ error }) => {
          if (error) console.error('Auto-sync toggle task failed:', error);
        });
      }
    }
  }, []);

  const setTaskTiming = useCallback((id: string, timing: Timing) => {
    updateTask(id, { timing });
  }, [updateTask]);

  // Reorder task within a column or across columns.
  // Rebuilds the ordered list, re-stamps every task's `order` to its new index,
  // and persists any task whose order or timing changed so the arrangement
  // survives a reload (including from Supabase).
  const reorderTask = useCallback((activeId: string, targetId: string | null, targetTiming?: Timing, position: 'before' | 'after' = 'before') => {
    let changedTasks: Task[] = [];

    setTasks(prev => {
      const activeIndex = prev.findIndex(t => t.id === activeId);
      if (activeIndex === -1 || activeId === targetId) return prev;

      const activeTask = { ...prev[activeIndex] };
      if (targetTiming && activeTask.timing !== targetTiming) {
        activeTask.timing = targetTiming;
      }

      const remaining = prev.filter(t => t.id !== activeId);
      const columnTiming = targetTiming || activeTask.timing;
      let reordered: Task[];

      if (!targetId) {
        if (position === 'before') {
          const firstTargetIndex = remaining.findIndex(t => t.timing === columnTiming);
          reordered = firstTargetIndex === -1
            ? [activeTask, ...remaining]
            : [...remaining.slice(0, firstTargetIndex), activeTask, ...remaining.slice(firstTargetIndex)];
        } else {
          let lastTargetIndex = -1;
          for (let i = remaining.length - 1; i >= 0; i--) {
            if (remaining[i].timing === columnTiming) {
              lastTargetIndex = i;
              break;
            }
          }
          reordered = lastTargetIndex === -1
            ? [...remaining, activeTask]
            : [...remaining.slice(0, lastTargetIndex + 1), activeTask, ...remaining.slice(lastTargetIndex + 1)];
        }
      } else {
        const targetIndex = remaining.findIndex(t => t.id === targetId);
        if (targetIndex === -1) {
          reordered = [activeTask, ...remaining];
        } else {
          const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
          reordered = [...remaining.slice(0, insertIndex), activeTask, ...remaining.slice(insertIndex)];
        }
      }

      // Re-stamp order to the new array position for a stable, persistable sort key.
      const withOrder = reordered.map((t, i) => ({ ...t, order: i }));

      // Capture only the tasks whose order or timing changed, for cloud persistence.
      const prevById = new Map<string, Task>(prev.map(t => [t.id, t] as [string, Task]));
      changedTasks = withOrder.filter(t => {
        const old = prevById.get(t.id);
        return !old || old.order !== t.order || old.timing !== t.timing;
      });

      return withOrder;
    });

    const supabase = getSupabase();
    if (supabase) {
      for (const t of changedTasks) {
        supabase.from('tasks').upsert(mapTaskToDb(t)).then(({ error }) => {
          if (error) console.error('Auto-sync reorder task failed:', error);
        });
      }
    }
  }, []);

  // Move a task to the absolute top of its column
  const moveTaskToTop = useCallback((taskId: string) => {
    setTasks(prev => {
      const taskIndex = prev.findIndex(t => t.id === taskId);
      if (taskIndex <= 0) return prev;
      const task = prev[taskIndex];
      const otherTasks = prev.filter(t => t.id !== taskId);
      
      const firstSameTimingIndex = otherTasks.findIndex(t => t.timing === task.timing);
      if (firstSameTimingIndex === -1) return [task, ...otherTasks];
      return [...otherTasks.slice(0, firstSameTimingIndex), task, ...otherTasks.slice(firstSameTimingIndex)];
    });
  }, []);

  // Move a task to the absolute bottom of its column
  const moveTaskToBottom = useCallback((taskId: string) => {
    setTasks(prev => {
      const taskIndex = prev.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prev;
      const task = prev[taskIndex];
      const otherTasks = prev.filter(t => t.id !== taskId);
      
      let lastSameTimingIndex = -1;
      for (let i = otherTasks.length - 1; i >= 0; i--) {
        if (otherTasks[i].timing === task.timing) {
          lastSameTimingIndex = i;
          break;
        }
      }
      if (lastSameTimingIndex === -1) return [...otherTasks, task];
      return [...otherTasks.slice(0, lastSameTimingIndex + 1), task, ...otherTasks.slice(lastSameTimingIndex + 1)];
    });
  }, []);

  // Subtask Operations
  const toggleSubTask = useCallback((taskId: string, subtaskId: string) => {
    let updatedTaskObj: Task | null = null;
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const updated = {
            ...task,
            subtasks: task.subtasks.map(st =>
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            ),
          };
          updatedTaskObj = updated;
          return updated;
        }
        return task;
      })
    );

    const supabase = getSupabase();
    if (supabase && updatedTaskObj) {
      supabase.from('tasks').upsert(mapTaskToDb(updatedTaskObj)).then(({ error }) => {
        if (error) console.error('Auto-sync toggle subtask failed:', error);
      });
    }
  }, []);

  const addSubTask = useCallback((taskId: string, title: string) => {
    const newSubTask: SubTask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      completed: false,
    };

    let updatedTaskObj: Task | null = null;
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const updated = {
            ...task,
            subtasks: [...task.subtasks, newSubTask],
          };
          updatedTaskObj = updated;
          return updated;
        }
        return task;
      })
    );

    const supabase = getSupabase();
    if (supabase && updatedTaskObj) {
      supabase.from('tasks').upsert(mapTaskToDb(updatedTaskObj)).then(({ error }) => {
        if (error) console.error('Auto-sync add subtask failed:', error);
      });
    }
  }, []);

  const deleteSubTask = useCallback((taskId: string, subtaskId: string) => {
    let updatedTaskObj: Task | null = null;
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const updated = {
            ...task,
            subtasks: task.subtasks.filter(st => st.id !== subtaskId),
          };
          updatedTaskObj = updated;
          return updated;
        }
        return task;
      })
    );

    const supabase = getSupabase();
    if (supabase && updatedTaskObj) {
      supabase.from('tasks').upsert(mapTaskToDb(updatedTaskObj)).then(({ error }) => {
        if (error) console.error('Auto-sync delete subtask failed:', error);
      });
    }
  }, []);

  const updateSubTaskTitle = useCallback((taskId: string, subtaskId: string, title: string) => {
    let updatedTaskObj: Task | null = null;
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const updated = {
            ...task,
            subtasks: task.subtasks.map(st =>
              st.id === subtaskId ? { ...st, title: title.trim() } : st
            ),
          };
          updatedTaskObj = updated;
          return updated;
        }
        return task;
      })
    );

    const supabase = getSupabase();
    if (supabase && updatedTaskObj) {
      supabase.from('tasks').upsert(mapTaskToDb(updatedTaskObj)).then(({ error }) => {
        if (error) console.error('Auto-sync update subtask title failed:', error);
      });
    }
  }, []);

  // Category Operations
  const addCategory = useCallback((name: string, color?: string) => {
    const newCat: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      color: color || '#1868F2',
      subcategories: [],
    };
    setCategories(prev => [...prev, newCat]);
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('categories').upsert(mapCategoryToDb(newCat)).then(({ error }) => {
        if (error) console.error('Auto-sync add category failed:', error);
      });
    }
    return newCat;
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    let updatedCatObj: Category | null = null;
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === id) {
          const updated = { ...cat, ...updates };
          updatedCatObj = updated;
          return updated;
        }
        return cat;
      })
    );

    const supabase = getSupabase();
    if (supabase && updatedCatObj) {
      supabase.from('categories').upsert(mapCategoryToDb(updatedCatObj)).then(({ error }) => {
        if (error) console.error('Auto-sync update category failed:', error);
      });
    }
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
    // Clear category reference on tasks
    setTasks(prev =>
      prev.map(task => {
        if (task.categoryId === id) {
          return { ...task, categoryId: '', subCategoryId: undefined };
        }
        return task;
      })
    );

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('categories').delete().eq('id', id).then();
      supabase.from('tasks').update({ category_id: null, sub_category_id: null }).eq('category_id', id).then();
    }
  }, []);

  const addSubCategory = useCallback((categoryId: string, name: string) => {
    const newSub: SubCategory = {
      id: `subcat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
    };

    let updatedCatObj: Category | null = null;
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === categoryId) {
          const updated = {
            ...cat,
            subcategories: [...cat.subcategories, newSub],
          };
          updatedCatObj = updated;
          return updated;
        }
        return cat;
      })
    );

    const supabase = getSupabase();
    if (supabase && updatedCatObj) {
      supabase.from('categories').upsert(mapCategoryToDb(updatedCatObj)).then(({ error }) => {
        if (error) console.error('Auto-sync add subcategory failed:', error);
      });
    }
    return newSub;
  }, []);

  const updateSubCategory = useCallback((categoryId: string, subCategoryId: string, name: string) => {
    let updatedCatObj: Category | null = null;
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === categoryId) {
          const updated = {
            ...cat,
            subcategories: cat.subcategories.map(sub =>
              sub.id === subCategoryId ? { ...sub, name: name.trim() } : sub
            ),
          };
          updatedCatObj = updated;
          return updated;
        }
        return cat;
      })
    );

    const supabase = getSupabase();
    if (supabase && updatedCatObj) {
      supabase.from('categories').upsert(mapCategoryToDb(updatedCatObj)).then(({ error }) => {
        if (error) console.error('Auto-sync update subcategory failed:', error);
      });
    }
  }, []);

  const deleteSubCategory = useCallback((categoryId: string, subCategoryId: string) => {
    let updatedCatObj: Category | null = null;
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === categoryId) {
          const updated = {
            ...cat,
            subcategories: cat.subcategories.filter(sub => sub.id !== subCategoryId),
          };
          updatedCatObj = updated;
          return updated;
        }
        return cat;
      })
    );

    // Clear subcategory reference on tasks
    setTasks(prev =>
      prev.map(task => {
        if (task.subCategoryId === subCategoryId) {
          return { ...task, subCategoryId: undefined };
        }
        return task;
      })
    );

    const supabase = getSupabase();
    if (supabase && updatedCatObj) {
      supabase.from('categories').upsert(mapCategoryToDb(updatedCatObj)).then(({ error }) => {
        if (error) console.error('Auto-sync delete subcategory failed:', error);
      });
      supabase.from('tasks').update({ sub_category_id: null }).eq('sub_category_id', subCategoryId).then();
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    setCategories(INITIAL_CATEGORIES);
    setTasks(INITIAL_TASKS);
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    } catch {}
  }, []);

  const manualSyncToSupabase = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsCloudConnected(false);
      return {
        success: false,
        message: 'Supabase is not configured yet. Please enter your Project URL and Anon Key.',
      };
    }

    try {
      setIsSyncing(true);

      // 1. Upsert all categories
      const currentCats = categories.length > 0 ? categories : INITIAL_CATEGORIES;
      for (const cat of currentCats) {
        const { error: catErr } = await supabase
          .from('categories')
          .upsert(mapCategoryToDb(cat));
        if (catErr) {
          console.error('Error syncing category to Supabase:', catErr);
        }
      }

      // 2. Upsert all tasks
      const currentTasks = tasks.length > 0 ? tasks : INITIAL_TASKS;
      let syncedCount = 0;
      for (const task of currentTasks) {
        const { error: taskErr } = await supabase
          .from('tasks')
          .upsert(mapTaskToDb(task));
        if (taskErr) {
          console.error('Error syncing task to Supabase:', taskErr);
        } else {
          syncedCount++;
        }
      }

      setIsCloudConnected(true);
      setLastSyncedAt(new Date());
      return {
        success: true,
        message: `Successfully synced ${currentCats.length} categories and ${syncedCount} tasks to Supabase!`,
      };
    } catch (err: any) {
      console.error('Manual sync failed:', err);
      return {
        success: false,
        message: `Sync failed: ${err.message || String(err)}`,
      };
    } finally {
      setIsSyncing(false);
    }
  }, [categories, tasks]);

  return {
    tasks,
    categories,
    isCloudConnected,
    isSyncing,
    lastSyncedAt,
    manualSyncToSupabase,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    setTaskTiming,
    reorderTask,
    moveTaskToTop,
    moveTaskToBottom,
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
