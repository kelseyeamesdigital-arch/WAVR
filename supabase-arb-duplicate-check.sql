-- READ-ONLY. Changes nothing. Run this and send back the result.
--
-- There are two "Adventure Rafting Bled" operator accounts and the older one owns
-- a live waiver ("Canyoning Waiver - GRMA + JEREKA"). Before merging them we need
-- to know which account ARB's staff actually log in to, and what each one holds —
-- deleting the wrong one would take its signed waivers with it.

select
  p.id,
  p.business_name,
  p.subdomain,
  p.timezone,
  u.email,
  u.last_sign_in_at,
  u.created_at                                                as account_created,
  (select count(*) from waivers w
     where w.operator_id = p.id)                              as waivers_total,
  (select count(*) from waivers w
     where w.operator_id = p.id and w.is_active)              as waivers_active,
  (select string_agg(w.title, ' | ' order by w.title) from waivers w
     where w.operator_id = p.id)                              as waiver_titles,
  (select count(*) from submissions s
     where s.operator_id = p.id)                              as signed_waivers,
  (select max(s.created_at) from submissions s
     where s.operator_id = p.id)                              as last_signature
from profiles p
left join auth.users u on u.id = p.id
order by u.created_at;
