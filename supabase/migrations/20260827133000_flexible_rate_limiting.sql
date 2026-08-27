-- Migration: 20260827133000_flexible_rate_limiting.sql
-- Objetivo: Atualizar check_rate_limit para permitir ativação/desativação flexível sem requerer permissões de superusuário

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max_requests integer,
  p_window_seconds integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_now timestamptz := now();
  v_record public.rate_limits%ROWTYPE;
  v_bypass_active boolean;
BEGIN
  -- 🔓 VERIFICAÇÃO DE BYPASS / MODO PENTEST
  -- Se houver a chave 'GLOBAL_RATE_LIMIT_DISABLED' ativa no rate_limits, ignora a checagem
  SELECT EXISTS(
    SELECT 1 FROM public.rate_limits 
    WHERE key = 'GLOBAL_RATE_LIMIT_DISABLED' AND reset_at > v_now
  ) INTO v_bypass_active;

  IF v_bypass_active THEN
    RETURN true;
  END IF;

  -- 1. Bloqueio transacional de linha
  SELECT * INTO v_record FROM public.rate_limits WHERE key = p_key FOR UPDATE;

  -- 2. Primeira requisição ou janela expirada
  IF NOT FOUND OR v_record.reset_at < v_now THEN
    INSERT INTO public.rate_limits (key, request_count, reset_at, updated_at)
    VALUES (p_key, 1, v_now + (p_window_seconds || ' seconds')::interval, v_now)
    ON CONFLICT (key) DO UPDATE
    SET request_count = 1,
        reset_at = EXCLUDED.reset_at,
        updated_at = EXCLUDED.updated_at;
    RETURN true;
  END IF;

  -- 3. Limite excedido
  IF v_record.request_count >= p_max_requests THEN
    RETURN false;
  END IF;

  -- 4. Incremento do contador
  UPDATE public.rate_limits
  SET request_count = request_count + 1,
      updated_at = v_now
  WHERE key = p_key;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO authenticated, anon;
