-- Admins can replay the weekly quiz as many times as needed (practice mode),
-- and admin attempts never appear in any ranking.

-- start_weekly_attempt: for admins, a finished attempt is wiped so they can
-- start over. Regular users keep the one-attempt-per-week behaviour.
create or replace function public.start_weekly_attempt()
returns public.quiz_attempts
language plpgsql security definer set search_path = public
as $$
declare
  v_week date := public.current_week_start();
  v_attempt public.quiz_attempts;
  v_is_admin boolean;
begin
  select (role = 'admin') into v_is_admin
    from public.profiles where id = auth.uid();

  select * into v_attempt from public.quiz_attempts
    where user_id = auth.uid() and week_start = v_week;

  -- Admins practise unlimited: a completed attempt is discarded so a fresh
  -- one can be started (the unique(user_id, week_start) constraint stays).
  if coalesce(v_is_admin, false) and v_attempt.id is not null
     and v_attempt.status = 'completed' then
    delete from public.quiz_attempts where id = v_attempt.id;
    v_attempt := null;
  end if;

  if v_attempt.id is null then
    insert into public.quiz_attempts (user_id, week_start)
    values (auth.uid(), v_week)
    returning * into v_attempt;
  end if;

  return v_attempt;
end;
$$;

-- Exclude admins from every leaderboard.
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
    and p.role <> 'admin'
  order by qa.total_score desc, qa.total_time_seconds asc;
$$;

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
    and p.role <> 'admin'
    and qa.week_start >= date_trunc('month', p_month)::date
    and qa.week_start < (date_trunc('month', p_month) + interval '1 month')::date
  group by qa.user_id, p.full_name
  order by total_score desc, total_time_seconds asc;
$$;

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
    and p.role <> 'admin'
    and qa.week_start >= make_date(p_year, 1, 1)
    and qa.week_start < make_date(p_year + 1, 1, 1)
  group by qa.user_id, p.full_name
  order by total_score desc, total_time_seconds asc;
$$;
