import React from 'react';
import { X, DownloadCloud, FileArchive, ShieldAlert, Cpu } from 'lucide-react';
import { Language, translations } from '../translations';

interface ExtensionInstallModalProps {
    isOpen: boolean;
    onClose: () => void;
    lang: Language;
}

const ExtensionInstallModal: React.FC<ExtensionInstallModalProps> = ({ isOpen, onClose, lang }) => {
    if (!isOpen) return null;
    const t = translations[lang];

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
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold leading-tight">
                                {lang === 'tr' ? 'MephistoMail Eklentisi (Sideload)' : 'MephistoMail Extension (Sideload)'}
                            </h2>
                            <p className="text-[11px] text-red-400 font-medium">
                                {lang === 'tr' ? 'Maksimum gizlilik için mağaza dışı sürüm' : 'Non-store version for maximum privacy'}
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
                    <p className="text-sm text-slate-300">
                        {lang === 'tr'
                            ? 'Chrome Mağazası Google tarafından katı bir şekilde izlendiği için eklentimizi açık kaynak kodlu olarak (Sideload) paylaşıyoruz. Tek yapmanız gereken üç adımı takip etmek:'
                            : 'Since the Chrome Web Store is strictly monitored by Google, we provide our open-source extension as a sideload. Just follow these three simple steps:'}
                    </p>

                    <div className="space-y-4">
                        {/* Step 1 */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-red-500 font-black shrink-0">1</div>
                            <div>
                                <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-1">
                                    <DownloadCloud className="w-4 h-4 text-slate-400" />
                                    {lang === 'tr' ? 'ZIP Olarak İndir' : 'Download ZIP'}
                                </h3>
                                <p className="text-xs text-slate-400 mb-2">
                                    {lang === 'tr' ? 'Aşağıdaki butona tıklayarak kaynak kodları bilgisayarınıza indirin.' : 'Click the button below to download the source code to your computer.'}
                                </p>
                                <a
                                    href="https://github.com/jokallame350-lang/temp-mailmephisto/archive/refs/heads/main.zip"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-colors"
                                >
                                    <FileArchive className="w-4 h-4" />
                                    mephistomail-main.zip
                                </a>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-orange-500 font-black shrink-0">2</div>
                            <div>
                                <h3 className="text-white font-bold text-sm mb-1">
                                    {lang === 'tr' ? 'Klasöre Çıkart' : 'Extract the Folder'}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {lang === 'tr' ? 'İndiğiniz ZIP dosyasını dışarı aktarın. İçerisindeki ' : 'Extract the downloaded ZIP. Inside, you will find a '}
                                    <code className="text-orange-400 bg-orange-400/10 px-1 py-0.5 rounded">extension</code>
                                    {lang === 'tr' ? ' klasörünü bulun.' : ' folder.'}
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-green-500 font-black shrink-0">3</div>
                            <div>
                                <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-1">
                                    <Cpu className="w-4 h-4 text-slate-400" />
                                    {lang === 'tr' ? 'Tarayıcıya Yükle' : 'Load in Browser'}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {lang === 'tr' ? 'Yeni bir sekmede ' : 'Open a new tab and go to '}
                                    <code className="font-mono text-green-400 bg-green-400/10 px-1 py-0.5 rounded select-all cursor-pointer">chrome://extensions</code>
                                    {lang === 'tr' ? ' adresine gidin. Sağ üstteki ' : '. Enable the '}
                                    <span className="font-bold text-white">{lang === 'tr' ? 'Geliştirici Modunu ' : 'Developer Mode'}</span>
                                    {lang === 'tr' ? 'açın ve çıkarttığınız ' : ' at the top right, and '}
                                    <code className="text-orange-400">extension</code>
                                    {lang === 'tr' ? ' klasörünü sayfanın içine sürükleyip bırakın!' : ' drag and drop the extension folder into the page!'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExtensionInstallModal;
