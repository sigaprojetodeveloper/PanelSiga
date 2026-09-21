/* eslint-disable complexity */
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Trash2, 
  ArrowLeft, 
  AlertTriangle, 
  Mail, 
  User, 
  KeyRound, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles,
  Info,
  Clock,
  RefreshCw
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export default function DeleteAccountClient() {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');

  // Formulário etapa 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);

  // Etapa 2 (OTP)
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Timer do OTP
  useEffect(() => {
    let timer: any;
    if (step === 'otp' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Timer de cooldown para reenviar
  useEffect(() => {
    let timer: any;
    if (step === 'otp' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const formatMinutes = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Enviar código para o e-mail
  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }
    if (!agreed) {
      setError('Você deve marcar a caixa confirmando ciência de que a exclusão é permanente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/account/send-delete-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao solicitar código de exclusão.');
      }

      setMaskedEmail(data.maskedEmail || email);
      if (data.devCode) {
        setDevOtpHint(data.devCode);
      }
      setStep('otp');
      setTimeLeft(600);
      setCanResend(false);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Erro ao comunicar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Confirmar exclusão com o código de 6 dígitos
  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6) {
      setError('O código de verificação deve conter 6 dígitos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/account/confirm-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: cleanCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Código incorreto ou expirado.');
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Erro ao processar exclusão da conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'var(--bg-app)',
      color: 'var(--text-main)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-light)',
        padding: '14px 24px'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <Link 
            href="/terms" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'var(--transition-smooth)'
            }}
          >
            <ArrowLeft size={16} />
            <span>Voltar aos Termos</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoImg.src} alt="Siga Logo" style={{ height: '34px', objectFit: 'contain' }} />
            <span style={{ 
              fontWeight: 800, 
              fontSize: '18px', 
              fontFamily: 'var(--font-title)',
              background: 'linear-gradient(135deg, var(--primary), hsl(0, 75%, 35%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              SIGA
            </span>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Privacidade & LGPD
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{
        maxWidth: '620px',
        width: '100%',
        margin: '40px auto 60px',
        padding: '0 20px',
        flex: 1
      }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          padding: '36px',
          boxShadow: 'var(--shadow-md)'
        }}>
          {/* Header Title */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: step === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: step === 'success' ? 'var(--success)' : 'var(--danger)',
              marginBottom: '16px'
            }}>
              {step === 'success' ? <CheckCircle2 size={30} /> : <Trash2 size={26} />}
            </div>

            <h1 style={{
              fontSize: '24px',
              fontWeight: 800,
              fontFamily: 'var(--font-title)',
              color: 'var(--text-main)',
              marginBottom: '8px'
            }}>
              {step === 'form' && 'Exclusão de Conta e Dados Pessoais'}
              {step === 'otp' && 'Confirmação com Código de Segurança'}
              {step === 'success' && 'Conta Excluída com Sucesso'}
            </h1>

            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {step === 'form' && 'Informe os dados da sua conta para receber o código de validação por e-mail, conforme diretrizes da LGPD e Google Play.'}
              {step === 'otp' && `Enviamos um código de 6 dígitos para ${maskedEmail}. Insira o código abaixo para efetivar a remoção definitiva.`}
              {step === 'success' && 'Seus dados e registros pessoais foram permanentemente removidos de todos os sistemas da plataforma SIGA.'}
            </p>
          </div>

          {/* Error Message Box */}
          {error && (
            <div style={{
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              marginBottom: '20px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Dev Mode Code Hint (Apenas exibido se retornado para ambiente local) */}
          {devOtpHint && step === 'otp' && (
            <div style={{
              backgroundColor: 'var(--info-bg)',
              color: 'var(--info)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              marginBottom: '16px',
              border: '1px solid rgba(2, 132, 199, 0.2)'
            }}>
              💡 <strong>Código gerado para testes locais:</strong> {devOtpHint}
            </div>
          )}

          {/* ================= STEP 1: FORM ================= */}
          {step === 'form' && (
            <form onSubmit={handleRequestCode}>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label htmlFor="name" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Nome Completo (Cadastrado)
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="name"
                    type="text"
                    className="input-field"
                    style={{ width: '100%', paddingLeft: '38px', height: '44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  E-mail da Conta <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="email"
                    type="email"
                    required
                    className="input-field"
                    style={{ width: '100%', paddingLeft: '38px', height: '44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Warning Alert Box */}
              <div style={{
                backgroundColor: 'hsl(38, 96%, 97%)',
                border: '1px solid hsl(38, 92%, 85%)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '24px',
                fontSize: '13px',
                color: 'hsl(38, 92%, 25%)',
                lineHeight: '1.6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
                  <AlertTriangle size={16} color="hsl(38, 92%, 40%)" />
                  <span>Atenção: Ação Definitiva e Irreversível</span>
                </div>
                Ao confirmar a exclusão, seu perfil, portfólios, fotos, histórico de contratações, estabelecimentos cadastrados e dados de acesso serão apagados definitivamente.
              </div>

              {/* Checkbox of Agreement */}
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '13px',
                color: 'var(--text-main)',
                cursor: 'pointer',
                marginBottom: '26px'
              }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ marginTop: '3px', cursor: 'pointer' }}
                />
                <span>
                  Estou ciente de que a exclusão é definitiva e autorizo a remoção de todos os meus dados vinculados a este e-mail.
                </span>
              </label>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !agreed}
                style={{
                  width: '100%',
                  height: '46px',
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: (loading || !agreed) ? 'not-allowed' : 'pointer',
                  opacity: (loading || !agreed) ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {loading ? 'Processando envio...' : 'Enviar Código de Confirmação'}
              </button>
            </form>
          )}

          {/* ================= STEP 2: OTP VERIFICATION ================= */}
          {step === 'otp' && (
            <form onSubmit={handleConfirmDelete}>
              <div style={{
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Código enviado para:
                </div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>
                  {maskedEmail}
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '10px',
                  fontSize: '12px',
                  color: timeLeft < 60 ? 'var(--danger)' : 'var(--text-muted)'
                }}>
                  <Clock size={14} />
                  <span>Código expira em: <strong>{formatMinutes(timeLeft)}</strong></span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label htmlFor="otpCode" style={{ display: 'block', fontSize: '13px', fontWeight: 600, textAlign: 'center', marginBottom: '8px' }}>
                  Digite o código de 6 dígitos
                </label>
                <div style={{ position: 'relative', maxWidth: '240px', margin: '0 auto' }}>
                  <KeyRound size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="otpCode"
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    className="input-field"
                    style={{
                      width: '100%',
                      height: '52px',
                      paddingLeft: '44px',
                      fontSize: '24px',
                      fontWeight: 800,
                      letterSpacing: '8px',
                      textAlign: 'center',
                      borderRadius: 'var(--radius-sm)',
                      border: '2px solid var(--primary)'
                    }}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  style={{
                    width: '100%',
                    height: '46px',
                    backgroundColor: 'var(--danger)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: (loading || otpCode.length !== 6) ? 'not-allowed' : 'pointer',
                    opacity: (loading || otpCode.length !== 6) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <Trash2 size={16} />
                  {loading ? 'Excluindo permanentemente...' : 'Confirmar Exclusão Definitiva'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => { setStep('form'); setOtpCode(''); setError(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Voltar / Alterar e-mail
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestCode()}
                    disabled={!canResend || loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: canResend ? 'var(--primary)' : 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: canResend ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RefreshCw size={12} />
                    {canResend ? 'Reenviar código' : `Aguarde ${resendCooldown}s`}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ================= STEP 3: SUCCESS ================= */}
          {step === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                backgroundColor: 'var(--success-bg)',
                color: 'var(--success)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                lineHeight: '1.6',
                marginBottom: '24px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                ✅ A sua conta e todas as informações vinculadas foram apagadas dos nossos servidores, em cumprimento integral à <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong> e às exigências do <strong>Google Play</strong>.
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>
                Caso deseje utilizar o aplicativo no futuro, você poderá criar uma conta totalmente nova a qualquer momento.
              </p>

              <Link
                href="/terms"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-main)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Retornar aos Termos de Uso
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--border-light)',
        padding: '24px',
        textAlign: 'center',
        fontSize: '13px',
        color: 'var(--text-muted)'
      }}>
        © {new Date().getFullYear()} Plataforma SIGA. Canal oficial de conformidade e privacidade.
      </footer>
    </div>
  );
}
