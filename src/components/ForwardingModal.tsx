import React, { useState, useEffect } from 'react';
import { Ghost, X, AlertTriangle, ArrowRight, CheckCircle, Trash2, Clock } from 'lucide-react';
import { translations, Language } from '../translations';
import { useModalA11y } from '../hooks/useModalA11y';

interface ForwardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  activeAddress: string | undefined;
}

interface ForwardingPref {
  source: string;
  destination: string;
  queuedAt: number;
  status: 'queued_for_beta';
}

const STORAGE_PREFIX = 'mephisto_forwarding_pref_';

const ForwardingModal: React.FC<ForwardingModalProps> = ({ isOpen, onClose, lang, activeAddress }) => {
  const t = translations[lang] || translations.en;
  const [targetEmail, setTargetEmail] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [savedPref, setSavedPref] = useState<ForwardingPref | null>(null);

  const { modalRef, handleBackdropClick } = useModalA11y({
    isOpen,
    onClose,
  });

  const storageKey = `${STORAGE_PREFIX}${activeAddress || 'default'}`;

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: ForwardingPref = JSON.parse(raw);
        if (parsed?.destination) {
          setTargetEmail(parsed.destination);
          setIsSaved(true);
          setSavedPref(parsed);
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }
    setIsSaved(false);
    setSavedPref(null);
  }, [isOpen, storageKey]);

  if (!isOpen) return null;

  const isValidEmail = targetEmail.trim().includes('@') && targetEmail.trim().includes('.');

  const handleSave = () => {
    if (!isValidEmail) return;
    const newPref: ForwardingPref = {
      source: activeAddress || 'unassigned',
      destination: targetEmail.trim().toLowerCase(),
      queuedAt: Date.now(),
      status: 'queued_for_beta',
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(newPref));
    } catch {
      // Ignore storage write error
    }
    setSavedPref(newPref);
    setIsSaved(true);
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage removal error
    }
    setSavedPref(null);
    setTargetEmail('');
    setIsSaved(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forwarding-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-white relative z-10 animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#111]">
          <h3 id="forwarding-modal-title" className="text-sm font-bold uppercase flex items-center gap-2 text-rose-500">
            <Ghost className="w-4 h-4 text-rose-500" aria-hidden="true" />
            <span>{t.ghostForwardTitle}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Private Beta Notice */}
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 text-xs text-rose-300 flex flex-col gap-1.5 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>{t.ghostBetaTitle}</span>
            </div>
            <p className="text-rose-300/90 text-[11px]">
              {t.ghostBetaDesc}
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed text-center">
            {t.ghostForwardDesc}
          </p>

          {/* Routing Preference Configuration */}
          <div className="space-y-3">
            <div className="flex flex-col gap-1 p-3 bg-black/40 border border-white/5 rounded-xl group hover:border-white/10 transition-colors">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
                {t.ghostSourceLabel}
              </span>
              <span className="text-sm font-mono font-medium text-emerald-400 truncate">
                {activeAddress || t.ghostSelectAddress}
              </span>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <div className="bg-black border border-white/10 p-1.5 rounded-full text-slate-500 shadow-md">
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
            </div>

            <div className="flex flex-col gap-1 p-3 bg-black/40 border border-white/5 rounded-xl focus-within:border-rose-500/50 transition-colors">
              <label htmlFor="forward-dest-email" className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
                {t.ghostDestLabel}
              </label>
              <input
                id="forward-dest-email"
                value={targetEmail}
                onChange={(e) => {
                  setTargetEmail(e.target.value);
                  if (isSaved && e.target.value !== savedPref?.destination) {
                    setIsSaved(false);
                  }
                }}
                type="email"
                placeholder="real-inbox@example.com"
                className="w-full bg-transparent border-none text-sm font-mono text-white focus:outline-none placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-rose-500 rounded"
              />
            </div>
          </div>

          {/* Saved State Status Card */}
          {isSaved && savedPref && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-2 animate-fade-in" role="status">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />
                <span>{t.ghostActiveRule}</span>
              </div>
              <p className="text-[11px] text-emerald-300/80 leading-normal">
                {t.ghostQueuedNotice}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 pt-1 border-t border-emerald-500/20">
                <Clock className="w-3 h-3 text-slate-500" aria-hidden="true" />
                <span>
                  {lang === 'tr' ? 'Kayıt Zamanı:' : 'Queued At:'} {new Date(savedPref.queuedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              type="button"
              disabled={!isValidEmail}
              onClick={handleSave}
              className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                !isValidEmail
                  ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                  : isSaved
                    ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/40'
                    : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-rose-500/20'
              }`}
            >
              {isSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span>{lang === 'tr' ? 'Tercih Kaydedildi' : 'Preference Saved'}</span>
                </>
              ) : (
                <>
                  <Ghost className="w-4 h-4" aria-hidden="true" />
                  <span>{t.ghostActivateBtn}</span>
                </>
              )}
            </button>

            {isSaved && (
              <button
                type="button"
                onClick={handleClear}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                title={t.ghostRemovePrefBtn}
                aria-label={t.ghostRemovePrefBtn}
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="sm:hidden">{t.ghostRemovePrefBtn}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForwardingModal;
