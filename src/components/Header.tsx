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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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
    <header className="fixed top-0 left-0 w-full h-16 border-b border-white/5 bg-[#0a0a0c]/90 backdrop-blur-xl z-50 flex items-center justify-between px-4 md:px-8 shadow-2xl transition-all duration-300">

      {/* Logo Alanı */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Mephisto Logo"
          className="w-10 h-10 rounded-xl shadow-lg shadow-red-500/20 object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="hidden md:flex flex-col">
          <span className="font-black text-lg text-white tracking-tighter leading-none font-['Sora']">Mephisto Temp Mail</span>
          <span className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-bold">Privacy Shield &amp; Disposable Addresses</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {/* PWA Install */}
          {pwaInstallable && (
            <button
              onClick={handleInstallPWA}
              className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-all animate-pulse"
              title={lang === 'tr' ? 'Uygulamayı Yükle' : 'Install App'}
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Dil Seçimi */}
          <button
            onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1.5 font-bold text-[10px] tracking-widest"
          >
            <Languages className="w-4 h-4" />
            <span>{lang.toUpperCase()}</span>
          </button>
        </div>

        {/* QR Kod ve Şifre Araçları */}
        <div className="flex items-center gap-1 mr-2 pr-2 border-r border-white/10">
          <button onClick={onOpenQR} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title={t.qrTitle}>
            <QrCode className="w-4 h-4" />
          </button>
          <button onClick={onOpenPass} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title={t.passTitle}>
            <KeyRound className="w-4 h-4" />
          </button>
        </div>

        {/* Hesap Menüsü */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 bg-[#111] hover:bg-[#161616] border border-white/10 px-3 py-1.5 rounded-xl transition-all duration-200 group"
          >
            <div className="flex flex-col items-end text-right">
              <span className="text-[11px] text-slate-200 font-mono max-w-[100px] truncate font-bold">
                {currentAccount ? currentAccount.address : t.noAccount}
              </span>
              <span className="text-[8px] text-slate-500 uppercase tracking-wider font-black group-hover:text-red-500 transition-colors">
                {accounts.length} {t.activeLabel}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center group-hover:border-red-500/30 transition-colors">
              <User className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
            </div>
            <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[60]">
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