import React, { useState } from 'react';
import { X, LogIn, UserPlus, Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { registerWithRealEmail, loginWithRealEmail } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === 'login') {
        await loginWithRealEmail(email, password);
      } else {
        await registerWithRealEmail(email, password);
      }
      onSuccess(email);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
        <div className="flex border-b border-gray-200 dark:border-white/5">
          <button 
            type="button"
            onClick={() => { setActiveTab('login'); setError(null); }} 
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'login' ? 'text-red-500 bg-red-500/5 border-b-2 border-red-500' : 'text-slate-500'}`}
          >
            Giriş
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('register'); setError(null); }} 
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'register' ? 'text-red-500 bg-red-500/5 border-b-2 border-red-500' : 'text-slate-500'}`}
          >
            Kayıt
          </button>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-red-500 transition-colors z-10">
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] rounded-lg flex items-center gap-2 font-bold"><AlertCircle className="w-4 h-4" /> {error}</div>}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Mail className="w-3 h-3" /> Email Adresi</label>
            <input 
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="örnek: isminiz@gmail.com"
              className="w-full bg-slate-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-red-500/50"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Lock className="w-3 h-3" /> Şifre</label>
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-red-500/50"
              required
            />
          </div>

          <button 
            type="submit" disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-red-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (activeTab === 'login' ? 'Oturum Aç' : 'Hesabı Oluştur')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;