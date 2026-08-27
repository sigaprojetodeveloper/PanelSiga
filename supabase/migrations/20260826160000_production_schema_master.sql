-- ============================================================================
-- MIGRATION: 20260826160000_production_schema_master.sql
-- OBJETIVO: Estrutura Completa de Produção do Ecossistema Siga
--           (SigaPanelAdmin + Siga Mobile)
-- INCLUI: Extensões, Enums, Tabelas, Índices, Funções RPC, Triggers, RLS e Seeds
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EXTENSÕES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TIPOS E ENUMS
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE verification_level_enum AS ENUM ('none', 'bronze', 'silver', 'gold', 'platinum', 'diamond');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- 3. TABELA DE RATE LIMITS (Segurança & Anti-Abuso)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  request_count integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. TABELA DE AUDITORIA (Audit Trail para Ações Administrativas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. TABELA: ADMIN_USERS (RBAC do Painel Web: admin vs admin_master)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'admin_master')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. TABELAS DE USUÁRIOS E PERFIS (Compartilhadas Mobile + Web)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text,
  avatar_url text,
  bio text,
  verification_level verification_level_enum NOT NULL DEFAULT 'none',
  is_suspended boolean NOT NULL DEFAULT false,
  verification_updated_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text,
  phone text,
  role_flags text[] NOT NULL DEFAULT ARRAY['cliente']::text[],
  document_type text CHECK (document_type IN ('cpf', 'cnpj')),
  document_hash text,
  nationality text,
  marital_status text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'deleted')),
  block_reason text,
  verification_level verification_level_enum NOT NULL DEFAULT 'none',
  is_suspended boolean NOT NULL DEFAULT false,
  verification_updated_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  avatar_url text,
  bio text,
  instagram text,
  facebook text,
  whatsapp_phone text,
  whatsapp_phone_2 text,
  telegram text,
  email_contact text,
  website text,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0.00,
  rating_count integer NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  verification_level verification_level_enum NOT NULL DEFAULT 'none',
  is_suspended boolean NOT NULL DEFAULT false,
  verification_updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('base', 'work')),
  country text NOT NULL DEFAULT 'Brasil',
  state text NOT NULL,
  city text NOT NULL,
  district text,
  street text NOT NULL,
  number text,
  complement text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. TABELAS: OBRAS, PROPOSTAS, ORÇAMENTOS E PORTFÓLIO
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'concluida', 'cancelled', 'deleted')),
  city text NOT NULL,
  state text NOT NULL,
  media_urls text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceita', 'recusada', 'cancelled')),
  budget_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  client_name_manual text NOT NULL,
  valid_until timestamptz NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  discount numeric(12,2) NOT NULL DEFAULT 0.00,
  total_value numeric(12,2) NOT NULL DEFAULT 0.00,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.portfolio_works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portfolio_works ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.portfolio_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_work_id uuid NOT NULL REFERENCES public.portfolio_works(id) ON DELETE CASCADE,
  url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'pdf')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portfolio_media ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. TABELAS: EMPRESAS / LOJISTAS (Módulo Empresas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.enterprises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nome_fantasia text NOT NULL,
  razao_social text,
  cnpj text,
  logo_url text,
  banner_url text,
  category text,
  description text,
  whatsapp text,
  instagram text,
  website text,
  phone text,
  email_fiscal text,
  is_international boolean DEFAULT false,
  tax_id text,
  inscricao_estadual text,
  inscricao_municipal text,
  gallery_urls text[],
  tier text NOT NULL DEFAULT 'LITE' CHECK (tier IN ('LITE', 'PREMIUM')),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'BLOCKED')),
  blocked_reason text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.enterprises ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.enterprise_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id uuid NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  street text NOT NULL,
  number text,
  complement text,
  district text,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text,
  latitude numeric(10,8),
  longitude numeric(11,8),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.enterprise_addresses ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.enterprise_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id uuid NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  stripe_intent_id text,
  amount_paid numeric(12,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'active',
  billing_breakdown jsonb DEFAULT '{}'::jsonb,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.enterprise_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. TABELAS: TARIFAS E MONETIZAÇÃO REGIONAL
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.city_pricings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_default boolean NOT NULL DEFAULT false,
  city_name text NOT NULL,
  state text NOT NULL,
  price_lite integer NOT NULL DEFAULT 9900,
  price_premium integer NOT NULL DEFAULT 19900,
  tax_extra_lite integer NOT NULL DEFAULT 2900,
  tax_extra_premium integer NOT NULL DEFAULT 4900,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_city_state UNIQUE (city_name, state)
);
ALTER TABLE public.city_pricings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.city_volume_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_distinct_cities integer NOT NULL UNIQUE CHECK (min_distinct_cities >= 2),
  discount_percentage numeric(5,2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.city_volume_discounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ad_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_type text NOT NULL CHECK (ad_type IN ('banner', 'story', 'contract')),
  scope text NOT NULL CHECK (scope IN ('global', 'national', 'state', 'city')),
  price_per_day numeric(12,2) NOT NULL DEFAULT 0.00,
  payment_term_days integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_pricing ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. TABELAS: BANNERS E STORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  title text,
  subtitle text,
  link_url text,
  link_label text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_payment', 'scheduled', 'active', 'rejected', 'expired', 'deactivated', 'deleted')),
  initialization_date timestamptz NOT NULL,
  expiration_date timestamptz NOT NULL,
  scope text NOT NULL DEFAULT 'state' CHECK (scope IN ('global', 'national', 'state', 'city')),
  country text,
  state text,
  city text,
  rejection_reason text,
  paid boolean DEFAULT false,
  payment_date timestamptz,
  total_price numeric(12,2) DEFAULT 0.00,
  payment_limit_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.story_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  avatar_url text,
  is_destaque boolean DEFAULT false,
  is_active boolean DEFAULT true,
  scope text NOT NULL DEFAULT 'state' CHECK (scope IN ('global', 'national', 'state', 'city')),
  country text,
  state text,
  city text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_payment', 'scheduled', 'active', 'rejected', 'expired', 'deactivated', 'deleted')),
  rejection_reason text,
  data_inicializacao timestamptz,
  data_expiracao timestamptz,
  paid boolean DEFAULT false,
  payment_date timestamptz,
  total_price numeric(12,2) DEFAULT 0.00,
  payment_limit_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.story_channels ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.story_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.story_channels(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  link_url text,
  link_label text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'deleted')),
  expiration_date timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.story_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11. TABELAS: DENÚNCIAS E NOTIFICAÇÕES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  target_type text NOT NULL CHECK (target_type IN ('user', 'work', 'proposal', 'budget', 'enterprise', 'content')),
  target_id text NOT NULL,
  reason text NOT NULL,
  description text,
  attachment_urls text[],
  allow_contact boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'new', 'in_review', 'resolved', 'ignored')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 12. FUNÇÕES AUXILIARES DE SEGURANÇA E RATE LIMIT
-- ============================================================================

-- Helper: Checagem se o usuário atual é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = user_id AND status = 'ACTIVE'
  );
$$;

-- Helper: Checagem se o usuário atual é admin_master
CREATE OR REPLACE FUNCTION public.is_admin_master(user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = user_id AND role = 'admin_master' AND status = 'ACTIVE'
  );
$$;

-- Helper: Rate limit seguro (Concurrency Safe)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max_requests integer,
  p_window_seconds integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_now timestamptz := now();
  v_record public.rate_limits%ROWTYPE;
BEGIN
  SELECT * INTO v_record FROM public.rate_limits WHERE key = p_key FOR UPDATE;

  IF NOT FOUND OR v_record.reset_at < v_now THEN
    INSERT INTO public.rate_limits (key, request_count, reset_at, updated_at)
    VALUES (p_key, 1, v_now + (p_window_seconds || ' seconds')::interval, v_now)
    ON CONFLICT (key) DO UPDATE
    SET request_count = 1,
        reset_at = EXCLUDED.reset_at,
        updated_at = EXCLUDED.updated_at;
    RETURN true;
  END IF;

  IF v_record.request_count >= p_max_requests THEN
    RETURN false;
  END IF;

  UPDATE public.rate_limits
  SET request_count = request_count + 1,
      updated_at = v_now
  WHERE key = p_key;

  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO authenticated, anon;

-- Helper: Obter nível de verificação efetivo (oculta se suspenso)
CREATE OR REPLACE FUNCTION public.get_effective_verification_level(profile_row profiles)
RETURNS verification_level_enum AS $$
BEGIN
  IF profile_row.is_suspended = true THEN
    RETURN 'none'::verification_level_enum;
  END IF;
  RETURN profile_row.verification_level;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger para automatizar criação de perfil no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', 'Usuário Siga'), new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', 'Usuário Siga'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_profiles (user_id, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 13. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- RATE LIMITS
DROP POLICY IF EXISTS "Apenas funcoes de seguranca acessam rate_limits" ON public.rate_limits;
CREATE POLICY "Apenas funcoes de seguranca acessam rate_limits" ON public.rate_limits FOR ALL TO authenticated, anon USING (false);

-- PROFILES
CREATE POLICY "Leitura de perfis" ON public.profiles FOR SELECT TO public USING (true);
CREATE POLICY "Usuario edita proprio perfil (exceto campos restritos)" ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  verification_level = (SELECT verification_level FROM profiles WHERE id = auth.uid()) AND
  is_suspended = (SELECT is_suspended FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Admin total perfis" ON public.profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- USERS & USER_PROFILES
CREATE POLICY "Leitura de users" ON public.users FOR SELECT TO public USING (status != 'deleted');
CREATE POLICY "Usuario atualiza proprio user" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admin total users" ON public.users FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Leitura de user_profiles" ON public.user_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Usuario edita proprio user_profile" ON public.user_profiles FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin total user_profiles" ON public.user_profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ADDRESSES
CREATE POLICY "Usuario gerencia seus enderecos" ON public.addresses FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin le enderecos" ON public.addresses FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ADMIN_USERS
CREATE POLICY "Admin le proprio registro" ON public.admin_users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admin Master gerencia admin_users" ON public.admin_users FOR ALL TO authenticated USING (public.is_admin_master(auth.uid()));

-- WORKS
CREATE POLICY "Leitura publica de obras ativas" ON public.works FOR SELECT TO public USING (status != 'deleted');
CREATE POLICY "Cliente cria/edita suas obras" ON public.works FOR ALL TO authenticated USING (client_id = auth.uid());
CREATE POLICY "Admin total obras" ON public.works FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- PROPOSALS & BUDGETS
CREATE POLICY "Participantes leem proposta" ON public.proposals FOR SELECT TO authenticated
USING (professional_id = auth.uid() OR work_id IN (SELECT id FROM public.works WHERE client_id = auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Profissional cria/edita propostas" ON public.proposals FOR ALL TO authenticated USING (professional_id = auth.uid());

CREATE POLICY "Participantes leem orcamentos" ON public.budgets FOR SELECT TO authenticated
USING (professional_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Profissional cria/edita orcamentos" ON public.budgets FOR ALL TO authenticated USING (professional_id = auth.uid());

-- PORTFOLIO
CREATE POLICY "Leitura publica portflio" ON public.portfolio_works FOR SELECT TO public USING (true);
CREATE POLICY "Profissional gerencia portfolio" ON public.portfolio_works FOR ALL TO authenticated USING (professional_id = auth.uid());
CREATE POLICY "Leitura publica portfolio media" ON public.portfolio_media FOR SELECT TO public USING (true);
CREATE POLICY "Profissional gerencia portfolio media" ON public.portfolio_media FOR ALL TO authenticated
USING (portfolio_work_id IN (SELECT id FROM public.portfolio_works WHERE professional_id = auth.uid()));

-- ENTERPRISES
CREATE POLICY "Leitura publica de lojas ativas" ON public.enterprises FOR SELECT TO public USING (status = 'ACTIVE' OR user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Lojista gerencia sua loja" ON public.enterprises FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin gerencia todas as lojas" ON public.enterprises FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Leitura enderecos de empresas" ON public.enterprise_addresses FOR SELECT TO public USING (true);
CREATE POLICY "Lojista edita enderecos da empresa" ON public.enterprise_addresses FOR ALL TO authenticated
USING (enterprise_id IN (SELECT id FROM public.enterprises WHERE user_id = auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Lojista le suas assinaturas" ON public.enterprise_subscriptions FOR SELECT TO authenticated
USING (enterprise_id IN (SELECT id FROM public.enterprises WHERE user_id = auth.uid()) OR public.is_admin(auth.uid()));

-- MONETIZAÇÃO
CREATE POLICY "Leitura de precos e descontos" ON public.city_pricings FOR SELECT TO public USING (true);
CREATE POLICY "Admin Master gerencia city_pricings" ON public.city_pricings FOR ALL TO authenticated USING (public.is_admin_master(auth.uid()));

CREATE POLICY "Leitura de descontos por volume" ON public.city_volume_discounts FOR SELECT TO public USING (true);
CREATE POLICY "Admin Master gerencia city_volume_discounts" ON public.city_volume_discounts FOR ALL TO authenticated USING (public.is_admin_master(auth.uid()));

CREATE POLICY "Leitura de ad_pricing" ON public.ad_pricing FOR SELECT TO public USING (true);
CREATE POLICY "Admin Master gerencia ad_pricing" ON public.ad_pricing FOR ALL TO authenticated USING (public.is_admin_master(auth.uid()));

-- BANNERS & STORIES
CREATE POLICY "Leitura publica de banners ativos" ON public.banners FOR SELECT TO public USING (status = 'active' OR user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Usuario cria/edita banner proprio" ON public.banners FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Leitura publica de story channels" ON public.story_channels FOR SELECT TO public USING (status = 'active' OR user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Usuario cria/edita story channel" ON public.story_channels FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Leitura publica story items" ON public.story_items FOR SELECT TO public USING (status = 'active' OR public.is_admin(auth.uid()));
CREATE POLICY "Gerenciar story items" ON public.story_items FOR ALL TO authenticated
USING (channel_id IN (SELECT id FROM public.story_channels WHERE user_id = auth.uid()) OR public.is_admin(auth.uid()));

-- REPORTS & NOTIFICATIONS
CREATE POLICY "Usuario cria e le suas denuncias" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Usuario insere denuncia" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Admin modera denuncias" ON public.reports FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Usuario le e edita suas notificacoes" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin gerencia notificacoes" ON public.notifications FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- AUDIT LOGS
CREATE POLICY "Admin le logs de auditoria" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin insere logs de auditoria" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- 14. SEED INICIAL (VALORES PADRÃO DE MONETIZAÇÃO)
-- ============================================================================

INSERT INTO public.city_pricings (is_default, city_name, state, price_lite, price_premium, tax_extra_lite, tax_extra_premium)
VALUES (true, 'DEFAULT', 'ALL', 9900, 19900, 2900, 4900)
ON CONFLICT (city_name, state) DO NOTHING;

INSERT INTO public.city_volume_discounts (min_distinct_cities, discount_percentage, is_active)
VALUES
  (2, 5.00, true),
  (3, 10.00, true),
  (5, 15.00, true)
ON CONFLICT (min_distinct_cities) DO NOTHING;

INSERT INTO public.ad_pricing (ad_type, scope, price_per_day, payment_term_days)
VALUES
  ('banner', 'state', 25.00, 1),
  ('banner', 'national', 50.00, 1),
  ('story', 'state', 15.00, 1),
  ('story', 'national', 30.00, 1),
  ('contract', 'global', 10.00, 1)
ON CONFLICT DO NOTHING;

COMMIT;
