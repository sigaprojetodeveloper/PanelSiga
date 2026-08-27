-- ==========================================================
-- COMANDOS RÁPIDOS PARA CONTROLE DO RATE LIMIT (SQL EDITOR)
-- ==========================================================

-- 🔴 1. PARA DESATIVAR TEMPORARIAMENTE (ex: 2 horas de pentest/testes)
INSERT INTO public.rate_limits (key, request_count, reset_at, updated_at)
VALUES ('GLOBAL_RATE_LIMIT_DISABLED', 1, now() + interval '2 hours', now())
ON CONFLICT (key) DO UPDATE 
SET reset_at = now() + interval '2 hours',
    updated_at = now();


-- 🟢 2. PARA REATIVAR O RATE LIMIT IMEDIATAMENTE (Modo Normal)
DELETE FROM public.rate_limits 
WHERE key = 'GLOBAL_RATE_LIMIT_DISABLED';


-- 🔍 3. PARA VERIFICAR SE O RATE LIMIT ESTÁ ATIVO OU DESATIVADO
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.rate_limits 
      WHERE key = 'GLOBAL_RATE_LIMIT_DISABLED' AND reset_at > now()
    ) THEN '🔴 DESATIVADO (Modo Pentest Ativo até ' || (SELECT reset_at FROM public.rate_limits WHERE key = 'GLOBAL_RATE_LIMIT_DISABLED') || ')'
    ELSE '🟢 ATIVO (Protegendo em Produção)'
  END AS status_rate_limit;
