// src/components/PersonaModal.tsx

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Copy, CheckCircle, Key, QrCode, Shield, Smartphone } from 'lucide-react';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail?: string; // Bu prop App.tsx'ten geliyor
}

const PersonaModal: React.FC<PersonaModalProps> = ({ isOpen, onClose, currentEmail }) => {
  const [activeTab, setActiveTab] = useState<'password' | 'qr'>('password');
  
  // Password Generator State
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(12);
  const [useSymbols, setUseSymbols] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [copied, setCopied] = useState(false);

  // STORAGE KEY: Her e-posta adresi için benzersiz bir anahtar oluşturuyoruz.
  // Örn: "saved_pass_randomuser@sharklasers.com"
  const storageKey = `saved_pass_${currentEmail || 'default'}`;

  useEffect(() => {
    if (isOpen && currentEmail) {
      // 1. Önce hafızada bu mail için kayıtlı şifre var mı bak
      const savedPass = localStorage.getItem(storageKey);
      
      if (savedPass) {
        // Varsa onu yükle (Değiştirme)
        setPassword(savedPass);
      } else {
        // Yoksa yeni oluştur
        generatePassword();
      }
      setCopied(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentEmail]); // Modal açıldığında veya email değiştiğinde çalışır

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    
    let chars = charset;
    if (useNumbers) chars += numbers;
    if (useSymbols) chars += symbols;

    let pass = "";
    for (let i = 0; i < length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // State'i güncelle
    setPassword(pass);
    setCopied(false);

    // HAFIZAYA KAYDET: Yeni şifreyi localStorage'a yazıyoruz
    if (currentEmail) {
      localStorage.setItem(storageKey, pass);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#0f0f11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-white">Privacy Tools</h2>
                <p className="text-xs text-slate-400">Secure utilities for your session</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
            <button 
                onClick={() => setActiveTab('password')}
                className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'password' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Key className="w-4 h-4" /> Password Gen
            </button>
            <button 
                onClick={() => setActiveTab('qr')}
                className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'qr' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <QrCode className="w-4 h-4" /> Mobile QR
            </button>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
          
          {/* --- PASSWORD GENERATOR TAB --- */}
          {activeTab === 'password' && (
              <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                  <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                      <div 
                        className="relative flex items-center justify-between p-4 bg-[#151520] rounded-lg border border-white/10 cursor-pointer"
                        onClick={handleCopy}
                      >
                          <span className="text-xl font-mono text-white tracking-wider truncate">{password}</span>
                          {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-slate-500" />}
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-2">
                              <span>Length</span>
                              <span>{length} characters</span>
                          </div>
                          <input 
                            type="range" 
                            min="8" 
                            max="32" 
                            value={length} 
                            onChange={(e) => { setLength(Number(e.target.value)); generatePassword(); }}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                      </div>

                      <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer group">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${useNumbers ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}`}>
                                  {useNumbers && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <input type="checkbox" className="hidden" checked={useNumbers} onChange={() => { setUseNumbers(!useNumbers); setTimeout(generatePassword, 0); }} />
                              <span className="text-sm text-slate-300 group-hover:text-white">Numbers</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer group">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${useSymbols ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}`}>
                                  {useSymbols && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <input type="checkbox" className="hidden" checked={useSymbols} onChange={() => { setUseSymbols(!useSymbols); setTimeout(generatePassword, 0); }} />
                              <span className="text-sm text-slate-300 group-hover:text-white">Symbols</span>
                          </label>
                      </div>
                  </div>

                  <button 
                    onClick={generatePassword}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate Password
                  </button>
              </div>
          )}

          {/* --- QR CODE TAB --- */}
          {activeTab === 'qr' && (
              <div className="flex flex-col items-center justify-center space-y-6 animate-in slide-in-from-right-4 duration-300 h-full">
                  <div className="p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                     <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${currentEmail || 'nomail'}&color=000000&bgcolor=ffffff`} 
                        alt="QR Code" 
                        className="w-48 h-48"
                     />
                  </div>
                  
                  <div className="text-center space-y-2">
                      <h3 className="text-white font-medium flex items-center justify-center gap-2">
                          <Smartphone className="w-4 h-4 text-indigo-400" />
                          Scan to Mobile
                      </h3>
                      <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
                          Scan this QR code with your phone camera to open this email address instantly.
                      </p>
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PersonaModal;