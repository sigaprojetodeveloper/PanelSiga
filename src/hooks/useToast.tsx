"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  createdAt?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    const createdAt = performance.now();
    const newToast: ToastItem = { id, message, type, duration: 10000, createdAt };
    
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 10000);
  }, [removeToast]);

  const toast = useCallback((message: string, type?: ToastType, duration?: number) => {
    addToast(message, type);
  }, [addToast]);

  const success = useCallback((message: string, duration?: number) => {
    addToast(message, 'success');
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    addToast(message, 'info');
  }, [addToast]);

  const warning = useCallback((message: string, duration?: number) => {
    addToast(message, 'warning');
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    addToast(message, 'error');
  }, [addToast]);

  useEffect(() => {
    if (toasts.length === 0) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.toast')) {
        const now = performance.now();
        setToasts((prev) => prev.filter((t) => t.createdAt && (now - t.createdAt) < 100));
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [toasts]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-success" style={{ color: 'var(--success)' }} />;
      case 'warning':
        return <AlertTriangle size={18} className="text-warning" style={{ color: 'var(--warning)' }} />;
      case 'error':
        return <XCircle size={18} className="text-danger" style={{ color: 'var(--danger)' }} />;
      case 'info':
      default:
        return <Info size={18} className="text-info" style={{ color: 'var(--info)' }} />;
    }
  };

  return (
    <ToastContext.Provider value={{ toast, success, info, warning, error }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type}`}
            onClick={() => removeToast(t.id)}
          >
            {getIcon(t.type)}
            <div className="toast-content">
              <div className="toast-message">{t.message}</div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
}
