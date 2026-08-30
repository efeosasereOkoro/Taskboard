import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  X,
  RefreshCw,
  ArrowUpRight,
  UploadCloud,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import {
  getSupabase,
  getSupabaseCredentials,
  setCustomSupabaseCredentials,
  isSupabaseConfigured,
} from '../lib/supabase';
import { Task, Category } from '../types';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCloudConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  tasks: Task[];
  categories: Category[];
  onManualSync?: () => Promise<{ success: boolean; message: string }>;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  isCloudConnected,
  isSyncing,
  lastSyncedAt,
  tasks,
  categories,
  onManualSync,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedTaskSql, setCopiedTaskSql] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isPushing, setIsPushing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrlInput(creds.url);
      setKeyInput(creds.anonKey);
      setSyncStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sqlSchema = `-- Taskboard Supabase Setup
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

create policy "allow_all_categories" on public.categories for all using (true) with check (true);
create policy "allow_all_tasks" on public.tasks for all using (true) with check (true);

alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.tasks;`;

  const taskInsertSql = `-- Insert all current tasks including the Life Group Flyer task
INSERT INTO public.categories (id, name, color, subcategories) VALUES
('cat-work', 'Work', '#1868F2', '[{"id":"sub-client","name":"Clients"},{"id":"sub-internal","name":"Internal"},{"id":"sub-planning","name":"Planning"}]'::jsonb),
('cat-startup', 'Startup', '#7C3AED', '[{"id":"sub-product","name":"Product"},{"id":"sub-marketing","name":"Marketing"},{"id":"sub-investors","name":"Investors"}]'::jsonb),
('cat-personal', 'Personal', '#10B981', '[{"id":"sub-health","name":"Health"},{"id":"sub-finance","name":"Finance"},{"id":"sub-learning","name":"Learning"}]'::jsonb),
('cat-sidegig', 'Side Gig', '#F59E0B', '[{"id":"sub-content","name":"Content"},{"id":"sub-consulting","name":"Consulting"}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color, subcategories = EXCLUDED.subcategories;

INSERT INTO public.tasks (id, title, description, completed, timing, priority, category_id, sub_category_id, subtasks, created_at)
VALUES
('task-life-group-flyer', 'Share Life group flyer and survey link to the life group google chat group', 'Post flyer asset and survey form link into the Google Chat channel for the Life Group.', false, 'now', 'high', 'cat-personal', null, '[{"id":"subtask-lg-1","title":"Attach flyer image asset","completed":false},{"id":"subtask-lg-2","title":"Paste survey form link","completed":false}]'::jsonb, ${Date.now()})
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, timing = EXCLUDED.timing, priority = EXCLUDED.priority;
`;

  const handleSaveCredentials = async () => {
    setCustomSupabaseCredentials(urlInput, keyInput);
    if (onManualSync) {
      setIsPushing(true);
      const res = await onManualSync();
      setIsPushing(false);
      setSyncStatusMsg(res.message);
    } else {
      setSyncStatusMsg('Credentials saved!');
    }
  };

  const handlePushAllTasks = async () => {
    if (onManualSync) {
      setIsPushing(true);
      const res = await onManualSync();
      setIsPushing(false);
      setSyncStatusMsg(res.message);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyTaskSql = () => {
    navigator.clipboard.writeText(taskInsertSql);
    setCopiedTaskSql(true);
    setTimeout(() => setCopiedTaskSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-neutral-200/80 max-w-xl w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1868F2] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Supabase PostgreSQL Sync</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isCloudConnected ? 'bg-emerald-400/20 text-emerald-100' : 'bg-amber-400/20 text-amber-100'
                  }`}
                >
                  {isCloudConnected ? 'Connected' : 'Offline Mode'}
                </span>
              </div>
              <p className="text-blue-100 text-xs">Real-time database storage &amp; multi-device sync</p>
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
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-neutral-600">
          {/* Status Alert Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isCloudConnected
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            {isCloudConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">
                  {isCloudConnected ? 'Connected to Supabase' : 'Direct Supabase Integration'}
                </h4>
                {lastSyncedAt && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Synced: {lastSyncedAt.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-neutral-700 leading-relaxed">
                {isCloudConnected
                  ? `Your tasks table is live on Supabase. Every task add, update, and drag-and-drop order change syncs directly to public.tasks.`
                  : `Save your Supabase Project URL and Anon API key below or run the SQL seed query directly in Supabase.`}
              </p>
            </div>
          </div>

          {syncStatusMsg && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl font-medium text-xs flex items-center justify-between">
              <span>{syncStatusMsg}</span>
              <button
                onClick={() => setSyncStatusMsg(null)}
                className="text-blue-600 hover:text-blue-900 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Direct Credentials Box */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-[#1868F2]" />
                <span>Supabase API Credentials</span>
              </div>
              <span className="text-[10px] text-neutral-500">From Supabase Project Settings ➔ API</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-mono text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#1868F2]/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Anon / Public API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-mono text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#1868F2]/30"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSaveCredentials}
                disabled={isPushing}
                className="px-3.5 py-1.5 bg-[#1868F2] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPushing ? 'animate-spin' : ''}`} />
                <span>Save &amp; Sync Now</span>
              </button>

              <button
                onClick={handlePushAllTasks}
                disabled={isPushing}
                className="px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <UploadCloud className="w-3.5 h-3.5 text-neutral-600" />
                <span>Push All {tasks.length} Tasks to Database</span>
              </button>
            </div>
          </div>

          {/* Quick SQL Inserts to run directly in Supabase */}
          <div className="p-4 bg-neutral-900 text-neutral-200 rounded-xl space-y-3 border border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Database className="w-4 h-4 text-blue-400" />
                <span>Direct SQL Seed &amp; Query Option</span>
              </span>
              <span className="text-[10px] text-blue-300 font-mono">SQL Editor</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              If you want to immediately populate your <code className="text-blue-300 font-mono">public.tasks</code> table with all tasks (including <em>&quot;Share Life group flyer and survey link...&quot;</em>), click below and run it in your Supabase SQL Editor:
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopyTaskSql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs cursor-pointer"
              >
                {copiedTaskSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copied Tasks SQL!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Task Insert SQL (All Tasks)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 font-semibold rounded-lg text-xs transition-colors shadow-2xs cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Table Schema!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Table Schema</span>
                  </>
                )}
              </button>
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
            <span>Open Supabase Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-2xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
