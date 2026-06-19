"use client";

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldAlert, Key, User, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (username: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Query the admin_users table
      const { data, error: dbError } = await (supabase
        .from('admin_users' as any)
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle() as any);

      if (dbError) {
        console.error('Supabase DB error:', dbError);
        // Fallback to default user
        if (username === 'SigaAdmin' && password === 'Entrar.Siga.123') {
          onLoginSuccess(username);
          return;
        }
        setError(`Erro de banco de dados: ${dbError.message}`);
        return;
      }

      if (data) {
        onLoginSuccess(data.username);
      } else {
        // Fallback to default user check in case table wasn't seeded or for offline usage
        if (username === 'SigaAdmin' && password === 'Entrar.Siga.123') {
          onLoginSuccess(username);
        } else {
          setError('Usuário ou senha incorretos.');
        }
      }
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      if (username === 'SigaAdmin' && password === 'Entrar.Siga.123') {
        onLoginSuccess(username);
      } else {
        setError(err.message || 'Erro inesperado ao realizar login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <ShieldAlert size={36} color="var(--primary)" />
          <h1>Painel Siga</h1>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
          Painel de Moderação e Controle da Plataforma Siga
        </p>

        {error && (
          <div style={{
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            marginBottom: '20px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Usuário Administrativo</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="username"
                type="text"
                className="input-field"
                style={{ width: '100%', paddingLeft: '38px' }}
                placeholder="Ex: Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label htmlFor="password">Senha</label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                style={{ width: '100%', paddingLeft: '38px', paddingRight: '40px' }}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '45px', marginBottom: '8px' }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}
