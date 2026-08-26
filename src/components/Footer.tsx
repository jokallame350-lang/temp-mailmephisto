import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { translations, Language } from '../translations';
import LegalModal from './LegalModal';
import { Mail, Shield, Clock, Wrench, BookOpen, HelpCircle, FileText, Scale, Code2, MessageSquare, Github, Twitter, Heart, Send, CheckCircle, Zap, Download } from 'lucide-react';

interface FooterProps {
  lang: Language;
}

const Footer: React.FC<FooterProps> = ({ lang }) => {
  const t = translations[lang];
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubmitted(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSubmitted(false), 4000);
    }
  };

  return (
    <footer className="py-8 sm:py-12 px-4 sm:px-6 bg-black/30 border-t border-white/5 mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto">

        {/* Newsletter Section */}
        <div className="border-b border-white/5 pb-8 sm:pb-10 mb-8 sm:mb-10">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">
              {lang === 'tr' ? '📬 Gizlilik Bültenimize Abone Olun' : '📬 Subscribe to Our Privacy Newsletter'}
            </h3>
            <p className="text-slate-500 text-xs mb-5">
              {lang === 'tr'
                ? 'Gizlilik ipuçları, güvenlik haberleri ve MephistoMail güncellemeleri hakkında aylık bülten.'
                : 'Monthly newsletter with privacy tips, security news, and MephistoMail updates.'}
            </p>
            {newsletterSubmitted ? (
              <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-medium animate-pulse">
                <CheckCircle size={16} />
                {lang === 'tr' ? 'Teşekkürler! Abone oldunuz.' : 'Thanks! You\'re subscribed.'}
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder={lang === 'tr' ? 'E-posta adresiniz' : 'Your email address'}
                  className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm sm:text-xs placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 transition-colors"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5"
                >
                  <Send size={12} />
                  {lang === 'tr' ? 'Abone Ol' : 'Subscribe'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-10">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                <Mail size={14} className="text-white" />
              </div>
              <span className="text-white font-bold text-sm tracking-tight">MephistoMail</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed mb-4">
              {lang === 'tr'
                ? 'Ücretsiz geçici mail servisi. Anonim, güvenli ve hızlı kullan-at e-posta adresleri.'
                : 'Free temporary email service. Anonymous, secure, and fast disposable email addresses.'}
            </p>
            <div className="flex items-center gap-1 text-slate-500 text-[10px] mb-4">
              <Shield size={10} />
              <span>{lang === 'tr' ? 'Sıfır Kayıt Politikası' : 'Zero Logging Policy'}</span>
            </div>
            {/* Social Links */}
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/jokallame350-lang/temp-mailmephisto"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-500 hover:text-white hover:border-white/20 transition-all"
                aria-label="GitHub"
              >
                <Github size={14} />
              </a>

              <a
                href="https://www.producthunt.com/products/mephistomail"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-500 hover:text-orange-400 hover:border-orange-500/20 transition-all"
                aria-label="Product Hunt"
              >
                <Heart size={14} />
              </a>

              <a
                href="https://chromewebstore.google.com/detail/mephistomail/kolhhealinebomlncflljopkphaoilob"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-500 hover:text-orange-400 hover:border-orange-500/20 transition-all"
                aria-label="Chrome Web Store"
                title={lang === 'tr' ? 'Chrome Web Store\'da mevcuttur' : 'Available on Chrome Web Store'}
              >
                <Download size={14} />
              </a>
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
                  <Link to="/services" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <Zap size={10} />
                    {lang === 'tr' ? 'Servis Kataloğu' : 'Services Catalog'}
                  </Link>
                </li>
                <li>
                  <Link to="/disposable-checker" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <Shield size={10} />
                    {lang === 'tr' ? 'E-posta Denetleyici' : 'Email Checker'}
                  </Link>
                </li>
                <li>
                  <Link to="/breach-checker" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <Shield size={10} />
                    {lang === 'tr' ? 'Sızıntı Kontrolü' : 'Breach Checker'}
                  </Link>
                </li>
                <li>
                  <Link to="/test-card-generator" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <Zap size={10} />
                    {lang === 'tr' ? 'Test Kartı Üretici' : 'Test Card Generator'}
                  </Link>
                </li>
                <li>
                  <Link to="/password-generator" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <Zap size={10} />
                    {lang === 'tr' ? 'Güçlü Şifre Üretici' : 'Password Generator'}
                  </Link>
                </li>
                <li>
                  <a
                    href="https://chromewebstore.google.com/detail/mephistomail/kolhhealinebomlncflljopkphaoilob"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 text-[11px] hover:text-orange-400 transition-colors flex items-center gap-1.5"
                  >
                    <Download size={10} />
                    {lang === 'tr' ? 'Chrome Eklentisi' : 'Chrome Extension'}
                  </a>
                </li>
                <li>
                  <a
                    href="https://mephistoshares.online"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 text-[11px] hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                  >
                    <Shield size={10} />
                    {lang === 'tr' ? 'MephistoVault (P2P Dosya Transfer)' : 'MephistoVault (P2P File Transfer)'}
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Use Cases (Kullanım Alanları) */}
          <div>
            <h4 className="text-slate-300 text-[11px] font-bold uppercase tracking-wider mb-3">
              {lang === 'tr' ? 'Kullanım Alanları' : 'Use Cases'}
            </h4>
            <nav aria-label={lang === 'tr' ? 'Kullanım alanı bağlantıları' : 'Use case links'}>
              <ul className="space-y-1.5">
                <li>
                  <Link to="/temp-mail-for-discounts" className="text-slate-500 text-[11px] hover:text-orange-400 transition-colors">
                    🎟️ {lang === 'tr' ? 'İndirim Kuponları' : 'Discount Codes'}
                  </Link>
                </li>
                <li>
                  <Link to="/temp-mail-for-free-trials" className="text-slate-500 text-[11px] hover:text-orange-400 transition-colors">
                    🎬 {lang === 'tr' ? 'Ücretsiz Deneme (Trial)' : 'Free Trial SaaS'}
                  </Link>
                </li>
                <li>
                  <Link to="/temp-mail-for-wifi-login" className="text-slate-500 text-[11px] hover:text-orange-400 transition-colors">
                    🌐 {lang === 'tr' ? 'Wi-Fi Giriş Kalkanı' : 'Public Wi-Fi Login'}
                  </Link>
                </li>
                <li>
                  <Link to="/temp-mail-for-downloads" className="text-slate-500 text-[11px] hover:text-orange-400 transition-colors">
                    📚 {lang === 'tr' ? 'PDF & E-Kitap İndirme' : 'Free PDF Downloads'}
                  </Link>
                </li>
                <li>
                  <Link to="/temp-mail-for-gaming" className="text-slate-500 text-[11px] hover:text-orange-400 transition-colors">
                    🎮 {lang === 'tr' ? 'Oyun & Yan Hesaplar' : 'Gaming Alt Accounts'}
                  </Link>
                </li>
                <li>
                  <Link to="/temp-mail-for-qa-testing" className="text-slate-500 text-[11px] hover:text-orange-400 transition-colors">
                    🧪 {lang === 'tr' ? 'Yazılım Testi & QA' : 'QA & Dev Automation'}
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
              </ul>
            </nav>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-slate-300 text-[11px] font-bold uppercase tracking-wider mb-3">
              {lang === 'tr' ? 'Şirket' : 'Company'}
            </h4>
            <nav aria-label={lang === 'tr' ? 'Şirket bağlantıları' : 'Company links'}>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <Shield size={10} />
                    {lang === 'tr' ? 'Hakkımızda' : 'About Us'}
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
                    API {lang === 'tr' ? 'Dokümantasyon' : 'Documentation'}
                  </Link>
                </li>
                <li>
                  <a href="https://github.com/jokallame350-lang/temp-mailmephisto" target="_blank" rel="noopener noreferrer" className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <Github size={10} />
                    GitHub
                  </a>
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
                  <Link
                    to="/privacy"
                    className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5"
                  >
                    <FileText size={10} />
                    {t.footerPrivacy}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5"
                  >
                    <Scale size={10} />
                    {t.footerTerms}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cookies"
                    className="text-slate-500 text-[11px] hover:text-red-400 transition-colors flex items-center gap-1.5"
                  >
                    <FileText size={10} />
                    {lang === 'tr' ? 'Çerez Politikası' : 'Cookie Policy'}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* SEO Keyword Links */}
        <div className="border-t border-white/5 pt-6 mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: 'Temp Mail', path: '/' },
              { label: 'Disposable Email', path: '/' },
              { label: 'Geçici Mail', path: '/' },
              { label: 'Kullan At Mail', path: '/' },
              { label: '10 Minute Mail', path: '/10minutemail' },
              { label: 'Fake Mail', path: '/tools' },
              { label: 'Throwaway Email', path: '/tools' },
              { label: 'Sahte Mail', path: '/tools' },
              { label: 'Temporary Email', path: '/services' },
              { label: 'Burner Email', path: '/services' },
              { label: 'Anonymous Email', path: '/services' },
              { label: 'Anonim Mail', path: '/services' },
              { label: 'Free Temp Mail', path: '/kullanim-alanlari' },
              { label: 'Ücretsiz Geçici Mail', path: '/kullanim-alanlari' },
              { label: 'Spam Protection', path: '/temp-mail-for-spam-protection' },
              { label: 'OTP Email', path: '/temp-mail-for-qa-testing' },
            ].map((kw) => (
              <Link
                key={kw.label}
                to={kw.path}
                className="text-slate-600 text-[9px] hover:text-red-400/60 transition-colors"
                title={kw.label}
              >
                {kw.label}
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