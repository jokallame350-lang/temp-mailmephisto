import React from 'react';
import { X, ShieldAlert, FileText } from 'lucide-react';
import { translations, Language } from '../translations';
import { useModalA11y } from '../hooks/useModalA11y';

interface LegalModalProps {
  type: 'privacy' | 'terms';
  lang: Language | string;
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ type, lang, onClose }) => {
  const currentLang = (translations as any)[lang] ? (lang as Language) : 'en';
  const t = translations[currentLang] || translations.en;

  const { modalRef, handleBackdropClick } = useModalA11y({
    isOpen: true,
    onClose,
  });

  const content = {
    privacy: {
      title: t.privacyTitle || t.footerPrivacy,
      icon: <ShieldAlert className="w-6 h-6 text-red-500" aria-hidden="true" />,
      text: t.privacyModalText,
    },
    terms: {
      title: t.termsTitle || t.footerTerms,
      icon: <FileText className="w-6 h-6 text-red-500" aria-hidden="true" />,
      text: t.termsModalText,
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-[#0f0f12] border border-white/10 rounded-[32px] p-6 sm:p-8 relative shadow-2xl animate-in zoom-in-95 duration-150 text-white"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={currentLang === 'tr' ? 'Kapat' : 'Close'}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-all p-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shrink-0">
            {content[type].icon}
          </div>
          <h2 id="legal-modal-title" className="text-lg sm:text-xl font-black uppercase italic tracking-tighter text-white">
            {content[type].title}
          </h2>
        </div>

        <div className="text-slate-300 text-sm leading-relaxed max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <p className="mb-4">{content[type].text}</p>
          <p className="opacity-50 text-[12px]">Last updated: 2025-12-24</p>
        </div>

        <button 
          type="button"
          onClick={onClose}
          className="w-full mt-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          {t.understood}
        </button>
      </div>
    </div>
  );
};

export default LegalModal;