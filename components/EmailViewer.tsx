import React from 'react';
import { EmailDetail } from '../types';
import { Mail, Clock, User, ShieldCheck, Loader2 } from 'lucide-react';

interface EmailViewerProps {
  email: EmailDetail | null;
  loading: boolean;
  onBack: () => void;
}

const EmailViewer: React.FC<EmailViewerProps> = ({ email, loading, onBack }) => {
  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-2 opacity-20" />
        <span className="text-[10px] uppercase tracking-widest font-mono">Decrypting Payload...</span>
      </div>
    );
  }

  // EĞER MAİL SEÇİLİ DEĞİLSE (Görseldeki durum)
  if (!email) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-slate-800 p-8 text-center select-none">
        <div className="relative mb-4">
            <ShieldCheck className="w-16 h-16 opacity-10 text-red-500" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-2 text-slate-700">Secure Terminal</h3>
        <p className="text-[10px] font-mono text-slate-600 max-w-[200px] leading-relaxed">
          Select a transmission to decrypt and view its contents.
        </p>
      </div>
    );
  }

  // MAİL İÇERİĞİ BURADA RENDER EDİLİR
  return (
    <div className="flex-grow flex flex-col h-full bg-[#0a0a0c] animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-white/[0.01]">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-sm md:text-base font-bold text-white tracking-tight leading-tight">
            {email.subject || '(No Subject)'}
          </h2>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
            <ShieldCheck className="w-3 h-3 text-red-500" />
            <span className="text-[9px] font-bold text-red-400 uppercase tracking-tighter">Verified</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/5 shrink-0">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Sender</p>
              <p className="text-[11px] text-slate-300 truncate font-mono">
                {email.from.name || email.from.address}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-900/50 flex items-center justify-center border border-white/5 shrink-0">
              <Clock className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Timestamp</p>
              <p className="text-[11px] text-slate-300 font-mono">
                {new Date(email.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow p-6 overflow-y-auto custom-scrollbar bg-[#050505]">
        <div className="max-w-none prose prose-invert prose-sm">
          {email.html && email.html.length > 0 ? (
            <div 
              className="mail-content text-slate-300 font-sans leading-relaxed"
              dangerouslySetInnerHTML={{ __html: email.html[0] }} 
            />
          ) : (
            <pre className="whitespace-pre-wrap text-slate-300 font-mono text-[11px] leading-relaxed">
              {email.text}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailViewer;