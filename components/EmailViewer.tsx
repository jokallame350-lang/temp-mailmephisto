import React, { useState, useMemo } from 'react';
import { EmailDetail } from '../types';
import { FileText, Download, ArrowLeft, ExternalLink, Zap, Globe, Code } from 'lucide-react';

interface EmailViewerProps {
  email: EmailDetail | null;
  loading: boolean;
  onBack?: () => void;
}

const EmailViewer: React.FC<EmailViewerProps> = ({ email, loading, onBack }) => {
  const [tab, setTab] = useState<'html' | 'text'>('html');

  const processHtmlContent = (htmlContent: string) => {
    if (!htmlContent) return '';
    return htmlContent.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi, (match, quote, url) => {
      if (match.includes('target=')) {
        return match.replace(/target=["']([^"']*)["']/, 'target="_blank" rel="noopener noreferrer"');
      }
      return match.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ');
    });
  };

  const extractPrimaryLink = (html: string, text: string): string | null => {
    const keywords = ['verify', 'confirm', 'activate', 'login', 'sign in', 'doğrula', 'onayla', 'giris', 'password', 'şifre'];
    const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
    let match;
    const links: string[] = [];
    
    if (html) {
      while ((match = linkRegex.exec(html)) !== null) {
        if (!match[1].match(/(unsubscribe|css|jpg|png|gif|font)/i)) {
           links.push(match[1]);
        }
      }
    }
    
    if (links.length === 0 && text) {
       const textLinkRegex = /(https?:\/\/[^\s]+)/g;
       while ((match = textLinkRegex.exec(text)) !== null) {
         links.push(match[1]);
       }
    }

    if (links.length === 0) return null;
    if (links.length === 1) return links[0];

    const scoredLinks = links.map(link => {
      let score = 0;
      const lowerLink = link.toLowerCase();
      if (keywords.some(k => lowerLink.includes(k))) score += 2;
      if (lowerLink.includes('token') || lowerLink.includes('id=')) score += 1;
      return { link, score };
    });

    scoredLinks.sort((a, b) => b.score - a.score);
    return scoredLinks[0].link;
  };

  const processedHtml = useMemo(() => {
    const rawHtml = (email?.html && email.html.length > 0) ? email.html[0] : '';
    return processHtmlContent(rawHtml);
  }, [email]);

  const primaryLink = useMemo(() => {
    if (!email) return null;
    const rawHtml = (email.html && email.html.length > 0) ? email.html[0] : '';
    return extractPrimaryLink(rawHtml, email.text || '');
  }, [email]);

  const linkifyText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-red-400 hover:underline break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6">
        <div className="relative">
           <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-red-500 animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-8 h-8 rounded-full bg-red-500/20 blur-md"></div>
           </div>
        </div>
        <div className="text-sm text-gray-400 font-mono tracking-widest animate-pulse">DECRYPTING...</div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="h-full hidden md:flex flex-col items-center justify-center p-12 text-center opacity-40">
        <div className="w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-3xl flex items-center justify-center mb-6 border border-white/5 transform rotate-12">
           <FileText className="w-10 h-10 text-gray-400 transform -rotate-12" />
        </div>
        <h3 className="text-xl font-bold text-gray-300 tracking-wide">SECURE TERMINAL</h3>
        <p className="text-sm mt-2 text-gray-500 font-mono">Select a transmission to decrypt contents.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black/20">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-white/[0.02]">
        
        {/* Mobile Nav */}
        <div className="md:hidden flex items-center mb-4">
           <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
             <ArrowLeft className="w-5 h-5" />
             <span className="font-bold text-sm">BACK</span>
           </button>
        </div>

        <div className="flex items-start justify-between gap-4">
           <h2 className="text-xl md:text-2xl font-bold text-white leading-tight flex-grow drop-shadow-md">{email.subject}</h2>
        </div>

        <div className="flex items-center justify-between text-sm mt-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-orange-700 flex items-center justify-center font-bold text-white text-lg shrink-0 shadow-lg shadow-red-900/30">
              {email.from.address.substring(0, 1).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-gray-200 font-bold truncate w-full text-base">{email.from.name || email.from.address}</span>
              <span className="text-gray-500 text-xs font-mono">{email.from.address}</span>
            </div>
          </div>
          <span className="text-gray-500 text-xs font-mono border border-white/10 px-2 py-1 rounded-md">
            {new Date(email.createdAt).toLocaleDateString()} <span className="text-gray-700">|</span> {new Date(email.createdAt).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* QUICK ACTION: Primary Verification Link */}
      {primaryLink && (
        <div className="px-6 py-4 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-400 animate-pulse">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-200">Action Required</h4>
              <p className="text-[11px] text-red-400/70 uppercase tracking-wider font-bold">Verification Link Detected</p>
            </div>
          </div>
          <a 
            href={primaryLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-500/20 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
          >
            <span>Open Link</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Content Controls */}
      <div className="px-6 py-2 flex items-center gap-2 border-b border-white/5 bg-black/20">
         <button 
           onClick={() => setTab('html')}
           className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${tab === 'html' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
         >
           <Globe className="w-3 h-3" /> HTML View
         </button>
         <button 
           onClick={() => setTab('text')}
           className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${tab === 'text' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
         >
           <Code className="w-3 h-3" /> Raw Text
         </button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-auto bg-white p-8 relative min-h-[300px]">
         <div className="text-gray-900">
           {tab === 'html' ? (
             <div 
               className="prose max-w-none text-sm break-words"
               dangerouslySetInnerHTML={{ __html: processedHtml || linkifyText(email.text || '') }}
             />
           ) : (
             <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
               {linkifyText(email.text || email.intro)}
             </pre>
           )}
         </div>
      </div>

      {/* Attachments Footer */}
      {email.hasAttachments && email.attachments && email.attachments.length > 0 && (
        <div className="p-6 bg-black/40 border-t border-white/5 backdrop-blur-md">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
             <Download className="w-4 h-4" /> 
             Attachments ({email.attachments.length})
          </h4>
          <div className="flex flex-wrap gap-3">
            {email.attachments.map((att) => (
              <a 
                key={att.id} 
                href={att.downloadUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                <div className="p-2 bg-black/50 rounded-lg">
                  <FileText className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                </div>
                <div className="flex flex-col">
                   <span className="truncate max-w-[150px] text-xs font-bold text-white">{att.filename}</span>
                   <span className="text-[10px] text-gray-500 font-mono">{(att.size / 1024).toFixed(1)} KB</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailViewer;
