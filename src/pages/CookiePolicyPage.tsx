import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ArrowLeft, Mail } from 'lucide-react';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Language } from '../translations';

interface CookiePolicyPageProps {
  lang: Language;
}

export const CookiePolicyPage: React.FC<CookiePolicyPageProps> = ({ lang }) => {
  const isTr = lang === 'tr';

  return (
    <div className="min-h-screen bg-[#06070B] text-slate-200 flex flex-col selection:bg-red-500/30 selection:text-white">
      <SEOHead
        title={isTr ? "Çerez Politikası — MephistoMail" : "Cookie Policy — MephistoMail"}
        description={isTr
          ? "MephistoMail çerez politikası: Birinci taraf zorunlu çerezler, Google AdSense reklam çerezleri ve çerez yönetimi rehberi."
          : "MephistoMail cookie policy: First-party essential cookies, Google AdSense advertising cookies, and cookie management guide."}
        canonicalUrl="https://mephistomail.site/cookies"
        lang={lang}
      />

            {/* Top Navbar */}
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white font-bold tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
              <Mail size={16} className="text-white" />
            </div>
            <span>MephistoMail</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              {lang === 'tr' ? 'Geçici Mail Oluştur' : 'Generate Temp Mail'}
            </Link>
            <Link to="/tools" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors hidden sm:block">
              {lang === 'tr' ? 'Araçlar' : 'Tools'}
            </Link>
            <Link to="/blog" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors hidden sm:block">
              Blog
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {isTr ? "Ana Sayfaya Dön" : "Back to Home"}
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Cookie className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {isTr ? "Çerez Politikası" : "Cookie Policy"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isTr ? "Son Güncelleme: 24 Ağustos 2026 • Versiyon 2.0" : "Last Updated: August 24, 2026 • Version 2.0"}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 text-sm sm:text-base leading-relaxed text-slate-300">
          
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {isTr ? "1. Çerezler (Cookies) Nedir?" : "1. What Are Cookies?"}
            </h2>
            <p>
              {isTr
                ? "Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınız tarafından cihazınızda saklanan küçük metin dosyalarıdır. Web sitelerinin verimli çalışmasını, tercihlerin hatırlanmasını ve analiz yapılmasını sağlarlar."
                : "Cookies are small text files stored on your device by your browser when you visit a website. They help websites function efficiently, remember preferences, and provide analytics."}
            </p>
          </section>

          <section className="space-y-3 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <h2 className="text-lg sm:text-xl font-bold text-amber-300">
              {isTr ? "2. Google AdSense ve Üçüncü Taraf Reklam Çerezleri" : "2. Google AdSense & Third-Party Advertising Cookies"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              {isTr
                ? "Sitemizde reklam yayını için Google AdSense kullanılmaktadır. Google, kullanıcıların sitemizi ve internetteki diğer siteleri ziyaretlerine göre kişiselleştirilmiş reklamlar sunmak üzere çerezlerden faydalanır."
                : "Our site uses Google AdSense for serving advertisements. Google uses cookies to serve personalized ads based on visits to our website and other websites across the web."}
            </p>
            <p className="text-xs sm:text-sm text-slate-300">
              {isTr ? "Kullanıcılar, istedikleri zaman " : "Users can opt out of personalized ads at any time via "}
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-semibold">
                Google Ads Settings
              </a>
              {isTr ? " veya " : " or "}
              <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-semibold">
                aboutads.info
              </a>
              {isTr ? " üzerinden reklam çerezlerini kapatabilirler." : "."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {isTr ? "3. Çerezleri Nasıl Yönetebilirsiniz?" : "3. How to Manage Cookies"}
            </h2>
            <p>
              {isTr
                ? "Tarayıcınızın ayarları üzerinden tüm çerezleri engelleyebilir veya mevcut çerezleri silebilirsiniz. Ancak zorunlu çerezleri kapatmanız durumunda geçici e-posta oturumunuzun düzgün çalışmayabileceğini unutmayın."
                : "You can block or delete cookies through your browser settings. Note that disabling essential cookies may impact mailbox session persistence."}
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-800 pt-6">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-400" />
              {isTr ? "4. Sorularınız İçin" : "4. Contact Us"}
            </h2>
            <p className="text-xs sm:text-sm">
              {isTr
                ? "Çerez politikamız hakkında detaylı bilgi için jokallame0@gmail.com ile iletişime geçebilirsiniz."
                : "For questions regarding our cookie practices, reach us at jokallame0@gmail.com."}
            </p>
          </section>

        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
};

export default CookiePolicyPage;
