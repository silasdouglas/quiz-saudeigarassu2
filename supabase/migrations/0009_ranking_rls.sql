-- Allow authenticated users to read completed attempts (needed for public ranking)
drop policy if exists quiz_attempts_select on public.quiz_attempts;

create policy quiz_attempts_select on public.quiz_attempts for select
  using (
    user_id = auth.uid()
    or public.is_admin()
    or (auth.role() = 'authenticated' and status = 'completed')
  );

-- Same for profiles: allow authenticated users to read any profile (for ranking names/avatars)
drop policy if exists profiles_select on public.profiles;

create policy profiles_select on public.profiles for select
  using (auth.role() = 'authenticated' or public.is_admin());
