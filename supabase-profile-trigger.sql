-- Auto-create a profiles row whenever a new operator account is created.
-- Runs when you add a user in Supabase (Dashboard → Authentication → Add user).
-- Put the business name in the new user's "User Metadata" as { "business_name": "..." }
-- and it will be copied into their profile automatically.
--
-- Safe to run more than once (CREATE OR REPLACE + DROP IF EXISTS).

create or replace function public.handle_new_operator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, business_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'business_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_operator();
