import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Copy, Check, ShieldCheck } from 'lucide-react';
import { translations, Language } from '../translations';
import { useModalA11y } from '../hooks/useModalA11y';

interface PasswordGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const PasswordGenModal: React.FC<PasswordGenModalProps> = ({ isOpen, onClose, lang }) => {
  const t = translations[lang] || translations.en;
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const { modalRef, handleBackdropClick } = useModalA11y({
    isOpen,
    onClose,
  });

  const generatePassword = useCallback(() => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let validChars = chars;
    if (includeNumbers) validChars += numbers;
    if (includeSymbols) validChars += symbols;
    let generated = '';
    for (let i = 0; i < length; i++) generated += validChars.charAt(Math.floor(Math.random() * validChars.length));
    setPassword(generated);
    setCopied(false);
  }, [length, includeNumbers, includeSymbols]);

  useEffect(() => {
    if (isOpen) generatePassword();
  }, [isOpen, generatePassword]);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pass-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-white animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#111]">
          <h3 id="pass-modal-title" className="text-sm font-bold uppercase flex items-center gap-2 text-green-400">
            <ShieldCheck className="w-4 h-4 text-green-500" aria-hidden="true" />
            <span>{t.passTitle}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 sm:p-6 space-y-6">
          <div className="relative flex items-center bg-black border border-white/10 rounded-xl p-3 sm:p-4 justify-between gap-2">
            <span className="font-mono text-base sm:text-lg text-emerald-400 break-all mr-2 select-all">{password}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={generatePassword}
                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                aria-label={lang === 'tr' ? 'Yeni şifre oluştur' : 'Generate new password'}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                aria-label={copied ? t.copied : t.copy}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs uppercase font-bold text-slate-400">
                <span>{t.length}</span>
                <span className="font-mono">{length} {t.chars}</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label={t.length}
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIncludeNumbers(!includeNumbers); } }}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${includeNumbers ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-500 bg-transparent'}`}
                  role="checkbox"
                  aria-checked={includeNumbers}
                  aria-label={t.nums}
                >
                  {includeNumbers && <Check className="w-3 h-3" aria-hidden="true" />}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={includeNumbers}
                  onChange={() => setIncludeNumbers(!includeNumbers)}
                  tabIndex={-1}
                />
                <span className="text-sm text-slate-300 select-none">{t.nums}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIncludeSymbols(!includeSymbols); } }}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${includeSymbols ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-500 bg-transparent'}`}
                  role="checkbox"
                  aria-checked={includeSymbols}
                  aria-label={t.syms}
                >
                  {includeSymbols && <Check className="w-3 h-3" aria-hidden="true" />}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={includeSymbols}
                  onChange={() => setIncludeSymbols(!includeSymbols)}
                  tabIndex={-1}
                />
                <span className="text-sm text-slate-300 select-none">{t.syms}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordGenModal;