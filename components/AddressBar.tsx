import React, { useState } from 'react';
import { Mailbox } from '../types';
import { Copy, RefreshCw, Trash2, ChevronDown, Check, Globe, Command } from 'lucide-react';
import { translations, Language } from '../translations';

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
  lang: Language;
}

const AddressBar: React.FC<AddressBarProps> = ({ 
  mailbox, isLoading, isRefreshing, onRefresh, onChange, onDelete, onDomainChange, 
  domains = [], progress, lang 
}) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCopy = () => {
    if (mailbox?.address) {
      navigator.clipboard.writeText(mailbox.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Dropdown aç/kapa (Hem dokunmatik hem mouse için)
  const toggleDropdown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Varsayılan davranışı engelle
    e.stopPropagation(); // Tıklamanın yayılmasını engelle
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="w-full relative group flex flex-col gap-1 z-30">
      
      {/* 1. GÖRÜNMEZ PERDE: Menü açıksa ekranın geri kalanına basınca kapatır */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/5" 
          onClick={() => setIsDropdownOpen(false)}
          onTouchEnd={() => setIsDropdownOpen(false)}
        />
      )}

      {/* Arka plan efekti */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
      
      <div className="relative flex items-center bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-lg p-1.5 shadow-xl overflow-visible z-30">
        
        {/* İlerleme Çubuğu */}
        <div className="absolute bottom-0 left-0 h-[2px] bg-red-500/50 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>

        <div className="pl-3 pr-2 text-slate-400 dark:text-slate-500 hidden sm:block">
           <Globe className="w-4 h-4 animate-pulse" />
        </div>

        {/* INPUT: z-index 10 (Butonların altında kalsın diye düşük verdik) */}
        <input 
          type="text" readOnly
          value={isLoading ? t.generating : (mailbox?.address || t.noShield)}
          className="flex-grow bg-transparent border-none text-slate-700 dark:text-slate-200 text-sm font-mono focus:ring-0 px-2 placeholder-slate-400 dark:placeholder-slate-600 w-full min-w-0 relative z-10"
        />

        {/* 2. BUTON GRUBU: z-index 50 (En üstte dursun, input üstüne çıkmasın) */}
        <div className="flex items-center gap-1 pl-2 border-l border-gray-200 dark:border-white/5 relative bg-white dark:bg-[#0a0a0c] z-50 flex-shrink-0">
            
            <button type="button" onClick={handleCopy} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            
            <button type="button" onClick={onRefresh} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            {/* 3. DROPDOWN (OK) BUTONU - Düzeltildi */}
            <div className="relative">
              <button 
                type="button"
                onClick={toggleDropdown}     // Mouse tıklaması
                onTouchEnd={toggleDropdown}  // Dokunmatik ekran garantisi
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer active:bg-slate-200 dark:active:bg-white/10"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-lg shadow-2xl z-[60] py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-gray-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">{t.selectDomain}</div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {domains.length > 0 ? domains.map((domain) => (
                      <button 
                        key={domain} 
                        type="button"
                        onClick={() => { onDomainChange(domain); setIsDropdownOpen(false); }}
                        onTouchEnd={(e) => { e.preventDefault(); onDomainChange(domain); setIsDropdownOpen(false); }} 
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-white transition-colors flex items-center justify-between"
                      >
                        <span className="font-mono">{domain}</span>
                        {mailbox?.address.endsWith(domain) && <Check className="w-3 h-3 text-red-500" />}
                      </button>
                    )) : <div className="px-4 py-3 text-xs text-slate-500">{t.loadingDomains}</div>}
                  </div>
                </div>
              )}
            </div>
            
            <button type="button" onClick={onDelete} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
        </div>
      </div>
      
      {/* Kısayollar (Mobilde gizli) */}
      <div className="flex justify-center gap-4 text-[9px] text-slate-400 dark:text-slate-600 font-mono uppercase tracking-widest opacity-60 hidden sm:flex">
        <span className="flex items-center gap-1"><Command className="w-3 h-3" /> R : {t.refresh}</span>
        <span className="flex items-center gap-1"><Command className="w-3 h-3" /> C : {t.copy}</span>
        <span className="flex items-center gap-1"><Command className="w-3 h-3" /> N : {t.new}</span>
      </div>
    </div>
  );
};

export default AddressBar;
