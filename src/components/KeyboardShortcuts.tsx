import React, { useState, useEffect, useCallback } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Language } from '../translations';

interface KeyboardShortcutsProps {
    lang: Language;
    onNewAccount: () => void;
    onRefresh: () => void;
    onToggleLang: () => void;
}

interface Shortcut {
    key: string;
    description: { en: string; tr: string };
    action: string;
}

const SHORTCUTS: Shortcut[] = [
    { key: 'N', description: { en: 'New Account', tr: 'Yeni Hesap' }, action: 'new' },
    { key: 'R', description: { en: 'Refresh Inbox', tr: 'Kutuyu Yenile' }, action: 'refresh' },
    { key: 'L', description: { en: 'Toggle Language', tr: 'Dil Değiştir' }, action: 'lang' },
    { key: '?', description: { en: 'Keyboard Shortcuts', tr: 'Klavye Kısayolları' }, action: 'help' },
    { key: 'Esc', description: { en: 'Close / Go Back', tr: 'Kapat / Geri' }, action: 'escape' },
];

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ lang, onNewAccount, onRefresh, onToggleLang }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Modal/input açıkken çalışmasın
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable'))) return;

        switch (e.key) {
            case '?':
                e.preventDefault();
                setIsOpen(prev => !prev);
                break;
            case 'n':
            case 'N':
                if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); onNewAccount(); }
                break;
            case 'r':
            case 'R':
                if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); onRefresh(); }
                break;
            case 'l':
            case 'L':
                if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); onToggleLang(); }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    }, [onNewAccount, onRefresh, onToggleLang]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setIsOpen(false)} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <Keyboard className="w-5 h-5 text-cyan-500" />
                        </div>
                        <h2 className="text-lg font-black text-white uppercase tracking-wider">
                            {lang === 'tr' ? 'Kısayollar' : 'Shortcuts'}
                        </h2>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-2">
                    {SHORTCUTS.map(shortcut => (
                        <div key={shortcut.action} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                            <span className="text-xs font-bold text-slate-300">{shortcut.description[lang]}</span>
                            <kbd className="kbd text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-400 font-mono font-bold">
                                {shortcut.key}
                            </kbd>
                        </div>
                    ))}
                </div>

                <p className="text-[9px] text-slate-600 text-center mt-4 font-medium">
                    {lang === 'tr' ? 'Kısayollar input alanları dışında çalışır.' : 'Shortcuts work outside of input fields.'}
                </p>
            </div>
        </div>
    );
};

export default React.memo(KeyboardShortcuts);
