import React, { useState } from 'react';
import { Copy, Check, RefreshCw, ShieldCheck, QrCode, Key, X } from 'lucide-react';
import { Mailbox } from '../types';

interface AddressBarProps {
  mailbox: Mailbox | null;
  isLoading: boolean;
  onRefresh: () => void;
  lang: string;
  // HATA ÇÖZÜMÜ: App.tsx'ten gelen 'progress' buraya eklendi
  progress?: number; 
  // Opsiyonel olarak diğerlerini de ekleyelim ki App.tsx gönderirse kızmasın
  onChange?: () => void;
  onDelete?: () => void;
  onDomainChange?: (domain: string) => void;
}

const AddressBar: React.FC<AddressBarProps> = ({ 
  mailbox, isLoading, onRefresh, lang, progress = 0 
}) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showPassGen, setShowPassGen] = useState(false);
  const [generatedPass, setGeneratedPass] = useState('');

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPass(password);
    setShowPassGen(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl space-y-4">
      {/* Loading Bar (Progress Görselleştirmesi) */}
      {isLoading && (
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
           <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* ADRES ALANI */}
        <div 
          onClick={() => mailbox && handleCopy(mailbox.address)}
          className="flex-grow flex items-center px-5 py-4 bg-[#0a0a0c] border border-white/5 rounded-2xl cursor-pointer hover:border-red-500/50 transition-all group min-w-0 w-full"
        >
          <ShieldCheck className="w-5 h-5 text-red-600 mr-3 shrink-0" />
          <span className="text-sm md:text-base font-black text-white truncate font-mono tracking-tight select-none">
            {isLoading ? (lang === 'tr' ? 'Bağlantı Kuruluyor...' : 'Establishing secure link...') : (mailbox?.address || (lang === 'tr' ? 'Node Bekleniyor...' : 'Awaiting Node...'))}
          </span>
        </div>

        {/* ARAÇLAR */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button onClick={() => setShowQR(true)} className="p-3.5 bg-white/5 rounded-xl hover:bg-white/10 text-slate-400 border border-white/5">
            <QrCode className="w-5 h-5" />
          </button>
          <button onClick={generatePassword} className="p-3.5 bg-white/5 rounded-xl hover:bg-white/10 text-slate-400 border border-white/5">
            <Key className="w-5 h-5" />
          </button>
          <button onClick={onRefresh} className="p-3.5 bg-white/5 rounded-xl hover:bg-white/10 text-white border border-white/5 active:rotate-180 transition-all">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={() => mailbox && handleCopy(mailbox.address)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${copied ? 'bg-green-600 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? (lang === 'tr' ? 'KOPYALANDI' : 'COPIED') : (lang === 'tr' ? 'KOPYALA' : 'COPY')}
          </button>
        </div>
      </div>
      
      {/* MODALLAR (Eski kodunun aynısı, sadece çeviri eklendi) */}
      {showQR && mailbox && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#0f0f12] p-8 rounded-[40px] border border-white/10 flex flex-col items-center relative max-w-sm w-full">
            <button onClick={() => setShowQR(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            <div className="p-4 bg-white rounded-3xl mb-6">
               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${mailbox.address}`} alt="QR" className="w-48 h-48" />
            </div>
            <button onClick={() => setShowQR(false)} className="w-full py-4 bg-white/5 rounded-2xl font-black uppercase text-[10px] text-white">Close</button>
          </div>
        </div>
      )}

      {showPassGen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#0f0f12] p-10 rounded-[40px] border border-white/10 flex flex-col items-center relative max-w-sm w-full">
            <button onClick={() => setShowPassGen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            <div className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl mb-8 flex items-center justify-between">
              <span className="text-sm font-mono font-black text-red-500 tracking-wider truncate">{generatedPass}</span>
              <button onClick={() => handleCopy(generatedPass)} className="p-2 text-slate-400 hover:text-white"><Copy className="w-4 h-4" /></button>
            </div>
            <button onClick={generatePassword} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px]">New Password</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressBar;