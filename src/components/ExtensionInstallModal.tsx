import React from 'react';
import { X, FileArchive, ShieldCheck, ExternalLink, Cpu, Chrome, CheckCircle2 } from 'lucide-react';
import { Language } from '../translations';

interface ExtensionInstallModalProps {
    isOpen: boolean;
    onClose: () => void;
    lang: Language;
}

const ExtensionInstallModal: React.FC<ExtensionInstallModalProps> = ({ isOpen, onClose, lang }) => {
    if (!isOpen) return null;
    const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/mephistomail/kolhhealinebomlncflljopkphaoilob';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Arka plan overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Chrome className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold leading-tight">
                                {lang === 'tr' ? 'MephistoMail Chrome Eklentisi' : 'MephistoMail Chrome Extension'}
                            </h2>
                            <p className="text-[11px] text-green-400 font-medium flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {lang === 'tr' ? 'Resmi Chrome Web Store Sürümü' : 'Official Chrome Web Store Version'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-6">
                    <p className="text-sm text-slate-300 leading-relaxed">
                        {lang === 'tr'
                            ? 'MephistoMail Chrome eklentisini doğrudan Chrome Web Store üzerinden tek tıkla tarayıcınıza yükleyebilir, kayıt formlarında anında kullan at e-posta oluşturabilirsiniz.'
                            : 'Install the MephistoMail Chrome extension directly from the Chrome Web Store in one click to generate disposable email addresses instantly on registration forms.'}
                    </p>

                    {/* Primary Direct Install CTA */}
                    <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-4 flex flex-col items-center text-center space-y-3">
                        <div className="flex items-center justify-center gap-2">
                            <Chrome className="w-6 h-6 text-orange-400" />
                            <span className="text-white font-bold text-base">
                                {lang === 'tr' ? 'Doğrudan Chrome Mağazasından Yükleyin' : 'Direct Install from Chrome Web Store'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-300 max-w-sm">
                            {lang === 'tr'
                                ? 'Tek tıkla otomatik kurulum. Güncellemeler otomatik olarak tarayıcınıza gelir.'
                                : 'One-click automatic installation. Updates are delivered automatically to your browser.'}
                        </p>
                        <a
                            href={CHROME_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5"
                        >
                            <Chrome className="w-4 h-4" />
                            <span>{lang === 'tr' ? 'Chrome Web Store\'da Aç & Yükle' : 'Open in Chrome Web Store'}</span>
                            <ExternalLink className="w-4 h-4 opacity-80" />
                        </a>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 pt-1 border-t border-white/5">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            {lang === 'tr' ? 'Eklenti Özellikleri' : 'Extension Features'}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                <span>{lang === 'tr' ? 'Tek Tıkla Mail Oluşturma' : 'One-Click Email Generation'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                <span>{lang === 'tr' ? 'Form Otomatik Doldurma' : 'Auto-Fill Form Fields'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                <span>{lang === 'tr' ? 'Anlık Gelen Kutusu Bildirimi' : 'Instant Inbox Notifications'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                <span>{lang === 'tr' ? 'Sıfır Kayıt & Gizlilik Garantisi' : 'Zero Logs & Privacy First'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Fallback Option: Developer Source Code Sideload */}
                    <div className="pt-3 border-t border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                                {lang === 'tr' ? 'Alternatif: Manuel (Sideload) Kurulum' : 'Alternative: Manual (Sideload) Install'}
                            </h3>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            {lang === 'tr'
                                ? 'Geliştiriciler veya açık kaynak kodunu kendisi derlemek isteyenler GitHub repository üzerindeki '
                                : 'For developers or users who prefer building from source, download the '}
                            <code className="text-orange-400 bg-orange-400/10 px-1 py-0.5 rounded text-[10px]">extension</code>
                            {lang === 'tr' ? ' klasörünü ' : ' folder and load it via '}
                            <code className="font-mono text-green-400 bg-green-400/10 px-1 py-0.5 rounded text-[10px]">chrome://extensions</code>
                            {lang === 'tr' ? ' üzerinden yükleyebilir.' : '.'}
                        </p>
                        <a
                            href="https://github.com/jokallame350-lang/temp-mailmephisto/archive/refs/heads/main.zip"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
                        >
                            <FileArchive className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lang === 'tr' ? 'Kaynak Kod ZIP İndir (GitHub)' : 'Download Source ZIP (GitHub)'}</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExtensionInstallModal;
