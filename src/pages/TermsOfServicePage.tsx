import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, CheckCircle2, AlertTriangle, ArrowLeft, Mail, FileText } from 'lucide-react';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Language } from '../translations';

interface TermsOfServicePageProps {
  lang: Language;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ lang }) => {
  const isTr = lang === 'tr';

  return (
    <div className="min-h-screen bg-[#06070B] text-slate-200 flex flex-col selection:bg-red-500/30 selection:text-white">
      <SEOHead
        title={isTr ? "Kullanım Koşulları — MephistoMail" : "Terms of Service — MephistoMail"}
        description={isTr
          ? "MephistoMail hizmet kullanım koşulları: Yasal sınırlamalar, adil kullanım şartları ve hizmet şartları kuralları."
          : "MephistoMail terms of service: Permitted usage, acceptable use policy, warranties, and platform rules."}
        canonicalUrl="https://mephistomail.site/terms"
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
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Scale className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {isTr ? "Kullanım Koşulları" : "Terms of Service"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isTr ? "Son Güncelleme: 24 Ağustos 2026 • Versiyon 2.1" : "Last Updated: August 24, 2026 • Version 2.1"}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 text-sm sm:text-base leading-relaxed text-slate-300">
          
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {isTr ? "1. Koşulların Kabulü" : "1. Acceptance of Terms"}
            </h2>
            <p>
              {isTr
                ? "MephistoMail hizmetlerine (web sitesi, API ve Chrome uzantısı) erişerek veya kullanarak, bu Kullanım Koşullarına ve Gizlilik Politikamıza bağlı kalmayı kabul etmiş olursunuz. Bu şartları kabul etmiyorsanız servisimizi kullanmamanız gerekmektedir."
                : "By accessing or using MephistoMail (including the website, API, and Chrome extension), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use the service."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {isTr ? "2. Kabul Edilebilir Kullanım ve Yasaklar" : "2. Acceptable Use & Prohibited Activities"}
            </h2>
            <p>
              {isTr
                ? "MephistoMail yalnızca kişisel gizlilik koruması, test ve yasal amaçlar için kullanılabilir. Aşağıdaki eylemler kesinlikle yasaktır:"
                : "MephistoMail is intended exclusively for personal privacy defense, software testing, and lawful purposes. The following actions are strictly prohibited:"}
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2">
              <li>{isTr ? "Spam, toplu e-posta veya dolandırıcılık faaliyetlerinde bulunmak." : "Engaging in spamming, mass-mailing, or fraudulent operations."}</li>
              <li>{isTr ? "Yasa dışı materyallerin iletimi veya dağıtımı." : "Transmitting or distributing illegal materials."}</li>
              <li>{isTr ? "Servis sunucularına DoS/DDoS saldırıları düzenlemek veya aşırı yük bindirmek." : "Launching DoS/DDoS attacks or intentionally overloading the infrastructure."}</li>
              <li>{isTr ? "Başkalarının hesaplarına yetkisiz erişim sağlamaya çalışmak." : "Attempting unauthorized access to systems or accounts."}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {isTr ? "3. Hizmet Garantisi ve Sorumluluk Reddi" : "3. Disclaimer of Warranties"}
            </h2>
            <p>
              {isTr
                ? "Hizmetimiz 'olduğu gibi' (AS IS) ve 'mevcut olduğu şekilde' (AS AVAILABLE) sunulmaktadır. MephistoMail, geçici e-postaların belirli bir süre boyunca saklanacağını garanti etmez. Kritik bankacılık veya resmi işlemleriniz için kalıcı kişisel e-posta adreslerinizi kullanmanız önerilir."
                : "The service is provided 'AS IS' and 'AS AVAILABLE' without warranties of any kind. MephistoMail does not guarantee indefinite retention of temporary emails. For critical financial or government services, permanent email accounts should always be used."}
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-800 pt-6">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-orange-400" />
              {isTr ? "4. İletişim" : "4. Contact Us"}
            </h2>
            <p className="text-xs sm:text-sm">
              {isTr
                ? "Kullanım şartları hakkında sorularınız için jokallame0@gmail.com adresine yazabilirsiniz."
                : "For inquiries regarding our terms, please contact us at jokallame0@gmail.com."}
            </p>
          </section>

        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
};

export default TermsOfServicePage;
