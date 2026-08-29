import React, { useMemo, useState } from 'react';
import { X, UserCheck, Copy, Check, MapPin, Briefcase, Calendar, Phone } from 'lucide-react';
import { translations, Language } from '../translations';
import { generateDeterministicIdentity } from '../utils/identity';
import { useModalA11y } from '../hooks/useModalA11y';

interface IdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  activeAddress: string | undefined;
}

const IdentityModal: React.FC<IdentityModalProps> = ({ isOpen, onClose, lang, activeAddress }) => {
  const t = translations[lang] || translations.en;
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { modalRef, handleBackdropClick } = useModalA11y({
    isOpen,
    onClose,
  });

  const identity = useMemo(() => {
    if (!activeAddress) return null;
    return generateDeterministicIdentity(activeAddress);
  }, [activeAddress]);

  if (!isOpen || !identity) return null;

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyBtn = (field: string, text: string) => (
    <button
      type="button"
      onClick={() => handleCopy(field, text)}
      aria-label={`Copy ${field}`}
      className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {copiedField === field ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="identity-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-white relative z-10 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#111]">
          <h3 id="identity-modal-title" className="text-sm font-bold uppercase flex items-center gap-2 text-indigo-400">
            <UserCheck className="w-4 h-4" aria-hidden="true" />
            <span>{t.identityTitle}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed mb-2 text-center">
            {t.identityDesc}
          </p>

          <div className="space-y-3">
            <div className="flex flex-col gap-1 p-3 bg-black/40 border border-white/5 rounded-xl group hover:border-indigo-500/50 transition-colors">
              <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5"><UserCheck className="w-3 h-3" aria-hidden="true" /> {t.identityName}</span>
              <div className="flex justify-between items-center text-sm font-medium"><span>{identity.name}</span> {copyBtn('name', identity.name)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 p-3 bg-black/40 border border-white/5 rounded-xl group hover:border-indigo-500/50 transition-colors">
                <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5"><Calendar className="w-3 h-3" aria-hidden="true" /> {t.identityBirthday}</span>
                <div className="flex justify-between items-center text-sm text-slate-300 font-mono"><span>{identity.birthday}</span> {copyBtn('birthday', identity.birthday)}</div>
              </div>
              <div className="flex flex-col gap-1 p-3 bg-black/40 border border-white/5 rounded-xl group hover:border-indigo-500/50 transition-colors">
                <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5"><Phone className="w-3 h-3" aria-hidden="true" /> {t.identityPhone}</span>
                <div className="flex justify-between items-center text-sm text-slate-300 font-mono"><span>{identity.phone}</span> {copyBtn('phone', identity.phone)}</div>
              </div>
            </div>

            <div className="flex flex-col gap-1 p-3 bg-black/40 border border-white/5 rounded-xl group hover:border-indigo-500/50 transition-colors">
              <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5"><Briefcase className="w-3 h-3" aria-hidden="true" /> {t.identityJob}</span>
              <div className="flex justify-between items-center text-sm font-medium text-emerald-400"><span>{identity.job}</span> {copyBtn('job', identity.job)}</div>
            </div>

            <div className="flex flex-col gap-1 p-3 bg-black/40 border border-white/5 rounded-xl group hover:border-indigo-500/50 transition-colors">
              <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5"><MapPin className="w-3 h-3" aria-hidden="true" /> {t.identityAddress}</span>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="break-words max-w-[80%] text-slate-200">{identity.address}</span>
                {copyBtn('address', identity.address)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityModal;
