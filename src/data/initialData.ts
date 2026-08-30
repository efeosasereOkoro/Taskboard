import { Category, Task } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-work',
    name: 'WORK',
    color: '#1868F2', // Taskboard Blue
    subcategories: [
      { id: 'sub-teasoo', name: 'Teasoo Consulting' },
      { id: 'sub-govtech', name: 'GovTech' },
    ],
  },
  {
    id: 'cat-startup',
    name: 'STARTUP',
    color: '#8B5CF6', // Purple
    subcategories: [
      { id: 'sub-prepiq', name: 'PrepIQ' },
    ],
  },
  {
    id: 'cat-personal',
    name: 'PERSONAL',
    color: '#10B981', // Emerald Green
    subcategories: [],
  },
  {
    id: 'cat-sidegig',
    name: 'SIDE GIG',
    color: '#F59E0B', // Amber
    subcategories: [
      { id: 'sub-mowaa', name: 'MOWAA' },
      { id: 'sub-starsector', name: 'StarSector8' },
    ],
  },
];

export const INITIAL_TASKS: Task[] = [
  // NOW - This week
  {
    id: 'task-1',
    title: 'Finalize Q3 consulting deliverables for Teasoo',
    description: 'Review client requirements, draft summary brief, and submit finalized slide deck.',
    completed: false,
    timing: 'now',
    priority: 'high',
    categoryId: 'cat-work',
    subCategoryId: 'sub-teasoo',
    subtasks: [
      { id: 'subtask-1-1', title: 'Compile data audit findings', completed: true },
      { id: 'subtask-1-2', title: 'Prepare executive summary slides', completed: false },
      { id: 'subtask-1-3', title: 'Send draft deck for team review', completed: false },
    ],
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'task-2',
    title: 'PrepIQ onboarding flow UI overhaul',
    description: 'Simplify sign-up wizard to 3 clean steps with high conversion rate.',
    completed: false,
    timing: 'now',
    priority: 'high',
    categoryId: 'cat-startup',
    subCategoryId: 'sub-prepiq',
    subtasks: [
      { id: 'subtask-2-1', title: 'Wireframe streamlined screens', completed: true },
      { id: 'subtask-2-2', title: 'Implement mobile touch gestures', completed: false },
    ],
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'task-3',
    title: 'Book annual medical checkup & dental appointment',
    description: 'Call clinic before Friday afternoon.',
    completed: false,
    timing: 'now',
    priority: 'medium',
    categoryId: 'cat-personal',
    subtasks: [],
    createdAt: Date.now() - 86400000 * 3,
  },

  // NEXT - From next week
  {
    id: 'task-4',
    title: 'GovTech cloud infrastructure compliance review',
    description: 'Go through government cyber security checklist ahead of scheduled audit.',
    completed: false,
    timing: 'next',
    priority: 'medium',
    categoryId: 'cat-work',
    subCategoryId: 'sub-govtech',
    subtasks: [
      { id: 'subtask-4-1', title: 'Audit IAM permissions', completed: false },
      { id: 'subtask-4-2', title: 'Export encryption status report', completed: false },
    ],
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'task-5',
    title: 'MOWAA gallery event promo & visual identity design',
    description: 'Create social cards and email invitations for upcoming opening night.',
    completed: false,
    timing: 'next',
    priority: 'low',
    categoryId: 'cat-sidegig',
    subCategoryId: 'sub-mowaa',
    subtasks: [
      { id: 'subtask-5-1', title: 'Export high-res posters', completed: false },
      { id: 'subtask-5-2', title: 'Schedule Instagram announcement', completed: false },
    ],
    createdAt: Date.now() - 86400000 * 5,
  },

  // LATER - From next month onwards
  {
    id: 'task-6',
    title: 'StarSector8 game mechanics balance test & alpha release',
    description: 'Run playtest with 15 closed testers and gather telemetry feedback.',
    completed: false,
    timing: 'later',
    priority: 'low',
    categoryId: 'cat-sidegig',
    subCategoryId: 'sub-starsector',
    subtasks: [
      { id: 'subtask-6-1', title: 'Prepare build pipeline', completed: false },
      { id: 'subtask-6-2', title: 'Setup Discord feedback channel', completed: false },
    ],
    createdAt: Date.now() - 86400000 * 6,
  },
  {
    id: 'task-7',
    title: 'PrepIQ Series Seed pitch deck revision',
    description: 'Update metric charts with Q2 retention and ARR performance data.',
    completed: false,
    timing: 'later',
    priority: 'medium',
    categoryId: 'cat-startup',
    subCategoryId: 'sub-prepiq',
    subtasks: [],
    createdAt: Date.now() - 86400000 * 7,
  },
];
