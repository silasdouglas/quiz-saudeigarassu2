-- Rename 'tecnico_enfermagem' → 'tecnico' for brevity

-- 1. Drop old constraints (must happen before data update)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_funcao_check;
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_target_role_check;

-- 2. Migrate existing data
UPDATE public.profiles SET funcao = 'tecnico' WHERE funcao = 'tecnico_enfermagem';
UPDATE public.questions SET target_role = 'tecnico' WHERE target_role = 'tecnico_enfermagem';

-- 3. Re-add constraints with new allowed values
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_funcao_check CHECK (funcao IN ('tecnico', 'enfermeira'));

ALTER TABLE public.questions
  ADD CONSTRAINT questions_target_role_check CHECK (target_role IN ('tecnico', 'enfermeira', 'ambos'));
