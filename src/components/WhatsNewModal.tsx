import React from 'react';
import { Sparkles, GripVertical, CheckCircle2, Database, X } from 'lucide-react';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateFocusMode?: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen,
  onClose,
  onActivateFocusMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-neutral-200/80 max-w-md w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="bg-[#1868F2] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">What&apos;s New in Taskboard</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white">
                  v1.3.0
                </span>
              </div>
              <p className="text-blue-100 text-xs">Today column &amp; drag to prioritize</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-neutral-600">
          {/* Feature 1: Drag to Reorder */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <GripVertical className="w-4 h-4 text-[#1868F2]" />
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 text-sm">Drag &amp; Drop Prioritization</h4>
              <p className="mt-0.5 leading-relaxed">
                Drag any card up or down to set its priority, or drop it into another column. A blue line shows exactly where it will land, and the order is saved.
              </p>
            </div>
          </div>

          {/* Feature 2: Today column */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 text-sm">New &ldquo;Today&rdquo; Column</h4>
              <p className="mt-0.5 leading-relaxed">
                A dedicated <strong>Today</strong> column sits before Now, so you can pull out the handful of things you are actually doing today.
              </p>
            </div>
          </div>

          {/* Feature 3: Focus Mode */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 text-sm">Focus Mode</h4>
              <p className="mt-0.5 leading-relaxed">
                Collapse Now, Next and Later to focus exclusively on your <strong>Today</strong> tasks without distractions.
              </p>
            </div>
          </div>

          {/* Feature 4: Supabase Sync */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
              <Database className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 text-sm">Supabase PostgreSQL Sync</h4>
              <p className="mt-0.5 leading-relaxed">
                Real-time multi-device cloud synchronization. Changes to tasks and categories sync live in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-2">
          {onActivateFocusMode && (
            <button
              onClick={onActivateFocusMode}
              className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs transition-colors"
            >
              Try Focus Mode
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1868F2] hover:bg-[#1456ca] text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
