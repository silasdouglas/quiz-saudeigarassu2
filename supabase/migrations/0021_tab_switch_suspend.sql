-- New tab-switch policy:
-- 1st switch → warning only (no penalty, can continue)
-- 2nd switch → attempt completed with total_score = 0

CREATE OR REPLACE FUNCTION public.apply_tab_switch_penalty(p_attempt_id uuid)
RETURNS TABLE (tab_switch_count int, total_score int, limit_reached boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_attempt public.quiz_attempts;
  v_new_count int;
BEGIN
  -- Pre-calculate new count to avoid ambiguity with RETURNS TABLE output columns
  SELECT qa.tab_switch_count + 1 INTO v_new_count
    FROM public.quiz_attempts qa
    WHERE qa.id = p_attempt_id AND qa.user_id = auth.uid() AND qa.status = 'in_progress';

  IF v_new_count IS NULL THEN
    RAISE EXCEPTION 'attempt not found or not in progress';
  END IF;

  UPDATE public.quiz_attempts
    SET tab_switch_count = v_new_count
    WHERE id = p_attempt_id
    RETURNING * INTO v_attempt;

  -- 2nd switch: suspend with score 0
  IF v_new_count >= 2 THEN
    UPDATE public.quiz_attempts
      SET status = 'completed', finished_at = now(), total_score = 0
      WHERE id = p_attempt_id
      RETURNING * INTO v_attempt;
  END IF;

  RETURN QUERY SELECT v_attempt.tab_switch_count, v_attempt.total_score,
    (v_attempt.status = 'completed');
END;
$$;
