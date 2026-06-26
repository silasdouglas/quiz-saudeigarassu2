-- Remove score deduction from tab switch; keep counter and limit enforcement.
create or replace function public.apply_tab_switch_penalty(p_attempt_id uuid)
returns table (tab_switch_count int, total_score int, limit_reached boolean)
language plpgsql security definer set search_path = public
as $$
declare
  v_max int;
  v_attempt public.quiz_attempts;
begin
  select max_tab_switches
    into v_max
    from public.quiz_settings where id = true;

  update public.quiz_attempts
    set tab_switch_count = tab_switch_count + 1
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
