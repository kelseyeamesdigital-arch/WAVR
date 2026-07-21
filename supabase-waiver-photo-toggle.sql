-- Per-waiver toggle for the "email me the trip photos" opt-in on the sign page.
-- Defaults to true so existing waivers (e.g. ARB's) keep showing it.

alter table public.waivers
  add column if not exists photo_opt_in_enabled boolean not null default true;

notify pgrst, 'reload schema';
