import React from 'react';
import { translations, Language } from '../translations';

interface FooterProps {
  lang: Language;
}

const Footer: React.FC<FooterProps> = ({ lang }) => {
  const t = translations[lang];
  return (
    <footer className="w-full py-6 text-center text-[10px] text-slate-400 dark:text-slate-600 border-t border-gray-200 dark:border-white/5 bg-slate-50 dark:bg-[#050505]">
      <p className="mb-2">&copy; {new Date().getFullYear()} Mephisto Mail. {t.footerRights}</p>
      <div className="flex justify-center gap-4">
        <a href="#" className="hover:text-red-500 transition-colors">{t.footerPrivacy}</a>
        <span>&bull;</span>
        <a href="#" className="hover:text-red-500 transition-colors">{t.footerTerms}</a>
      </div>
    </footer>
  );
};

export default Footer;