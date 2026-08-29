import React, { useState } from 'react';
import { Globe, Copy, Check, ShieldCheck, Info, X, Sparkles } from 'lucide-react';
import { translations, Language } from '../translations';
import { useModalA11y } from '../hooks/useModalA11y';

interface CustomDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomDomain: (domain: string, username: string) => void;
  lang: Language;
}

export const CustomDomainModal: React.FC<CustomDomainModalProps> = ({
  isOpen,
  onClose,
  onAddCustomDomain,
  lang,
}) => {
  const [domainInput, setDomainInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('inbox');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  const { modalRef, handleBackdropClick } = useModalA11y({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const t = translations[lang] || translations.en;

  const mxRecord = 'mx.mephistomail.site';
  const spfRecord = 'v=spf1 include:mephistomail.site ~all';

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = domainInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanUser = usernameInput.trim().toLowerCase() || 'inbox';
    if (!cleanDomain) return;

    onAddCustomDomain(cleanDomain, cleanUser);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-domain-modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/20">
              <Globe className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 id="custom-domain-modal-title" className="text-lg font-semibold text-white flex items-center gap-2">
                <span>{t.customDomainTitle}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-normal border border-purple-500/30">
                  {t.customDomainBadge}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {t.customDomainSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeStep === 1}
            onClick={() => setActiveStep(1)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              activeStep === 1
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.customDomainTab1}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeStep === 2}
            onClick={() => setActiveStep(2)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              activeStep === 2
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.customDomainTab2}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-start space-x-3">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  {t.customDomainStep1Info}
                </div>
              </div>

              {/* Record 1: MX */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
                  <span>{t.customDomainMxTitle}</span>
                  <span className="text-slate-500">{t.customDomainMxPriority}</span>
                </div>
                <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-sm font-mono">
                  <span className="text-slate-200 truncate">{mxRecord}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(mxRecord, 'mx')}
                    className="ml-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center space-x-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    aria-label="Copy MX Record"
                  >
                    {copiedField === 'mx' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        <span className="text-emerald-400">{t.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t.copy}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Record 2: TXT (SPF) */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                  <span>{t.customDomainSpfTitle}</span>
                  <span className="text-slate-500">{t.customDomainSpfHost}</span>
                </div>
                <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-sm font-mono">
                  <span className="text-slate-200 truncate">{spfRecord}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(spfRecord, 'spf')}
                    className="ml-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center space-x-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label="Copy SPF TXT Record"
                  >
                    {copiedField === 'spf' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        <span className="text-emerald-400">{t.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t.copy}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-purple-600/20 flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  <span>{t.customDomainNextStep}</span>
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.customDomainDomainLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={t.customDomainDomainPlaceholder}
                    value={domainInput}
                    onChange={e => setDomainInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-purple-500"
                  />
                  <Globe className="w-4 h-4 text-slate-500 absolute right-3 top-3" aria-hidden="true" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.customDomainUsernameLabel}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    required
                    placeholder={t.customDomainUsernamePlaceholder}
                    value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-purple-500"
                  />
                  <span className="text-slate-400 font-mono text-sm">
                    @{domainInput.trim() || 'domain.com'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>
                  {t.customDomainStep2Info}
                </span>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  {t.customDomainBackStep}
                </button>
                <button
                  type="submit"
                  disabled={!domainInput.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-purple-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  {t.customDomainActivateBtn}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomDomainModal;
