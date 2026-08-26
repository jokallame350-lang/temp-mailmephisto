import React from 'react';
import { X, AlertTriangle, Crown, ShieldAlert } from 'lucide-react';
import { translations, Language } from '../translations';

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'daily' | 'capacity';
  lang: Language;
}

const LimitModal: React.FC<LimitModalProps> = ({ isOpen, onClose, title, message, type = 'daily', lang }) => {
  const t = translations[lang];
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0c] border border-red-500/30 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden relative text-white">
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-red-500/[0.03]">
          <h3 className="text-sm font-bold text-red-400 uppercase flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> {t.systemAlert}</h3>
          <button onClick={onClose} aria-label="Close modal"><X className="w-5 h-5 text-slate-500 hover:text-white transition-colors" /></button>
        </div>
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-2">
            {type === 'daily' ? <AlertTriangle className="w-6 h-6 text-red-500" /> : <Crown className="w-6 h-6 text-orange-500" />}
          </div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-sm text-slate-400">{message}</p>
          <button onClick={onClose} className="w-full py-2.5 bg-white text-black font-bold text-sm rounded-lg hover:bg-slate-200 transition-colors active:scale-95">{t.understood}</button>
        </div>
      </div>
    </div>
  );
};
export default LimitModal;