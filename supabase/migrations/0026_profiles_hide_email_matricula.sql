-- SECURITY: PII leak fix.
-- RLS policy profiles_select lets any authenticated user read every profile row,
-- and authenticated had table-level SELECT — so any logged-in user could harvest
-- all staff emails and matriculas (GET /rest/v1/profiles?select=email,matricula).
--
-- A table-level SELECT grant covers all columns and cannot be narrowed by a
-- per-column REVOKE, so we revoke the table grant and re-grant only the columns
-- that are safe to expose across users (needed for ranking/UI). email and
-- matricula are intentionally excluded.
--
-- A user's OWN email now comes from auth.getUser() in dal.ts (the auth session),
-- not from this table. Admin views read email via SECURITY DEFINER RPCs
-- (admin_list_attempts, admin_get_user_email) which run with owner rights and are
-- unaffected by these grants.
revoke select on public.profiles from authenticated;
grant select (id, full_name, role, created_at, avatar_url, funcao)
  on public.profiles to authenticated;
