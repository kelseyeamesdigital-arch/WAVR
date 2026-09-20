-- September updates. Safe to run more than once.
--   1. Operator timezone (fixes "today" being yesterday for NZ)
--   2. Returning-guest fast-track (per-waiver toggle + automatic record linking)

-- ── 1. Operator timezone ────────────────────────────────────────────────────
-- Each operator's IANA timezone, so "today" on their dashboard and the default
-- trip date on their sign pages use THEIR local date, not UTC.

alter table public.profiles
  add column if not exists timezone text;

update public.profiles
   set timezone = 'Europe/Ljubljana'
 where id = 'efdcbfc6-e823-4045-82d9-0a74d4b4113e';   -- Adventure Rafting Bled

update public.profiles
   set timezone = 'Pacific/Auckland'
 where id = 'cdb98dbe-5070-4928-aff6-3104b13e4a68';   -- Awastone, Mangaweka


-- ── 2. Returning-guest fast-track ───────────────────────────────────────────
-- Per-waiver switch (off by default).
alter table public.waivers
  add column if not exists returning_guest_enabled boolean not null default false;

-- A returning guest who reports no medical changes is saved with has_medical
-- unknown (null) until the trigger below copies it from their earlier waiver.
-- (No-op if the column already allows nulls.)
alter table public.submissions
  alter column has_medical drop not null;

-- When a guest says "I've been before", they skip most questions, so their new
-- submission arrives without email/age/country/medical. This trigger attaches
-- those from their most recent earlier waiver with the same operator + name.
--
-- It only links when the name maps to exactly ONE person (one distinct email).
-- If there's no earlier record, or two different people share the name, it
-- leaves the details blank and flags the row for staff instead of guessing.
--
-- SECURITY DEFINER so it can read earlier submissions even though the guest
-- (anonymous) can't — the guest never sees any of this data.

create or replace function public.link_returning_guest()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prior          record;
  distinct_people int;
begin
  if coalesce(new.form_data ->> 'returning_guest', 'false') <> 'true' then
    return new;
  end if;

  select count(distinct lower(coalesce(guest_email, '')))
    into distinct_people
    from submissions
   where operator_id = new.operator_id
     and lower(trim(guest_name)) = lower(trim(new.guest_name))
     and coalesce(form_data ->> 'returning_guest', 'false') <> 'true';

  if distinct_people <> 1 then
    new.form_data := new.form_data || jsonb_build_object(
      'link_status', case when distinct_people = 0 then 'no_match' else 'ambiguous' end
    );
    return new;
  end if;

  select id, guest_email, guest_age, guest_country, has_medical
    into prior
    from submissions
   where operator_id = new.operator_id
     and lower(trim(guest_name)) = lower(trim(new.guest_name))
     and coalesce(form_data ->> 'returning_guest', 'false') <> 'true'
   order by created_at desc
   limit 1;

  new.guest_email   := coalesce(new.guest_email,   prior.guest_email);
  new.guest_age     := coalesce(new.guest_age,     prior.guest_age);
  new.guest_country := coalesce(new.guest_country, prior.guest_country);
  -- Only inherit the medical flag if they said nothing changed (has_medical null);
  -- if they updated their medical answers, the new answers stand.
  new.has_medical   := coalesce(new.has_medical,   prior.has_medical);
  new.form_data := new.form_data || jsonb_build_object(
    'link_status', 'linked',
    'linked_submission_id', prior.id
  );
  return new;
end;
$$;

drop trigger if exists link_returning_guest on public.submissions;
create trigger link_returning_guest
  before insert on public.submissions
  for each row execute function public.link_returning_guest();

notify pgrst, 'reload schema';
