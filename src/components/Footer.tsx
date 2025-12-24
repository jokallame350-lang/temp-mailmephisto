import React, { useState } from 'react';
import LegalModal from './LegalModal'; // Yasal metin modalı

interface FooterProps {
  lang: string;
}

const Footer: React.FC<FooterProps> = ({ lang }) => {
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 px-6 bg-transparent border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Telif Hakkı Yazısı */}
        <p className="text-slate-500 text-[11px] font-medium tracking-tight">
          © {currentYear} Mephisto Mail. All Rights Reserved.
        </p>

        {/* Tıklanabilir Yasal Bağlantılar */}
        <div className="flex items-center gap-4 text-slate-500 text-[11px] font-medium">
          <button 
            onClick={() => setModalType('privacy')}
            className="hover:text-red-500 transition-colors duration-200"
          >
            {lang === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}
          </button>
          <span className="opacity-20">•</span>
          <button 
            onClick={() => setModalType('terms')}
            className="hover:text-red-500 transition-colors duration-200"
          >
            {lang === 'tr' ? 'Kullanım Koşulları' : 'Terms of Service'}
          </button>
        </div>
      </div>

      {/* Yasal Metin Modalı */}
      {modalType && (
        <LegalModal 
          type={modalType} 
          lang={lang} 
          onClose={() => setModalType(null)} 
        />
      )}
    </footer>
  );
};

export default Footer;