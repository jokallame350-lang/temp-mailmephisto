import React, { useState } from 'react';
import { Ghost, X, AlertTriangle, ArrowRight } from 'lucide-react';
import { translations, Language } from '../translations';

interface ForwardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    lang: Language;
    activeAddress: string | undefined;
}

const ForwardingModal: React.FC<ForwardingModalProps> = ({ isOpen, onClose, lang, activeAddress }) => {
    const t = translations[lang];
    const [targetEmail, setTargetEmail] = useState('');
    const [saved, setSaved] = useState(false);

    if (!isOpen) return null;

    const handleSave = () => {
        if (targetEmail.includes('@')) {
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                onClose();
            }, 2500);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden text-white relative z-10 animate-fade-in-up">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#111]">
                    <h3 className="text-sm font-bold uppercase flex items-center gap-2 text-rose-500">
                        <Ghost className="w-4 h-4 text-rose-500" />
                        {t.ghostForwardTitle}
                    </h3>
                    <button onClick={onClose} aria-label="Close forwarding modal"><X className="w-5 h-5 text-slate-500 hover:text-white transition-colors" /></button>
                </div>

                <div className="p-5 space-y-5">
                    <p className="text-xs text-slate-400 leading-relaxed text-center">
                        {t.ghostForwardDesc}
                    </p>

                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-md p-3 text-[11px] text-rose-400 flex flex-col gap-1.5 leading-snug">
                        <div className="flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <strong>{t.ghostBetaTitle}</strong>
                        </div>
                        <p className="text-rose-400/80">{t.ghostBetaDesc}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-1.5 p-3 bg-black/40 border border-white/5 rounded-lg group hover:border-white/10 transition-colors">
                            <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5">{t.ghostSourceLabel}</span>
                            <span className="text-sm font-medium text-emerald-400 truncate">{activeAddress || t.ghostSelectAddress}</span>
                        </div>

                        <div className="flex justify-center -my-3 relative z-10"><div className="bg-black border border-white/10 p-1.5 rounded-full text-slate-500"><ArrowRight className="w-4 h-4" /></div></div>

                        <div className="flex flex-col gap-1.5 p-3 bg-black/40 border border-white/5 rounded-lg focus-within:border-rose-500/50 transition-colors">
                            <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5">{t.ghostDestLabel}</span>
                            <input
                                value={targetEmail}
                                onChange={(e) => setTargetEmail(e.target.value)}
                                type="email"
                                placeholder="name@example.com"
                                className="w-full bg-transparent border-none text-sm text-white focus:outline-none placeholder-slate-700"
                            />
                        </div>
                    </div>

                    <button
                        disabled={!targetEmail.includes('@') || saved}
                        onClick={handleSave}
                        className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg ${saved
                            ? 'bg-green-500 text-white shadow-green-500/20'
                            : targetEmail.includes('@')
                                ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-rose-500/20'
                                : 'bg-white/5 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        {saved ? t.ghostActiveRule : t.ghostActivateBtn}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForwardingModal;
