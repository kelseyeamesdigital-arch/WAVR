-- Storage policies for the public "logos" bucket.
-- The app uploads each operator's logo to a path like "<user-id>/logo.png",
-- so we scope write access to the folder named after the operator's own user id.
-- Public read is provided by the bucket being marked Public, but we add an
-- explicit select policy too so it works regardless of that toggle.

-- Let anyone read logos (they're shown on public sign pages).
create policy "Public read logos"
  on storage.objects for select
  to public
  using (bucket_id = 'logos');

-- Operators can upload into their own folder.
create policy "Operators upload own logo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Operators can replace their own logo (the app uploads with upsert = update).
create policy "Operators update own logo"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Operators can delete their own logo.
create policy "Operators delete own logo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
