-- Taskboard Supabase SQL Schema
-- Run this in your Supabase Project's SQL Editor to provision tables and real-time syncing:

-- 1. Create categories table
create table if not exists public.categories (
  id text primary key,
  name text not null,
  color text,
  subcategories jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create tasks table
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

-- 3. Enable Row Level Security (RLS) or public access for prototype
alter table public.categories enable row level security;
alter table public.tasks enable row level security;

-- Permissive policy for all operations (can be restricted to auth users if needed)
create policy "Allow all read access on categories" on public.categories for select using (true);
create policy "Allow all insert access on categories" on public.categories for insert with check (true);
create policy "Allow all update access on categories" on public.categories for update using (true);
create policy "Allow all delete access on categories" on public.categories for delete using (true);

create policy "Allow all read access on tasks" on public.tasks for select using (true);
create policy "Allow all insert access on tasks" on public.tasks for insert with check (true);
create policy "Allow all update access on tasks" on public.tasks for update using (true);
create policy "Allow all delete access on tasks" on public.tasks for delete using (true);

-- 4. Enable Realtime Replication
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.tasks;
