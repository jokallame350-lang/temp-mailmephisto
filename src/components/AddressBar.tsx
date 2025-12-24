import React, { useState, useRef, useEffect } from 'react';
import { Mailbox } from '../types';
import { Copy, RefreshCw, Trash2, ChevronDown, Check, Globe, Command } from 'lucide-react';
import { translations, Language } from '../translations'; // İMPORT

interface AddressBarProps {
  mailbox: Mailbox | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onChange: () => void;
  onDelete: () => void;
  onDomainChange: (domain: string) => void;
  domains?: string[];
  progress: number;
  lang: Language; // DİL DESTEĞİ
}

const AddressBar: React.FC<AddressBarProps> = ({ 
  mailbox, isLoading, isRefreshing, onRefresh, onChange, onDelete, onDomainChange, 
  domains = [], progress, lang 
}) => {
  const t = translations[lang]; // ÇEVİRİYİ AL
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (mailbox?.address) {
      navigator.clipboard.writeText(mailbox.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) { setIsDropdownOpen(false); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full relative group flex flex-col gap-1">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
      
      <div className="relative flex items-center bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-lg p-1.5 shadow-xl overflow-hidden">
        <div className="absolute bottom-0 left-0 h-[2px] bg-red-500/50 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>

        <div className="pl-3 pr-2 text-slate-400 dark:text-slate-500 hidden sm:block">
           <Globe className="w-4 h-4 animate-pulse" />
        </div>

        <input 
          type="text" readOnly
          value={isLoading ? t.generating : (mailbox?.address || t.noShield)}
          className="flex-grow bg-transparent border-none text-slate-700 dark:text-slate-200 text-sm font-mono focus:ring-0 px-2 placeholder-slate-400 dark:placeholder-slate-600 w-full min-w-0"
        />

        <div className="flex items-center gap-1 pl-2 border-l border-gray-200 dark:border-white/5 relative z-10">
            <button onClick={handleCopy} className="group/btn p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors relative" title={t.tipCopy}>
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button onClick={onRefresh} className="group/btn p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors relative" title={t.tipRefresh}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1" title={t.tipDomain}>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-lg shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-gray-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">{t.selectDomain}</div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {domains.length > 0 ? domains.map((domain) => (
                      <button key={domain} onClick={() => { onDomainChange(domain); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-white transition-colors flex items-center justify-between">
                        <span className="font-mono">{domain}</span>
                        {mailbox?.address.endsWith(domain) && <Check className="w-3 h-3 text-red-500" />}
                      </button>
                    )) : <div className="px-4 py-3 text-xs text-slate-500">{t.loadingDomains}</div>}
                  </div>
                </div>
              )}
            </div>
            <button onClick={onDelete} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors" title={t.tipDestroy}>
              <Trash2 className="w-4 h-4" />
            </button>
        </div>
      </div>
      <div className="flex justify-center gap-4 text-[9px] text-slate-400 dark:text-slate-600 font-mono uppercase tracking-widest opacity-60">
        <span className="flex items-center gap-1"><Command className="w-3 h-3" /> R : {translations[lang].refresh}</span>
        <span className="flex items-center gap-1"><Command className="w-3 h-3" /> C : {translations[lang].copy}</span>
        <span className="flex items-center gap-1"><Command className="w-3 h-3" /> N : {translations[lang].new}</span>
      </div>
    </div>
  );
};

export default AddressBar;