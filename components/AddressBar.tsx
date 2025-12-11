import React, { useState } from 'react';
import { Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { Mailbox } from '../types';

interface AddressBarProps {
  mailbox: Mailbox | null;
  isLoading: boolean;
  error?: string | null;
}

const AddressBar: React.FC<AddressBarProps> = ({ mailbox, isLoading, error }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (mailbox?.address) {
      navigator.clipboard.writeText(mailbox.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group">
      {/* Glowing background effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
      
      <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-1 flex items-center">
        
        {/* Address Display */}
        <div 
          onClick={handleCopy}
          className="flex-grow flex items-center justify-between px-6 py-4 cursor-pointer select-all"
        >
           <div className="flex flex-col">
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
               {error ? 'Status' : 'Active Secure Tunnel'}
             </span>
             <span className={`text-xl md:text-2xl font-mono font-medium truncate transition-colors ${error ? 'text-red-500' : 'text-white group-hover:text-red-50'}`}>
                {error ? 'Connection Failed' : (mailbox?.address || 'Initializing...')}
             </span>
           </div>
           
           {/* Mobile Copy Icon */}
           <div className="md:hidden text-gray-500">
              {copied ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Copy className="w-6 h-6" />}
           </div>
        </div>

        {/* Desktop Button */}
        <button
          onClick={handleCopy}
          disabled={!mailbox?.address}
          className="hidden md:flex items-center gap-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-medium py-3 px-8 rounded-xl transition-all border-l border-white/5 h-full"
        >
          {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
          <span className="tracking-wide">COPY</span>
        </button>
      </div>
    </div>
  );
};

export default AddressBar;
