-- Run this in your Supabase SQL Editor

-- Waivers created by operators
create table waivers (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  body_text text not null default '',
  fields jsonb not null default '[]',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Guest submissions (one per signed waiver)
create table submissions (
  id uuid primary key default gen_random_uuid(),
  waiver_id uuid references waivers(id) on delete cascade not null,
  operator_id uuid references auth.users(id) on delete cascade not null,
  guest_name text not null,
  guest_email text,
  guest_age integer,
  guest_country text,
  form_data jsonb not null default '{}',
  signature_url text,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table waivers enable row level security;
alter table submissions enable row level security;

-- Operators can only see their own waivers
create policy "Operators manage own waivers"
  on waivers for all
  using (operator_id = auth.uid())
  with check (operator_id = auth.uid());

-- Operators can only see their own submissions
create policy "Operators manage own submissions"
  on submissions for all
  using (operator_id = auth.uid())
  with check (operator_id = auth.uid());

-- Anyone can read a waiver by ID (for the guest signing page)
create policy "Public can read active waivers"
  on waivers for select
  using (is_active = true);

-- Anyone (unauthenticated guests) can insert a submission
create policy "Guests can submit waivers"
  on submissions for insert
  with check (true);

-- Indexes for common queries
create index on waivers (operator_id, created_at desc);
create index on submissions (operator_id, created_at desc);
create index on submissions (waiver_id);
