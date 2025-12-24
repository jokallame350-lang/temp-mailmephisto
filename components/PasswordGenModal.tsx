import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Copy, Check, ShieldCheck } from 'lucide-react';
import { translations, Language } from '../translations';

interface PasswordGenModalProps { isOpen: boolean; onClose: () => void; lang: Language; }

const PasswordGenModal: React.FC<PasswordGenModalProps> = ({ isOpen, onClose, lang }) => {
  const t = translations[lang];
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let validChars = chars;
    if (includeNumbers) validChars += numbers;
    if (includeSymbols) validChars += symbols;
    let generated = "";
    for (let i = 0; i < length; i++) generated += validChars.charAt(Math.floor(Math.random() * validChars.length));
    setPassword(generated);
    setCopied(false);
  };

  useEffect(() => { if (isOpen) generatePassword(); }, [isOpen, length, includeNumbers, includeSymbols]);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-slate-900 dark:text-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/5">
          <h3 className="text-sm font-bold uppercase flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> {t.passTitle}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="relative flex items-center bg-slate-100 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-4 justify-between">
            <span className="font-mono text-lg text-emerald-600 dark:text-emerald-400 break-all mr-2">{password}</span>
            <div className="flex items-center gap-2">
               <button onClick={generatePassword} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md text-slate-500 dark:text-slate-400"><RefreshCw className="w-4 h-4" /></button>
               <button onClick={handleCopy} className="p-2 bg-white dark:bg-white/10 rounded-md text-slate-700 dark:text-white">{copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
               <div className="flex justify-between text-xs uppercase font-bold text-slate-500"><span>{t.length}</span><span>{length} {t.chars}</span></div>
               <input type="range" min="8" max="64" value={length} onChange={(e) => setLength(Number(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
            </div>
            <div className="flex gap-4">
               <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${includeNumbers ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-400 bg-transparent'}`}>{includeNumbers && <Check className="w-3 h-3" />}</div>
                  <input type="checkbox" className="hidden" checked={includeNumbers} onChange={() => setIncludeNumbers(!includeNumbers)} />
                  <span className="text-sm text-slate-600 dark:text-slate-300 select-none">{t.nums}</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${includeSymbols ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-400 bg-transparent'}`}>{includeSymbols && <Check className="w-3 h-3" />}</div>
                  <input type="checkbox" className="hidden" checked={includeSymbols} onChange={() => setIncludeSymbols(!includeSymbols)} />
                  <span className="text-sm text-slate-600 dark:text-slate-300 select-none">{t.syms}</span>
               </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PasswordGenModal;