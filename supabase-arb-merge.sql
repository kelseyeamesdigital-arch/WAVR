-- Merge the duplicate ARB operator account into the real one.
--
-- FROM  41b8a600-d6fe-4e88-9782-4c264b6822b5  kelseyeamesdigital@gmail.com
--       (Kelsey's own early account — owns "Canyoning Waiver - GRMA + JEREKA"
--        and its 11 signed waivers from May)
-- TO    efdcbfc6-e823-4045-82d9-0a74d4b4113e  admin@adventure-rafting.com
--       (ARB's real account — 555 signed waivers)
--
-- Nothing is deleted. The waiver and all 11 signatures are preserved and simply
-- change owner, so ARB can see their own records. Runs as one transaction: if any
-- statement fails, the whole thing rolls back.

begin;

-- 1. Move the waiver
update public.waivers
   set operator_id = 'efdcbfc6-e823-4045-82d9-0a74d4b4113e'
 where operator_id = '41b8a600-d6fe-4e88-9782-4c264b6822b5';

-- 2. Move the signed waivers
update public.submissions
   set operator_id = 'efdcbfc6-e823-4045-82d9-0a74d4b4113e'
 where operator_id = '41b8a600-d6fe-4e88-9782-4c264b6822b5';

-- 3. Retire the old waiver so no NEW guests can sign it.
--    ARB already runs "Bled Canyoning Waiver" for current canyoning trips.
--    The 11 existing records stay fully intact and visible — this only stops
--    the old link from accepting new signatures.
--    >> Delete this statement if you'd rather keep the old link live. <<
update public.waivers
   set is_active = false
 where title = 'Canyoning Waiver - GRMA + JEREKA'
   and operator_id = 'efdcbfc6-e823-4045-82d9-0a74d4b4113e';

commit;

-- 4. Check the result: the old account should now show 0 and 0,
--    and ARB should hold 4 waivers and 566 signed waivers.
select
  p.id,
  u.email,
  (select count(*) from waivers w     where w.operator_id = p.id) as waivers,
  (select count(*) from submissions s where s.operator_id = p.id) as signed_waivers
from profiles p
left join auth.users u on u.id = p.id
where p.id in (
  '41b8a600-d6fe-4e88-9782-4c264b6822b5',
  'efdcbfc6-e823-4045-82d9-0a74d4b4113e'
);
