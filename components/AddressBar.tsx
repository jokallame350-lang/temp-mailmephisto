import React, { useState } from 'react';
import { Mailbox } from '../types';
import { Copy, RefreshCw, Trash2, ChevronDown, Globe } from 'lucide-react';

interface AddressBarProps {
  mailbox: Mailbox | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onChange: () => void;
  onDelete: () => void;
  onDomainChange: (domain: string) => void;
}

const AddressBar: React.FC<AddressBarProps> = ({ 
  mailbox, isLoading, isRefreshing, onRefresh, onChange, onDelete, onDomainChange 
}) => {
  const [showDomains, setShowDomains] = useState(false);
  const domains = ["sharklasers.com", "guerrillamail.com", "guerrillamail.info", "grr.la", "guerrillamail.net", "guerrillamail.org", "pokemail.net", "spam4.me"];

  const copyToClipboard = () => {
    if (mailbox) {
      navigator.clipboard.writeText(mailbox.address);
    }
  };

  return (
    <div className="w-full bg-[#0a0a0c] border border-white/5 rounded-xl p-1.5 flex flex-col md:flex-row items-center gap-2 shadow-2xl">
      {/* SOL KISIM: E-POSTA ADRES ALANI (DÜZELTİLEN YER) */}
      <div className="flex-grow flex items-center gap-3 px-4 py-2.5 bg-white/[0.02] rounded-lg border border-white/5 w-full overflow-hidden">
        <Globe className="w-4 h-4 text-slate-500 shrink-0" />
        <span className="text-slate-200 font-mono text-[13px] truncate lowercase tracking-normal leading-none mb-[-1px]">
          {isLoading ? "generating encryption..." : mailbox?.address || "no-signal"}
        </span>
      </div>

      {/* SAĞ KISIM: BUTONLAR */}
      <div className="flex items-center gap-1.5 w-full md:w-auto shrink-0">
        <button 
          onClick={copyToClipboard} 
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-all text-[11px] font-bold uppercase tracking-wider border border-white/5 active:scale-95"
        >
          <Copy className="w-3.5 h-3.5" /> 
          <span>Copy</span>
        </button>
        
        <button 
          onClick={onRefresh} 
          className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-all border border-white/5 active:scale-95"
          title="Refresh Inbox"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowDomains(!showDomains)} 
            className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-all border border-white/5 active:scale-95"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showDomains ? 'rotate-180' : ''}`} />
          </button>
          
          {showDomains && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDomains(false)}></div>
              <div className="absolute right-0 mt-2 w-56 bg-[#0f0f11] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 border-b border-white/5 text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold">Select Domain</div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {domains.map(d => (
                    <button 
                      key={d} 
                      onClick={() => { onDomainChange(d); setShowDomains(false); }} 
                      className="w-full px-4 py-2.5 text-left text-[12px] text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors border-b border-white/5 last:border-0 font-mono flex justify-between items-center group"
                    >
                      {d}
                      <Globe className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button 
          onClick={onDelete} 
          className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all border border-red-500/20 active:scale-95"
          title="Delete Address"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AddressBar;
