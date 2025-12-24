import React from 'react';
import { X, AlertTriangle, Crown, ShieldAlert } from 'lucide-react';
import { translations, Language } from '../translations';

interface LimitModalProps {
  isOpen: boolean; onClose: () => void; title: string; message: string; type?: 'daily' | 'capacity';
  lang: Language;
}

const LimitModal: React.FC<LimitModalProps> = ({ isOpen, onClose, title, message, type = 'daily', lang }) => {
  const t = translations[lang];
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0a0a0c] border border-red-500/30 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden relative">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/5 bg-red-50 dark:bg-red-500/[0.03]">
          <h3 className="text-sm font-bold text-red-500 dark:text-red-400 uppercase flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> System Alert</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-6 flex flex-col items-center text-center space-y-4 text-slate-900 dark:text-white">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center border border-red-200 dark:border-red-500/20 mb-2">
            {type === 'daily' ? <AlertTriangle className="w-6 h-6 text-red-500" /> : <Crown className="w-6 h-6 text-orange-500" />}
          </div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
          <button onClick={onClose} className="w-full py-2.5 bg-slate-100 dark:bg-white text-slate-900 dark:text-black font-bold text-sm rounded-lg hover:bg-slate-200 transition-colors">{t.understood}</button>
          {type === 'daily' && <button className="w-full py-2.5 bg-red-50 dark:bg-red-600/10 text-red-500 font-bold text-sm rounded-lg border border-red-200 dark:border-red-500/20 flex items-center justify-center gap-2"><Crown className="w-3 h-3" /> {t.upgrade}</button>}
        </div>
      </div>
    </div>
  );
};
export default LimitModal;