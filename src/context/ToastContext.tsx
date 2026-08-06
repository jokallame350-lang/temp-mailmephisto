import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast, { ToastData } from '../components/Toast';

interface ToastContextType {
  toasts: ToastData[];
  addToast: (from: string, subject: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// OTP kodunu subject'ten çıkar (toast için)
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
    const toast: ToastData = {
      id: Date.now().toString(),
      from,
      subject,
      code: code || undefined,
    };
    setToasts((prev) => [toast, ...prev].slice(0, 5));
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
