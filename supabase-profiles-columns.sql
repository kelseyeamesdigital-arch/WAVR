-- Fix: "Could not find the 'address' column of 'profiles' in the schema cache".
-- The profiles table was created with fewer columns than the Settings form saves.
-- Add every column the form writes to. IF NOT EXISTS makes this safe to run even
-- though some columns already exist.

alter table public.profiles
  add column if not exists business_name text,
  add column if not exists logo_url      text,
  add column if not exists website       text,
  add column if not exists address       text,
  add column if not exists phone         text,
  add column if not exists email         text,
  add column if not exists primary_color text,
  add column if not exists updated_at    timestamptz default now();

-- Tell PostgREST to reload its schema cache immediately so the new columns are
-- usable without waiting.
notify pgrst, 'reload schema';
