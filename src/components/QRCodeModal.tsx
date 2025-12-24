import React from 'react';
import { X, Copy, Check } from 'lucide-react';
import { translations, Language } from '../translations';

interface QRCodeModalProps { isOpen: boolean; onClose: () => void; email: string; lang: Language; }

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, email, lang }) => {
  const t = translations[lang];
  const [copied, setCopied] = React.useState(false);
  
  if (!isOpen) return null;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${email}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden text-slate-900 dark:text-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/5">
          <h3 className="text-sm font-bold uppercase flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>{t.qrTitle}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-6 flex flex-col items-center gap-6">
          <div className="bg-white p-2 rounded-lg shadow-inner"><img src={qrUrl} alt="QR Code" className="w-48 h-48" /></div>
          <div className="text-center space-y-2 w-full">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{t.qrDesc}</p>
            <div onClick={handleCopy} className="group cursor-pointer bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-lg p-3 flex items-center justify-between gap-3 hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
              <span className="text-sm font-mono text-slate-600 dark:text-slate-300 truncate">{email || "No Email"}</span>
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default QRCodeModal;