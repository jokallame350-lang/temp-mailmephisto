import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { translations, Language } from '../translations';
import LegalModal from './LegalModal';
import { Mail, Shield, Clock, Wrench, BookOpen, HelpCircle, FileText, Scale, ExternalLink, Code2, MessageSquare } from 'lucide-react';

interface FooterProps {
  lang: Language;
}

const Footer: React.FC<FooterProps> = ({ lang }) => {
  const t = translations[lang];
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 px-6 bg-black/30 border-t border-white/5 mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                <Mail size={14} className="text-white" />
              </div>
              <span className="text-white font-bold text-sm tracking-tight">MephistoMail</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed mb-3">
              {lang === 'tr'
                ? 'Ücretsiz geçici mail servisi. Anonim, güvenli ve hızlı kullan-at e-posta adresleri.'
                : 'Free temporary email service. Anonymous, secure, and fast disposable email addresses.'}
            </p>
            <div className="flex items-center gap-1 text-slate-500 text-[10px]">
              <Shield size={10} />
              <span>{lang === 'tr' ? 'Sıfır Kayıt Politikası' : 'Zero Logging Policy'}</span>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-slate-300 text-[11px] font-bold uppercase tracking-wider mb-3">
              {lang === 'tr' ? 'Özellikler' : 'Features'}
            </h4>
            <nav aria-label={lang === 'tr' ? 'Özellik bağlantıları' : 'Feature links'}>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <Mail size={10} />
                    {lang === 'tr' ? 'Geçici Mail' : 'Temp Mail'}
                  </Link>
                </li>
                <li>
                  <Link to="/10minutemail" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <Clock size={10} />
                    10 {lang === 'tr' ? 'Dakikalık Mail' : 'Minute Mail'}
                  </Link>
                </li>
                <li>
                  <Link to="/tools" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <Wrench size={10} />
                    {lang === 'tr' ? 'Güvenlik Araçları' : 'Security Tools'}
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <Shield size={10} />
                    {lang === 'tr' ? 'Şifre Oluşturucu' : 'Password Generator'}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-slate-300 text-[11px] font-bold uppercase tracking-wider mb-3">
              {lang === 'tr' ? 'Kaynaklar' : 'Resources'}
            </h4>
            <nav aria-label={lang === 'tr' ? 'Kaynak bağlantıları' : 'Resource links'}>
              <ul className="space-y-2">
                <li>
                  <Link to="/blog" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <BookOpen size={10} />
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/help" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <HelpCircle size={10} />
                    {lang === 'tr' ? 'Yardım Merkezi' : 'Help Center'}
                  </Link>
                </li>
                <li>
                  <Link to="/help" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <HelpCircle size={10} />
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <MessageSquare size={10} />
                    {lang === 'tr' ? 'İletişim' : 'Contact'}
                  </Link>
                </li>
                <li>
                  <Link to="/api-docs" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <Code2 size={10} />
                    API
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-slate-300 text-[11px] font-bold uppercase tracking-wider mb-3">
              {lang === 'tr' ? 'Yasal' : 'Legal'}
            </h4>
            <nav aria-label={lang === 'tr' ? 'Yasal bağlantılar' : 'Legal links'}>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setModalType('privacy')}
                    className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5"
                  >
                    <FileText size={10} />
                    {t.footerPrivacy}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setModalType('terms')}
                    className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5"
                  >
                    <Scale size={10} />
                    {t.footerTerms}
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* SEO Keyword Links */}
        <div className="border-t border-white/5 pt-6 mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              'Temp Mail', 'Disposable Email', 'Geçici Mail', 'Kullan At Mail',
              '10 Minute Mail', 'Fake Mail', 'Throwaway Email', 'Sahte Mail',
              'Temporary Email', 'Burner Email', 'Anonymous Email', 'Anonim Mail',
              'Free Temp Mail', 'Ücretsiz Geçici Mail', 'Spam Protection', 'OTP Email',
            ].map((keyword) => (
              <Link
                key={keyword}
                to="/"
                className="text-slate-600 text-[9px] hover:text-red-400/60 transition-colors"
                title={keyword}
              >
                {keyword}
              </Link>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-slate-600 text-[10px] font-medium">
            © {currentYear} MephistoMail. {t.footerRights}
          </p>
          <p className="text-slate-700 text-[9px]">
            {lang === 'tr'
              ? 'Gizliliğiniz için tasarlandı — RAM-only mimari ile sıfır iz garantisi.'
              : 'Designed for your privacy — zero trace guarantee with RAM-only architecture.'}
          </p>
        </div>
      </div>

      {/* MODAL */}
      {modalType && (
        <LegalModal
          type={modalType}
          lang={lang === 'tr' ? 'tr' : 'en'}
          onClose={() => setModalType(null)}
        />
      )}
    </footer>
  );
};

export default Footer;