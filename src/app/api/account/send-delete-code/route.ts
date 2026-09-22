import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Por favor, forneça um e-mail válido.' }, { status: 400 });
    }

    const supabaseUrl = process.env.SIGA_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SIGA_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Configuração do Supabase ausente.' }, { status: 500 });
    }

    // Invoca a Edge Function 'send-delete-code' hospedada no Supabase
    const response = await fetch(`${supabaseUrl}/functions/v1/send-delete-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ 
        name: (name || '').trim(), 
        email: email.trim().toLowerCase() 
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Falha ao solicitar código de exclusão.' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Código de confirmação gerado e enviado com sucesso.',
      maskedEmail: data.maskedEmail,
    });
  } catch (err: any) {
    console.error('Erro ao solicitar exclusão via Supabase Edge Function:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao processar a solicitação de exclusão.' },
      { status: 500 }
    );
  }
}

