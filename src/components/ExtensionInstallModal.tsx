import React from 'react';
import { X, FileArchive, ShieldCheck, ExternalLink, Cpu, Chrome, CheckCircle2 } from 'lucide-react';
import { translations, Language } from '../translations';
import { useModalA11y } from '../hooks/useModalA11y';

interface ExtensionInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const ExtensionInstallModal: React.FC<ExtensionInstallModalProps> = ({ isOpen, onClose, lang }) => {
  const t = translations[lang] || translations.en;

  const { modalRef, handleBackdropClick } = useModalA11y({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;
  const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/mephistomail/kolhhealinebomlncflljopkphaoilob';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ext-modal-title"
    >
      <div
        ref={modalRef}
        className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Chrome className="w-5 h-5 text-orange-400" aria-hidden="true" />
            </div>
            <div>
              <h2 id="ext-modal-title" className="text-white font-bold leading-tight">
                {t.extModalTitle}
              </h2>
              <p className="text-[11px] text-green-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.extModalBadge}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            {t.extModalDesc}
          </p>

          {/* Primary Direct Install CTA */}
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-4 flex flex-col items-center text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Chrome className="w-6 h-6 text-orange-400" aria-hidden="true" />
              <span className="text-white font-bold text-base">
                {t.extDirectTitle}
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-sm">
              {t.extDirectDesc}
            </p>
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <Chrome className="w-4 h-4" aria-hidden="true" />
              <span>{t.extInstallBtn}</span>
              <ExternalLink className="w-4 h-4 opacity-80" aria-hidden="true" />
            </a>
          </div>

          {/* Features List */}
          <div className="space-y-2 pt-1 border-t border-white/5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {t.extFeaturesTitle}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" aria-hidden="true" />
                <span>{t.extFeat1}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" aria-hidden="true" />
                <span>{t.extFeat2}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" aria-hidden="true" />
                <span>{t.extFeat3}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" aria-hidden="true" />
                <span>{t.extFeat4}</span>
              </div>
            </div>
          </div>

          {/* Fallback Option */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span>{t.extManualTitle}</span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.extManualDesc1}
              <code className="text-orange-400 bg-orange-400/10 px-1 py-0.5 rounded text-[10px]">extension</code>
              {t.extManualDesc2}
              <code className="font-mono text-green-400 bg-green-400/10 px-1 py-0.5 rounded text-[10px]">chrome://extensions</code>
              {t.extManualDesc3}
            </p>
            <a
              href="https://github.com/jokallame350-lang/temp-mailmephisto/archive/refs/heads/main.zip"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <FileArchive className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>{t.extDownloadZip}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionInstallModal;
