import React from 'react';
import { Mail, Clock, ChevronRight, Inbox, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { EmailSummary } from '../types';

interface EmailListProps {
  emails: EmailSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  lang: string;
}

const EmailList: React.FC<EmailListProps> = ({ emails, selectedId, onSelect, loading, lang }) => {
  
  // 3. AUTO-REFRESH GÖRSELLEŞTİRME: Liste boş değilken en üstte görünen "Canlı Tarama" göstergesi
  const RefreshIndicator = () => (
    <div className="flex items-center justify-center gap-2 py-3 bg-red-500/5 border-b border-white/5 animate-pulse">
      <Loader2 className="w-3 h-3 text-red-500 animate-spin" />
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500/80">
        {lang === 'tr' ? 'E-postalar taranıyor...' : 'Searching for emails...'}
      </span>
    </div>
  );

  // YÜKLEME DURUMU
  if (loading && emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Establishing Secure Node...</span>
      </div>
    );
  }

  // 4. BOŞ DURUM (EMPTY STATE) İYİLEŞTİRMESİ
  if (emails.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <RefreshIndicator />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 bg-red-500/5 rounded-[32px] flex items-center justify-center mb-6 border border-red-500/10 relative">
             <Inbox className="w-10 h-10 text-red-500/20" />
             <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-4 border-[#0a0a0c] animate-ping" />
          </div>
          
          <h3 className="text-sm font-black uppercase tracking-widest mb-2 text-white">
            {lang === 'tr' ? 'Gelen Kutusu Boş' : 'Inbox is Empty'}
          </h3>
          
          <div className="space-y-4 max-w-[240px]">
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium uppercase tracking-tighter">
              {lang === 'tr' 
                ? 'Sistem aktif. Test etmek için bu adrese bir e-posta gönderin.' 
                : 'System is active. Send an email to this address to test the connection.'}
            </p>
            
            <div className="flex flex-col gap-2 pt-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
                <ShieldCheck className="w-3 h-3 text-red-500" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">End-to-End Encrypted</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
                <Zap className="w-3 h-3 text-orange-500" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Instant Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full divide-y divide-white/5">
      {/* Liste doluyken de en üstte tarama yapıldığını gösteriyoruz */}
      <RefreshIndicator />

      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => onSelect(email.id)}
            className={`group relative p-5 cursor-pointer transition-all duration-300 ${
              selectedId === email.id 
              ? 'bg-red-500/5 border-l-2 border-red-600' 
              : 'hover:bg-white/[0.02] border-l-2 border-transparent'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest truncate max-w-[150px]">
                {email.from}
              </span>
              <div className="flex items-center gap-2 text-slate-500">
                <Clock className="w-3 h-3" />
                <span className="text-[9px] font-bold">New</span>
              </div>
            </div>
            
            <h3 className={`text-xs font-bold mb-1 truncate ${selectedId === email.id ? 'text-white' : 'text-slate-400'}`}>
              {email.subject}
            </h3>
            
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-600 truncate max-w-[200px] font-medium tracking-tighter uppercase">
                Encrypted Signal Received...
              </p>
              <ChevronRight className={`w-4 h-4 transition-transform ${selectedId === email.id ? 'translate-x-1 text-red-500' : 'opacity-0 group-hover:opacity-100 text-slate-700'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailList;