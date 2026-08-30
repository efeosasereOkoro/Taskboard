import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, FolderPlus, RotateCcw, Tag } from 'lucide-react';
import { Category } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (name: string, color?: string) => void;
  onUpdateCategory: (id: string, name: string, color?: string) => void;
  onDeleteCategory: (id: string) => void;
  onAddSubCategory: (categoryId: string, name: string) => void;
  onUpdateSubCategory: (categoryId: string, subId: string, name: string) => void;
  onDeleteSubCategory: (categoryId: string, subId: string) => void;
  onResetDefaults: () => void;
}

const PRESET_COLORS = [
  '#1868F2', // Taskboard Blue
  '#8B5CF6', // Purple
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#64748B', // Slate
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddSubCategory,
  onUpdateSubCategory,
  onDeleteSubCategory,
  onResetDefaults,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#1868F2');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  const [activeSubInputCatId, setActiveSubInputCatId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');

  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState('');

  if (!isOpen) return null;

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      onAddCategory(newCatName.trim(), newCatColor);
      setNewCatName('');
    }
  };

  const handleSaveCatEdit = (catId: string) => {
    if (editingCatName.trim()) {
      onUpdateCategory(catId, editingCatName.trim());
      setEditingCatId(null);
      setEditingCatName('');
    }
  };

  const handleCreateSubCategory = (catId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (newSubName.trim()) {
      onAddSubCategory(catId, newSubName.trim());
      setNewSubName('');
      setActiveSubInputCatId(null);
    }
  };

  const handleSaveSubEdit = (catId: string, subId: string) => {
    if (editingSubName.trim()) {
      onUpdateSubCategory(catId, subId, editingSubName.trim());
      setEditingSubId(null);
      setEditingSubName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              Manage Categories & Subcategories
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Organize your work, startups, side gigs, and personal tasks.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categories List Container */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Add New Category Form */}
          <form
            onSubmit={handleCreateCategory}
            className="bg-blue-50/40 p-3.5 rounded-xl border border-blue-100 flex flex-col gap-2.5"
          >
            <div className="text-xs font-semibold text-[#1868F2] flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create New Category</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Category name (e.g., WORK, STARTUP, HEALTH)..."
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-white rounded-lg border border-neutral-200 focus:outline-none focus:border-[#1868F2] focus:ring-1 focus:ring-[#1868F2]"
              />
              <div className="flex items-center gap-1">
                {PRESET_COLORS.slice(0, 5).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      newCatColor === c ? 'scale-125 ring-2 ring-blue-500 ring-offset-1' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#1868F2] text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
          </form>

          {/* Existing Categories */}
          <div className="space-y-3">
            {categories.map(cat => {
              const isEditingThisCat = editingCatId === cat.id;
              const isAddingSub = activeSubInputCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="bg-neutral-50/80 rounded-xl p-3.5 border border-neutral-200/80 space-y-2.5 transition-all"
                >
                  {/* Category Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || '#1868F2' }}
                      />

                      {isEditingThisCat ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={editingCatName}
                            onChange={e => setEditingCatName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveCatEdit(cat.id);
                              if (e.key === 'Escape') setEditingCatId(null);
                            }}
                            autoFocus
                            className="text-xs sm:text-sm font-bold bg-white border border-blue-400 rounded px-2 py-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveCatEdit(cat.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCatId(null)}
                            className="p-1 text-neutral-400 hover:bg-neutral-200 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-sm text-neutral-900 tracking-tight">
                          {cat.name}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditingCatName(cat.name);
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded"
                        title="Rename Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat.id)}
                        className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories Container */}
                  <div className="pl-5 space-y-1.5 border-l-2 border-neutral-200 ml-1.5">
                    {cat.subcategories.map(sub => {
                      const isEditingThisSub = editingSubId === sub.id;

                      return (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg bg-white border border-neutral-100 text-xs text-neutral-700"
                        >
                          {isEditingThisSub ? (
                            <div className="flex items-center gap-1.5 flex-1">
                              <input
                                type="text"
                                value={editingSubName}
                                onChange={e => setEditingSubName(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveSubEdit(cat.id, sub.id);
                                  if (e.key === 'Escape') setEditingSubId(null);
                                }}
                                autoFocus
                                className="flex-1 bg-white border border-blue-400 rounded px-1.5 py-0.5 text-xs text-neutral-900"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveSubEdit(cat.id, sub.id)}
                                className="p-0.5 text-emerald-600"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSubId(null)}
                                className="p-0.5 text-neutral-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-medium truncate">{sub.name}</span>
                          )}

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSubId(sub.id);
                                setEditingSubName(sub.name);
                              }}
                              className="p-1 text-neutral-300 hover:text-neutral-700"
                              title="Rename subcategory"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteSubCategory(cat.id, sub.id)}
                              className="p-1 text-neutral-300 hover:text-rose-500"
                              title="Delete subcategory"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Subcategory input */}
                    {isAddingSub ? (
                      <form
                        onSubmit={e => handleCreateSubCategory(cat.id, e)}
                        className="flex items-center gap-1 pt-1"
                      >
                        <input
                          type="text"
                          value={newSubName}
                          onChange={e => setNewSubName(e.target.value)}
                          placeholder="Subcategory name (e.g., Teasoo Consulting, PrepIQ)..."
                          autoFocus
                          className="flex-1 px-2.5 py-1 text-xs bg-white rounded-md border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          className="px-2.5 py-1 bg-[#1868F2] text-white rounded-md text-xs font-semibold hover:bg-blue-700"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSubInputCatId(null);
                            setNewSubName('');
                          }}
                          className="px-2 py-1 text-xs text-neutral-400 hover:text-neutral-600"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSubInputCatId(cat.id);
                          setNewSubName('');
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-[#1868F2] py-0.5 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add subcategory to {cat.name}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/60">
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset categories and tasks to the default product structure?')) {
                onResetDefaults();
                onClose();
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to default structure</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
