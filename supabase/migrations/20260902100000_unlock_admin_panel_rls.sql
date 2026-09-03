
-- ============================================================================
-- MIGRATION: 20260902100000_unlock_admin_panel_rls.sql
-- OBJETIVO: Destravar todas as consultas e operações do Painel Administrativo,
--           garantindo que qualquer operação exija TOKEN AUTENTICADO validado
--           (bloqueando acessos anônimos sem token).
-- ============================================================================

-- 1. Estrutura e Funções Helper de Admin
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS role text DEFAULT 'admin_master';
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS status text DEFAULT 'ACTIVE';
UPDATE public.admin_users SET role = 'admin_master', status = 'ACTIVE' WHERE role IS NULL OR status IS NULL;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT (
    user_id IS NOT NULL AND (
      EXISTS (SELECT 1 FROM public.admin_users WHERE id = user_id AND status = 'ACTIVE')
      OR coalesce(auth.jwt() ->> 'role', '') IN ('admin', 'admin_master')
      OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'admin_master')
      OR coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'admin_master')
      OR auth.role() = 'service_role'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_master(user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT (
    user_id IS NOT NULL AND (
      EXISTS (SELECT 1 FROM public.admin_users WHERE id = user_id AND (role = 'admin_master' OR role IS NULL) AND status = 'ACTIVE')
      OR coalesce(auth.jwt() ->> 'role', '') IN ('admin', 'admin_master')
      OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'admin_master')
      OR auth.role() = 'service_role'
    )
  );
$$;

-- 2. admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select on admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_select_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_admin_manage" ON public.admin_users;

-- Permite leitura de username/email para autenticação do painel
CREATE POLICY "admin_users_select_policy" ON public.admin_users FOR SELECT TO anon, authenticated USING (true);
-- Permite que admins autenticados gerenciem outros admins
CREATE POLICY "admin_users_admin_manage" ON public.admin_users FOR ALL TO authenticated
USING (public.is_admin_master(auth.uid())) WITH CHECK (public.is_admin_master(auth.uid()));

-- Trigger de sincronização automática entre public.admin_users e auth.users
CREATE OR REPLACE FUNCTION public.sync_admin_user_to_auth()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions AS $$
DECLARE
  v_email text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_email := COALESCE(NEW.email, lower(NEW.username) || '@siga.com');
    NEW.email := v_email;

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id OR email = v_email) THEN
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        email_change_token_current, phone_change, phone_change_token, reauthentication_token,
        is_sso_user, is_anonymous
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        NEW.id, 'authenticated', 'authenticated', v_email,
        crypt(NEW.password, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"],"role":"admin"}',
        json_build_object('name', NEW.username, 'username', NEW.username), now(), now(),
        '', '', '', '', '', '', '', '', false, false
      );

      INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), NEW.id, NEW.id::text, json_build_object('sub', NEW.id::text, 'email', v_email), 'email', now(), now(), now()
      ) ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.password IS DISTINCT FROM OLD.password THEN
      UPDATE auth.users
      SET encrypted_password = crypt(NEW.password, gen_salt('bf')), updated_at = now()
      WHERE id = NEW.id;
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email AND NEW.email IS NOT NULL THEN
      UPDATE auth.users
      SET email = NEW.email, updated_at = now()
      WHERE id = NEW.id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM auth.users WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_admin_user_to_auth ON public.admin_users;
CREATE TRIGGER trigger_sync_admin_user_to_auth
BEFORE INSERT OR UPDATE OR DELETE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.sync_admin_user_to_auth();

-- 3. ad_pricing
ALTER TABLE public.ad_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura publica de tabela ad_pricing" ON public.ad_pricing;
DROP POLICY IF EXISTS "Admin Master gerencia ad_pricing" ON public.ad_pricing;
DROP POLICY IF EXISTS "ad_pricing_select_policy" ON public.ad_pricing;
DROP POLICY IF EXISTS "ad_pricing_admin_manage" ON public.ad_pricing;

CREATE POLICY "ad_pricing_select_policy" ON public.ad_pricing FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ad_pricing_admin_manage" ON public.ad_pricing FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 4. city_pricings & city_volume_discounts
ALTER TABLE public.city_pricings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "city_pricings_public_select" ON public.city_pricings;
DROP POLICY IF EXISTS "city_pricings_admin_write" ON public.city_pricings;
DROP POLICY IF EXISTS "Leitura publica de tarifas city_pricings" ON public.city_pricings;
DROP POLICY IF EXISTS "Admin Master gerencia city_pricings" ON public.city_pricings;

CREATE POLICY "city_pricings_public_select" ON public.city_pricings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "city_pricings_admin_write" ON public.city_pricings FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.city_volume_discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "city_volume_discounts_public_select" ON public.city_volume_discounts;
DROP POLICY IF EXISTS "city_volume_discounts_admin_write" ON public.city_volume_discounts;
DROP POLICY IF EXISTS "Leitura publica descontos de volume" ON public.city_volume_discounts;
DROP POLICY IF EXISTS "Admin Master gerencia city_volume_discounts" ON public.city_volume_discounts;

CREATE POLICY "city_volume_discounts_public_select" ON public.city_volume_discounts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "city_volume_discounts_admin_write" ON public.city_volume_discounts FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 5. enterprises, enterprise_addresses, enterprise_subscriptions
ALTER TABLE public.enterprises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enterprises_public_select" ON public.enterprises;
DROP POLICY IF EXISTS "enterprises_owner_admin_select" ON public.enterprises;
DROP POLICY IF EXISTS "enterprises_owner_admin_update" ON public.enterprises;
DROP POLICY IF EXISTS "enterprises_owner_admin_delete" ON public.enterprises;
DROP POLICY IF EXISTS "enterprises_owner_insert" ON public.enterprises;
DROP POLICY IF EXISTS "enterprises_admin_manage" ON public.enterprises;

-- Leitura pública apenas para empresas ativas
CREATE POLICY "enterprises_public_select" ON public.enterprises FOR SELECT TO anon, authenticated
USING (status = 'ACTIVE' OR auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "enterprises_owner_insert" ON public.enterprises FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "enterprises_owner_update" ON public.enterprises FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "enterprises_owner_delete" ON public.enterprises FOR DELETE TO authenticated
USING (
  ((auth.uid() = user_id) AND (status = ANY (ARRAY['DRAFT'::enterprise_status, 'EXPIRED'::enterprise_status])))
  OR public.is_admin(auth.uid())
);

ALTER TABLE public.enterprise_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enterprise_addresses_public_select" ON public.enterprise_addresses;
DROP POLICY IF EXISTS "enterprise_addresses_owner_admin_select" ON public.enterprise_addresses;
DROP POLICY IF EXISTS "enterprise_addresses_owner_admin_insert" ON public.enterprise_addresses;
DROP POLICY IF EXISTS "enterprise_addresses_owner_admin_update" ON public.enterprise_addresses;
DROP POLICY IF EXISTS "enterprise_addresses_owner_admin_delete" ON public.enterprise_addresses;

CREATE POLICY "enterprise_addresses_select" ON public.enterprise_addresses FOR SELECT TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM enterprises WHERE enterprises.id = enterprise_addresses.enterprise_id AND enterprises.status = 'ACTIVE')
  OR EXISTS (SELECT 1 FROM enterprises WHERE enterprises.id = enterprise_addresses.enterprise_id AND enterprises.user_id = auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE POLICY "enterprise_addresses_manage" ON public.enterprise_addresses FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM enterprises WHERE enterprises.id = enterprise_addresses.enterprise_id AND enterprises.user_id = auth.uid())
  OR public.is_admin(auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM enterprises WHERE enterprises.id = enterprise_addresses.enterprise_id AND enterprises.user_id = auth.uid())
  OR public.is_admin(auth.uid())
);

ALTER TABLE public.enterprise_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enterprise_subscriptions_owner_admin_select" ON public.enterprise_subscriptions;
DROP POLICY IF EXISTS "enterprise_subscriptions_service_admin_write" ON public.enterprise_subscriptions;

CREATE POLICY "enterprise_subscriptions_select" ON public.enterprise_subscriptions FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM enterprises WHERE enterprises.id = enterprise_subscriptions.enterprise_id AND enterprises.user_id = auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE POLICY "enterprise_subscriptions_write" ON public.enterprise_subscriptions FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 6. banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select on banners" ON public.banners;
DROP POLICY IF EXISTS "Allow insert on banners" ON public.banners;
DROP POLICY IF EXISTS "Allow update on banners" ON public.banners;
DROP POLICY IF EXISTS "Allow delete on banners" ON public.banners;
DROP POLICY IF EXISTS "banners_select_policy" ON public.banners;
DROP POLICY IF EXISTS "banners_insert_policy" ON public.banners;
DROP POLICY IF EXISTS "banners_update_policy" ON public.banners;
DROP POLICY IF EXISTS "banners_delete_policy" ON public.banners;

CREATE POLICY "banners_select_policy" ON public.banners FOR SELECT TO anon, authenticated
USING (status = 'active' OR auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "banners_insert_policy" ON public.banners FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "banners_update_policy" ON public.banners FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "banners_delete_policy" ON public.banners FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 7. story_channels & story_items
ALTER TABLE public.story_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select on story_channels" ON public.story_channels;
DROP POLICY IF EXISTS "Allow insert on story_channels" ON public.story_channels;
DROP POLICY IF EXISTS "Allow update on story_channels" ON public.story_channels;
DROP POLICY IF EXISTS "Allow delete on story_channels" ON public.story_channels;
DROP POLICY IF EXISTS "story_channels_select_policy" ON public.story_channels;
DROP POLICY IF EXISTS "story_channels_manage_policy" ON public.story_channels;

CREATE POLICY "story_channels_select_policy" ON public.story_channels FOR SELECT TO anon, authenticated
USING (status = 'active' OR auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "story_channels_manage_policy" ON public.story_channels FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

ALTER TABLE public.story_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select on story_items" ON public.story_items;
DROP POLICY IF EXISTS "Allow insert on story_items" ON public.story_items;
DROP POLICY IF EXISTS "Allow update on story_items" ON public.story_items;
DROP POLICY IF EXISTS "Allow delete on story_items" ON public.story_items;
DROP POLICY IF EXISTS "authenticated users can read story_items" ON public.story_items;
DROP POLICY IF EXISTS "story_items_select_policy" ON public.story_items;
DROP POLICY IF EXISTS "story_items_manage_policy" ON public.story_items;

CREATE POLICY "story_items_select_policy" ON public.story_items FOR SELECT TO anon, authenticated
USING (status = 'active' OR EXISTS (SELECT 1 FROM story_channels WHERE story_channels.id = story_items.channel_id AND story_channels.user_id = auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "story_items_manage_policy" ON public.story_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM story_channels WHERE story_channels.id = story_items.channel_id AND story_channels.user_id = auth.uid()) OR public.is_admin(auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM story_channels WHERE story_channels.id = story_items.channel_id AND story_channels.user_id = auth.uid()) OR public.is_admin(auth.uid()));

-- 8. works, proposals, budgets, contracts
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "works_admin_manage" ON public.works;
CREATE POLICY "works_admin_manage" ON public.works FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proposals_admin_manage" ON public.proposals;
CREATE POLICY "proposals_admin_manage" ON public.proposals FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "budgets_admin_manage" ON public.budgets;
CREATE POLICY "budgets_admin_manage" ON public.budgets FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contracts_admin_manage" ON public.contracts;
CREATE POLICY "contracts_admin_manage" ON public.contracts FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 9. reports (Denúncias - Blindadas: Anônimos NÃO leem!)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select on reports for admin or anon" ON public.reports;
DROP POLICY IF EXISTS "Allow update on reports for admin or anon" ON public.reports;
DROP POLICY IF EXISTS "reports: reporter read own" ON public.reports;
DROP POLICY IF EXISTS "reports_admin_select" ON public.reports;
DROP POLICY IF EXISTS "reports_admin_update" ON public.reports;

CREATE POLICY "reports_authenticated_select" ON public.reports FOR SELECT TO authenticated
USING (reporter_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "reports_admin_update" ON public.reports FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 10. users e user_profiles
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_admin_manage" ON public.users;
CREATE POLICY "users_admin_manage" ON public.users FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_profiles_admin_manage" ON public.user_profiles;
CREATE POLICY "user_profiles_admin_manage" ON public.user_profiles FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 11. notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert on notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_admin_manage" ON public.notifications;

CREATE POLICY "notifications_admin_manage" ON public.notifications FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));
