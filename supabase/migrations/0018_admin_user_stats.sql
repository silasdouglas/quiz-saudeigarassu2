-- Admin: per-user performance profile. Aggregates one user's answers across all
-- attempts to surface overall accuracy and their strongest/weakest categories.
-- Admin-guarded, security definer (RLS hides other users' answers).

create or replace function public.admin_get_user_overview(p_user_id uuid)
returns table (
  user_id uuid,
  full_name text,
  email text,
  funcao text,
  role text,
  created_at timestamptz,
  attempts_total bigint,
  attempts_completed bigint,
  total_answers bigint,
  correct_answers bigint,
  wrong_answers bigint,
  total_score bigint,
  avg_time_seconds numeric
)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  return query
    select
      p.id, p.full_name, p.email, p.funcao, p.role, p.created_at,
      (select count(*) from public.quiz_attempts qa where qa.user_id = p.id)::bigint,
      (select count(*) from public.quiz_attempts qa
        where qa.user_id = p.id and qa.status = 'completed')::bigint,
      count(aa.id)::bigint,
      count(aa.id) filter (where aa.is_correct)::bigint,
      count(aa.id) filter (where not aa.is_correct)::bigint,
      coalesce(sum(aa.points_awarded), 0)::bigint,
      coalesce(round(avg(aa.time_taken_seconds), 1), 0)
    from public.profiles p
    left join public.quiz_attempts qa on qa.user_id = p.id
    left join public.attempt_answers aa on aa.attempt_id = qa.id
    where p.id = p_user_id
    group by p.id;
end;
$$;
grant execute on function public.admin_get_user_overview(uuid) to authenticated;

create or replace function public.admin_get_user_category_stats(p_user_id uuid)
returns table (
  category_id uuid,
  category_name text,
  total bigint,
  correct bigint,
  wrong bigint,
  accuracy numeric
)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  return query
    select
      c.id,
      coalesce(c.name, 'Sem categoria'),
      count(aa.id)::bigint,
      count(aa.id) filter (where aa.is_correct)::bigint,
      count(aa.id) filter (where not aa.is_correct)::bigint,
      round(
        (count(aa.id) filter (where aa.is_correct)::numeric
          / greatest(count(aa.id), 1)) * 100, 0
      )
    from public.attempt_answers aa
    join public.quiz_attempts qa on qa.id = aa.attempt_id
    join public.questions q on q.id = aa.question_id
    left join public.categories c on c.id = q.category_id
    where qa.user_id = p_user_id
    group by c.id, c.name
    order by accuracy desc, total desc;
end;
$$;
grant execute on function public.admin_get_user_category_stats(uuid) to authenticated;

create or replace function public.admin_get_user_difficulty_stats(p_user_id uuid)
returns table (
  difficulty text,
  total bigint,
  correct bigint,
  accuracy numeric
)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  return query
    select
      q.difficulty,
      count(aa.id)::bigint,
      count(aa.id) filter (where aa.is_correct)::bigint,
      round(
        (count(aa.id) filter (where aa.is_correct)::numeric
          / greatest(count(aa.id), 1)) * 100, 0
      )
    from public.attempt_answers aa
    join public.quiz_attempts qa on qa.id = aa.attempt_id
    join public.questions q on q.id = aa.question_id
    where qa.user_id = p_user_id
    group by q.difficulty;
end;
$$;
grant execute on function public.admin_get_user_difficulty_stats(uuid) to authenticated;
