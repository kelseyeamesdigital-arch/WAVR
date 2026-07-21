-- Fix: "new row violates row-level security policy" when saving Settings.
-- The profiles table allows reads but is missing working INSERT/UPDATE policies,
-- so operators can't save their own profile. These policies let each operator
-- write ONLY their own row (id = their user id). Additive and idempotent —
-- safe to run without touching the existing public-read policy.

alter table public.profiles enable row level security;

-- Operator can create their own profile row.
drop policy if exists "Profiles insert own" on public.profiles;
create policy "Profiles insert own"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

-- Operator can update their own profile row.
drop policy if exists "Profiles update own" on public.profiles;
create policy "Profiles update own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
