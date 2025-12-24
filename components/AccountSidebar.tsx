import React from 'react';
import { Mail, Trash2, Plus, X } from 'lucide-react';
import { Mailbox } from '../types';

interface AccountSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Mailbox[];
  currentAccount: Mailbox | null;
  onSwitch: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void; // onDelete fonksiyonunu prop olarak ekledik
}

const AccountSidebar: React.FC<AccountSidebarProps> = ({
  isOpen,
  onClose,
  accounts,
  currentAccount,
  onSwitch,
  onCreate,
  onDelete
}) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-[#0f0f12] border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white tracking-tighter italic">ACCOUNTS</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3">
            {accounts.map((acc) => (
              <div 
                key={acc.id}
                className={`group p-4 rounded-xl border transition-all cursor-pointer relative ${
                  currentAccount?.id === acc.id 
                    ? 'bg-white/5 border-red-600/50' 
                    : 'bg-transparent border-white/5 hover:border-white/20'
                }`}
                onClick={() => onSwitch(acc.id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-2 h-2 rounded-full ${currentAccount?.id === acc.id ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`} />
                  <span className="text-xs font-bold text-slate-500">ID: {acc.id.substring(0, 8)}</span>
                </div>
                {/* HATA ÇÖZÜMÜ: acc.email yerine acc.address kullanıldı */}
                <p className={`text-sm font-mono truncate ${currentAccount?.id === acc.id ? 'text-white' : 'text-slate-400'}`}>
                  {acc.address}
                </p>
                
                {/* Silme Butonu */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Tıklamanın üst elemana geçmesini engelle
                    onDelete(acc.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <button 
              onClick={onCreate}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> New Identity
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountSidebar;