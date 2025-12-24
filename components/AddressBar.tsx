import React, { useState } from 'react';
import { Copy, RefreshCw, Trash2, Edit2, Check, Loader2, QrCode } from 'lucide-react';
import { Mailbox } from '../types';

interface AddressBarProps {
  mailbox: Mailbox | null;
  isLoading: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onChange?: () => void;
  onDelete?: () => void;
  error?: string | null;
}

const AddressBar: React.FC<AddressBarProps> = ({ 
  mailbox, 
  isLoading, 
  isRefreshing = false, 
  onRefresh, 
  onChange, 
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (mailbox?.address) {
      navigator.clipboard.writeText(mailbox.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 px-4 md:px-0 animate-in fade-in duration-700">
        
        {/* --- 1. MAİL KUTUSU (Temp Mail Tarzı Input Group) --- */}
        <div className="flex flex-col items-center gap-4">
            <h2 className="text-sm font-bold text-gray-400 tracking-widest uppercase">
                Your Temporary Email Address
            </h2>

            {/* Input Benzeri Kutu */}
            <div className="relative w-full max-w-2xl group">
                {/* Glow Efekti */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                
                <div className="relative flex items-center bg-[#18181b] border border-white/10 rounded-full p-2 pr-2 shadow-2xl">
                    
                    {/* Mail Adresi Yazısı */}
                    <div className="flex-grow px-6 py-3 overflow-hidden">
                        {isLoading || !mailbox ? (
                            <div className="flex items-center gap-3 text-gray-500">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-lg font-mono animate-pulse">Loading...</span>
                            </div>
                        ) : (
                            <input 
                                type="text" 
                                readOnly 
                                value={mailbox.address}
                                className="w-full bg-transparent border-none outline-none text-gray-200 text-lg md:text-xl font-mono text-center md:text-left selection:bg-emerald-500/30"
                                onClick={(e) => e.currentTarget.select()}
                            />
                        )}
                    </div>

                    {/* Sağdaki Küçük İkonlar (QR ve Kopyala - Görseldeki Gibi) */}
                    <div className="hidden md:flex items-center gap-2 border-l border-white/10 pl-2">
                        <button className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors" title="QR Code">
                            <QrCode className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={handleCopy}
                            className={`p-3 rounded-full transition-all duration-300 ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                            title="Copy Address"
                        >
                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Alt Açıklama */}
            <p className="text-gray-500 text-xs md:text-sm text-center max-w-lg leading-relaxed">
                Forget about spam, advertising mailings, hacking and attacking robots. Keep your real mailbox clean and secure.
            </p>
        </div>

        {/* --- 2. AKSİYON BUTONLARI (KAPSÜL TASARIM) --- */}
        {/* Görseldeki gibi yan yana dizilmiş, yuvarlak köşeli (pill) butonlar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto">
            
            <CapsuleButton 
                onClick={handleCopy} 
                icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                label={copied ? "Copied" : "Copy"}
                disabled={!mailbox}
            />

            <CapsuleButton 
                onClick={onRefresh} 
                icon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                label={isRefreshing ? "Refreshing" : "Refresh"}
                disabled={!mailbox}
            />

            <CapsuleButton 
                onClick={onChange} 
                icon={<Edit2 className="w-4 h-4" />}
                label="Change"
                disabled={isLoading}
            />

            <CapsuleButton 
                onClick={onDelete} 
                icon={<Trash2 className="w-4 h-4" />}
                label="Delete"
                disabled={!mailbox}
            />
        </div>

    </div>
  );
};

// --- YENİ KAPSÜL BUTON BİLEŞENİ (Temp Mail Tarzı) ---
const CapsuleButton = ({ onClick, icon, label, disabled }: any) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`
            flex items-center justify-center gap-3
            py-4 px-6 rounded-full
            font-semibold tracking-wide text-sm md:text-base
            transition-all duration-200 transform
            active:scale-95 shadow-lg shadow-black/20
            ${disabled 
                ? 'bg-[#18181b] text-gray-600 cursor-not-allowed border border-white/5' 
                : 'bg-[#1e1e24] text-gray-300 hover:bg-[#272730] hover:text-white border border-white/10 hover:border-white/20'
            }
        `}
    >
        {icon}
        <span>{label}</span>
    </button>
);

export default AddressBar;
