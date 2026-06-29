-- New tab-switch policy:
-- 1st switch → warning only (no penalty, can continue)
-- 2nd switch → attempt completed with total_score = 0

CREATE OR REPLACE FUNCTION public.apply_tab_switch_penalty(p_attempt_id uuid)
RETURNS TABLE (tab_switch_count int, total_score int, limit_reached boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_attempt public.quiz_attempts;
BEGIN
  UPDATE public.quiz_attempts
    SET tab_switch_count = tab_switch_count + 1
    WHERE id = p_attempt_id AND user_id = auth.uid() AND status = 'in_progress'
    RETURNING * INTO v_attempt;

  IF v_attempt.id IS NULL THEN
    RAISE EXCEPTION 'attempt not found or not in progress';
  END IF;

  -- 2nd switch: suspend with score 0
  IF v_attempt.tab_switch_count >= 2 THEN
    UPDATE public.quiz_attempts
      SET status = 'completed', finished_at = now(), total_score = 0
      WHERE id = p_attempt_id
      RETURNING * INTO v_attempt;
  END IF;

  RETURN QUERY SELECT v_attempt.tab_switch_count, v_attempt.total_score,
    (v_attempt.status = 'completed');
END;
$$;
