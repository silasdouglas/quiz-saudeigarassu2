-- Security-definer RPCs for the quiz flow, ranking, and admin dashboard.
-- These exist because question_answers and other users' profiles are locked
-- down by RLS; the functions below are the only sanctioned way to read/write
-- across those boundaries, and every one re-checks auth.uid() internally.

create or replace function public.current_week_start()
returns date
language sql stable
as $$
  select date_trunc('week', now())::date;
$$;

-- Starts (or resumes) the current week's attempt for the calling user.
create or replace function public.start_weekly_attempt()
returns public.quiz_attempts
language plpgsql security definer set search_path = public
as $$
declare
  v_week date := public.current_week_start();
  v_attempt public.quiz_attempts;
begin
  select * into v_attempt from public.quiz_attempts
    where user_id = auth.uid() and week_start = v_week;

  if v_attempt.id is null then
    insert into public.quiz_attempts (user_id, week_start)
    values (auth.uid(), v_week)
    returning * into v_attempt;
  end if;

  return v_attempt;
end;
$$;
grant execute on function public.start_weekly_attempt() to authenticated;

-- Records one answer, scores it server-side (the correct option is never
-- sent to the client), and updates the attempt's running total.
create or replace function public.submit_answer(
  p_attempt_id uuid,
  p_question_id uuid,
  p_selected_option text,
  p_time_taken_seconds numeric
)
returns table (is_correct boolean, points_awarded int, total_score int)
language plpgsql security definer set search_path = public
as $$
declare
  v_correct text;
  v_points int;
  v_is_correct boolean;
  v_awarded int;
  v_existing public.attempt_answers;
begin
  if not exists (
    select 1 from public.quiz_attempts
    where id = p_attempt_id and user_id = auth.uid() and status = 'in_progress'
  ) then
    raise exception 'attempt not found or not in progress';
  end if;

  select correct_option into v_correct
    from public.question_answers where question_id = p_question_id;
  select points into v_points
    from public.questions where id = p_question_id;

  if v_correct is null or v_points is null then
    raise exception 'question not found';
  end if;

  v_is_correct := (v_correct = p_selected_option);
  v_awarded := case when v_is_correct then v_points else 0 end;

  insert into public.attempt_answers
    (attempt_id, question_id, selected_option, is_correct, points_awarded, time_taken_seconds)
  values
    (p_attempt_id, p_question_id, p_selected_option, v_is_correct, v_awarded, p_time_taken_seconds)
  on conflict (attempt_id, question_id) do nothing
  returning * into v_existing;

  if v_existing.id is null then
    -- already answered earlier; return the original result, don't double-score
    select * into v_existing from public.attempt_answers
      where attempt_id = p_attempt_id and question_id = p_question_id;
  else
    update public.quiz_attempts
      set total_score = total_score + v_awarded,
          total_time_seconds = total_time_seconds + p_time_taken_seconds
      where id = p_attempt_id;
  end if;

  return query
    select v_existing.is_correct, v_existing.points_awarded,
      (select qa.total_score from public.quiz_attempts qa where qa.id = p_attempt_id);
end;
$$;
grant execute on function public.submit_answer(uuid, uuid, text, numeric) to authenticated;

-- Called when the client detects a tab/visibility switch. Deducts the
-- configured penalty and auto-finishes the attempt once the switch limit
-- is reached, so a user can't just keep tabbing away indefinitely.
create or replace function public.apply_tab_switch_penalty(p_attempt_id uuid)
returns table (tab_switch_count int, total_score int, limit_reached boolean)
language plpgsql security definer set search_path = public
as $$
declare
  v_penalty int;
  v_max int;
  v_attempt public.quiz_attempts;
begin
  select tab_switch_penalty_points, max_tab_switches
    into v_penalty, v_max
    from public.quiz_settings where id = true;

  update public.quiz_attempts
    set tab_switch_count = tab_switch_count + 1,
        total_score = greatest(0, total_score - v_penalty)
    where id = p_attempt_id and user_id = auth.uid() and status = 'in_progress'
    returning * into v_attempt;

  if v_attempt.id is null then
    raise exception 'attempt not found or not in progress';
  end if;

  if v_attempt.tab_switch_count >= v_max then
    update public.quiz_attempts
      set status = 'completed', finished_at = now()
      where id = p_attempt_id
      returning * into v_attempt;
  end if;

  return query select v_attempt.tab_switch_count, v_attempt.total_score,
    (v_attempt.status = 'completed');
end;
$$;
grant execute on function public.apply_tab_switch_penalty(uuid) to authenticated;

create or replace function public.finish_attempt(p_attempt_id uuid)
returns public.quiz_attempts
language plpgsql security definer set search_path = public
as $$
declare
  v_attempt public.quiz_attempts;
begin
  update public.quiz_attempts
    set status = 'completed', finished_at = now()
    where id = p_attempt_id and user_id = auth.uid() and status = 'in_progress'
    returning * into v_attempt;

  if v_attempt.id is null then
    raise exception 'attempt not found or not in progress';
  end if;

  return v_attempt;
end;
$$;
grant execute on function public.finish_attempt(uuid) to authenticated;

-- Ranking: profiles of other users are locked by RLS, so the leaderboard
-- has to go through a definer function that returns only the DTO fields
-- needed for display (no email, no role).
create or replace function public.get_weekly_ranking(p_week_start date)
returns table (
  user_id uuid, full_name text, total_score int,
  total_time_seconds numeric, finished_at timestamptz
)
language sql security definer set search_path = public stable
as $$
  select qa.user_id, p.full_name, qa.total_score, qa.total_time_seconds, qa.finished_at
  from public.quiz_attempts qa
  join public.profiles p on p.id = qa.user_id
  where qa.week_start = p_week_start and qa.status = 'completed'
  order by qa.total_score desc, qa.total_time_seconds asc;
$$;
grant execute on function public.get_weekly_ranking(date) to authenticated;

create or replace function public.get_monthly_ranking(p_month date)
returns table (
  user_id uuid, full_name text, total_score bigint, total_time_seconds numeric
)
language sql security definer set search_path = public stable
as $$
  select qa.user_id, p.full_name,
    sum(qa.total_score)::bigint as total_score,
    sum(qa.total_time_seconds) as total_time_seconds
  from public.quiz_attempts qa
  join public.profiles p on p.id = qa.user_id
  where qa.status = 'completed'
    and qa.week_start >= date_trunc('month', p_month)::date
    and qa.week_start < (date_trunc('month', p_month) + interval '1 month')::date
  group by qa.user_id, p.full_name
  order by total_score desc, total_time_seconds asc;
$$;
grant execute on function public.get_monthly_ranking(date) to authenticated;

create or replace function public.get_annual_ranking(p_year int)
returns table (
  user_id uuid, full_name text, total_score bigint, total_time_seconds numeric
)
language sql security definer set search_path = public stable
as $$
  select qa.user_id, p.full_name,
    sum(qa.total_score)::bigint as total_score,
    sum(qa.total_time_seconds) as total_time_seconds
  from public.quiz_attempts qa
  join public.profiles p on p.id = qa.user_id
  where qa.status = 'completed'
    and qa.week_start >= make_date(p_year, 1, 1)
    and qa.week_start < make_date(p_year + 1, 1, 1)
  group by qa.user_id, p.full_name
  order by total_score desc, total_time_seconds asc;
$$;
grant execute on function public.get_annual_ranking(int) to authenticated;

-- Admin dashboard: which categories users get wrong the most.
create or replace function public.get_category_error_stats()
returns table (
  category_id uuid, category_name text,
  total_answers bigint, wrong_answers bigint, wrong_rate numeric
)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  return query
    select c.id, c.name,
      count(aa.id)::bigint as total_answers,
      count(aa.id) filter (where not aa.is_correct)::bigint as wrong_answers,
      round(
        (count(aa.id) filter (where not aa.is_correct)::numeric
          / greatest(count(aa.id), 1)) * 100, 1
      ) as wrong_rate
    from public.categories c
    left join public.questions q on q.category_id = c.id
    left join public.attempt_answers aa on aa.question_id = q.id
    group by c.id, c.name
    order by wrong_rate desc, total_answers desc;
end;
$$;
grant execute on function public.get_category_error_stats() to authenticated;
