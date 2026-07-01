-- CLEANUP: drop the dead Portuguese-named legacy schema.
-- The live app uses the English tables exclusively (questions, question_answers,
-- categories, weekly_schedules, schedule_questions, quiz_attempts, attempt_answers).
-- The PT tables/functions below are an old, unreferenced parallel schema: no app
-- code touches them and their helper functions pointed at a `perfis` table that no
-- longer exists (email_by_matricula/matricula_existe/admin_toggle_ativo were broken;
-- admin_resetar_quiz_semana operated on the dead PT tables). email_by_matricula and
-- matricula_existe were also EXECUTE-granted to anon — removing them closes a latent
-- PII-enumeration surface.

drop function if exists public.email_by_matricula(text);
drop function if exists public.matricula_existe(text);
drop function if exists public.admin_toggle_ativo(uuid, boolean);
drop function if exists public.admin_resetar_quiz_semana(uuid, text);

drop table if exists public.respostas cascade;
drop table if exists public.semana_perguntas cascade;
drop table if exists public.sessoes_quiz cascade;
drop table if exists public.alternativas cascade;
drop table if exists public.perguntas cascade;
