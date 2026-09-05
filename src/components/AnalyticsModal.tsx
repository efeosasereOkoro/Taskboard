import React, { useMemo } from 'react';
import { X, BarChart3, TrendingUp } from 'lucide-react';
import { Task, Category } from '../types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  categories: Category[];
}

interface MonthlyData {
  month: string;
  monthNum: number;
  year: number;
  categories: Record<string, number>;
  total: number;
}

export function AnalyticsModal({ isOpen, onClose, tasks, categories }: AnalyticsModalProps) {
  const analyticsData = useMemo(() => {
    const monthlyStats: Record<string, MonthlyData> = {};

    // Process all completed tasks
    const completedTasks = tasks.filter(t => t.completed && t.completedAt);

    completedTasks.forEach(task => {
      if (!task.completedAt) return;

      const date = new Date(task.completedAt);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthName = date.toLocaleString('default', { month: 'short' });
      const key = `${year}-${month}`;
      const monthLabel = `${monthName} ${year}`;

      if (!monthlyStats[key]) {
        monthlyStats[key] = {
          month: monthLabel,
          monthNum: month,
          year,
          categories: {},
          total: 0,
        };
      }

      const catName = categories.find(c => c.id === task.categoryId)?.name || 'Uncategorized';
      monthlyStats[key].categories[catName] = (monthlyStats[key].categories[catName] || 0) + 1;
      monthlyStats[key].total += 1;
    });

    // Sort by date
    return Object.values(monthlyStats).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthNum - b.monthNum;
    });
  }, [tasks, categories]);

  const overallStats = useMemo(() => {
    const completedTasks = tasks.filter(t => t.completed);
    const categoryStats: Record<string, number> = {};
    let totalCompleted = 0;

    completedTasks.forEach(task => {
      const catName = categories.find(c => c.id === task.categoryId)?.name || 'Uncategorized';
      categoryStats[catName] = (categoryStats[catName] || 0) + 1;
      totalCompleted += 1;
    });

    return {
      totalCompleted,
      byCategory: categoryStats,
    };
  }, [tasks, categories]);

  const getCategoryColor = (categoryName: string): string => {
    const cat = categories.find(c => c.name === categoryName);
    return cat?.color || '#6B7280';
  };

  const getMaxWidth = (value: number, max: number): string => {
    return `${Math.max((value / max) * 100, 5)}%`;
  };

  if (!isOpen) return null;

  const maxMonthlyTotal = Math.max(...analyticsData.map(d => d.total), 1);
  const maxCategoryTotal = Math.max(...Object.values(overallStats.byCategory), 1);
  const categoryNames = Object.keys(overallStats.byCategory).sort();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between border-b border-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Task Analytics</h2>
              <p className="text-blue-100 text-sm">Categories completed per month</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Overall Stats Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-neutral-900">Overall Statistics</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Total Completed Tasks</p>
                <p className="text-4xl font-bold text-blue-600">{overallStats.totalCompleted}</p>
              </div>

              <div>
                <p className="text-sm text-neutral-600 mb-3">Tasks by Category</p>
                <div className="space-y-2">
                  {categoryNames.map(catName => (
                    <div key={catName} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-700">{catName}</span>
                      <span className="font-semibold text-neutral-900">
                        {overallStats.byCategory[catName]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Category Distribution Chart */}
          {categoryNames.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                Distribution by Category
              </h3>

              <div className="space-y-4 bg-neutral-50 p-4 rounded-lg">
                {categoryNames.map(catName => {
                  const count = overallStats.byCategory[catName];
                  const percentage = ((count / overallStats.totalCompleted) * 100).toFixed(1);
                  const color = getCategoryColor(catName);

                  return (
                    <div key={catName} className="space-y-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color }}
                          ></div>
                          <span className="text-sm font-medium text-neutral-900">{catName}</span>
                        </div>
                        <span className="text-sm font-semibold text-neutral-700">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: getMaxWidth(count, maxCategoryTotal),
                            backgroundColor: color,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Monthly Breakdown */}
          {analyticsData.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                Monthly Breakdown
              </h3>

              <div className="space-y-6">
                {analyticsData.map(monthData => (
                  <div key={`${monthData.year}-${monthData.monthNum}`} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-neutral-900">{monthData.month}</h4>
                      <span className="text-sm font-medium text-neutral-600">
                        {monthData.total} completed
                      </span>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(monthData.categories)
                        .sort((a, b) => b[1] - a[1])
                        .map(([catName, count]) => {
                          const color = getCategoryColor(catName);
                          const percentage = ((count / monthData.total) * 100).toFixed(0);

                          return (
                            <div
                              key={`${monthData.year}-${monthData.monthNum}-${catName}`}
                              className="space-y-1"
                            >
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: color }}
                                  ></div>
                                  <span className="text-neutral-700">{catName}</span>
                                </div>
                                <span className="font-medium text-neutral-900">
                                  {count} ({percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: getMaxWidth(count, maxMonthlyTotal),
                                    backgroundColor: color,
                                  }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">No completed tasks yet. Start completing tasks to see analytics!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
