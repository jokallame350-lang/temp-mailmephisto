import React from 'react';
import { X, User, Shield, Zap, Globe, Lock } from 'lucide-react';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail?: string;
}

const PersonaModal: React.FC<PersonaModalProps> = ({ isOpen, onClose, currentEmail }) => {
  if (!isOpen) return null;

  const features = [
    { icon: <Shield className="w-5 h-5 text-green-500" />, title: "Full Privacy", desc: "Your real identity remains hidden." },
    { icon: <Zap className="w-5 h-5 text-yellow-500" />, title: "Instant Access", desc: "No registration required." },
    { icon: <Globe className="w-5 h-5 text-blue-500" />, title: "Global Reach", desc: "Receive emails from anywhere." },
    { icon: <Lock className="w-5 h-5 text-red-500" />, title: "Secure Storage", desc: "Emails are auto-deleted." }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-red-500 z-10"><X className="w-5 h-5" /></button>
        <div className="p-8 text-slate-900 dark:text-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg"><User className="text-white w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-bold">Active Identity</h2>
              <p className="text-sm text-slate-500 font-mono truncate max-w-[250px]">{currentEmail || 'Generating...'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-red-500/20 transition-all">
                <div className="mt-1">{f.icon}</div>
                <div><h3 className="font-bold text-sm">{f.title}</h3><p className="text-xs text-slate-500">{f.desc}</p></div>
              </div>
            ))}
          </div>
          <button onClick={onClose} className="w-full mt-8 py-4 bg-slate-900 dark:bg-white dark:text-black text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all">Close Dashboard</button>
        </div>
      </div>
    </div>
  );
};

export default PersonaModal;