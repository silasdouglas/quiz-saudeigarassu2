-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.questions enable row level security;
alter table public.question_answers enable row level security;
alter table public.quiz_settings enable row level security;
alter table public.weekly_schedules enable row level security;
alter table public.schedule_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.attempt_answers enable row level security;

-- profiles
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid() or public.is_admin());
create policy profiles_delete_admin on public.profiles for delete
  using (public.is_admin());

-- categories: everyone logged in can read, only admin writes
create policy categories_select on public.categories for select
  using (auth.role() = 'authenticated');
create policy categories_admin_write on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

-- questions: logged in users can read active questions; admin full access
create policy questions_select on public.questions for select
  using (active = true or public.is_admin());
create policy questions_admin_write on public.questions for all
  using (public.is_admin()) with check (public.is_admin());

-- correct answers: admin only, ever
create policy question_answers_admin_only on public.question_answers for all
  using (public.is_admin()) with check (public.is_admin());

-- settings: readable by all logged in users, writable by admin only
create policy quiz_settings_select on public.quiz_settings for select
  using (auth.role() = 'authenticated');
create policy quiz_settings_admin_write on public.quiz_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- schedules: readable by all logged in users, writable by admin only
create policy weekly_schedules_select on public.weekly_schedules for select
  using (auth.role() = 'authenticated');
create policy weekly_schedules_admin_write on public.weekly_schedules for all
  using (public.is_admin()) with check (public.is_admin());

create policy schedule_questions_select on public.schedule_questions for select
  using (auth.role() = 'authenticated');
create policy schedule_questions_admin_write on public.schedule_questions for all
  using (public.is_admin()) with check (public.is_admin());

-- attempts: users see/manage their own; admin sees all
create policy quiz_attempts_select on public.quiz_attempts for select
  using (user_id = auth.uid() or public.is_admin());
create policy quiz_attempts_insert on public.quiz_attempts for insert
  with check (user_id = auth.uid());
create policy quiz_attempts_update on public.quiz_attempts for update
  using (user_id = auth.uid() or public.is_admin());

-- attempt_answers: read own (or admin); writes only via security-definer functions below
create policy attempt_answers_select on public.attempt_answers for select
  using (
    public.is_admin()
    or exists (select 1 from public.quiz_attempts qa where qa.id = attempt_id and qa.user_id = auth.uid())
  );
