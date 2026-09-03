-- ============================================================================
-- MIGRATION: 20260827170100_setup_storage_buckets.sql
-- OBJETIVO: Criar os buckets de Storage do Supabase e configurar políticas RLS
-- APLICAÇÃO: Supabase de Produção (tdvydfbnqaihqyzqebdn)
-- ============================================================================

-- 1. Criação dos Buckets Públicos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('works', 'works', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('portfolio', 'portfolio', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf']),
  ('enterprises', 'enterprises', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('banners', 'banners', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('stories', 'stories', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
ON CONFLICT (id) DO UPDATE 
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Criação dos Buckets Privados
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('budgets', 'budgets', false, 20971520, ARRAY['application/pdf']),
  ('reports', 'reports', false, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE 
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Políticas de Acesso ao Storage (storage.objects)
DROP POLICY IF EXISTS "Leitura publica de objetos em buckets publicos" ON storage.objects;
CREATE POLICY "Leitura publica de objetos em buckets publicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('avatars', 'works', 'portfolio', 'enterprises', 'banners', 'stories'));

DROP POLICY IF EXISTS "Usuarios autenticados realizam upload" ON storage.objects;
CREATE POLICY "Usuarios autenticados realizam upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('avatars', 'works', 'portfolio', 'enterprises', 'banners', 'stories', 'budgets', 'reports'));

DROP POLICY IF EXISTS "Usuarios autenticados atualizam seus objetos" ON storage.objects;
CREATE POLICY "Usuarios autenticados atualizam seus objetos"
ON storage.objects FOR UPDATE
TO authenticated
USING (owner = auth.uid());

DROP POLICY IF EXISTS "Usuarios autenticados excluem seus objetos" ON storage.objects;
CREATE POLICY "Usuarios autenticados excluem seus objetos"
ON storage.objects FOR DELETE
TO authenticated
USING (owner = auth.uid() OR public.is_admin(auth.uid()));
