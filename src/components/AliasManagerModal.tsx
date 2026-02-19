import React, { useState } from 'react';
import { Mailbox } from '../types';
import { Tag, X, Clock, Palette, Trash2, Copy, Check } from 'lucide-react';
import { Language, translations } from '../translations';

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

    if (!isOpen) return null;

    const handleBulkCopy = () => {
        onBulkCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose} role="dialog" aria-modal="true" aria-label="Alias manager">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Tag className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-wider">
                                {lang === 'tr' ? 'Hesap Yöneticisi' : 'Account Manager'}
                            </h2>
                            <p className="text-[10px] text-slate-500">{accounts.length} {lang === 'tr' ? 'hesap' : 'accounts'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBulkCopy}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 transition-all"
                            aria-label="Copy all addresses"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? 'OK!' : (lang === 'tr' ? 'Toplu Kopyala' : 'Bulk Copy')}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors" aria-label="Close alias manager">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Account List */}
                <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2">
                    {accounts.map(acc => (
                        <div key={acc.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
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
                                        onClick={() => setEditingId(editingId === acc.id ? null : acc.id)}
                                        className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
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
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{lang === 'tr' ? 'Etiket' : 'Label'}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {LABEL_PRESETS.map(preset => (
                                                <button
                                                    key={preset.label}
                                                    onClick={() => onUpdateLabel(acc.id, lang === 'tr' ? preset.labelTr : preset.label, preset.color)}
                                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${acc.label === preset.label || acc.label === preset.labelTr
                                                            ? 'opacity-100 scale-105'
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
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {lang === 'tr' ? 'Otomatik Silme' : 'Auto Delete'}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {AUTO_DELETE_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => onSetAutoDelete(acc.id, opt.value === 0 ? undefined : opt.value)}
                                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${(acc.autoDeleteMinutes === opt.value) || (!acc.autoDeleteMinutes && opt.value === 0)
                                                            ? 'bg-red-500/20 border-red-500/30 text-red-400'
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
