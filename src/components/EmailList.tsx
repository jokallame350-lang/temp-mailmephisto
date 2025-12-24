import React from 'react';
// DÜZELTME BURADA: '../types' yerine '../appTypes'
import { EmailSummary } from '../appTypes';
import { Trash2, Mail, Clock, AlertCircle, CheckCircle2, Tag } from 'lucide-react';
import { translations, Language } from '../translations';

interface EmailListProps {
  emails: EmailSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onDeleteAll: () => void;
  loading: boolean;
  lang: Language;
}

const EmailList: React.FC<EmailListProps> = ({ emails, selectedId, onSelect, onDelete, onDeleteAll, loading, lang }) => {
  const t = translations[lang];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0c]">
      <div className="p-3 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded bg-red-500/10 text-red-500 text-[10px] font-bold">
            {emails.length}
          </span>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">{t.inbox}</span>
        </div>
        {emails.length > 0 && (
          <button onClick={onDeleteAll} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider font-bold">
            <Trash2 className="w-3 h-3" /> {t.clearAll}
          </button>
        )}
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {emails.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-50">
            <div className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center ${loading ? 'animate-pulse border-red-500/30 text-red-500' : 'border-slate-300 dark:border-slate-700 text-slate-400'}`}>
               <Mail className="w-5 h-5" />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{t.emptyInboxTitle}</p>
               <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">{t.emptyInboxDesc}</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {emails.map((email) => (
              <div 
                key={email.id}
                onClick={() => onSelect(email.id)}
                className={`p-4 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-white/5 relative group ${selectedId === email.id ? 'bg-red-50 dark:bg-red-500/10' : ''} ${!email.seen ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}
              >
                {!email.seen && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}
                <div className="flex justify-between items-start mb-1">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className={`text-sm truncate ${!email.seen ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                      {/* Güvenli erişim */}
                      {typeof email.from === 'string' ? email.from : (email.from.name || email.from.address)}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate font-mono">
                        {typeof email.from === 'string' ? email.from : email.from.address}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                    <Clock className="w-3 h-3" />
                    {new Date(email.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <h4 className={`text-xs mb-1 truncate ${!email.seen ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                  {email.subject || '(No Subject)'}
                </h4>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                  {email.intro}
                </p>
                <div className="flex items-center justify-between mt-3">
                   <div className="flex items-center gap-2">
                      {email.aiCategory === 'Verification' && <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 text-[9px] border border-green-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Code</span>}
                      {email.aiCategory === 'Security' && <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] border border-red-500/20 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Alert</span>}
                      {email.aiCategory === 'Newsletter' && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] border border-blue-500/20 flex items-center gap-1"><Tag className="w-3 h-3"/> News</span>}
                   </div>
                   <button onClick={(e) => onDelete(email.id, e)} className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10">
                     <Trash2 className="w-3.5 h-3.5" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailList;
