-- Fix: "column reference total_score is ambiguous" — the RETURNS TABLE declaration
-- has a column named total_score which conflicts with the UPDATE SET clause.
-- Qualify with table name to resolve.
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
  select q.points into v_points
    from public.questions q where q.id = p_question_id;

  if v_correct is null or v_points is null then
    raise exception 'question not found';
  end if;

  v_is_correct := (p_selected_option is not null and v_correct = p_selected_option);
  v_awarded := case when v_is_correct then v_points else 0 end;

  insert into public.attempt_answers
    (attempt_id, question_id, selected_option, is_correct, points_awarded, time_taken_seconds)
  values
    (p_attempt_id, p_question_id, p_selected_option, v_is_correct, v_awarded, p_time_taken_seconds)
  on conflict (attempt_id, question_id) do nothing
  returning * into v_existing;

  if v_existing.id is null then
    select * into v_existing from public.attempt_answers
      where attempt_id = p_attempt_id and question_id = p_question_id;
  else
    update public.quiz_attempts qa
      set total_score = qa.total_score + v_awarded,
          total_time_seconds = qa.total_time_seconds + p_time_taken_seconds
      where qa.id = p_attempt_id;
  end if;

  return query
    select v_existing.is_correct, v_existing.points_awarded,
      (select qa2.total_score from public.quiz_attempts qa2 where qa2.id = p_attempt_id);
end;
$$;

grant execute on function public.submit_answer(uuid, uuid, text, numeric) to authenticated;
