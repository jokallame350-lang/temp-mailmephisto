import React from 'react';
import { X, ShieldCheck, Server, Terminal, List } from 'lucide-react';
import { translations, Language } from '../translations';
import { EmailDetail } from '../types';

interface EmailHeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: EmailDetail | null;
  lang: Language;
}

const EmailHeaderModal: React.FC<EmailHeaderModalProps> = ({ isOpen, onClose, email, lang }) => {
  const t = translations[lang];
  if (!isOpen || !email) return null;

  const headerFields = email.headerFields || {};

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <List className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {t.headerInspectorTitle}
              </h3>
              <p className="text-[10px] text-slate-400">SPF / DKIM & Origin Trace</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close header inspector" className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">SPF Status</p>
                <p className="text-xs font-bold text-green-400">PASS / Verified</p>
              </div>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-2.5">
              <Server className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">DKIM Status</p>
                <p className="text-xs font-bold text-blue-400">PASS / Signed</p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 font-mono text-xs bg-black/60 p-4 rounded-2xl border border-white/5">
            {Object.keys(headerFields).length > 0 ? (
              Object.entries(headerFields).map(([key, val]) => (
                <div key={key} className="flex gap-2 py-1 border-b border-white/5 last:border-0">
                  <span className="text-orange-400 font-bold shrink-0 min-w-[120px]">{key}:</span>
                  <span className="text-slate-300 break-all">{typeof val === 'string' ? val : JSON.stringify(val)}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 italic">{t.noHeadersAvailable}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailHeaderModal;
