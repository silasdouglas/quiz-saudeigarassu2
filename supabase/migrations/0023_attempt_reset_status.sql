-- Add 'reset' status so admin-reset attempts stay visible in the list

ALTER TABLE public.quiz_attempts DROP CONSTRAINT quiz_attempts_status_check;
ALTER TABLE public.quiz_attempts ADD CONSTRAINT quiz_attempts_status_check
  CHECK (status IN ('in_progress', 'completed', 'reset'));

-- admin_reset_attempt: mark as 'reset' instead of deleting the row
CREATE OR REPLACE FUNCTION public.admin_reset_attempt(p_attempt_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  DELETE FROM public.attempt_answers WHERE attempt_id = p_attempt_id;

  UPDATE public.quiz_attempts
    SET status = 'reset',
        total_score = 0,
        total_time_seconds = 0,
        tab_switch_count = 0,
        finished_at = NULL
    WHERE id = p_attempt_id;
END;
$$;

-- start_weekly_attempt: allow re-start when status = 'reset'
CREATE OR REPLACE FUNCTION public.start_weekly_attempt()
RETURNS public.quiz_attempts LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_week date := public.current_week_start();
  v_attempt public.quiz_attempts;
  v_is_admin boolean;
BEGIN
  SELECT (role = 'admin') INTO v_is_admin
    FROM public.profiles WHERE id = auth.uid();

  SELECT * INTO v_attempt FROM public.quiz_attempts
    WHERE user_id = auth.uid() AND week_start = v_week;

  -- Admins restart from completed
  IF COALESCE(v_is_admin, false) AND v_attempt.id IS NOT NULL
     AND v_attempt.status = 'completed' THEN
    DELETE FROM public.quiz_attempts WHERE id = v_attempt.id;
    v_attempt := null;
  END IF;

  -- Anyone restarts from reset (admin granted redo)
  IF v_attempt.id IS NOT NULL AND v_attempt.status = 'reset' THEN
    DELETE FROM public.quiz_attempts WHERE id = v_attempt.id;
    v_attempt := null;
  END IF;

  IF v_attempt.id IS NULL THEN
    INSERT INTO public.quiz_attempts (user_id, week_start)
    VALUES (auth.uid(), v_week)
    RETURNING * INTO v_attempt;
  END IF;

  RETURN v_attempt;
END;
$$;
