import React from 'react';
import { EmailSummary } from '../types';
import { Trash2, Mail, Inbox } from 'lucide-react';

interface EmailListProps {
  emails: EmailSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onDeleteAll: () => void;
  loading: boolean;
}

const EmailList: React.FC<EmailListProps> = ({ emails, selectedId, onSelect, onDelete, onDeleteAll, loading }) => {
  
  const formatTime = (isoString: string) => {
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return "--:--";
    }
  };

  const safeEmails = emails || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col border-b border-white/5 bg-white/[0.02] sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
               <Inbox className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="font-bold text-gray-200 tracking-wider text-sm uppercase">Inbox</h3>
            {safeEmails.length > 0 && (
              <span className="bg-white/10 text-gray-300 text-[10px] px-2 py-0.5 rounded-full font-mono border border-white/5">
                {safeEmails.length}
              </span>
            )}
          </div>
          {safeEmails.length > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteAll(); }}
              className="text-xs text-gray-500 hover:text-red-400 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors group"
            >
              <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow p-2 overflow-y-auto">
        {loading && safeEmails.length === 0 ? (
          <div className="space-y-2 p-2">
             {[1,2,3,4].map(i => (
               <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
             ))}
          </div>
        ) : safeEmails.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4 opacity-50">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
               <Mail className="w-8 h-8 text-gray-500" />
             </div>
             <div>
               <p className="text-gray-300 font-medium text-lg">No Signals Detected</p>
               <p className="text-sm text-gray-600 mt-1">Waiting for encrypted transmissions...</p>
             </div>
           </div>
        ) : (
          <div className="space-y-1">
            {safeEmails.map((email) => {
              // ID karşılaştırmasını string bazlı ve güvenli yapıyoruz
              const isSelected = String(selectedId) === String(email.id);
              
              return (
                <div 
                  key={email.id}
                  onClick={() => onSelect(email.id)}
                  className={`group relative p-4 rounded-xl cursor-pointer border transition-all duration-300
                    ${isSelected 
                      ? 'bg-white/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
                      : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'
                    }
                  `}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className={`text-sm font-bold truncate max-w-[70%] ${isSelected ? 'text-red-400' : 'text-gray-200'}`}>
                      {email.from.name || email.from.address}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {formatTime(email.createdAt)}
                    </span>
                  </div>
                  
                  <div className="mb-1">
                     <h4 className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                        {email.subject || '(No Subject)'}
                     </h4>
                  </div>
                  
                  <p className="text-[11px] text-gray-600 truncate group-hover:text-gray-500 pr-8">
                    {email.intro || 'No preview available'}
                  </p>

                  <button
                    onClick={(e) => {
                        e.stopPropagation(); // Tıklamanın onSelect'e gitmesini engeller
                        onDelete(email.id, e);
                    }}
                    className="absolute right-4 bottom-4 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg md:opacity-0 md:group-hover:opacity-100 transition-all z-20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  {isSelected && (
                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-red-500 rounded-r-full shadow-[0_0_10px_#ef4444]"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailList;