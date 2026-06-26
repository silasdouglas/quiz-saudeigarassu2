-- Add funcao to profiles (professional role of the user)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS funcao TEXT
  CHECK (funcao IN ('tecnico_enfermagem', 'enfermeira'));

-- Add target_role to questions
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS target_role TEXT NOT NULL DEFAULT 'ambos'
  CHECK (target_role IN ('tecnico_enfermagem', 'enfermeira', 'ambos'));

-- Update auth trigger to persist funcao from user_metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, funcao)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    'user',
    NULLIF(NEW.raw_user_meta_data->>'funcao', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
