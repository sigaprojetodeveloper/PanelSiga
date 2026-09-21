import nodemailer from 'nodemailer';

const gmailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const gmailPassword = process.env.SMTP_PASS || process.env.EMAIL_PASS;

export async function sendDeleteAccountEmail(params: {
  toEmail: string;
  code: string;
  name?: string;
}): Promise<{ success: boolean; error?: string }> {
  // Se não houver credenciais SMTP configuradas no servidor, registra aviso e prossegue sem travar
  if (!gmailUser || !gmailPassword) {
    console.info(`[emailService] Provedor SMTP não configurado. Código OTP gerado para ${params.toEmail}: ${params.code}`);
    return { success: true };
  }

  try {
    const { toEmail, code, name } = params;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    const rawHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; background: #f8fafc;">
    <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
      <h2 style="color: #0f172a; margin: 0 0 8px;">Solicitação de Exclusão de Conta</h2>
      <p style="color: #64748b; font-size: 15px; margin: 0 0 24px;">
        Olá ${name ? `<strong>${name}</strong>` : ''}, recebemos uma solicitação para <strong>excluir permanentemente</strong> sua conta e dados no aplicativo Siga.
      </p>
      <p style="color: #475569; font-size: 14px; margin: 0 0 12px;">Use o código de verificação abaixo para confirmar a exclusão:</p>
      <div style="background: #fef2f2; border: 2px dashed #fca5a5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #dc2626;">${code}</span>
      </div>
      <p style="color: #dc2626; font-size: 13px; font-weight: 600; text-align: center; margin: 0 0 24px;">⏱ Este código expira em <strong>10 minutos</strong>.</p>
      <div style="background: #fafafa; border-radius: 8px; padding: 16px; font-size: 13px; color: #64748b; line-height: 1.6;">
        <strong>⚠️ Atenção:</strong> A exclusão da conta é <strong>permanente e irreversível</strong>. Todos os seus dados, cadastros, anúncios e históricos serão removidos conforme a LGPD (Lei nº 13.709/2018).
        <br/><br/>
        Se você <strong>não solicitou</strong> isso, ignore este e-mail. Sua conta permanecerá intacta.
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"/>
      <p style="color: #94a3b8; font-size: 11px; margin: 0; text-align: center;">Plataforma Siga — Este é um e-mail automático. Não responda.</p>
    </div>
  </body>
</html>`;

    await transporter.sendMail({
      from: `"Plataforma Siga" <${gmailUser}>`,
      to: toEmail,
      subject: '🔐 Código para exclusão da sua conta Siga',
      html: rawHtml,
    });

    return { success: true };
  } catch (err: any) {
    console.error('[emailService] Erro ao disparar e-mail de exclusão:', err);
    return { success: false, error: err.message || 'Erro ao enviar e-mail.' };
  }
}
