import React, { useEffect, useState, useCallback, memo } from 'react';
import { Mail, X, CheckCircle2, Copy, Check } from 'lucide-react';

export interface ToastData {
    id: string;
    from: string;
    subject: string;
    code?: string; // OTP kodu varsa
}

interface ToastProps {
    toasts: ToastData[];
    onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = memo(({ toasts, onDismiss }) => {
    return (
        <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
});

const ToastItem: React.FC<{ toast: ToastData; onDismiss: (id: string) => void }> = memo(({ toast, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);

    useEffect(() => {
        // Giriş animasyonu
        requestAnimationFrame(() => setIsVisible(true));

        // 6 saniye sonra otomatik kapat
        const timer = setTimeout(() => {
            setIsLeaving(true);
            setTimeout(() => onDismiss(toast.id), 400);
        }, 6000);

        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    const handleCopyCode = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (toast.code) {
            navigator.clipboard.writeText(toast.code);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        }
    }, [toast.code]);

    const handleDismiss = useCallback(() => {
        setIsLeaving(true);
        setTimeout(() => onDismiss(toast.id), 400);
    }, [onDismiss, toast.id]);

    return (
        <div
            className={`pointer-events-auto transform transition-all duration-400 ease-out ${isVisible && !isLeaving
                    ? 'translate-x-0 opacity-100 scale-100'
                    : 'translate-x-full opacity-0 scale-95'
                }`}
        >
            <div className="relative overflow-hidden bg-[#111115]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50">
                {/* Üst Parlama */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>

                {/* İlerleme Çubuğu */}
                <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-red-500 to-orange-500 animate-toast-progress"></div>

                <div className="p-4">
                    <div className="flex items-start gap-3">
                        {/* İkon */}
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Mail className="w-5 h-5 text-red-500" />
                        </div>

                        {/* İçerik */}
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-500">New Message</span>
                                <button
                                    onClick={handleDismiss}
                                    className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-500 hover:text-white"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                            <p className="text-xs font-bold text-white truncate">{toast.subject || '(No Subject)'}</p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {typeof toast.from === 'string'
                                    ? toast.from
                                    : (toast.from && typeof toast.from === 'object'
                                        ? String((toast.from as any).name || (toast.from as any).address || '')
                                        : String(toast.from || ''))}
                            </p>
                        </div>
                    </div>

                    {/* OTP Kodu Varsa */}
                    {toast.code && (
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-grow flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                <span className="font-mono text-lg font-black text-green-400 tracking-[0.15em]">{toast.code}</span>
                            </div>
                            <button
                                onClick={handleCopyCode}
                                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-black rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95 shrink-0"
                            >
                                {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {codeCopied ? 'OK!' : 'Copy'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default Toast;
