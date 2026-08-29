import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast, { ToastData } from '../components/Toast';

interface ToastContextType {
  toasts: ToastData[];
  addToast: (from: string, subject: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Extract OTP code from subject or body for toast notification
const extractOTPCode = (subject: string): string | null => {
  const patterns = [/\b(\d{6})\b/, /\b(\d{4})\b/, /\b(\d{8})\b/, /code[:\s]+(\d{4,8})/i, /kod[:\s]+(\d{4,8})/i];
  for (const p of patterns) {
    const m = subject.match(p);
    if (m) return m[1];
  }
  return null;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((from: string, subject: string) => {
    const code = extractOTPCode(subject);
    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const toast: ToastData = {
      id: uniqueId,
      from,
      subject,
      code: code || undefined,
    };
    setToasts((prev) => [toast, ...prev.filter(t => t.subject !== subject || t.from !== from)].slice(0, 3));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
