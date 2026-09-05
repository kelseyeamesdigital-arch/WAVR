-- Map each operator to their subdomain so the app can tell which client a request
-- belongs to (e.g. awastone.wavr.app -> Awastone). Used for per-client branding
-- such as the "Add to Home Screen" icon.

alter table public.profiles
  add column if not exists subdomain text;

create unique index if not exists profiles_subdomain_key
  on public.profiles (subdomain)
  where subdomain is not null;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Now set each operator's subdomain. Run these AFTER the alter above.
-- The value is just the first part of their domain, with no ".wavr.app".
--
-- NOTE: there are currently two profiles named "Adventure Rafting Bled".
-- Only set the subdomain on the REAL one (the row whose logo_url points at
-- Supabase storage, id efdcbfc6-...). The other row (logo_url '/logo-full.png')
-- looks like a leftover — check it before deleting.
-- ---------------------------------------------------------------------------

update public.profiles
   set subdomain = 'adventure-rafting'
 where id = 'efdcbfc6-e823-4045-82d9-0a74d4b4113e';

update public.profiles
   set subdomain = 'awastone'
 where id = 'cdb98dbe-5070-4928-aff6-3104b13e4a68';
