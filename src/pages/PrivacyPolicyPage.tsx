import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, CheckCircle2, ArrowLeft, Mail, Globe, Cookie } from 'lucide-react';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Language } from '../translations';

interface PrivacyPolicyPageProps {
  lang: Language;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ lang }) => {
  const isTr = lang === 'tr';

  return (
    <div className="min-h-screen bg-[#06070B] text-slate-200 flex flex-col selection:bg-red-500/30 selection:text-white">
      <SEOHead
        title={isTr ? "Gizlilik Politikası — MephistoMail | %100 Anonim Geçici E-posta" : "Privacy Policy — MephistoMail | 100% Anonymous Temp Mail"}
        description={isTr
          ? "MephistoMail gizlilik politikası: RAM üzerinde çalışan sıfır kayıt (zero-log) mimarisi, Google AdSense çerez uyumluluğu ve veri güvenliği ilkelerimiz."
          : "MephistoMail privacy policy: Zero-log RAM architecture, Google AdSense cookie compliance, GDPR/CCPA alignment, and complete anonymous data security."}
        canonicalUrl="https://mephistomail.site/privacy"
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
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {isTr ? "Gizlilik Politikası" : "Privacy Policy"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isTr ? "Son Güncelleme: 24 Ağustos 2026 • Versiyon 2.4 (GDPR & AdSense Uyumlu)" : "Last Updated: August 24, 2026 • Version 2.4 (GDPR & AdSense Compliant)"}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 text-sm sm:text-base leading-relaxed text-slate-300">
          
          {/* Section 1: Core Privacy Commitment */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-400" />
              {isTr ? "1. Temel Gizlilik Taahhüdümüz (Sıfır Günlük / Zero-Log)" : "1. Our Core Privacy Commitment (Zero-Log Architecture)"}
            </h2>
            <p>
              {isTr
                ? "MephistoMail (https://mephistomail.site), kullanıcı gizliliğini temel bir insan hakkı olarak kabul eder. Servisimiz Sıfır Kayıt (Zero-Log) prensibi ile tasarlanmıştır. Kalıcı disk depolaması yapmıyoruz; gelen e-postalar yalnızca geçici RAM (uçucu bellek) üzerinde işlenir ve oturumunuz bittiğinde ya da belirlenen süre dolduğunda geri döndürülemez şekilde silinir."
                : "MephistoMail (https://mephistomail.site) treats user privacy as a fundamental human right. Our service is built on a strict Zero-Log principle. We do not use persistent disk storage; incoming emails are processed solely in volatile RAM and permanently erased when your session ends or the countdown expires."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs">{isTr ? "Kayıt / Üyelik yok, şifre veya kimlik bilgisi istenmez." : "No sign-up or registration required; zero personal ID collection."}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs">{isTr ? "IP adresi veya tarayıcı geçmişi asla günlüklere yazılmaz." : "IP addresses and browsing histories are never recorded."}</span>
              </div>
            </div>
          </section>

          {/* Section 2: Google AdSense & Third-Party Advertising Cookies (MANDATORY FOR ADSENSE) */}
          <section className="space-y-3 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <h2 className="text-lg sm:text-xl font-bold text-amber-300 flex items-center gap-2">
              <Cookie className="w-5 h-5 text-amber-400" />
              {isTr ? "2. Google AdSense ve Reklam Çerezleri Politikası" : "2. Google AdSense & Advertising Cookies Disclosure"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              {isTr
                ? "Sitemizde sunucu ve altyapı giderlerimizi karşılamak amacıyla üçüncü taraf reklam sağlayıcısı olarak Google AdSense kullanılmaktadır. Google AdSense program politikaları gereği aşağıdaki maddeler ziyaretçilerimizin bilgisine sunulur:"
                : "Our website utilizes Google AdSense as a third-party advertising vendor to support server and operational costs. In accordance with Google AdSense program policies, the following disclosures apply to all visitors:"}
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-300 pl-2">
              <li>
                {isTr
                  ? "Google dahil olmak üzere üçüncü taraf satıcılar, kullanıcıların sitemize veya diğer web sitelerine daha önce yaptıkları ziyaretlere dayalı olarak reklam yayınlamak için çerezler (cookies) kullanır."
                  : "Third party vendors, including Google, use cookies to serve ads based on a user's prior visits to your website or other websites."}
              </li>
              <li>
                {isTr
                  ? "Google'ın reklam çerezlerini kullanması, kendisinin ve iş ortaklarının kullanıcılarımıza sitemize ve/veya İnternet'teki diğer sitelere yaptıkları ziyaretlere dayalı olarak reklamlar sunmasını sağlar."
                  : "Google's use of advertising cookies enables it and its partners to serve ads to your users based on their visit to your sites and/or other sites on the Internet."}
              </li>
              <li>
                {isTr ? "Kullanıcılar, " : "Users may opt out of personalized advertising by visiting "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline hover:text-amber-300 font-semibold"
                >
                  {isTr ? "Google Reklam Ayarları" : "Google Ads Settings"}
                </a>
                {isTr
                  ? " sayfasını ziyaret ederek kişiselleştirilmiş reklamcılık için çerez kullanımını devre dışı bırakabilirler. Alternatif olarak, kullanıcılar "
                  : ". Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting "}
                <a
                  href="https://www.aboutads.info"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline hover:text-amber-300 font-semibold"
                >
                  www.aboutads.info
                </a>
                {isTr ? " adresini kullanarak üçüncü taraf satıcıların çerezlerini devre dışı bırakabilir." : "."}
              </li>
            </ul>
          </section>

          {/* Section 3: Data We Collect (and Don't Collect) */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-red-400" />
              {isTr ? "3. Toplanan ve Toplanmayan Veriler" : "3. Information We Collect and Do Not Collect"}
            </h2>
            <div className="space-y-2">
              <p>
                <strong>{isTr ? "Toplanmayan Veriler:" : "Data We Never Collect:"}</strong>{" "}
                {isTr
                  ? "Gerçek adınız, fiziksel adresiniz, telefon numaranız, ödeme bilgileriniz veya kalıcı kimlik tanımlayıcılarınız asla istenmez ve saklanmaz."
                  : "Your real name, physical address, phone number, financial details, or permanent identifiers are never requested or stored."}
              </p>
              <p>
                <strong>{isTr ? "Yerel Tarayıcı Depolaması (Local Storage):" : "Local Browser Storage:"}</strong>{" "}
                {isTr
                  ? "Oluşturduğunuz geçici e-posta adresleri ve gelen kutusu kimlikleri yalnızca kendi tarayıcınızın local storage alanında tutulur. Tarayıcınızı temizlediğinizde bu veriler tamamen yok olur."
                  : "Your active temporary email addresses are stored only in your local browser's local storage. Clearing your browser data immediately removes all active references."}
              </p>
            </div>
          </section>

          {/* Section 4: GDPR & CCPA Compliance */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-red-400" />
              {isTr ? "4. KVKK, GDPR ve CCPA Hakları" : "4. GDPR, CCPA & International Data Rights"}
            </h2>
            <p>
              {isTr
                ? "Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR), Kaliforniya Tüketici Gizliliği Yasası (CCPA) ve Türkiye Cumhuriyeti Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca, kullanıcılarımızın kişisel veri güvenliğine tam uyum sağlamaktayız. Sistemimizde herhangi bir kişisel veri profili tutulmadığı için Unutulma Hakkı sistemin doğası gereği anlık olarak gerçekleşmektedir."
                : "In compliance with the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and international privacy frameworks, we uphold all data subject rights. Because we do not retain identifiable personal data, the right to erasure (Right to be Forgotten) is inherently satisfied upon mailbox expiration."}
            </p>
          </section>

          {/* Section 5: Contact Information */}
          <section className="space-y-3 border-t border-slate-800 pt-6">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-red-400" />
              {isTr ? "5. Gizlilik İletişim ve Destek" : "5. Privacy Inquiries & Contact"}
            </h2>
            <p>
              {isTr
                ? "Gizlilik politikamız veya veri güvenliği süreçlerimiz hakkında her türlü soru, geri bildirim veya talep için geliştirici ekibimizle doğrudan iletişime geçebilirsiniz:"
                : "For any questions, feedback, or concerns regarding our privacy practices, you can reach our engineering and data protection team directly:"}
            </p>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1 text-xs sm:text-sm">
              <p><strong>{isTr ? "Geliştirici / Veri Sorumlusu:" : "Developer / Data Controller:"}</strong> Mert Can Yıldız</p>
              <p><strong>{isTr ? "Resmi İletişim E-postası:" : "Official Contact Email:"}</strong> <a href="mailto:jokallame0@gmail.com" className="text-red-400 hover:underline">jokallame0@gmail.com</a></p>
              <p><strong>{isTr ? "Hizmet Web Sitesi:" : "Service Website:"}</strong> https://mephistomail.site</p>
            </div>
          </section>

        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
};

export default PrivacyPolicyPage;
