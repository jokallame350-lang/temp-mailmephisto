import React, { useState, useEffect } from 'react';
import { EmailDetail } from '../types';
import { ArrowLeft, Calendar, User, Download, Code, Eye, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import DOMPurify from 'dompurify';
import { translations, Language } from '../translations';

interface EmailViewerProps {
  email: EmailDetail | null;
  loading: boolean;
  onBack: () => void;
  lang: Language;
}

const EmailViewer: React.FC<EmailViewerProps> = ({ email, loading, onBack, lang }) => {
  const t = translations[lang];
  const [viewSource, setViewSource] = useState(false);
  const [showImages, setShowImages] = useState(false);

  useEffect(() => { setViewSource(false); setShowImages(false); }, [email?.id]);

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-xs text-slate-500 font-mono animate-pulse">{t.decrypting}</div>
      </div>
    );
  }

  if (!email) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDownload = () => {
    const emlContent = `From: ${email.from.address}\nSubject: ${email.subject}\nDate: ${email.createdAt}\n\n${email.html ? email.html[0] : email.text || ''}`;
    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${email.subject?.replace(/[^a-z0-9]/gi, '_').substring(0, 20)}.eml`;
    link.click();
  };

  let cleanHTML = DOMPurify.sanitize(email.html ? email.html[0] : (email.text || ''), { USE_PROFILES: { html: true } });
  if (!showImages) {
    cleanHTML = cleanHTML.replace(/<img[^>]*>/g, () => `<div style="border:1px dashed #ccc; padding:10px; color:#666; font-size:11px; background:#f5f5f5;">[IMAGE BLOCKED]</div>`);
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/5 bg-slate-50 dark:bg-[#0e0e11]">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors text-xs font-bold uppercase md:hidden">
          <ArrowLeft className="w-4 h-4" /> {t.back}
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setViewSource(!viewSource)} className={`p-2 rounded-lg transition-colors ${viewSource ? 'bg-red-500/20 text-red-500' : 'hover:bg-slate-200 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400'}`} title={t.sourceCode}>
            {viewSource ? <Eye className="w-4 h-4" /> : <Code className="w-4 h-4" />}
          </button>
          <button onClick={handleDownload} className="p-2 hover:bg-slate-200 dark:hover:bg-white/5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors" title={t.download}>
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6 border-b border-gray-200 dark:border-white/5 space-y-4 bg-white dark:bg-transparent">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{email.subject || t.noSubject}</h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/5">
            <User className="w-3 h-3 text-red-500" />
            <span className="text-slate-800 dark:text-slate-200 font-medium">{email.from.name}</span>
            <span className="text-slate-500">&lt;{email.from.address}&gt;</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{formatDate(email.createdAt)}</span>
          </div>
        </div>
      </div>

      {!showImages && !viewSource && (
        <div className="bg-yellow-50 border-b border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20 p-3 flex items-center justify-between gap-4">
           <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500 text-xs">
              <ShieldAlert className="w-4 h-4" /> <span>{t.privacyAlert}</span>
           </div>
           <button onClick={() => setShowImages(true)} className="text-xs bg-yellow-100 dark:bg-yellow-500/10 hover:bg-yellow-200 dark:hover:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-3 py-1.5 rounded border border-yellow-200 dark:border-yellow-500/20 flex items-center gap-2 transition-colors">
             <ImageIcon className="w-3 h-3" /> {t.loadImages}
           </button>
        </div>
      )}

      <div className="flex-grow overflow-y-auto custom-scrollbar relative bg-white">
        {viewSource ? (
          <div className="absolute inset-0 bg-[#050505] p-6 text-xs font-mono text-green-500/80 overflow-auto">
            <pre className="whitespace-pre-wrap break-all">{`From: ${email.from.address}\nSubject: ${email.subject}\nDate: ${email.createdAt}\n\n${email.html ? email.html[0] : email.text}`}</pre>
          </div>
        ) : (
          <div className="w-full min-h-full p-8 text-slate-900 leading-relaxed">
             <div className="prose max-w-none prose-sm md:prose-base prose-img:rounded-lg prose-a:text-blue-600 prose-headings:text-slate-900" dangerouslySetInnerHTML={{ __html: cleanHTML }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailViewer;