import React, { useState, useMemo } from 'react';
import { AppStats, NotificationFilter, AICategory } from '../types';
import { BarChart3, Bell, BellOff, X, Mail, Shield, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { translations, Language } from '../translations';

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: AppStats;
    lang: Language;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, stats, lang }) => {
    if (!isOpen) return null;
    const t = translations[lang];

    const categories: { key: AICategory; label: string; icon: React.ReactNode; color: string }[] = [
        { key: 'Verification', label: t.filterVerificationCodes, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-500 bg-green-500/10' },
        { key: 'Security', label: t.filterSecurityAlerts, icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-500 bg-red-500/10' },
        { key: 'Newsletter', label: t.filterNewsletters, icon: <Tag className="w-4 h-4" />, color: 'text-blue-500 bg-blue-500/10' },
        { key: 'Other', label: t.filterOther, icon: <Mail className="w-4 h-4" />, color: 'text-slate-400 bg-slate-500/10' },
    ];

    const total = Object.values(stats.categoryBreakdown).reduce((a, b) => a + b, 0) || 1;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={t.statsModalTitle}>
            <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-purple-500" />
                        </div>
                        <h2 className="text-lg font-black text-white uppercase tracking-wider">
                            {t.statsModalTitle}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors" aria-label="Close statistics">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-black text-white">{stats.totalAccountsCreated}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {t.statsAccountsCreated}
                        </p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-black text-white">{stats.totalEmailsReceived}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {t.statsEmailsReceived}
                        </p>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {t.statsCategoryBreakdown}
                    </p>
                    {categories.map(cat => {
                        const count = stats.categoryBreakdown[cat.key] || 0;
                        const pct = Math.round((count / total) * 100);
                        return (
                            <div key={cat.key} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color}`}>{cat.icon}</div>
                                <div className="flex-grow">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-300">{cat.label}</span>
                                        <span className="text-xs font-mono text-slate-400">{count}</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

interface NotifFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: NotificationFilter;
    setFilters: (f: NotificationFilter) => void;
    lang: Language;
}

export const NotifFilterModal: React.FC<NotifFilterModalProps> = ({ isOpen, onClose, filters, setFilters, lang }) => {
    if (!isOpen) return null;
    const t = translations[lang];

    const items: { key: keyof NotificationFilter; label: string; icon: React.ReactNode }[] = [
        { key: 'verification', label: t.filterVerificationCodes, icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
        { key: 'security', label: t.filterSecurityAlerts, icon: <Shield className="w-4 h-4 text-red-500" /> },
        { key: 'newsletter', label: t.filterNewsletters, icon: <Tag className="w-4 h-4 text-blue-500" /> },
        { key: 'other', label: t.filterOther, icon: <Mail className="w-4 h-4 text-slate-400" /> },
    ];

    const toggle = (key: keyof NotificationFilter) => {
        setFilters({ ...filters, [key]: !filters[key] });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={t.filterModalTitle}>
            <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-yellow-500" />
                        </div>
                        <h2 className="text-lg font-black text-white uppercase tracking-wider">
                            {t.filterModalTitle}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors" aria-label="Close notification filters">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3">
                    {items.map(item => (
                        <button
                            key={item.key}
                            onClick={() => toggle(item.key)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${filters[item.key]
                                    ? 'bg-white/[0.05] border-white/10'
                                    : 'bg-transparent border-white/5 opacity-50'
                                }`}
                            aria-pressed={filters[item.key]}
                            aria-label={`Toggle ${item.label} notifications`}
                        >
                            {item.icon}
                            <span className="flex-grow text-left text-sm font-bold text-slate-300">{item.label}</span>
                            {filters[item.key] ? <Bell className="w-4 h-4 text-green-500" /> : <BellOff className="w-4 h-4 text-slate-600" />}
                        </button>
                    ))}
                </div>

                <p className="text-[10px] text-slate-400 mt-4 text-center">
                    {t.filterNote}
                </p>
            </div>
        </div>
    );
};
