-- SECURITY: privilege escalation fix.
-- RLS policy profiles_update_self allows a user to UPDATE their own row, and its
-- implicit WITH CHECK ((id = auth.uid()) OR is_admin()) stays true even when the
-- row's role is changed. Combined with a table-wide UPDATE grant to `authenticated`,
-- any logged-in user could run  UPDATE profiles SET role='admin' WHERE id=auth.uid()
-- via PostgREST and become admin.
--
-- Fix: revoke the blanket UPDATE and re-grant only the columns the app legitimately
-- lets a user change (full_name, avatar_url). role/matricula/funcao/email/id stay
-- immutable for normal users. Admin operations run through SECURITY DEFINER RPCs
-- (owner rights), so they are unaffected by these column grants.
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
