import React, { useState } from 'react';
import { ChevronDown, Plus, Crown, User, Moon, Sun, Languages } from 'lucide-react';
import { Mailbox } from '../types';

interface HeaderProps {
  accounts: Mailbox[];
  currentAccount: Mailbox | null;
  onSwitchAccount: (id: string) => void;
  onNewAccount: () => void;
  onOpenPremium: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  lang: string;
  setLang: (l: any) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  accounts, currentAccount, onSwitchAccount, onNewAccount, onOpenPremium, theme, toggleTheme, lang, setLang 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dil Değiştirme Fonksiyonu (Tıklamalı Yapı)
  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'tr' : 'en';
    setLang(nextLang);
  };

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-white dark:bg-[#050505] border-b border-gray-100 dark:border-white/5 relative z-[60] transition-all">
      
      {/* SOL: BÜYÜTÜLMÜŞ LOGO VE İSİM */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 flex items-center justify-center relative group cursor-pointer">
          {/* Logo arkasındaki siyahlık/kutu kaldırıldı, PNG şeffaflığı için sadece img bırakıldı */}
          <img 
            src="/logo.png" 
            alt="Mephisto Logo" 
            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.4)] group-hover:scale-110 transition-transform duration-300" 
          />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-black italic tracking-tighter text-xl md:text-2xl uppercase dark:text-white">
            MEPHISTO <span className="text-red-600 dark:text-red-500">Temp Mail</span>
          </span>
        </div>
      </div>

      {/* SAĞ KISIM: KONTROLLER */}
      <div className="flex items-center gap-3 md:gap-5">
        
        {/* DİL SEÇİCİ (TIKLAMALI BUTON YAPISI) */}
        <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-transparent hover:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group active:scale-95"
            title={lang === 'en' ? 'Switch to Turkish' : 'Switch to English'}
        >
            <Languages className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">
                {lang}
            </span>
        </button>

        {/* TEMA SEÇİCİ */}
        <button 
          onClick={toggleTheme} 
          className="p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400 hover:text-red-500 transition-all border border-transparent hover:border-white/10 active:scale-90"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* PREMIUM BUTONU */}
        <button 
          onClick={onOpenPremium}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.25)] transition-all active:scale-95 animate-pulse"
        >
          <Crown className="w-4 h-4" /> <span className="hidden sm:inline">Premium</span>
        </button>

        {/* HESAPLAR DROPBOX */}
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-3 pl-4 pr-3 py-2 bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl hover:border-red-500 transition-all"
          >
            <div className="text-right hidden lg:block">
              <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                {currentAccount?.address || 'No Account'}
              </p>
              <p className="text-[9px] font-black uppercase text-red-500">
                {accounts.length} ACTIVE ID
              </p>
            </div>
            <div className="w-9 h-9 bg-slate-900 dark:bg-white/10 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </button>

          {isMenuOpen && (
            <div className="absolute top-full mt-3 right-0 w-72 bg-white dark:bg-[#0f0f12] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-60 overflow-y-auto custom-scrollbar mb-2">
                {accounts.map(acc => (
                  <div 
                    key={acc.id}
                    onClick={() => { onSwitchAccount(acc.id); setIsMenuOpen(false); }}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all mb-1 ${currentAccount?.id === acc.id ? 'bg-red-600/10 border border-red-600/20' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                  >
                    <span className={`text-xs font-bold truncate ${currentAccount?.id === acc.id ? 'text-red-500' : 'dark:text-slate-400'}`}>
                      {acc.address}
                    </span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => { onNewAccount(); setIsMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                <Plus className="w-4 h-4" /> New Address
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;