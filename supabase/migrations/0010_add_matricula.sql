alter table public.profiles add column if not exists matricula text;

-- update trigger to capture matricula from user metadata on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, matricula, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'matricula',
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
