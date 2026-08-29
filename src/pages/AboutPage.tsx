import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Shield, Zap, Lock, Globe, Code2, ArrowLeft, Heart, CheckCircle2 } from 'lucide-react';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Language } from '../translations';

interface AboutPageProps {
  lang: Language;
}

export const AboutPage: React.FC<AboutPageProps> = ({ lang }) => {
  const isTr = lang === 'tr';

  return (
    <div className="min-h-screen bg-[#06070B] text-slate-200 flex flex-col selection:bg-red-500/30 selection:text-white">
      <SEOHead
        title={isTr ? "Hakkımızda — MephistoMail | Misyonumuz ve Mimarimiz" : "About Us — MephistoMail | Our Mission & Architecture"}
        description={isTr
          ? "MephistoMail hakkında: 2026 sıfır kayıt (zero-log) geçici e-posta servisi, kurucu hikayesi, güvenlik mimarimiz ve vizyonumuz."
          : "About MephistoMail: Zero-log disposable email service, architecture, team, and privacy mission."}
        canonicalUrl="https://mephistomail.site/about"
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

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/20">
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {isTr ? "MephistoMail Hakkında" : "About MephistoMail"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isTr ? "Gizliliğinizi Koruyan Yeni Nesil Geçici E-posta Servisi" : "Next-Generation Disposable Email Shield"}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 text-sm sm:text-base leading-relaxed text-slate-300">
          
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-400" />
              {isTr ? "Misyonumuz" : "Our Mission"}
            </h2>
            <p>
              {isTr
                ? "MephistoMail, internet kullanıcılarını spam saldırılarından, veri sızıntılarından ve agresif reklam takipçilerinden korumak amacıyla geliştirilmiştir. Kullanıcılarımızın ana e-posta adreslerini paylaşmak zorunda kalmadan güvenle internette gezinmelerini, ücretsiz denemelere kaydolmalarını ve OTP doğrulama kodlarını 1 saniyede almalarını sağlıyoruz."
                : "MephistoMail was engineered to protect internet users from spam surges, data breaches, and aggressive ad trackers. We empower individuals to browse securely, claim free trials, and receive verification OTP codes within 1 second without exposing their permanent personal email inboxes."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-400" />
              {isTr ? "Teknolojik Mimarimiz" : "Our Architectural Pillars"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1.5">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {isTr ? "RAM-Only (Sıfır Disk)" : "RAM-Only Storage"}
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  {isTr
                    ? "Gelen mailler diske kaydedilmez. Yalnızca uçucu RAM belleğinde tutulur ve oturum bittiğinde kalıcı olarak yok edilir."
                    : "Incoming emails are never written to disk. They live only in volatile RAM and vanish permanently upon expiration."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1.5">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  {isTr ? "Hızlı Otomatik Senkronizasyon" : "Rapid Real-time Inbox Sync"}
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  {isTr
                    ? "Sayfayı yenilemenize gerek kalmadan OTP kodları ve mailler anında ekranınıza düşer."
                    : "Zero page reloads required. Inbound messages and OTP codes arrive instantly via fast automated inbox synchronization."}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-800 pt-6">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-red-400" />
              {isTr ? "Geliştirici & İletişim" : "Developer & Contact"}
            </h2>
            <p className="text-xs sm:text-sm">
              {isTr
                ? "MephistoMail bağımsız bir açık kaynak gizlilik projesi olarak Mert Can Yıldız tarafından geliştirilmektedir. Destek, iş birliği ve bildirimleriniz için:"
                : "MephistoMail is maintained as an independent privacy project by Mert Can Yildiz. For support and inquiries:"}
            </p>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1 text-xs sm:text-sm">
              <p><strong>{isTr ? "Kurucu / Geliştirici:" : "Creator / Lead Developer:"}</strong> Mert Can Yıldız</p>
              <p><strong>{isTr ? "E-posta:" : "Email:"}</strong> <a href="mailto:jokallame0@gmail.com" className="text-red-400 hover:underline">jokallame0@gmail.com</a></p>
              <p><strong>{isTr ? "Chrome Eklentisi:" : "Chrome Extension:"}</strong> <a href="https://chromewebstore.google.com/detail/mephistomail/kolhhealinebomlncflljopkphaoilob" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">Chrome Web Store Listing</a></p>
            </div>
          </section>

        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
};

export default AboutPage;
