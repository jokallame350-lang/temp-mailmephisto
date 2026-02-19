import React, { useState, useEffect } from 'react';
import { X, Globe, Loader2 } from 'lucide-react';
import { translations, Language } from '../translations';
import { fetchDomains } from '../services/mailService';

interface CustomAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (u: string, d: string, a: string) => void;
  lang: Language;
}

const CustomAddressModal: React.FC<CustomAddressModalProps> = ({ isOpen, onClose, onCreate, lang }) => {
  const t = translations[lang];
  const [username, setUsername] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [domainProviderMap, setDomainProviderMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setIsLoading(true);
      fetchDomains().then(data => {
        setDomains(data.domains);
        setDomainProviderMap(data.domainProviderMap);
        if (data.domains.length > 0) setSelectedDomain(data.domains[0]);
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-white">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-sm font-bold uppercase flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> {t.customTitle}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-500 hover:text-white transition-colors" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-400">{t.customDesc}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ''))}
              placeholder={t.usernamePlaceholder}
              className="flex-grow bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none text-white placeholder:text-slate-600"
            />
            <span className="py-2 text-slate-400">@</span>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm outline-none max-w-[150px] text-white"
            >
              {isLoading ? <option>{t.loadingDomains}</option> : domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button
            onClick={() => onCreate(username, selectedDomain, domainProviderMap[selectedDomain] || 'mail_tm')}
            disabled={!username || isLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 active:scale-95"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t.create}
          </button>
        </div>
      </div>
    </div>
  );
};
export default CustomAddressModal;