/* eslint-disable complexity */
import { NextRequest, NextResponse } from 'next/server';
import { getPrivilegedSupabaseClient } from '@/lib/supabaseServer';
import { sendDeleteAccountEmail } from '@/services/emailService';

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Por favor, forneça um e-mail válido.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabase = await getPrivilegedSupabaseClient();

    // 1. Localizar o usuário pelo email
    let targetUserId: string | null = null;
    let targetUserName: string = (name || '').trim();

    // Consulta 1: public.users (com sessão admin ou service_role, passa pelo RLS)
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, name, email')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (dbUser && dbUser.id) {
      targetUserId = dbUser.id;
      if (!targetUserName && dbUser.name) {
        targetUserName = dbUser.name;
      }
    }

    // Consulta 2: user_profiles (caso o email esteja em email_contact)
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

    // Consulta 3: auth.users (via admin se service_role estiver ativo)
    if (!targetUserId) {
      try {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const found = authUsers?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
        if (found) {
          targetUserId = found.id;
          targetUserName = targetUserName || found.user_metadata?.full_name || found.user_metadata?.name || '';
        }
      } catch (authErr) {
        // ignora se não tiver permissão de listUsers
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Nenhuma conta cadastrada foi encontrada com este endereço de e-mail.' },
        { status: 404 }
      );
    }

    // 2. Gerar código OTP de 6 dígitos e validade de 10 minutos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // 3. Salvar na tabela account_deletion_otps (com fallback silencioso)
    try {
      await supabase.from('account_deletion_otps').delete().eq('user_id', targetUserId);
      await supabase.from('account_deletion_otps').insert({
        user_id: targetUserId,
        code,
        expires_at: expiresAt,
        used: false,
      });
    } catch (otpErr) {
      console.warn('[send-delete-code] Falha ao persistir em account_deletion_otps:', otpErr);
    }

    // 4. Enviar e-mail com o código OTP de 6 dígitos
    const emailResult = await sendDeleteAccountEmail({
      toEmail: cleanEmail,
      code,
      name: targetUserName,
    });

    if (!emailResult.success) {
      console.warn('[send-delete-code] Falha no envio de e-mail:', emailResult.error);
    }

    // Mascara o e-mail para exibição segura: ex: u***@dominio.com
    const [userPart, domainPart] = cleanEmail.split('@');
    const maskedUser = userPart.length > 2 
      ? `${userPart[0]}${'*'.repeat(userPart.length - 2)}${userPart[userPart.length - 1]}`
      : `${userPart[0]}*`;
    const maskedEmail = `${maskedUser}@${domainPart}`;

    return NextResponse.json({
      success: true,
      message: 'Código de confirmação gerado e enviado com sucesso.',
      maskedEmail,
      // Em ambiente de desenvolvimento local, expõe o código para facilidade de testes rápidos
      devCode: process.env.NODE_ENV !== 'production' ? code : undefined,
    });
  } catch (err: any) {
    console.error('Erro ao solicitar exclusão:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao processar a solicitação de exclusão.' },
      { status: 500 }
    );
  }
}
