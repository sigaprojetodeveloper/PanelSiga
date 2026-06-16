import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const [adminUser, setAdminUser] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check active session from LocalStorage
    const savedUser = localStorage.getItem('siga_admin_user');
    if (savedUser) {
      setAdminUser(savedUser);
    }
    setCheckingAuth(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('siga_admin_user');
    setAdminUser(null);
  };

  const handleLoginSuccess = (username: string) => {
    localStorage.setItem('siga_admin_user', username);
    setAdminUser(username);
  };

  if (checkingAuth) {
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

  return (
    <>
      {adminUser ? (
        <Dashboard onLogout={handleLogout} adminUsername={adminUser} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

export default App;
