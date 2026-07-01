-- enforce matricula uniqueness at the DB level (app-side check has a TOCTOU race
-- under concurrent signups, allowing two accounts with the same matricula)
create unique index if not exists profiles_matricula_unique_idx
  on public.profiles (matricula)
  where matricula is not null;
