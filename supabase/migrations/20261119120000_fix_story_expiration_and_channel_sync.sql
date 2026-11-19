-- Migration: 20261119120000_fix_story_expiration_and_channel_sync.sql
-- Descrição:
-- 1. Ajusta o default de story_items.initialization_date para usar a data atual em America/Sao_Paulo.
-- 2. Cria índice parcial composto para consultas/sincronização de story_items ativos.
-- 3. Corrige fn_sync_story_channel_status() para respeitar status bloqueados do canal,
--    initialization_date, mudança de channel_id em UPDATE e search_path seguro.
-- 4. Atualiza fn_update_ad_statuses_lifecycle() com etapa explícita de sincronização de
--    story_channels.is_active (inativando canais que ficaram sem itens ativos), search_path seguro
--    e privilégios restritos.
-- 5. Garante o agendamento idempotente do pg_cron 'ad-lifecycle-daily-job' (03:05 UTC / 00:05 BRT).

BEGIN;

-- 1. Garantir default de initialization_date alinhado a America/Sao_Paulo (evita avanço +1 dia após 21h BRT)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'story_items'
      AND column_name = 'initialization_date'
  ) THEN
    EXECUTE $sql$
      ALTER TABLE public.story_items
      ALTER COLUMN initialization_date
      SET DEFAULT ((pg_catalog.now() AT TIME ZONE 'America/Sao_Paulo')::date)
    $sql$;
  END IF;
END $$;

-- 2. Índice parcial para acelerar checagem de stories ativos por canal e expiração
CREATE INDEX IF NOT EXISTS idx_story_items_channel_active_exp
  ON public.story_items (channel_id, expiration_date)
  WHERE status = 'active';

-- 3. Trigger function de sincronização de is_active no canal pai
CREATE OR REPLACE FUNCTION public.fn_sync_story_channel_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today date;
  v_channel_ids uuid[];
  v_cid uuid;
  v_has_active boolean;
BEGIN
  v_today := (pg_catalog.now() AT TIME ZONE 'America/Sao_Paulo')::date;

  IF TG_OP = 'DELETE' THEN
    v_channel_ids := ARRAY[OLD.channel_id];
  ELSIF TG_OP = 'UPDATE' AND OLD.channel_id IS DISTINCT FROM NEW.channel_id THEN
    v_channel_ids := ARRAY[OLD.channel_id, NEW.channel_id];
  ELSE
    v_channel_ids := ARRAY[NEW.channel_id];
  END IF;

  FOREACH v_cid IN ARRAY v_channel_ids LOOP
    IF v_cid IS NULL THEN
      CONTINUE;
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM public.story_items si
      WHERE si.channel_id = v_cid
        AND si.status = 'active'
        AND (si.initialization_date IS NULL OR si.initialization_date <= v_today)
        AND si.expiration_date >= v_today
    ) INTO v_has_active;

    UPDATE public.story_channels sc
    SET is_active = CASE
      WHEN COALESCE(sc.status, 'active') IN ('deactivated', 'deleted', 'rejected', 'pending', 'awaiting_payment', 'expired') THEN false
      ELSE v_has_active
    END
    WHERE sc.id = v_cid
      AND sc.is_active IS DISTINCT FROM (
        CASE
          WHEN COALESCE(sc.status, 'active') IN ('deactivated', 'deleted', 'rejected', 'pending', 'awaiting_payment', 'expired') THEN false
          ELSE v_has_active
        END
      );
  END LOOP;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_story_channel_status ON public.story_items;
CREATE TRIGGER trg_sync_story_channel_status
  AFTER INSERT OR UPDATE OR DELETE ON public.story_items
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_story_channel_status();

-- 4. Rotina diária de ciclo de vida de anúncios e stories (com sincronização explícita dos canais)
CREATE OR REPLACE FUNCTION public.fn_update_ad_statuses_lifecycle()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today date;
BEGIN
  v_today := (pg_catalog.now() AT TIME ZONE 'America/Sao_Paulo')::date;

  -- A. Promover 'scheduled' (pagos) para 'active' em banners e stories
  UPDATE public.banners
  SET status = 'active'
  WHERE status = 'scheduled'
    AND paid = true
    AND initialization_date <= v_today
    AND expiration_date >= v_today;

  UPDATE public.story_items
  SET status = 'active'
  WHERE status = 'scheduled'
    AND paid = true
    AND initialization_date <= v_today
    AND expiration_date >= v_today;

  -- B. Expirar banners e story items ativos ou agendados cuja data de validade já passou
  UPDATE public.banners
  SET status = 'expired'
  WHERE status IN ('active', 'scheduled')
    AND expiration_date < v_today;

  UPDATE public.story_items
  SET status = 'expired'
  WHERE status IN ('active', 'scheduled')
    AND expiration_date < v_today;

  -- C. Expirar qualquer anúncio/story vencido que ainda esteja pendente ou aguardando pagamento
  UPDATE public.banners
  SET status = 'expired'
  WHERE status IN ('awaiting_payment', 'pending')
    AND expiration_date < v_today;

  UPDATE public.story_items
  SET status = 'expired'
  WHERE status IN ('awaiting_payment', 'pending')
    AND expiration_date < v_today;

  -- D. Expirar anúncios e stories não pagos que ultrapassaram payment_limit_date
  UPDATE public.banners
  SET status = 'expired'
  WHERE status = 'awaiting_payment'
    AND paid = false
    AND payment_limit_date IS NOT NULL
    AND payment_limit_date < pg_catalog.now();

  UPDATE public.story_items
  SET status = 'expired'
  WHERE status = 'awaiting_payment'
    AND paid = false
    AND payment_limit_date IS NOT NULL
    AND payment_limit_date < pg_catalog.now();

  -- E. Expirar empresas comerciais ativas cuja validade já expirou
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'fn_check_expired_enterprises'
  ) THEN
    PERFORM public.fn_check_expired_enterprises();
  END IF;

  -- F. Sincronizar is_active de todos os story_channels (mantendo status = 'active' para reativação futura via RLS)
  UPDATE public.story_channels sc
  SET is_active = CASE
    WHEN COALESCE(sc.status, 'active') IN ('deactivated', 'deleted', 'rejected', 'pending', 'awaiting_payment', 'expired') THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.story_items si
      WHERE si.channel_id = sc.id
        AND si.status = 'active'
        AND (si.initialization_date IS NULL OR si.initialization_date <= v_today)
        AND si.expiration_date >= v_today
    )
  END
  WHERE sc.is_active IS DISTINCT FROM (
    CASE
      WHEN COALESCE(sc.status, 'active') IN ('deactivated', 'deleted', 'rejected', 'pending', 'awaiting_payment', 'expired') THEN false
      ELSE EXISTS (
        SELECT 1
        FROM public.story_items si
        WHERE si.channel_id = sc.id
          AND si.status = 'active'
          AND (si.initialization_date IS NULL OR si.initialization_date <= v_today)
          AND si.expiration_date >= v_today
      )
    END
  );
END;
$$;

-- 5. Restringir execução das funções SECURITY DEFINER
REVOKE ALL ON FUNCTION public.fn_sync_story_channel_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_sync_story_channel_status() TO postgres, service_role;

REVOKE ALL ON FUNCTION public.fn_update_ad_statuses_lifecycle() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_update_ad_statuses_lifecycle() TO postgres, service_role;

-- 6. Garantir agendamento idempotente no pg_cron (03:05 UTC = 00:05 BRT)
DO $$
DECLARE
  v_job record;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_extension WHERE extname = 'pg_cron') THEN
    FOR v_job IN
      SELECT jobid
      FROM cron.job
      WHERE jobname IN ('expire-story-items', 'ad-lifecycle-daily-job')
    LOOP
      PERFORM cron.unschedule(v_job.jobid);
    END LOOP;

    PERFORM cron.schedule(
      'ad-lifecycle-daily-job',
      '5 3 * * *',
      'SELECT public.fn_update_ad_statuses_lifecycle();'
    );
  END IF;
END $$;

-- 7. Executar imediatamente para sincronizar registros atuais
SELECT public.fn_update_ad_statuses_lifecycle();

COMMIT;

