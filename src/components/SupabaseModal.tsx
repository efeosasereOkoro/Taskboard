import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, X, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCloudConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  isCloudConnected,
  isSyncing,
  lastSyncedAt,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const sqlSchema = `-- Run this in Supabase SQL Editor:
create table if not exists public.categories (
  id text primary key,
  name text not null,
  color text,
  subcategories jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.tasks (
  id text primary key,
  title text not null,
  description text,
  completed boolean default false not null,
  timing text check (timing in ('now', 'next', 'later')) not null default 'now',
  priority text check (priority in ('high', 'medium', 'low')) not null default 'medium',
  category_id text references public.categories(id) on delete set null,
  sub_category_id text,
  subtasks jsonb default '[]'::jsonb,
  created_at bigint not null,
  completed_at bigint,
  "order" bigint
);

alter table public.categories enable row level security;
alter table public.tasks enable row level security;

create policy "categories_all" on public.categories for all using (true);
create policy "tasks_all" on public.tasks for all using (true);

alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.tasks;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-neutral-200/80 max-w-lg w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1868F2] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Supabase Cloud Sync</h2>
              <p className="text-blue-100 text-xs">Real-time multi-device PostgreSQL backend</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Connection Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isCloudConnected
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            {isCloudConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-bold text-sm">
                {isCloudConnected ? 'Connected to Supabase' : 'Supabase Credentials Pending'}
              </h4>
              <p className="mt-0.5 text-neutral-600">
                {isCloudConnected
                  ? `Live real-time sync is active. Changes to tasks and categories sync instantly across devices.`
                  : `Set your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment settings to enable live cloud persistence.`}
              </p>
              {lastSyncedAt && (
                <p className="text-[11px] text-neutral-500 mt-1">
                  Last synced: {lastSyncedAt.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="space-y-3">
            <h4 className="font-bold text-neutral-900 text-sm">How to Connect in 2 Steps:</h4>
            
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
              <div className="font-semibold text-neutral-800">1. Run SQL Schema in Supabase</div>
              <p className="text-neutral-600 leading-relaxed">
                Copy the pre-built schema and paste it into the <strong>SQL Editor</strong> on your Supabase dashboard.
              </p>
              <button
                onClick={handleCopySql}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 font-semibold rounded-lg text-neutral-800 transition-colors shadow-2xs"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied SQL!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Copy Schema SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
              <div className="font-semibold text-neutral-800">2. Configure Environment Variables</div>
              <p className="text-neutral-600 leading-relaxed">
                Add your Project URL and anon public API key:
              </p>
              <div className="bg-neutral-900 text-neutral-200 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto select-all">
                <div>VITE_SUPABASE_URL=https://your-project.supabase.co</div>
                <div>VITE_SUPABASE_ANON_KEY=eyJhbGciOi...</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#1868F2] hover:underline flex items-center gap-1"
          >
            <span>Supabase Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
