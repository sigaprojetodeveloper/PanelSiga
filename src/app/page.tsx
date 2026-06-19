"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '../components/Dashboard';

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [adminUser, setAdminUser] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const user = localStorage.getItem('siga_admin_user');
    if (!user) {
      router.push('/login');
    } else {
      setAdminUser(user);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('siga_admin_user');
    router.push('/login');
  };

  if (!mounted || !adminUser) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)',
        fontFamily: 'var(--font-sans)',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--border-light)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontWeight: 600 }}>Verificando credenciais...</span>
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  return <Dashboard adminUsername={adminUser} onLogout={handleLogout} />;
}
