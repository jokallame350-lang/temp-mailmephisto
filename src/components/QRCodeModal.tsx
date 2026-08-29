import React from 'react';
import { X, Copy, Check, QrCode } from 'lucide-react';
import { translations, Language } from '../translations';
import { useModalA11y } from '../hooks/useModalA11y';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  lang: Language;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, email, lang }) => {
  const t = translations[lang] || translations.en;
  const [copied, setCopied] = React.useState(false);

  const { modalRef, handleBackdropClick } = useModalA11y({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(email)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-white animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#111]">
          <h3 id="qr-modal-title" className="text-sm font-bold uppercase flex items-center gap-2 text-blue-400">
            <QrCode className="w-4 h-4 text-blue-500" aria-hidden="true" />
            <span>{t.qrTitle}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col items-center gap-6">
          <div className="bg-white p-3 rounded-2xl shadow-inner border border-white/20">
            <img src={qrUrl} alt={t.qrTitle} className="w-48 h-48 rounded-lg" />
          </div>
          <div className="text-center space-y-2 w-full">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{t.qrDesc}</p>
            <button
              type="button"
              onClick={handleCopy}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCopy(); } }}
              aria-label={t.tipCopy || 'Copy address'}
              className="w-full group cursor-pointer bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 hover:bg-white/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-left"
            >
              <span className="text-sm font-mono text-slate-300 truncate">{email || t.noAccount}</span>
              {copied ? <Check className="w-4 h-4 text-green-500 shrink-0" aria-hidden="true" /> : <Copy className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0 transition-colors" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;