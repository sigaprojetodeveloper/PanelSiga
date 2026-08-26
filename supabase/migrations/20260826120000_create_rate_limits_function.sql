-- Migration: 20260826120000_create_rate_limits_function.sql
-- Objetivo: Criar tabela e função de rate limiting no PostgreSQL para controle de taxa em ações críticas do ecossistema Siga

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  request_count integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ativar RLS por padrão
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Política de RLS restrita (operações diretas são bloqueadas; acesso exclusivo via funções SECURITY DEFINER)
CREATE POLICY "Apenas funcoes de seguranca acessam rate_limits"
ON public.rate_limits
FOR ALL
TO authenticated, anon
USING (false);

-- Função RPC SECURITY DEFINER para verificar e registrar limite de taxa de requisições
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_record public.rate_limits%ROWTYPE;
BEGIN
  -- Bloqueia o registro da chave para concorrência segura (concurrency safe)
  SELECT * INTO v_record FROM public.rate_limits WHERE key = p_key FOR UPDATE;

  -- Se a chave não existir ou a janela de tempo já expirou, reinicia a contagem
  IF NOT FOUND OR v_record.reset_at < v_now THEN
    INSERT INTO public.rate_limits (key, request_count, reset_at, updated_at)
    VALUES (p_key, 1, v_now + (p_window_seconds || ' seconds')::interval, v_now)
    ON CONFLICT (key) DO UPDATE
    SET request_count = 1,
        reset_at = EXCLUDED.reset_at,
        updated_at = EXCLUDED.updated_at;
    RETURN true;
  END IF;

  -- Se o contador exceder o limite configurado na janela, retorna false (bloqueado)
  IF v_record.request_count >= p_max_requests THEN
    RETURN false;
  END IF;

  -- Caso contrário, incrementa o contador
  UPDATE public.rate_limits
  SET request_count = request_count + 1,
      updated_at = v_now
  WHERE key = p_key;

  RETURN true;
END;
$$;

-- Conceder permissão de execução segura
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO authenticated, anon;
