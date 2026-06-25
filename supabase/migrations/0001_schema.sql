-- Quiz Saude Igarassu - core schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  difficulty text not null check (difficulty in ('facil','media','dificil')),
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  points int generated always as (
    case difficulty
      when 'facil' then 5
      when 'media' then 10
      when 'dificil' then 15
    end
  ) stored,
  time_limit_seconds int not null default 60 check (time_limit_seconds > 0),
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- correct answer kept in a separate, admin-only-readable table
create table if not exists public.question_answers (
  question_id uuid primary key references public.questions(id) on delete cascade,
  correct_option text not null check (correct_option in ('a','b','c','d'))
);

create table if not exists public.quiz_settings (
  id boolean primary key default true check (id),
  default_time_limit_seconds int not null default 60 check (default_time_limit_seconds > 0),
  tab_switch_penalty_points int not null default 5 check (tab_switch_penalty_points >= 0),
  max_tab_switches int not null default 3 check (max_tab_switches >= 0),
  updated_at timestamptz not null default now()
);
insert into public.quiz_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.weekly_schedules (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.schedule_questions (
  schedule_id uuid not null references public.weekly_schedules(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  primary key (schedule_id, question_id)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  total_score int not null default 0,
  total_time_seconds numeric not null default 0,
  tab_switch_count int not null default 0,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  unique (user_id, week_start)
);

create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option text check (selected_option in ('a','b','c','d')),
  is_correct boolean not null default false,
  points_awarded int not null default 0,
  time_taken_seconds numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists idx_questions_category on public.questions(category_id);
create index if not exists idx_questions_difficulty on public.questions(difficulty);
create index if not exists idx_schedule_questions_schedule on public.schedule_questions(schedule_id);
create index if not exists idx_quiz_attempts_week on public.quiz_attempts(week_start);
create index if not exists idx_quiz_attempts_user on public.quiz_attempts(user_id);
create index if not exists idx_attempt_answers_attempt on public.attempt_answers(attempt_id);
create index if not exists idx_attempt_answers_question on public.attempt_answers(question_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_questions_updated_at on public.questions;
create trigger trg_questions_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();
