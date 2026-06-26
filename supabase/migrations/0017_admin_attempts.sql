-- Admin: inspect every user's quiz attempt and answers, and reset an attempt
-- so the user can take the quiz again. All functions are admin-guarded and run
-- security definer because RLS hides other users' attempts/answers and the
-- correct options live in the admin-only question_answers table.

-- List every attempt with its owner and answer tallies, newest first.
create or replace function public.admin_list_attempts()
returns table (
  attempt_id uuid,
  user_id uuid,
  full_name text,
  email text,
  funcao text,
  role text,
  week_start date,
  status text,
  total_score int,
  total_time_seconds numeric,
  tab_switch_count int,
  started_at timestamptz,
  finished_at timestamptz,
  answered_count bigint,
  correct_count bigint
)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  return query
    select qa.id, qa.user_id, p.full_name, p.email, p.funcao, p.role,
      qa.week_start, qa.status, qa.total_score, qa.total_time_seconds,
      qa.tab_switch_count, qa.started_at, qa.finished_at,
      count(aa.id)::bigint as answered_count,
      count(aa.id) filter (where aa.is_correct)::bigint as correct_count
    from public.quiz_attempts qa
    join public.profiles p on p.id = qa.user_id
    left join public.attempt_answers aa on aa.attempt_id = qa.id
    group by qa.id, p.full_name, p.email, p.funcao, p.role
    order by qa.week_start desc, p.full_name asc, qa.started_at desc;
end;
$$;
grant execute on function public.admin_list_attempts() to authenticated;

-- Per-answer detail for one attempt, including the correct option.
create or replace function public.admin_get_attempt_answers(p_attempt_id uuid)
returns table (
  question_id uuid,
  question_text text,
  difficulty text,
  category_name text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  selected_option text,
  correct_option text,
  is_correct boolean,
  points_awarded int,
  time_taken_seconds numeric
)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  return query
    select q.id, q.question_text, q.difficulty, c.name,
      q.option_a, q.option_b, q.option_c, q.option_d,
      aa.selected_option, ans.correct_option, aa.is_correct,
      aa.points_awarded, aa.time_taken_seconds
    from public.attempt_answers aa
    join public.questions q on q.id = aa.question_id
    left join public.categories c on c.id = q.category_id
    left join public.question_answers ans on ans.question_id = q.id
    where aa.attempt_id = p_attempt_id
    order by aa.created_at asc;
end;
$$;
grant execute on function public.admin_get_attempt_answers(uuid) to authenticated;

-- Delete an attempt (answers cascade) so the user can retake the quiz.
-- For the current week this lets the user start a fresh attempt immediately.
create or replace function public.admin_reset_attempt(p_attempt_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  delete from public.quiz_attempts where id = p_attempt_id;
end;
$$;
grant execute on function public.admin_reset_attempt(uuid) to authenticated;
