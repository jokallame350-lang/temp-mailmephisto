import React, { useState } from 'react';
import { Mailbox } from '../types';
import { Tag, X, Clock, Palette, Copy, Check, FileSpreadsheet, FileCode } from 'lucide-react';
import { Language, translations } from '../translations';
import { useModalA11y } from '../hooks/useModalA11y';

interface AliasManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Mailbox[];
  onUpdateLabel: (id: string, label: string, color: string) => void;
  onSetAutoDelete: (id: string, minutes: number | undefined) => void;
  onBulkCopy: () => string;
  lang: Language;
}

const LABEL_PRESETS = [
  { label: 'Social Media', labelTr: 'Sosyal Medya', color: '#3b82f6' },
  { label: 'Shopping', labelTr: 'Alışveriş', color: '#f59e0b' },
  { label: 'Gaming', labelTr: 'Oyun', color: '#10b981' },
  { label: 'Work', labelTr: 'İş', color: '#8b5cf6' },
  { label: 'Testing', labelTr: 'Test', color: '#ef4444' },
  { label: 'Other', labelTr: 'Diğer', color: '#6b7280' },
];

const AUTO_DELETE_OPTIONS = [
  { label: '5 min', value: 5 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '6 hours', value: 360 },
  { label: '24 hours', value: 1440 },
  { label: 'Never', value: 0 },
];

const AliasManagerModal: React.FC<AliasManagerModalProps> = ({
  isOpen, onClose, accounts, onUpdateLabel, onSetAutoDelete, onBulkCopy, lang
}) => {
  const [copied, setCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const t = translations[lang] || translations.en;

  const { modalRef, handleBackdropClick } = useModalA11y({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const handleBulkCopy = () => {
    onBulkCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const headers = "Address,API,Created\n";
    const rows = accounts.map(a => `"${a.address}","${a.apiBase}","${a.createdAt ? new Date(a.createdAt).toISOString() : ''}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mephisto_accounts_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportJSON = () => {
    const data = accounts.map(a => ({ address: a.address, provider: a.apiBase, createdAt: a.createdAt }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mephisto_accounts_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const getTimeLeft = (account: Mailbox) => {
    if (!account.autoDeleteMinutes || !account.createdAt) return null;
    const elapsed = Date.now() - account.createdAt;
    const remaining = account.autoDeleteMinutes * 60 * 1000 - elapsed;
    if (remaining <= 0) return 'Expiring...';
    const mins = Math.floor(remaining / 60000);
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `${mins}m`;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alias-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Tag className="w-5 h-5 text-indigo-500" aria-hidden="true" />
            </div>
            <div>
              <h2 id="alias-modal-title" className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                {t.aliasManagerTitle}
              </h2>
              <p className="text-[10px] text-slate-400">{accounts.length} {t.aliasAccountsCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title={t.aliasExportCsv}
              aria-label={t.aliasExportCsv}
            >
              <FileSpreadsheet className="w-4 h-4 text-green-400" />
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title={t.aliasExportJson}
              aria-label={t.aliasExportJson}
            >
              <FileCode className="w-4 h-4 text-blue-400" />
            </button>
            <button
              type="button"
              onClick={handleBulkCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Copy all addresses"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'OK!' : t.copy}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Account List */}
        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2 pr-1">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {acc.labelColor && (
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: acc.labelColor }} />
                  )}
                  <span className="text-xs font-mono text-slate-300 truncate">{acc.address}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {getTimeLeft(acc) && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> {getTimeLeft(acc)}
                    </span>
                  )}
                  {acc.label && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border" style={{ color: acc.labelColor, borderColor: acc.labelColor + '40', backgroundColor: acc.labelColor + '15' }}>
                      {acc.label}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingId(editingId === acc.id ? null : acc.id)}
                    className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label="Edit account label"
                  >
                    <Palette className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded edit section */}
              {editingId === acc.id && (
                <div className="border-t border-white/5 pt-3 space-y-3">
                  {/* Labels */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.aliasLabel}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {LABEL_PRESETS.map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => onUpdateLabel(acc.id, lang === 'tr' ? preset.labelTr : preset.label, preset.color)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                            acc.label === preset.label || acc.label === preset.labelTr
                              ? 'opacity-100 scale-105 ring-2 ring-indigo-500/50'
                              : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{ color: preset.color, borderColor: preset.color + '40', backgroundColor: preset.color + '15' }}
                        >
                          {lang === 'tr' ? preset.labelTr : preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-delete timer */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t.aliasAutoDelete}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {AUTO_DELETE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => onSetAutoDelete(acc.id, opt.value === 0 ? undefined : opt.value)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${(acc.autoDeleteMinutes === opt.value) || (!acc.autoDeleteMinutes && opt.value === 0)
                            ? 'bg-red-500/20 border-red-500/30 text-red-400 ring-2 ring-red-500/40'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AliasManagerModal;
