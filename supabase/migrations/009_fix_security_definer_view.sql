-- =============================================================================
-- 009_fix_security_definer_view.sql
-- Corrige el aviso CRÍTICO del Advisor de Supabase:
--   "Security Definer View" en public.preguntas_publicas.
--
-- Por defecto, una vista usa los permisos/RLS de su DUEÑO (comportamiento
-- "security definer"), lo que puede saltarse las políticas del usuario que
-- consulta. Con security_invoker = on, la vista usa los permisos de QUIEN la
-- consulta (lo recomendado).
--
-- Sigue funcionando para los estudiantes (rol anon) porque ya existe la política
-- preguntas_select_anon que les permite leer la tabla preguntas.
--
-- Requiere PostgreSQL 15+ (Supabase ya lo cumple).
-- Ejecuta este archivo en el SQL Editor de Supabase.
-- =============================================================================

alter view public.preguntas_publicas set (security_invoker = on);
