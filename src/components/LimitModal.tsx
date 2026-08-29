import React from 'react';
import { X, AlertTriangle, Crown, ShieldAlert } from 'lucide-react';
import { translations, Language } from '../translations';
import { useModalA11y } from '../hooks/useModalA11y';

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'daily' | 'capacity';
  lang: Language;
}

const LimitModal: React.FC<LimitModalProps> = ({ isOpen, onClose, title, message, type = 'daily', lang }) => {
  const t = translations[lang] || translations.en;

  const { modalRef, handleBackdropClick } = useModalA11y({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="limit-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-[#0a0a0c] border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative text-white animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-red-500/[0.03]">
          <h3 id="limit-modal-title" className="text-sm font-bold text-red-400 uppercase flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500" aria-hidden="true" />
            <span>{t.systemAlert}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-2">
            {type === 'daily' ? <AlertTriangle className="w-6 h-6 text-red-500" aria-hidden="true" /> : <Crown className="w-6 h-6 text-orange-500" aria-hidden="true" />}
          </div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-white hover:bg-slate-200 text-black font-bold text-sm rounded-xl transition-colors active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            {t.understood}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LimitModal;