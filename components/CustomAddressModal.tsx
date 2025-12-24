import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, AtSign } from 'lucide-react';
import { fetchDomains } from '../services/mailService';

interface CustomAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (username: string, domain: string, apiBase: string) => Promise<void>;
}

const CustomAddressModal: React.FC<CustomAddressModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [username, setUsername] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [apiBase, setApiBase] = useState('');
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDomains();
      setUsername('');
      setError(null);
    }
  }, [isOpen]);

  const loadDomains = async () => {
    setLoadingDomains(true);
    try {
      const result = await fetchDomains();
      setDomains(result.domains);
      setApiBase(result.apiBase);
      if (result.domains.length > 0) {
        setSelectedDomain(result.domains[0]);
      }
    } catch (e) {
      setError("Failed to load domains. Please try again later.");
    } finally {
      setLoadingDomains(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !selectedDomain) return;

    setIsCreating(true);
    setError(null);
    try {
      await onCreate(username, selectedDomain, apiBase);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create address.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0a0a0a] rounded-2xl shadow-2xl shadow-red-900/10 w-full max-w-md overflow-hidden border border-white/10">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AtSign className="w-5 h-5 text-red-500" />
            Custom Alias
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loadingDomains ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-red-500" />
              <p className="text-sm font-mono">Initializing tunnel protocols...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-sm text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Username
                </label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-.]/g, ''))}
                  placeholder="e.g. secret-agent"
                  className="w-full px-4 py-3 rounded-xl bg-black border border-white/10 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all font-mono text-white placeholder-gray-700"
                  autoFocus
                  required
                  minLength={3}
                  maxLength={30}
                />
                <p className="text-[10px] text-gray-600 mt-1.5">
                  Only lowercase letters, numbers, dots, and hyphens.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Domain
                </label>
                <div className="relative">
                  <select 
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black border border-white/10 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all cursor-pointer text-white appearance-none"
                  >
                    {domains.map(d => (
                      <option key={d} value={d}>@{d}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isCreating || !username}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                ESTABLISH ALIAS
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper icon
const ChevronDown = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
);

export default CustomAddressModal;