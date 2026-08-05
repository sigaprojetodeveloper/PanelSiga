import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Criação do cliente Supabase com Service Role Key (bypassa RLS para atualizações admin)
const supabaseUrl = process.env.SIGA_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SIGA_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.warn('URL do Supabase não configurada no ambiente.');
}

const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceRoleKey || ''
);

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

    // Tenta atualizar em profiles, user_profiles e users sem falhar a requisição se uma coluna não existir em uma das tabelas.
    let updatedData: any = null;

    // 1. Tenta atualizar na tabela profiles
    const profileRes = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, verification_level, is_suspended, verification_updated_at')
      .maybeSingle();

    if (profileRes.data) {
      updatedData = profileRes.data;
    }

    // 2. Tenta atualizar na tabela user_profiles
    const userProfileRes = await supabaseAdmin
      .from('user_profiles')
      .update(updatePayload)
      .eq('user_id', userId)
      .select('user_id, verification_level, is_suspended, verification_updated_at')
      .maybeSingle();

    if (!updatedData && userProfileRes.data) {
      updatedData = { id: userId, ...userProfileRes.data };
    }

    // 3. Tenta atualizar na tabela users (se possuir a coluna)
    try {
      const userRes = await supabaseAdmin
        .from('users')
        .update(updatePayload)
        .eq('id', userId)
        .select('id, verification_level, is_suspended, verification_updated_at')
        .maybeSingle();

      if (!updatedData && userRes.data) {
        updatedData = userRes.data;
      }
    } catch {
      // ignora caso users não possua a coluna no schema cache do postgres
    }

    return NextResponse.json({
      success: true,
      data: updatedData || { id: userId, ...updatePayload },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro interno no servidor de administração' },
      { status: 500 }
    );
  }
}
