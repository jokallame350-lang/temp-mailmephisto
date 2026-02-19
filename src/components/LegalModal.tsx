import React from 'react';
import { X, ShieldAlert, FileText } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms';
  lang: string;
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ type, lang, onClose }) => {
  const content = {
    privacy: {
      title: lang === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy',
      icon: <ShieldAlert className="w-6 h-6 text-red-500" />,
      text: lang === 'tr' 
        ? "Mephisto Mail, gizliliğinizi %100 koruma altına alır. Hiçbir veriniz kayıt altına alınmaz ve üçüncü taraflarla paylaşılmaz."
        : "Mephisto Mail ensures 100% privacy. No personal data is stored or shared with third parties."
    },
    terms: {
      title: lang === 'tr' ? 'Kullanım Koşulları' : 'Terms of Service',
      icon: <FileText className="w-6 h-6 text-red-500" />,
      text: lang === 'tr'
        ? "Servisimiz sadece yasal amaçlar için kullanılmalıdır. Spam gönderimi ve kötüye kullanım yasaktır."
        : "Our service must be used for legal purposes only. Spamming and misuse are strictly prohibited."
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-[#0f0f12] border border-white/10 rounded-[32px] p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-all">
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
            {content[type].icon}
          </div>
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">
            {content[type].title}
          </h2>
        </div>

        <div className="text-slate-400 text-sm leading-relaxed max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <p className="mb-4">{content[type].text}</p>
          <p className="opacity-50 text-[12px]">Last updated: 2025-12-24</p>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
        >
          {lang === 'tr' ? 'ANLADIM' : 'I UNDERSTAND'}
        </button>
      </div>
    </div>
  );
};

export default LegalModal;