ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS source text;
