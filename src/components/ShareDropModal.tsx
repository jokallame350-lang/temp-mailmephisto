import React, { useState } from 'react';
import { X, SendToBack, Share2, Check, ShieldCheck, Copy } from 'lucide-react';
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

    const siteUrl = 'https://mephistomail.site';
    const viralMessageEn = `Send files securely and anonymously to my disposable address: ${activeAddress}\n\nVia MephistoMail Zero-Log Network -> ${siteUrl}`;
    const viralMessageTr = `Dosyalarınızı anonim ve güvenli olarak bana şu adresten iletin:\n${activeAddress}\n\nMephistoMail Zero-Log Ağı güvencesiyle -> ${siteUrl}`;

    const copyText = lang === 'tr' ? viralMessageTr : viralMessageEn;

    const handleCopy = () => {
        navigator.clipboard.writeText(copyText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: lang === 'tr' ? 'MephistoMail Güvenli Gönderim' : 'MephistoMail Secure Drop',
                    text: copyText,
                });
            } catch (err) {
                console.log('Share failed:', err);
                handleCopy();
            }
        } else {
            handleCopy();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-white relative z-10 animate-fade-in-up">
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-r from-[#111] to-[#1a1a1c]">
                    <h3 className="text-base font-black uppercase flex items-center gap-2 text-fuchsia-500 tracking-wider">
                        <SendToBack className="w-5 h-5" />
                        {lang === 'tr' ? 'Güvenli Paylaşım' : 'Secure Drop'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                </div>

                <div className="p-6 space-y-6 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-2 animate-pulse">
                        <ShieldCheck className="w-8 h-8 text-fuchsia-500" />
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed text-center">
                        {lang === 'tr'
                            ? 'Bu adresi Discord, WhatsApp vb uygulamalardan başkalarıyla paylaşarak size güvenli olarak dosya göndermelerini sağlayın.'
                            : 'Share this address with others on Discord, WhatsApp, etc. so they can send you files securely.'}
                    </p>

                    <button
                        onClick={handleShare}
                        className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg hover:scale-[1.02] active:scale-95 ${copied
                            ? 'bg-green-500 text-white shadow-green-500/20'
                            : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white shadow-fuchsia-500/20'
                            }`}
                    >
                        {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                        {copied
                            ? (lang === 'tr' ? 'Kopyalandı!' : 'Copied!')
                            : (lang === 'tr' ? 'Uygulamaya Gönder' : 'Share to App')}
                    </button>

                    <button onClick={handleCopy} className="text-xs text-slate-500 hover:text-white flex items-center gap-1.5 transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                        {lang === 'tr' ? 'Sadece metni kopyala' : 'Just copy text'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareDropModal;
