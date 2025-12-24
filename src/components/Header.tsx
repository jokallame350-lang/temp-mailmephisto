import React, { useState, useRef, useEffect } from 'react';
import { Mailbox } from '../appTypes';
import { Shield, Copy, Check, User, QrCode, KeyRound, Sun, Moon, Languages, ChevronDown, Trash2, Plus, Globe } from 'lucide-react';
import { Language } from '../appTranslations';

interface HeaderProps {
  accounts: Mailbox[];
  currentAccount: Mailbox | null;
  onSwitchAccount: (id: string) => void;
  onNewAccount: () => void;
  onNewCustomAccount: () => void;
  onDeleteAccount: (id: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onOpenQR?: () => void;
  onOpenPass?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  accounts, currentAccount, onSwitchAccount, onNewAccount, onNewCustomAccount, onDeleteAccount,
  theme, toggleTheme, lang, setLang,
  onOpenQR, onOpenPass
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const copyToClipboard = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <header className="w-full h-16 border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 shadow-sm dark:shadow-lg transition-colors duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
          <Shield className="text-white w-6 h-6" />
        </div>
        <div className="hidden md:flex flex-col">
          <span className="font-bold text-lg text-slate-800 dark:text-white tracking-tight leading-none">Mephisto</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Privacy Shield</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setLang(lang === 'en' ? 'tr' : 'en')} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs">
          <Languages className="w-4 h-4" />
          <span>{lang.toUpperCase()}</span>
        </button>

        <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors mr-2 border-r border-gray-200 dark:border-white/10 pr-3">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-1 mr-2 pr-2 border-r border-gray-200 dark:border-white/10">
            {onOpenQR && <button onClick={onOpenQR} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"><QrCode className="w-5 h-5" /></button>}
            {onOpenPass && <button onClick={onOpenPass} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"><KeyRound className="w-5 h-5" /></button>}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 bg-slate-100 dark:bg-[#111] hover:bg-slate-200 dark:hover:bg-[#161616] border border-gray-200 dark:border-white/10 px-3 py-2 rounded-lg transition-all duration-200 group">
            <div className="flex flex-col items-end text-right">
              <span className="text-xs text-slate-700 dark:text-slate-200 font-mono max-w-[120px] truncate">
                {currentAccount ? currentAccount.address : (lang === 'tr' ? 'Hesap Yok' : 'No Account')}
              </span>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold group-hover:text-red-500 transition-colors">
                {accounts.length} {lang === 'tr' ? 'Aktif' : 'Active ID'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 flex items-center justify-center">
               <User className="w-4 h-4 text-slate-500" />
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {accounts.map((acc) => (
                  <div key={acc.id} onClick={() => { onSwitchAccount(acc.id); setIsOpen(false); }} className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border border-transparent ${currentAccount?.id === acc.id ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                       <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${currentAccount?.id === acc.id ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                          {acc.address.substring(0, 1).toUpperCase()}
                       </div>
                       <span className={`text-xs font-mono truncate ${currentAccount?.id === acc.id ? 'text-red-700 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{acc.address}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={(e) => copyToClipboard(acc.address, acc.id, e)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded text-slate-500 dark:text-slate-400">{copiedId === acc.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}</button>
                       <button onClick={(e) => { e.stopPropagation(); onDeleteAccount(acc.id); }} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded text-slate-500 dark:text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-gray-200 dark:border-white/5 bg-slate-50 dark:bg-[#050505] grid grid-cols-2 gap-2">
                <button onClick={() => { onNewAccount(); setIsOpen(false); }} className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs text-slate-700 dark:text-white border border-gray-200 dark:border-white/5 transition-all"><Plus className="w-3 h-3" /> Random</button>
                <button onClick={() => { onNewCustomAccount(); setIsOpen(false); }} className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs text-slate-700 dark:text-white border border-gray-200 dark:border-white/5 transition-all"><Globe className="w-3 h-3" /> Custom</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
