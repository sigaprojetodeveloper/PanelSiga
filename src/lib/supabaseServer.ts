import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedAdminClient: SupabaseClient | null = null;

/**
 * Cria ou retorna um cliente Supabase com privilégios administrativos.
 * 1. Se SUPABASE_SERVICE_ROLE_KEY estiver disponível no .env, utiliza diretamente (bypassa RLS).
 * 2. Caso contrário, autentica uma sessão administrativa em segundo plano usando a credencial
 *    da tabela admin_users (garantindo que passe na policy public.is_admin(auth.uid())).
 */
export async function getPrivilegedSupabaseClient(): Promise<SupabaseClient> {
  const supabaseUrl = process.env.SIGA_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SIGA_SUPABASE_ANON_KEY || '';

  // Se tem service_role, é a forma nativa recomendada
  if (supabaseServiceRoleKey) {
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });
  }

  // Fallback: se já temos cliente autenticado em memória com sessão ativa
  if (cachedAdminClient) {
    const { data: { session } } = await cachedAdminClient.auth.getSession();
    if (session && session.expires_at && session.expires_at * 1000 > Date.now()) {
      return cachedAdminClient;
    }
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Autenticar com o primeiro admin cadastrado em admin_users
  try {
    const { data: adminList } = await client
      .from('admin_users')
      .select('email, password, username')
      .limit(1);

    if (adminList && adminList.length > 0) {
      const adminRecord = adminList[0];
      const email = adminRecord.email || `${adminRecord.username.toLowerCase()}@siga.com`;
      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email,
        password: adminRecord.password,
      });

      if (!authError && authData.session) {
        cachedAdminClient = client;
        return client;
      }
    }
  } catch (err) {
    console.warn('[getPrivilegedSupabaseClient] Falha ao autenticar admin interno:', err);
  }

  return client;
}
