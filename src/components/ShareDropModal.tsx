import React, { useState } from 'react';
import { X, SendToBack, Share2, Check, ShieldCheck, Copy } from 'lucide-react';
import { translations, Language } from '../translations';
import { useModalA11y } from '../hooks/useModalA11y';

interface ShareDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  activeAddress: string | undefined;
}

const ShareDropModal: React.FC<ShareDropModalProps> = ({ isOpen, onClose, lang, activeAddress }) => {
  const t = translations[lang] || translations.en;
  const [copied, setCopied] = useState(false);

  const { modalRef, handleBackdropClick } = useModalA11y({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const siteUrl = 'https://mephistomail.site';
  const viralMessageEn = `Send files securely and anonymously to my disposable address: ${activeAddress}\n\nVia MephistoMail Zero-Log Network -> ${siteUrl}`;
  const viralMessageTr = `Dosyalarınızı anonim ve güvenli olarak bana şu adresten iletin:\n${activeAddress}\n\nMephistoMail Zero-Log Ağı güvencesiyle -> ${siteUrl}`;

  const copyText = lang === 'tr' ? viralMessageTr : viralMessageEn;

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t.shareDropTitle,
          text: copyText,
        });
      } catch (err) {
        console.log('Share failed:', err);
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sharedrop-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-white relative z-10 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-r from-[#111] to-[#1a1a1c]">
          <h3 id="sharedrop-modal-title" className="text-base font-black uppercase flex items-center gap-2 text-fuchsia-500 tracking-wider">
            <SendToBack className="w-5 h-5" aria-hidden="true" />
            <span>{t.shareDropTitle}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-2 animate-pulse">
            <ShieldCheck className="w-8 h-8 text-fuchsia-500" aria-hidden="true" />
          </div>

          <p className="text-sm text-slate-300 leading-relaxed text-center">
            {t.shareDropDesc}
          </p>

          <button
            type="button"
            onClick={handleShare}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 ${
              copied
                ? 'bg-green-500 text-white shadow-green-500/20'
                : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white shadow-fuchsia-500/20'
            }`}
          >
            {copied ? <Check className="w-5 h-5" aria-hidden="true" /> : <Share2 className="w-5 h-5" aria-hidden="true" />}
            <span>{copied ? t.shareDropCopied : t.shareDropBtn}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
          >
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.shareDropJustCopy}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDropModal;
