/* eslint-disable complexity */
import { NextRequest, NextResponse } from 'next/server';
import { getPrivilegedSupabaseClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code || String(code).trim().length !== 6) {
      return NextResponse.json({ error: 'E-mail e código de 6 dígitos são obrigatórios.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim();
    const supabase = await getPrivilegedSupabaseClient();

    // 1. Identificar o usuário
    let targetUserId: string | null = null;

    const { data: dbUser } = await supabase
      .from('users')
      .select('id, email')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (dbUser && dbUser.id) {
      targetUserId = dbUser.id;
    }

    if (!targetUserId) {
      const { data: upUser } = await supabase
        .from('user_profiles')
        .select('user_id, email_contact')
        .ilike('email_contact', cleanEmail)
        .maybeSingle();

      if (upUser && upUser.user_id) {
        targetUserId = upUser.user_id;
      }
    }

    if (!targetUserId) {
      try {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const found = authUsers?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
        if (found) targetUserId = found.id;
      } catch {
        // ignora fallback
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // 2. Validar o código OTP na tabela account_deletion_otps
    let otpValid = false;
    let otpRecordId: string | null = null;

    try {
      const { data: otp1 } = await supabase
        .from('account_deletion_otps')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('code', cleanCode)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (otp1) {
        otpValid = true;
        otpRecordId = otp1.id;
      }
    } catch {
      // continua
    }

    if (!otpValid) {
      return NextResponse.json({ error: 'Código de verificação inválido ou expirado.' }, { status: 400 });
    }

    // 3. Marcar OTP como utilizado (anti-replay)
    try {
      if (otpRecordId) {
        await supabase.from('account_deletion_otps').update({ used: true }).eq('id', otpRecordId);
      }
    } catch {
      // Continua com a exclusão
    }

    // 4. Deleção em cascata dos dados pessoais (LGPD)
    try {
      const { data: works } = await supabase
        .from('portfolio_works')
        .select('id')
        .eq('professional_id', targetUserId);

      if (works && works.length > 0) {
        const workIds = works.map((w: any) => w.id);
        await supabase.from('portfolio_media').delete().in('portfolio_work_id', workIds);
      }
      await supabase.from('portfolio_works').delete().eq('professional_id', targetUserId);
    } catch (e) {
      console.warn('Erro ao limpar portfólio:', e);
    }

    try {
      await supabase.from('user_specialties').delete().eq('user_id', targetUserId);
      await supabase.from('professional_coverages').delete().eq('user_id', targetUserId);
      await supabase.from('addresses').delete().eq('user_id', targetUserId);
      await supabase.from('user_profiles').delete().eq('user_id', targetUserId);
      await supabase.from('account_deletion_otps').delete().eq('user_id', targetUserId);
      await supabase.from('users').delete().eq('id', targetUserId);
    } catch (e) {
      console.warn('Erro ao limpar tabelas do usuário:', e);
    }

    // 5. Deletar do Supabase Auth se tiver privilégio
    try {
      await supabase.auth.admin.deleteUser(targetUserId);
    } catch (authDelErr) {
      console.warn('Exclusão direta do auth não concluída via client:', authDelErr);
    }

    // 6. Registrar auditoria anonimizada
    try {
      await supabase.from('audit_logs').insert({
        action: 'ACCOUNT_DELETED_WEB',
        metadata: {
          reason: 'user_public_web_request_lgpd',
          timestamp: new Date().toISOString(),
        },
      });
    } catch {
      // Auditoria opcional
    }

    return NextResponse.json({
      success: true,
      message: 'Sua conta e todos os dados associados foram excluídos definitivamente.',
    });
  } catch (err: any) {
    console.error('Erro confirm-delete:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao efetuar a exclusão da conta.' },
      { status: 500 }
    );
  }
}
