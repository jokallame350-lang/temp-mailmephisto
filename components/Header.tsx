import React, { useState, useRef, useEffect } from 'react';
import { Flame, ShieldCheck, ChevronDown, Trash2, Copy, CheckCircle2 } from 'lucide-react';
import { Mailbox } from '../types';

interface HeaderProps {
  accounts: Mailbox[];
  currentAccount: Mailbox | null;
  onSwitchAccount: (id: string) => void;
  onNewAccount: () => void;
  onNewCustomAccount: () => void;
  onDeleteAccount: (id: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  accounts, 
  currentAccount, 
  onSwitchAccount, 
  onDeleteAccount,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideDesktop = !desktopMenuRef.current?.contains(target);
      const isOutsideMobile = !mobileMenuRef.current?.contains(target);

      if (isOutsideDesktop && isOutsideMobile) {
        setIsMenuOpen(false);
      }
    };
    
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentAccount?.address) {
      navigator.clipboard.writeText(currentAccount.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
      
      {/* --- DESKTOP VIEW --- */}
      <div className="hidden md:flex items-center gap-4">
        <div className="relative" ref={desktopMenuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-3 py-2 px-4 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group"
          >
            <div className="relative p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-red-500/30 transition-colors">
               <Flame className="w-5 h-5 text-red-500" />
            </div>
            
            <div className="text-left">
               <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 leading-none mb-1">
                Mephisto
               </h1>
               {currentAccount && (
                 <p className="text-[11px] text-gray-500 font-mono tracking-wide">
                   {currentAccount.address}
                 </p>
               )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute top-full left-0 mt-3 w-80 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl shadow-black overflow-hidden animate-in fade-in slide-in-from-top-2 z-50 backdrop-blur-3xl">
               <AccountList 
                 accounts={accounts}
                 currentAccount={currentAccount}
                 onSwitchAccount={onSwitchAccount}
                 onDeleteAccount={onDeleteAccount}
                 onClose={() => setIsMenuOpen(false)}
               />
            </div>
          )}
        </div>
      </div>

      {/* --- MOBILE VIEW --- */}
      <div className="flex md:hidden w-full items-center justify-between gap-3 relative" ref={mobileMenuRef}>
        <div 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex-grow flex flex-col justify-center overflow-hidden cursor-pointer"
        >
          <div className="flex items-center gap-2 text-white">
             <Flame className="w-4 h-4 text-red-500" />
             <span className="font-mono text-sm font-semibold truncate">
               {currentAccount ? currentAccount.address : 'Loading...'}
             </span>
             <ChevronDown className="w-3 h-3 text-gray-500" />
          </div>
        </div>

        <button 
          onClick={handleCopy}
          className="p-2.5 bg-white/5 border border-white/10 text-red-400 rounded-lg active:scale-95 transition-transform"
        >
          {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
        </button>

        {isMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-full bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
               <AccountList 
                 accounts={accounts}
                 currentAccount={currentAccount}
                 onSwitchAccount={onSwitchAccount}
                 onDeleteAccount={onDeleteAccount}
                 onClose={() => setIsMenuOpen(false)}
               />
            </div>
          )}
      </div>
      
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium text-gray-300">Encrypted</span>
        </div>
      </div>
    </header>
  );
};

interface AccountListProps {
  accounts: Mailbox[];
  currentAccount: Mailbox | null;
  onSwitchAccount: (id: string) => void;
  onDeleteAccount: (id: string) => void;
  onClose: () => void;
}

const AccountList: React.FC<AccountListProps> = ({ 
  accounts, currentAccount, onSwitchAccount, onDeleteAccount, onClose 
}) => {
  const safeAccounts = accounts || [];

  return (
    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-1">
        {safeAccounts.length === 0 && (
            <div className="text-center text-gray-500 py-4 text-xs">No active inboxes</div>
        )}
        {safeAccounts.map(acc => (
          <div 
            key={acc.id}
            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all ${
              currentAccount?.id === acc.id 
                ? 'bg-red-500/10 border border-red-500/20' 
                : 'hover:bg-white/5 border border-transparent'
            }`}
            onClick={() => { onSwitchAccount(acc.id); onClose(); }}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${currentAccount?.id === acc.id ? 'bg-red-500 shadow-red-500/50' : 'bg-gray-600'}`} />
              <span className={`text-sm font-mono truncate ${currentAccount?.id === acc.id ? 'text-red-200' : 'text-gray-400 group-hover:text-gray-200'}`}>
                {acc.address}
              </span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDeleteAccount(acc.id);
              }}
              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
    </div>
  );
};

export default Header;
