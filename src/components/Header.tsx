import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mailbox } from '../types';
import { Copy, Check, User, QrCode, KeyRound, Languages, ChevronDown, Trash2, Download } from 'lucide-react';
import { translations, Language } from '../translations';

interface HeaderProps {
  accounts: Mailbox[];
  currentAccount: Mailbox | null;
  onSwitchAccount: (id: string) => void;
  onDeleteAccount: (id: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onOpenQR?: () => void;
  onOpenPass?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  accounts, currentAccount, onSwitchAccount, onDeleteAccount,
  lang, setLang, onOpenQR, onOpenPass
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  const langDropRef = useRef<HTMLDivElement>(null);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (langDropRef.current && !langDropRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // PWA Install
  const [pwaInstallable, setPwaInstallable] = useState(false);
  useEffect(() => {
    // Zaten müsaitse
    if ((window as any).__pwaInstallPrompt) setPwaInstallable(true);
    const handler = () => setPwaInstallable(true);
    window.addEventListener('pwa-install-available', handler);
    return () => window.removeEventListener('pwa-install-available', handler);
  }, []);

  const handleInstallPWA = useCallback(async () => {
    const prompt = (window as any).__pwaInstallPrompt;
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') {
      setPwaInstallable(false);
    }
  }, []);

  const copyToClipboard = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <header className="fixed top-0 left-0 w-full h-14 sm:h-16 border-b border-white/5 bg-[#0a0a0c]/90 backdrop-blur-xl z-50 flex items-center justify-between px-2 sm:px-4 md:px-8 shadow-2xl transition-all duration-300">

      {/* Logo Alanı */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
        <img
          src="/logo.svg"
          alt="Mephisto Logo"
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-lg shadow-red-500/20 object-cover hover:scale-105 transition-transform duration-300 flex-shrink-0"
        />
        <div className="hidden md:flex flex-col">
          <span className="font-black text-lg text-white tracking-tighter leading-none font-['Sora']">Mephisto Temp Mail</span>
          <span className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-bold">Privacy Shield &amp; Disposable Addresses</span>
        </div>
        {/* Mobile-only brand text */}
        <span className="md:hidden font-black text-sm text-white tracking-tight leading-none font-['Sora'] truncate">Mephisto</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Extension Download */}
          <a
            href="https://github.com/jokallame350-lang/temp-mailmephisto/tree/main/extension"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 sm:p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-all"
            title={lang === 'tr' ? 'Chrome Eklentisini İndir' : 'Download Chrome Extension'}
          >
            <Download className="w-4 h-4" />
          </a>

          {/* PWA Install */}
          {pwaInstallable && (
            <button
              onClick={handleInstallPWA}
              className="p-1.5 sm:p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all"
              title={lang === 'tr' ? 'Uygulamayı Yüke (PWA)' : 'Install App (PWA)'}
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Dil Seçimi - Dropdown */}
          <div className="relative" ref={langDropRef}>
            <button
              onClick={() => setLangOpen(prev => !prev)}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1 sm:gap-1.5 font-bold text-[10px] tracking-widest"
            >
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline">{lang.toUpperCase()}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 bg-[#111] border border-white/10 rounded-lg shadow-xl z-50 min-w-[130px] py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {([
                  { code: 'en' as const, label: '🇬🇧 English' },
                  { code: 'tr' as const, label: '🇹🇷 Türkçe' },
                  { code: 'es' as const, label: '🇪🇸 Español' },
                  { code: 'de' as const, label: '🇩🇪 Deutsch' },
                  { code: 'fr' as const, label: '🇫🇷 Français' },
                ]).map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${lang === l.code ? 'text-red-400 bg-red-500/10 font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* QR Kod ve Şifre Araçları — hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-0.5 sm:gap-1 mr-1 sm:mr-2 pr-1 sm:pr-2 border-r border-white/10">
          <button onClick={onOpenQR} className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title={t.qrTitle}>
            <QrCode className="w-4 h-4" />
          </button>
          <button onClick={onOpenPass} className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title={t.passTitle}>
            <KeyRound className="w-4 h-4" />
          </button>
        </div>

        {/* Hesap Menüsü */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 sm:gap-3 bg-[#111] hover:bg-[#161616] border border-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all duration-200 group"
          >
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-[10px] sm:text-[11px] text-slate-200 font-mono max-w-[80px] sm:max-w-[120px] md:max-w-[160px] truncate font-bold">
                {currentAccount ? currentAccount.address : t.noAccount}
              </span>
              <span className="text-[8px] text-slate-500 uppercase tracking-wider font-black group-hover:text-red-500 transition-colors">
                {accounts.length} {t.activeLabel}
              </span>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center group-hover:border-red-500/30 transition-colors flex-shrink-0">
              <User className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
            </div>
            <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-1rem)] sm:w-72 max-w-[320px] bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[60]">
              <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {accounts.length > 0 ? accounts.map((acc) => (
                  <div key={acc.id} onClick={() => { onSwitchAccount(acc.id); setIsOpen(false); }} className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border border-transparent ${currentAccount?.id === acc.id ? 'bg-red-500/10 border-red-500/20' : 'hover:bg-white/5'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${currentAccount?.id === acc.id ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {acc.address.substring(0, 1).toUpperCase()}
                      </div>
                      <span className={`text-[10px] font-mono truncate ${currentAccount?.id === acc.id ? 'text-white' : 'text-slate-400'}`}>{acc.address}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => copyToClipboard(acc.address, acc.id, e)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400">{copiedId === acc.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}</button>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteAccount(acc.id); }} className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                )) : (
                  <div className="p-4 text-center text-slate-500 text-xs">{t.noAccount}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;