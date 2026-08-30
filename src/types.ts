export type Timing = 'now' | 'next' | 'later';

export type Priority = 'high' | 'medium' | 'low';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  subcategories: SubCategory[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  timing: Timing;
  priority: Priority;
  categoryId: string;
  subCategoryId?: string;
  subtasks: SubTask[];
  createdAt: number;
  completedAt?: number;
}

export type ViewMode = 'board' | 'list';
