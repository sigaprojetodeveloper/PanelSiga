-- ============================================================================
-- SCRIPT: setup_admin_master.sql
-- OBJETIVO: Vincular um usuário existente do auth.users como admin_master em Produção
-- INSTRUÇÃO: Substitua 'seu_email@exemplo.com' e 'seu_username' antes de executar.
-- ============================================================================

DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'seu_email@exemplo.com'; -- 🔴 Substitua pelo seu email cadastrado no Auth
  v_username text := 'master';             -- 🔴 Substitua pelo username desejado no painel
BEGIN
  -- Localiza o UUID do usuário em auth.users
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com o email "%" não foi encontrado em auth.users. Crie a conta primeiro via painel Auth do Supabase.', v_email;
  END IF;

  -- Insere ou atualiza na tabela admin_users com papel admin_master
  INSERT INTO public.admin_users (id, username, email, role, status)
  VALUES (v_user_id, v_username, v_email, 'admin_master', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin_master',
      status = 'ACTIVE',
      updated_at = now();

  RAISE NOTICE '✅ Sucesso! O usuário "%" (ID: %) agora é ADMIN_MASTER do SigaPanelAdmin.', v_email, v_user_id;
END $$;
