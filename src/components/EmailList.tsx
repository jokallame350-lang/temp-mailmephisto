import React from 'react';
import { Clock, Inbox, Loader2 } from 'lucide-react';
import { EmailSummary } from '../types';

interface EmailListProps {
  emails: EmailSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  lang: string;
}

const EmailList: React.FC<EmailListProps> = ({ emails, selectedId, onSelect, lang }) => {
  
  const RefreshIndicator = () => (
    <div className="flex items-center justify-center gap-2 py-3 bg-red-500/5 border-b border-white/5 animate-pulse">
      <Loader2 className="w-3 h-3 text-red-500 animate-spin" />
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500/80">
        {lang === 'tr' ? 'E-postalar taranıyor...' : 'Searching for emails...'}
      </span>
    </div>
  );

  if (emails.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#0a0a0c]">
        <RefreshIndicator />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
          <Inbox className="w-10 h-10 text-red-500/20 mb-4" />
          <h3 className="text-sm font-black uppercase tracking-widest mb-2 text-white">Inbox Empty</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full divide-y divide-white/5 bg-[#0a0a0c]">
      <RefreshIndicator />
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => onSelect(email.id)}
            className={`group relative p-5 cursor-pointer transition-all duration-300 ${
              selectedId === email.id ? 'bg-red-500/5 border-l-2 border-red-600' : 'hover:bg-white/[0.02]'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest truncate max-w-[150px]">
                {/* HATA ÇÖZÜMÜ: Obje render hatasını engelliyoruz */}
                {typeof email.from === 'object' ? (email.from as any).address : String(email.from)}
              </span>
              <div className="flex items-center gap-2 text-slate-500">
                <Clock className="w-3 h-3" />
                <span className="text-[9px] font-bold">New</span>
              </div>
            </div>
            <h3 className={`text-xs font-bold truncate ${selectedId === email.id ? 'text-white' : 'text-slate-400'}`}>
              {email.subject}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailList;