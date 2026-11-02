-- ==============================================================
-- FLATLY DATABASE SCHEMA FOR SUPABASE
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ==============================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- ==============================================================
-- 2. USER PROFILES TABLE
-- Linked with Supabase Auth (auth.users)
-- ==============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text,
  phone text,
  avatar_color text default '#FFD23F',
  habits jsonb default '{
    "sleepTime": "Moderate (11 PM - 1 AM)",
    "cleanliness": "Regular tidy up",
    "guests": "Weekends only",
    "foodPreference": "No preference",
    "smoking": "Non-smoker"
  }'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, phone, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Flatmate'),
    new.email,
    new.phone,
    '#FFD23F'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================
-- 3. FLATS TABLE
-- ==============================================================
create table if not exists public.flats (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rent numeric default 0,
  code text unique not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index if unfair on public.flats(code);

-- ==============================================================
-- 4. FLAT MEMBERS TABLE
-- Roommates inside each flat
-- ==============================================================
create table if not exists public.flat_members (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references public.flats(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  avatar_color text default '#FFD23F',
  role text default 'member', -- 'admin' or 'member'
  joined_at timestamptz default now()
);

create index if not exists idx_flat_members_flat on public.flat_members(flat_id);
create index if not exists idx_flat_members_user on public.flat_members(user_id);

-- ==============================================================
-- 5. EXPENSES TABLE (Hisab-Kitab)
-- ==============================================================
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references public.flats(id) on delete cascade,
  title text not null,
  amount numeric not null check (amount > 0),
  paid_by uuid not null references public.flat_members(id) on delete cascade,
  split_between uuid[] not null, -- Array of flat_member IDs
  date timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_expenses_flat on public.expenses(flat_id);

-- ==============================================================
-- 6. SETTLEMENTS TABLE
-- Records when members clear dues ("Settle Up")
-- ==============================================================
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references public.flats(id) on delete cascade,
  from_member uuid not null references public.flat_members(id) on delete cascade,
  to_member uuid not null references public.flat_members(id) on delete cascade,
  amount numeric not null check (amount > 0),
  date timestamptz default now()
);

create index if not exists idx_settlements_flat on public.settlements(flat_id);

-- ==============================================================
-- 7. CHORES TABLE (Aaj Ki Baari)
-- ==============================================================
create table if not exists public.chores (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references public.flats(id) on delete cascade,
  task text not null,
  assigned_to uuid references public.flat_members(id) on delete set null,
  frequency text default 'weekly', -- 'once' or 'weekly'
  due_day text not null,
  status text default 'pending', -- 'pending' or 'done'
  created_at timestamptz default now()
);

create index if not exists idx_chores_flat on public.chores(flat_id);

-- Chore Completions history (Used for monthly leaderboard)
create table if not exists public.chore_completions (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid not null references public.chores(id) on delete cascade,
  completed_by uuid references public.flat_members(id) on delete set null,
  completed_at timestamptz default now()
);

create index if not exists idx_chore_comp_chore on public.chore_completions(chore_id);

-- ==============================================================
-- 8. HOUSE RULES TABLE
-- ==============================================================
create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references public.flats(id) on delete cascade,
  text text not null,
  agreed_by uuid[] default '{}', -- Array of member IDs who agreed
  created_at timestamptz default now()
);

create index if not exists idx_rules_flat on public.rules(flat_id);

-- ==============================================================
-- 9. LISTINGS TABLE (Find a Room / Post Vacancy)
-- ==============================================================
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  location text not null,
  rent numeric not null check (rent > 0),
  seats integer not null default 1,
  description text not null,
  tags text[] default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_listings_location on public.listings(location);

-- ==============================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- Enabling RLS and providing open read/write for testing & authenticated app usage
-- ==============================================================

alter table public.profiles enable row level security;
alter table public.flats enable row level security;
alter table public.flat_members enable row level security;
alter table public.expenses enable row level security;
alter table public.settlements enable row level security;
alter table public.chores enable row level security;
alter table public.chore_completions enable row level security;
alter table public.rules enable row level security;
alter table public.listings enable row level security;

-- Profiles: Public read, user can update their own
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Flats & Flat data: Read and write policies
create policy "Flats viewable by everyone" on public.flats for all using (true);
create policy "Flat members viewable by everyone" on public.flat_members for all using (true);
create policy "Expenses accessible by all" on public.expenses for all using (true);
create policy "Settlements accessible by all" on public.settlements for all using (true);
create policy "Chores accessible by all" on public.chores for all using (true);
create policy "Chore completions accessible by all" on public.chore_completions for all using (true);
create policy "Rules accessible by all" on public.rules for all using (true);

-- Listings: Everyone can view all listings, authenticated users can insert/delete
create policy "Listings are viewable by everyone" on public.listings for select using (true);
create policy "Anyone can insert listings" on public.listings for insert with check (true);
create policy "Anyone can delete listings" on public.listings for delete using (true);

