import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code || String(code).trim().length !== 6) {
      return NextResponse.json({ error: 'E-mail e código de 6 dígitos são obrigatórios.' }, { status: 400 });
    }

    const supabaseUrl = process.env.SIGA_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SIGA_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Configuração do Supabase ausente.' }, { status: 500 });
    }

    // Invoca a Edge Function 'delete-user-account' hospedada no Supabase
    const response = await fetch(`${supabaseUrl}/functions/v1/delete-user-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ 
        email: email.trim().toLowerCase(), 
        code: String(code).trim() 
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Código incorreto ou erro ao excluir conta.' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Sua conta e todos os dados associados foram excluídos definitivamente.',
    });
  } catch (err: any) {
    console.error('Erro confirm-delete via Supabase Edge Function:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao efetuar a exclusão da conta.' },
      { status: 500 }
    );
  }
}

