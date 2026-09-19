-- Each operator's timezone (IANA name), so "today" on their dashboard and the
-- default trip date on their sign pages use THEIR local date, not UTC.

alter table public.profiles
  add column if not exists timezone text;

notify pgrst, 'reload schema';

-- Set the two current operators. (New operators can pick theirs in Settings.)
update public.profiles
   set timezone = 'Europe/Ljubljana'
 where id = 'efdcbfc6-e823-4045-82d9-0a74d4b4113e';   -- Adventure Rafting Bled

update public.profiles
   set timezone = 'Pacific/Auckland'
 where id = 'cdb98dbe-5070-4928-aff6-3104b13e4a68';   -- Awastone, Mangaweka
