import React from 'react';
import { X, Trash2, Plus, Check, Mail } from 'lucide-react';
import { Mailbox } from '../types';

interface AccountSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Mailbox[];
  activeAccountId: string | null;
  onSwitch: (id: string) => void;
  onNewAccount: () => void;
  onDelete: (id: string) => void;
}

const AccountSidebar: React.FC<AccountSidebarProps> = ({
  isOpen,
  onClose,
  accounts,
  activeAccountId,
  onSwitch,
  onNewAccount,
  onDelete
}) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`
        fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-6 h-full flex flex-col">
          
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-red-500" />
              My Inboxes
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto space-y-3">
            {accounts.map((acc) => (
              <div 
                key={acc.id}
                onClick={() => { onSwitch(acc.id); onClose(); }}
                className={`
                  p-4 rounded-xl border cursor-pointer transition-all group relative
                  ${acc.id === activeAccountId 
                    ? 'bg-red-500/10 border-red-500/50' 
                    : 'bg-slate-800/50 border-white/5 hover:border-white/20 hover:bg-slate-800'}
                `}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-mono truncate max-w-[180px] ${acc.id === activeAccountId ? 'text-white' : 'text-slate-400'}`}>
                    {acc.email}
                  </span>
                  {acc.id === activeAccountId && <Check className="w-4 h-4 text-red-500" />}
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(acc.id); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <button
              onClick={() => { onNewAccount(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-white text-black hover:bg-slate-200 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New Address
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default AccountSidebar;
