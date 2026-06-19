"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '../../components/Login';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const user = localStorage.getItem('siga_admin_user');
    if (user) {
      router.push('/');
    }
  }, [router]);

  const handleLoginSuccess = (username: string) => {
    localStorage.setItem('siga_admin_user', username);
    router.push('/');
  };

  if (!mounted) {
    return null; // Or simple landing loading element
  }

  return <Login onLoginSuccess={handleLoginSuccess} />;
}
