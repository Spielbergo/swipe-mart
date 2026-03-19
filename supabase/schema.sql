-- Run this in the Supabase SQL Editor to set up SwipeMart's database schema.
-- Dashboard → SQL Editor → New query → paste → Run

-- ─────────────────────────────────────────────
-- Enable Row Level Security helper
-- ─────────────────────────────────────────────

-- Profiles (one per user)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can upsert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ─────────────────────────────────────────────
-- Watchlist
-- ─────────────────────────────────────────────

create table if not exists public.watchlist (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  product_id   text not null,
  product_data jsonb not null,
  source       text,
  created_at   timestamptz default now(),
  unique (user_id, product_id)
);

alter table public.watchlist enable row level security;

create policy "Users can view own watchlist"
  on public.watchlist for select
  using (auth.uid() = user_id);

create policy "Users can add to watchlist"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from watchlist"
  on public.watchlist for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Trigger: auto-create profile on signup
-- ─────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
