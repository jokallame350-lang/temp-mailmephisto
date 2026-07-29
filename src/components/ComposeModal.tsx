import React, { useState, useEffect } from 'react';
import { Send, X, Paperclip, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { ComposeMailData } from '../types';
import { sendEmail } from '../services/mailService';
import { Language, translations } from '../translations';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderAddress: string;
  mailboxId: string;
  initialData?: ComposeMailData | null;
  lang: Language;
  onSuccessToast: (msg: string) => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  senderAddress,
  mailboxId,
  initialData,
  lang,
  onSuccessToast,
}) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTo(initialData.to || '');
      setSubject(initialData.subject ? (initialData.subject.startsWith('Re:') ? initialData.subject : `Re: ${initialData.subject}`) : '');
      setBody(initialData.body ? `\n\n--- Alıntılanan Mesaj ---\n${initialData.body}` : '');
    } else {
      setTo('');
      setSubject('');
      setBody('');
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setErrorMsg('Lütfen tüm alanları (Alıcı, Konu ve Mesaj) doldurun.');
      return;
    }

    setSending(true);
    setErrorMsg(null);

    try {
      const success = await sendEmail({
        from: senderAddress,
        to: to.trim(),
        subject: subject.trim(),
        text: body.trim(),
        mailboxId,
      });

      if (success) {
        onSuccessToast('✓ E-posta başarıyla gönderildi!');
        onClose();
      } else {
        setErrorMsg('E-posta gönderimi başarısız oldu. Lütfen tekrar deneyin.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gönderim sırasında hata oluştu.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {initialData ? 'E-postaya Yanıt Ver (Reply)' : 'Yeni E-posta Gönder (Outbound Mail)'}
              </h3>
              <p className="text-xs text-slate-400">
                Kimden: <span className="text-blue-400 font-mono">{senderAddress}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Alıcı E-posta Adresi (To)
            </label>
            <input
              type="email"
              required
              placeholder="alici@example.com"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Konu (Subject)
            </label>
            <input
              type="text"
              required
              placeholder="Konu başlığı"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Mesaj İçeriği
            </label>
            <textarea
              required
              rows={6}
              placeholder="Mesajınızı yazın..."
              value={body}
              onChange={e => setBody(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-mono leading-relaxed resize-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-800">
            <div className="flex items-center text-xs text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 mr-1.5" />
              <span>RAM-Only Güvenli Gönderim</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center space-x-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>E-posta Gönder</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposeModal;
