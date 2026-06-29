-- Drop legacy empty table and its orphaned views (v_ranking_mensal, v_ranking_mes,
-- v_ranking_ano) — all reference old schema (sessoes_quiz/respostas) unused by the app.
DROP TABLE IF EXISTS public.perfis CASCADE;
