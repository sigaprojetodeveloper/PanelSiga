import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SIGA_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.SIGA_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cria cliente Supabase autenticado no escopo administrativo
async function getAdminSupabaseClient(req: NextRequest) {
  if (serviceRoleKey && serviceRoleKey !== anonKey) {
    return createClient(supabaseUrl, serviceRoleKey);
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    return createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
  }

  const adminClient = createClient(supabaseUrl, anonKey);
  const { error: authError } = await adminClient.auth.signInWithPassword({
    email: 'admin@siga.com',
    password: 'Entrar.Siga.123',
  });

  if (authError) {
    console.warn('[update-verification] Aviso ao autenticar como admin no servidor:', authError.message);
  }

  return adminClient;
}

async function updateProfileRecord(client: any, userId: string, payload: Record<string, any>) {
  const { data, error } = await client
    .from('user_profiles')
    .update(payload)
    .eq('user_id', userId)
    .select('user_id, verification_level, is_suspended, verification_updated_at');

  if (error) {
    console.error('[update-verification] Erro user_profiles:', error);
    return null;
  }

  if (data && data.length > 0) {
    return { id: userId, ...data[0] };
  }

  // Se não existia linha em user_profiles, realiza upsert
  const { data: upsertData } = await client
    .from('user_profiles')
    .upsert({ user_id: userId, is_available: true, ...payload }, { onConflict: 'user_id' })
    .select('user_id, verification_level, is_suspended, verification_updated_at');

  return (upsertData && upsertData.length > 0) ? { id: userId, ...upsertData[0] } : null;
}

async function updateUserRecord(client: any, userId: string, payload: Record<string, any>) {
  const { data, error } = await client
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select('id, verification_level, is_suspended, verification_updated_at');

  if (error) {
    console.error('[update-verification] Erro users:', error);
    return null;
  }

  return (data && data.length > 0) ? data[0] : null;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, verificationLevel, isSuspended } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      verification_updated_at: new Date().toISOString(),
    };

    if (verificationLevel !== undefined) {
      updatePayload.verification_level = verificationLevel;
    }

    if (isSuspended !== undefined) {
      updatePayload.is_suspended = isSuspended;
    }

    const supabaseAdmin = await getAdminSupabaseClient(req);

    const [profileResult, userResult] = await Promise.all([
      updateProfileRecord(supabaseAdmin, userId, updatePayload),
      updateUserRecord(supabaseAdmin, userId, updatePayload),
    ]);

    const updatedData = profileResult || userResult;

    if (!updatedData) {
      return NextResponse.json(
        { error: 'Não foi possível persistir a alteração no banco de dados. Verifique as permissões de administrador.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedData,
    });
  } catch (err: any) {
    console.error('[update-verification] Erro interno:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno no servidor de administração' },
      { status: 500 }
    );
  }
}
