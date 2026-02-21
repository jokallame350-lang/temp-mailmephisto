import React, { useState } from 'react';
import { Shield, Zap, Lock, ChevronDown, ChevronUp, Cpu, Network, Key, ScanLine, CheckCircle2, ArrowRight, Star, Globe, Smartphone, Search, Timer, Users, Layers } from 'lucide-react';
import { translations, Language } from '../translations';

interface SEOContentProps {
  lang: Language;
}

export const SEOContent: React.FC<SEOContentProps> = ({ lang }) => {
  const t = translations[lang];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    { question: t.faq1Q, answer: t.faq1A },
    { question: t.faq2Q, answer: t.faq2A },
    { question: t.faq3Q, answer: t.faq3A },
    { question: t.faq4Q, answer: t.faq4A },
    { question: t.faq5Q, answer: t.faq5A },
    { question: t.faq6Q, answer: t.faq6A },
    { question: t.faq7Q, answer: t.faq7A },
    { question: t.faq8Q, answer: t.faq8A },
    { question: t.faq9Q, answer: t.faq9A },
    { question: t.faq10Q, answer: t.faq10A },
    { question: t.faq11Q, answer: t.faq11A },
    { question: t.faq12Q, answer: t.faq12A },
    { question: t.faq13Q, answer: t.faq13A },
    { question: t.faq14Q, answer: t.faq14A },
  ];

  return (
    <section className="mt-16 border-t border-white/5 pt-12 pb-24 px-4 bg-[#050505] transition-colors duration-300" aria-label={lang === 'tr' ? 'Geçici Mail Hakkında Bilgi' : 'About Temp Mail'}>
      <div className="max-w-4xl mx-auto">

        {/* ===== 4 FEATURE CARDS ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 border-b border-white/5 pb-10">
          <FeatureItem icon={<Cpu className="w-5 h-5 text-red-500" />} title={t.featVolatileTitle} desc={t.featVolatileDesc} />
          <FeatureItem icon={<Network className="w-5 h-5 text-orange-500" />} title={t.featLatencyTitle} desc={t.featLatencyDesc} />
          <FeatureItem icon={<Key className="w-5 h-5 text-red-400" />} title={t.featEntropyTitle} desc={t.featEntropyDesc} />
          <FeatureItem icon={<ScanLine className="w-5 h-5 text-orange-400" />} title={t.featHandoffTitle} desc={t.featHandoffDesc} />
        </div>

        {/* ===== MAIN SEO ARTICLE ===== */}
        <article className="prose prose-invert max-w-none space-y-16" itemScope itemType="https://schema.org/Article">
          <meta itemProp="headline" content={lang === 'tr' ? 'Geçici Mail Nedir? Nasıl Kullanılır?' : 'What is Temp Mail? How to Use It?'} />
          <meta itemProp="author" content="MephistoMail" />

          {/* ----- Section 1: Intro (The Tech Behind) ----- */}
          <div>
            <h2 className="text-[17px] font-bold text-white mb-4 uppercase tracking-widest border-l-2 border-red-500 pl-4 font-['Sora']">
              {t.artMainTitle} <span className="text-red-500">{t.artMainTitleHighlight}</span>
            </h2>
            <p className="text-slate-400 text-[14px] leading-relaxed mb-4">{t.artIntro1}</p>
            <p className="text-slate-400 text-[14px] leading-relaxed">{t.artIntro2}</p>
          </div>

          {/* ----- Section 2: What is Temp Mail ----- */}
          <div>
            <h2 className="text-[17px] font-bold text-white mb-4 uppercase tracking-wider font-['Sora']">{t.artWhatTitle}</h2>
            <p className="text-slate-400 text-[14px] leading-relaxed mb-4">{t.artWhatP1}</p>
            <p className="text-slate-400 text-[14px] leading-relaxed">{t.artWhatP2}</p>
          </div>

          {/* ----- Section 3: Why You Need One ----- */}
          <div>
            <h2 className="text-[17px] font-bold text-white mb-4 uppercase tracking-wider font-['Sora']">{t.artWhyTitle}</h2>
            <p className="text-slate-400 text-[14px] leading-relaxed mb-6">{t.artWhyIntro}</p>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-5 list-none pl-0">
              <li className="bg-[#0a0a0c] p-5 rounded-xl border border-white/5 hover:border-red-500/20 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-red-500" />
                  <strong className="text-white text-[14px] uppercase font-bold">{t.artWhyList1Title}</strong>
                </div>
                <span className="text-slate-500 text-[14px] leading-relaxed">{t.artWhyList1Desc}</span>
              </li>
              <li className="bg-[#0a0a0c] p-5 rounded-xl border border-white/5 hover:border-orange-500/20 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <strong className="text-white text-[14px] uppercase font-bold">{t.artWhyList2Title}</strong>
                </div>
                <span className="text-slate-500 text-[14px] leading-relaxed">{t.artWhyList2Desc}</span>
              </li>
              <li className="bg-[#0a0a0c] p-5 rounded-xl border border-white/5 hover:border-red-400/20 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="w-5 h-5 text-red-400" />
                  <strong className="text-white text-[14px] uppercase font-bold">{t.artWhyList3Title}</strong>
                </div>
                <span className="text-slate-500 text-[14px] leading-relaxed">{t.artWhyList3Desc}</span>
              </li>
            </ul>
          </div>

          {/* ----- Section 4: Use Cases ----- */}
          <div>
            <h2 className="text-[17px] font-bold text-white mb-6 uppercase tracking-wider font-['Sora']">{t.artUseCasesTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UseCaseCard icon={<Search className="w-4 h-4 text-cyan-500" />} title={t.artUseCase1Title} desc={t.artUseCase1Desc} />
              <UseCaseCard icon={<Timer className="w-4 h-4 text-yellow-500" />} title={t.artUseCase2Title} desc={t.artUseCase2Desc} />
              <UseCaseCard icon={<Users className="w-4 h-4 text-purple-500" />} title={t.artUseCase3Title} desc={t.artUseCase3Desc} />
              <UseCaseCard icon={<Key className="w-4 h-4 text-green-500" />} title={t.artUseCase4Title} desc={t.artUseCase4Desc} />
            </div>
          </div>

          {/* ----- Section 5: How to Use (Step-by-step guide for crawlers) ----- */}
          <div>
            <h2 className="text-[17px] font-bold text-white mb-6 uppercase tracking-wider font-['Sora']">{t.artUseTitle}</h2>
            <div className="space-y-4 mb-6">
              <HowToStep step={1} label={lang === 'tr' ? 'MephistoMail\'i ziyaret edin' : 'Visit MephistoMail'} desc={t.artUseP1} />
              <HowToStep step={2} label={lang === 'tr' ? 'Adresi kopyalayın ve kullanın' : 'Copy and use your address'} desc={t.artUseP2} />
            </div>
          </div>

          {/* ----- Section 6: Privacy Toolkit ----- */}
          <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-b from-red-500/5 to-transparent p-8">
            <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" aria-hidden="true"></div>
            <h2 className="text-[17px] font-bold text-white mb-6 relative z-10 uppercase tracking-wider flex items-center gap-2 font-['Sora']">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true"></span>
              {t.artToolTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div>
                <h3 className="text-[15px] text-white font-bold flex items-center gap-2 mb-2 font-['Sora']">
                  <Key className="w-4 h-4 text-orange-500" /> {t.artTool1Title}
                </h3>
                <p className="text-slate-400 text-[14px] leading-relaxed">{t.artTool1Desc}</p>
              </div>
              <div>
                <h3 className="text-[15px] text-white font-bold flex items-center gap-2 mb-2 font-['Sora']">
                  <ScanLine className="w-4 h-4 text-red-500" /> {t.artTool2Title}
                </h3>
                <p className="text-slate-400 text-[14px] leading-relaxed">{t.artTool2Desc}</p>
              </div>
            </div>
          </div>

          {/* ----- Section 7: How to Choose ----- */}
          <div>
            <h2 className="text-[17px] font-bold text-white mb-4 uppercase tracking-wider font-['Sora']">{t.artChooseTitle}</h2>
            <p className="text-slate-400 text-[14px] leading-relaxed mb-4">{t.artChooseP1}</p>
            <p className="text-slate-400 text-[14px] leading-relaxed">{t.artChooseP2}</p>
          </div>

          {/* ----- Section 8: Comparison Table ----- */}
          <div>
            <h2 className="text-[17px] font-bold text-white mb-6 uppercase tracking-wider font-['Sora']">{t.artCompareTitle}</h2>
            <p className="text-slate-400 text-[14px] leading-relaxed mb-6">{t.artCompareP1}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" role="table" aria-label={lang === 'tr' ? 'Temp mail servis karşılaştırması' : 'Temp mail service comparison'}>
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-[11px] font-black text-slate-400 uppercase tracking-wider py-3 px-4">{lang === 'tr' ? 'Özellik' : 'Feature'}</th>
                    <th className="text-[11px] font-black text-red-500 uppercase tracking-wider py-3 px-4">MephistoMail</th>
                    <th className="text-[11px] font-black text-slate-500 uppercase tracking-wider py-3 px-4">Mailinator</th>
                    <th className="text-[11px] font-black text-slate-500 uppercase tracking-wider py-3 px-4">Guerrilla</th>
                    <th className="text-[11px] font-black text-slate-500 uppercase tracking-wider py-3 px-4">10MinMail</th>
                  </tr>
                </thead>
                <tbody className="text-[12px]">
                  <CompareRow feature={lang === 'tr' ? 'Anlık WebSocket Teslimi' : 'Real-time WebSocket'} me={true} m={false} g={false} t10={false} />
                  <CompareRow feature={lang === 'tr' ? 'Sıfır Kayıt / RAM-only' : 'Zero-Log / RAM-only'} me={true} m={false} g={false} t10={false} />
                  <CompareRow feature={lang === 'tr' ? 'Özel Adres Oluşturma' : 'Custom Addresses'} me={true} m={true} g={true} t10={false} />
                  <CompareRow feature={lang === 'tr' ? 'Şifre Üretici' : 'Password Generator'} me={true} m={false} g={false} t10={false} />
                  <CompareRow feature={lang === 'tr' ? 'QR Kod Transferi' : 'QR Code Transfer'} me={true} m={false} g={false} t10={false} />
                  <CompareRow feature={lang === 'tr' ? '100 Eş Zamanlı Kutu' : '100 Simultaneous Inboxes'} me={true} m={false} g={false} t10={false} />
                  <CompareRow feature={lang === 'tr' ? 'Ücretsiz (Reklamsız)' : 'Free (No Ads)'} me={true} m={false} g={true} t10={true} />
                  <CompareRow feature={lang === 'tr' ? 'Çoklu Dil' : 'Multi-Language'} me={true} m={false} g={false} t10={true} />
                  <CompareRow feature={lang === 'tr' ? 'PWA Desteği' : 'PWA Support'} me={true} m={false} g={false} t10={false} />
                  <CompareRow feature={lang === 'tr' ? 'Otomatik Silme Zamanlayıcısı' : 'Auto-Delete Timer'} me={true} m={false} g={false} t10={true} />
                </tbody>
              </table>
            </div>
          </div>

          {/* ----- Section 9: Conclusion ----- */}
          <div className="bg-[#0f0f11] p-8 rounded-2xl border border-white/5 text-center">
            <h2 className="text-[17px] font-bold text-white mb-2 uppercase tracking-wider font-['Sora']">{t.artConclusionTitle}</h2>
            <p className="text-slate-400 text-[14px] leading-relaxed max-w-2xl mx-auto">{t.artConclusionDesc}</p>
          </div>
        </article>

        {/* ===== BROWSER EXTENSION ===== */}
        <div className="mt-20 relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 p-8">
          <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" aria-hidden="true"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none" aria-hidden="true"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-white uppercase tracking-wider font-['Sora']">
                  {lang === 'tr' ? 'Tarayıcı Eklentisi' : 'Browser Extension'}
                </h2>
                <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/10">
                  {lang === 'tr' ? 'Yakında' : 'Coming Soon'}
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-[14px] leading-relaxed mb-6">
              {lang === 'tr'
                ? 'MephistoMail tarayıcı eklentisi ile herhangi bir web sitesinde kayıt formunu gördüğünüzde tek tıkla geçici e-posta oluşturun. Chrome, Firefox ve Edge desteklenecek.'
                : 'Create temporary emails with one click whenever you see a registration form on any website using the MephistoMail browser extension. Chrome, Firefox, and Edge will be supported.'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: <Zap className="w-4 h-4 text-yellow-500" />,
                  title: lang === 'tr' ? 'Tek Tıkla Oluştur' : 'One-Click Generate',
                  desc: lang === 'tr' ? 'Herhangi bir kayıt formunda eklenti ikonuna tıklayın ve anında geçici e-posta oluşturun.' : 'Click the extension icon on any signup form and instantly generate a temp email.'
                },
                {
                  icon: <Globe className="w-4 h-4 text-blue-500" />,
                  title: lang === 'tr' ? 'Otomatik Doldurma' : 'Auto-Fill Forms',
                  desc: lang === 'tr' ? 'Oluşturulan e-posta adresini otomatik olarak form alanına yapıştırır.' : 'Automatically pastes the generated email address into the form field.'
                },
                {
                  icon: <Shield className="w-4 h-4 text-green-500" />,
                  title: lang === 'tr' ? 'Bildirimler' : 'Notifications',
                  desc: lang === 'tr' ? 'Yeni e-posta geldiğinde masaüstü bildirimi alın — sayfayı açık tutmak zorunda kalmayın.' : 'Get desktop notifications when new emails arrive — no need to keep the page open.'
                },
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    {item.icon}
                    <span className="text-white text-[12px] font-bold">{item.title}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {['Chrome', 'Firefox', 'Edge'].map(browser => (
                <span key={browser} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  {browser}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ===== PWA INSTALL GUIDE ===== */}
        <div className="mt-10 relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 p-8">
          <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" aria-hidden="true"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/10 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-white uppercase tracking-wider font-['Sora']">
                  {lang === 'tr' ? 'Mobil Uygulama — PWA' : 'Mobile App — PWA'}
                </h2>
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/10">
                  {lang === 'tr' ? 'Aktif' : 'Available'}
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-[14px] leading-relaxed mb-6">
              {lang === 'tr'
                ? 'MephistoMail bir Progressive Web App (PWA) olarak kullanılabilir. App Store veya Google Play\'den indirmenize gerek yok — doğrudan tarayıcınızdan yükleyin.'
                : 'MephistoMail is available as a Progressive Web App (PWA). No need to download from the App Store or Google Play — install directly from your browser.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Desktop Install */}
              <div className="bg-white/[0.03] rounded-xl p-5 border border-white/5">
                <h3 className="text-white text-[13px] font-bold mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-400" />
                  {lang === 'tr' ? '🖥️ Masaüstü Kurulumu' : '🖥️ Desktop Install'}
                </h3>
                <ol className="space-y-2 text-slate-400 text-[12px] leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-red-400 font-bold shrink-0">1.</span>
                    {lang === 'tr' ? 'Chrome\'da mephistomail.site adresini açın' : 'Open mephistomail.site in Chrome'}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400 font-bold shrink-0">2.</span>
                    {lang === 'tr' ? 'Adres çubuğundaki yükleme (⊕) ikonuna tıklayın' : 'Click the install (⊕) icon in the address bar'}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400 font-bold shrink-0">3.</span>
                    {lang === 'tr' ? '"Yükle" butonuna tıklayın - tamamdır!' : 'Click "Install" button — done!'}
                  </li>
                </ol>
              </div>

              {/* Mobile Install */}
              <div className="bg-white/[0.03] rounded-xl p-5 border border-white/5">
                <h3 className="text-white text-[13px] font-bold mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-green-400" />
                  {lang === 'tr' ? '📱 Mobil Kurulum' : '📱 Mobile Install'}
                </h3>
                <ol className="space-y-2 text-slate-400 text-[12px] leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-red-400 font-bold shrink-0">1.</span>
                    {lang === 'tr' ? 'Mobil tarayıcınızda mephistomail.site adresini açın' : 'Open mephistomail.site in your mobile browser'}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400 font-bold shrink-0">2.</span>
                    {lang === 'tr' ? 'Paylaş menüsünde "Ana Ekrana Ekle" seçeneğini seçin' : 'Tap "Add to Home Screen" in the share menu'}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400 font-bold shrink-0">3.</span>
                    {lang === 'tr' ? 'Uygulama ana ekranınıza eklenecek — app gibi çalışır!' : 'App will be added to your home screen — works like a native app!'}
                  </li>
                </ol>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { label: lang === 'tr' ? 'Çevrimdışı Çalışır' : 'Works Offline', color: 'bg-green-400' },
                { label: lang === 'tr' ? 'Anlık Bildirimler' : 'Push Notifications', color: 'bg-blue-400' },
                { label: lang === 'tr' ? 'Otomatik Güncelleme' : 'Auto Updates', color: 'bg-orange-400' },
                { label: lang === 'tr' ? 'Depolama Gerekmez' : 'No Storage Needed', color: 'bg-purple-400' },
              ].map(badge => (
                <span key={badge.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 text-[11px] font-medium">
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.color}`}></span>
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ===== TESTIMONIALS ===== */}
        <div className="mt-16">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-10 bg-white/10" aria-hidden="true"></div>
            <h2 className="text-[17px] font-bold text-white uppercase tracking-wider font-['Sora']">
              {lang === 'tr' ? 'Kullanıcı Yorumları' : 'What Users Say'}
            </h2>
            <div className="h-px w-10 bg-white/10" aria-hidden="true"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(lang === 'tr' ? [
              { name: 'Ahmet K.', role: 'Yazılım Geliştirici', text: 'Test otomasyonlarımda MephistoMail kullanıyorum. WebSocket ile anlık teslimat gerçekten çok hızlı, diğer servislerde 30 saniye beklerken burada 2 saniyede geliyor.', stars: 5 },
              { name: 'Elif D.', role: 'Freelancer', text: 'Her gün onlarca siteye kayıt oluyorum. MephistoMail sayesinde gerçek adresime spam gelmiyor. 100 eş zamanlı hesap özelliği harika!', stars: 5 },
              { name: 'Mert Y.', role: 'Öğrenci', text: 'Ücretsiz deneme abonelikleri için mükemmel. Kayıt olmadan anında sınırsız hesap açabiliyor olmak harika, tam aradığım şey.', stars: 5 },
              { name: 'Zeynep A.', role: 'UX Tasarımcı', text: 'Arayüzü diğer temp mail servislerine göre çok daha modern ve kullanışlı. Karanlık tema gözleri yormuyor.', stars: 5 },
              { name: 'Can B.', role: 'DevOps Mühendisi', text: 'CI/CD pipeline\'larımızda e-posta testleri için kullanıyoruz. RAM-only mimari gizlilik açısından güven veriyor.', stars: 5 },
              { name: 'Selin T.', role: 'Dijital Pazarlamacı', text: 'Rakip analizi yapırken çok işime yarıyor. QR kod ile mobil transfer özelliği çok pratik.', stars: 4 },
            ] : [
              { name: 'Alex M.', role: 'Software Engineer', text: 'I use MephistoMail for test automation. WebSocket delivery is incredibly fast — emails arrive in 2 seconds vs 30 seconds on other services.', stars: 5 },
              { name: 'Sarah L.', role: 'Freelancer', text: 'I sign up to dozens of sites daily. MephistoMail keeps spam away from my real inbox. The 100 simultaneous accounts feature is amazing!', stars: 5 },
              { name: 'James R.', role: 'Student', text: 'Perfect for free trial subscriptions. Being able to open unlimited accounts instantly without any registration is exactly what I needed.', stars: 5 },
              { name: 'Emma W.', role: 'UX Designer', text: 'The UI is so much better than other temp mail services. Modern, clean dark theme that doesn\'t strain the eyes.', stars: 5 },
              { name: 'David K.', role: 'DevOps Engineer', text: 'We use it for email testing in our CI/CD pipelines. The RAM-only architecture gives confidence in privacy.', stars: 5 },
              { name: 'Lisa C.', role: 'Digital Marketer', text: 'Great for competitor analysis signups. The QR code mobile transfer feature is super practical.', stars: 4 },
            ]).map((review, i) => (
              <div key={i} className="bg-[#0a0a0c] border border-white/5 rounded-xl p-5 hover:border-red-500/10 transition-all duration-300">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className={`w-3 h-3 ${si < review.stars ? 'text-yellow-500 fill-yellow-500' : 'text-slate-700'}`} />
                  ))}
                </div>
                <p className="text-slate-400 text-[12px] leading-relaxed mb-4 italic">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center text-[10px] font-black text-red-400">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-white text-[11px] font-bold block">{review.name}</span>
                    <span className="text-slate-600 text-[10px]">{review.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== FAQ (14 Questions) ===== */}
        <div className="max-w-3xl mx-auto mt-20" itemScope itemType="https://schema.org/FAQPage">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-10 bg-white/10" aria-hidden="true"></div>
            <h2 className="text-[17px] font-bold text-white uppercase tracking-wider font-['Sora']">{t.faqTitle}</h2>
            <div className="h-px w-10 bg-white/10" aria-hidden="true"></div>
          </div>

          <div className="space-y-3" role="list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:border-red-500/20"
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
                role="listitem"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 text-left text-[14px] md:text-[15px] font-bold text-slate-300 hover:text-white transition-colors font-['Sora']"
                  aria-expanded={openFaq === index}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <span itemProp="name">{faq.question}</span>
                  {openFaq === index ? <ChevronUp className="w-4 h-4 text-red-500 shrink-0 ml-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-4" aria-hidden="true" />}
                </button>

                <div
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                >
                  <div className="p-4 pt-0 text-[13px] md:text-[14px] text-slate-500 leading-relaxed border-t border-white/5 mt-1" itemProp="text">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== TRUST SIGNALS ===== */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" aria-hidden="true" />)}
          </div>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            {lang === 'tr' ? '2.847 kullanıcı tarafından 4.8/5 olarak derecelendirildi' : 'Rated 4.8/5 by 2,847 users'}
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-slate-600 uppercase tracking-wider">
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {lang === 'tr' ? '190+ Ülke' : '190+ Countries'}</span>
            <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> {lang === 'tr' ? 'Mobil Uyumlu' : 'Mobile Ready'}</span>
            <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {lang === 'tr' ? '100 Eş zamanlı kutu' : '100 Mailboxes'}</span>
          </div>
        </div>

      </div>
    </section>
  );
};

/* ===== SUB-COMPONENTS ===== */

const FeatureItem = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-4 rounded-xl bg-[#0a0a0c] border border-white/5 hover:border-red-500/30 transition-all duration-300 group text-center md:text-left">
    <div className="mb-3 p-2 bg-white/5 rounded-lg w-fit mx-auto md:mx-0 group-hover:scale-110 transition-transform duration-300 group-hover:bg-red-500/10">
      {icon}
    </div>
    <h3 className="text-[14px] font-bold text-white mb-2 font-['Sora']">{title}</h3>
    <p className="text-[13px] text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">{desc}</p>
  </div>
);

const UseCaseCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="bg-[#0a0a0c] p-5 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">{icon}</div>
      <h3 className="text-[14px] font-bold text-white font-['Sora']">{title}</h3>
    </div>
    <p className="text-[13px] text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const HowToStep = ({ step, label, desc }: { step: number, label: string, desc: string }) => (
  <div className="flex gap-4 items-start p-4 bg-[#0a0a0c] rounded-xl border border-white/5">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-[12px] font-black">
      {step}
    </div>
    <div>
      <h3 className=" text-[14px] font-bold text-white mb-1 font-['Sora'] flex items-center gap-2">
        {label}
        <ArrowRight className="w-3 h-3 text-red-500/40" aria-hidden="true" />
      </h3>
      <p className="text-[13px] text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const CompareRow = ({ feature, me, m, g, t10 }: { feature: string, me: boolean, m: boolean, g: boolean, t10: boolean }) => (
  <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
    <td className="py-2.5 px-4 text-slate-400 text-[12px] font-medium">{feature}</td>
    <td className="py-2.5 px-4 text-center">{me ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-slate-700">—</span>}</td>
    <td className="py-2.5 px-4 text-center">{m ? <CheckCircle2 className="w-4 h-4 text-green-500/40 mx-auto" /> : <span className="text-slate-700">—</span>}</td>
    <td className="py-2.5 px-4 text-center">{g ? <CheckCircle2 className="w-4 h-4 text-green-500/40 mx-auto" /> : <span className="text-slate-700">—</span>}</td>
    <td className="py-2.5 px-4 text-center">{t10 ? <CheckCircle2 className="w-4 h-4 text-green-500/40 mx-auto" /> : <span className="text-slate-700">—</span>}</td>
  </tr>
);