import React, { useState } from 'react';
import { X, SendToBack, Copy, Check, MessageSquare, ShieldAlert } from 'lucide-react';
import { translations, Language } from '../translations';

interface ShareDropModalProps {
    isOpen: boolean;
    onClose: () => void;
    lang: Language;
    activeAddress: string | undefined;
}

const ShareDropModal: React.FC<ShareDropModalProps> = ({ isOpen, onClose, lang, activeAddress }) => {
    const t = translations[lang] as any;
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    // The viral message to copy
    const siteUrl = 'https://mephistomail.com';
    const viralMessageEn = `Send your files securely and anonymously to my disposable address: ${activeAddress}\n\nYour message will be automatically destroyed upon delivery via the MephistoMail Zero-Log Network. Create your own secure inbox here -> ${siteUrl}`;
    const viralMessageTr = `Dosyanızı veya mesajınızı anonim ve güvenli olarak bana şu adresten iletin: ${activeAddress}\n\nİletiniz MephistoMail Zero-Log Ağı üzerinden imha edilerek güvenle bana ulaşacaktır. Kendi anonim posta kutunuzu ücretsiz oluşturun -> ${siteUrl}`;

    const copyText = lang === 'tr' ? viralMessageTr : viralMessageEn;

    const handleCopy = () => {
        navigator.clipboard.writeText(copyText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden text-white relative z-10 animate-fade-in-up">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#111]">
                    <h3 className="text-sm font-bold uppercase flex items-center gap-2 text-fuchsia-500">
                        <SendToBack className="w-4 h-4 text-fuchsia-500" />
                        {t.dropTitle || 'Share-to-Destruct'}
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-500 hover:text-white transition-colors" /></button>
                </div>

                <div className="p-5 space-y-5">
                    <p className="text-xs text-slate-400 leading-relaxed text-center">
                        {t.dropDesc || 'Create a viral secure drop point. Share this message so others can safely send you files, while introducing them to MephistoMail.'}
                    </p>

                    <div className="bg-black border border-white/10 rounded-lg p-3 text-xs text-slate-300 relative">
                        <div className="whitespace-pre-wrap leading-relaxed">{copyText}</div>

                        <button
                            onClick={handleCopy}
                            className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-fuchsia-500 hover:text-white rounded text-slate-400 transition-colors"
                            title="Copy Viral Message"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-md p-3 text-[11px] text-fuchsia-400 flex flex-col gap-1.5 leading-snug">
                        <div className="flex items-start gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <strong>Viral Growth Loop</strong>
                        </div>
                        <p className="text-fuchsia-400/80">Every time you share this, you are helping build the network while keeping your identity safe.</p>
                    </div>

                    <button
                        onClick={handleCopy}
                        className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg ${copied
                            ? 'bg-green-500 text-white shadow-green-500/20'
                            : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white shadow-fuchsia-500/20'
                            }`}
                    >
                        {copied ? 'Copied to Clipboard!' : 'Copy Drop Message'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareDropModal;
