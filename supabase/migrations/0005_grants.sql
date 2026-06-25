-- Table-level GRANTs. RLS policies only filter rows; without these grants
-- the roles can't touch the tables at all, regardless of policy.
grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables in schema public to service_role;

grant select, insert, update, delete on
  public.profiles,
  public.categories,
  public.questions,
  public.question_answers,
  public.quiz_settings,
  public.weekly_schedules,
  public.schedule_questions,
  public.quiz_attempts,
  public.attempt_answers
to authenticated;

alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
