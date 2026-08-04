import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Lock, ChevronDown, ChevronUp, Cpu, Network, Key, ScanLine, CheckCircle2, ArrowRight, Star, Globe, Smartphone, Search, Timer, Users, Layers, Bookmark } from 'lucide-react';
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

          {/* ----- Onboarding & Retention Booster Section ----- */}
          <div className="my-8 p-6 md:p-8 bg-gradient-to-r from-orange-950/20 via-[#0d0f17] to-amber-950/20 border border-orange-500/30 rounded-2xl shadow-xl" role="region" aria-label="Retention Boosters">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                <Bookmark className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-white uppercase tracking-wider font-['Sora']">
                  {lang === 'tr' ? '🚀 MephistoMail’i Daha Verimli Kullanın' : '🚀 Supercharge Your MephistoMail Experience'}
                </h2>
                <p className="text-xs text-slate-400">
                  {lang === 'tr' ? 'Gelen kutunuzu daha pratik kullanmak ve onay kodlarını anında yakalamak için 3 tatlı ipucu:' : 'Three quick tips to make checking your emails even faster and easier:'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-[#050508] p-4 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-black">1</span>
                    <h3 className="text-xs font-bold text-white font-['Sora']">
                      {lang === 'tr' ? '📌 Adresi Kaydedin (Ctrl+D)' : '📌 Save for Later (Ctrl+D)'}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {lang === 'tr'
                      ? 'Bu adrese daha sonra kolayca dönmek isterseniz Ctrl+D kısayoluyla tarayıcınıza ekleyebilirsiniz.'
                      : 'Need to check this address again later? Press Ctrl+D to bookmark it in one second.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert(lang === 'tr' ? '★ Adres bağlantısı kopyalandı! Ctrl+D ile tarayıcınıza ekleyebilirsiniz.' : '★ Link copied! Press Ctrl+D to bookmark.');
                  }}
                  className="mt-3 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-all text-center cursor-pointer"
                >
                  {lang === 'tr' ? 'Bağlantıyı Kopyala' : 'Copy Bookmark Link'}
                </button>
              </div>

              <div className="bg-[#050508] p-4 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-black">2</span>
                    <h3 className="text-xs font-bold text-white font-['Sora']">
                      {lang === 'tr' ? '📱 Masaüstü & Mobil Uygulama' : '📱 Add to Home Screen'}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {lang === 'tr'
                      ? 'MephistoMail\'i telefonunuzun veya bilgisayarınızın ana ekranına ekleyerek bir uygulama gibi kullanabilirsiniz.'
                      : 'You can add MephistoMail directly to your home screen so it opens like a normal app anytime.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    window.dispatchEvent(new Event('beforeinstallprompt'));
                    alert(lang === 'tr' ? '📱 Yüklemek için ekranın altındaki PWA Yükle rozetini kullanabilirsiniz.' : '📱 Use the floating PWA Install prompt at the bottom of your screen.');
                  }}
                  className="mt-3 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-all text-center cursor-pointer"
                >
                  {lang === 'tr' ? 'Uygulamayı Ekle' : 'How to Install'}
                </button>
              </div>

              <div className="bg-[#050508] p-4 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-black">3</span>
                    <h3 className="text-xs font-bold text-white font-['Sora']">
                      {lang === 'tr' ? '🔔 Canlı Masaüstü Bildirimleri' : '🔔 Live Alerts'}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {lang === 'tr'
                      ? 'Sekmeyi alta küçültseniz bile doğrulama kodunuz geldiğinde ekranda tatlı bir bildirim belirir.'
                      : 'Even if this tab is in the background, we\'ll send you a friendly notification when your code arrives.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (typeof Notification !== 'undefined') {
                      Notification.requestPermission().then(permission => {
                        alert(permission === 'granted' 
                          ? (lang === 'tr' ? '✅ Bildirimler aktif!' : '✅ Notifications enabled!')
                          : (lang === 'tr' ? '⚠️ Bildirim izni verilmedi.' : '⚠️ Notification permission not granted.')
                        );
                      });
                    }
                  }}
                  className="mt-3 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-all text-center cursor-pointer"
                >
                  {lang === 'tr' ? 'Bildirimlere İzin Ver' : 'Turn On Live Alerts'}
                </button>
              </div>
            </div>
          </div>

          {/* ----- Section 1.5: SaaS Platform Modules ----- */}
          <div className="my-8 p-6 md:p-8 bg-[#09090d] border border-white/10 rounded-2xl" role="region" aria-label="SaaS Features">
            <h2 className="text-[16px] md:text-[18px] font-bold text-white mb-2 uppercase tracking-wider font-['Sora'] flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-500" />
              {lang === 'tr' ? 'Sizi Güvende Tutacak Sevilen Özelliklerimiz' : 'Cool Features Built to Protect Your Privacy'}
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mb-6 leading-relaxed">
              {lang === 'tr'
                ? 'Sıradan geçici e-posta servislerinin ötesine geçtik. Gelen kutunuzu daha güvenli, hızlı ve rahat hale getirecek zengin araçlar hazırladık:'
                : 'We built MephistoMail with thoughtful privacy features so you can sign up for websites effortlessly and keep control of your inbox:'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <SaaSModuleCard
                title={lang === 'tr' ? '🌐 Kendi Alan Adınızı Bağlayın' : '🌐 Use Your Own Domain'}
                desc={lang === 'tr' ? 'Kendi domain adınızı bağlayarak engelli geçici mail filtrelerine takılmadan e-posta alın.' : 'Connect your own domain to bypass temp-mail blocks and keep full control over your addresses.'}
              />
              <SaaSModuleCard
                title={lang === 'tr' ? '🛡️ Takip Piksellerini Engelleme' : '🛡️ Automatic Tracker Blocker'}
                desc={lang === 'tr' ? 'E-postalara gizlenen 1x1 piksel casus görselleri ve konum takibini siz fark etmeden engelleriz.' : 'We strip away hidden 1x1 tracking pixels so senders can\'t secretly trace your location or email opens.'}
              />
              <SaaSModuleCard
                title={lang === 'tr' ? '⚡ Otomatik Bağlantı Tıklama' : '⚡ One-Click Auto Verification'}
                desc={lang === 'tr' ? 'Gelen aktivasyon e-postalarındaki onay butonlarını arka planda otomatik olarak tıklarız.' : 'Got an activation email? We can auto-click verification links for you so you don\'t even have to open them.'}
              />
              <SaaSModuleCard
                title={lang === 'tr' ? '✉️ E-postaları Yanıtlama' : '✉️ Reply Directly & Anonymously'}
                desc={lang === 'tr' ? 'Gelen geçici mailleri hemen yanıtlayın veya anonim olarak dışarıya e-posta gönderin.' : 'Need to reply to a confirmation email? You can answer back directly without exposing your real address.'}
              />
              <SaaSModuleCard
                title={lang === 'tr' ? '📥 E-postaları İndirme' : '📥 Easy Email Downloads'}
                desc={lang === 'tr' ? 'Önemli e-postaları .eml, PDF veya JSON formatında tek tıkla cihazınıza indirin.' : 'Save important emails to your device as PDF files, .eml text, or structured JSON data in one click.'}
              />
              <SaaSModuleCard
                title={lang === 'tr' ? '👤 Anonim Profil ve Şifreler' : '👤 Instant Identity & Pass Creator'}
                desc={lang === 'tr' ? 'Hesap oluştururken formları rastgele isimler ve güçlü şifrelerle saniyeler içinde doldurun.' : 'Quickly generate realistic test profiles and uncrackable passwords whenever a signup form asks for them.'}
              />
            </div>
          </div>

          {/* ----- Section 1.8: Programmatic High-Volume Target Services Hub ----- */}
          <div className="my-10 p-6 md:p-8 bg-[#0a0a0f] border border-red-500/20 rounded-2xl" role="region" aria-label="Target Services">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] md:text-[18px] font-bold text-white uppercase tracking-wider font-['Sora'] flex items-center gap-2">
                <Globe className="w-5 h-5 text-red-500" />
                {lang === 'tr' ? 'Sık Kullanılan Platformlar İçin Özel Sayfalar' : 'Instant Email Guides for Popular Apps & Platforms'}
              </h2>
              <Link to="/services" className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1">
                {lang === 'tr' ? 'Tüm Kataloğu Gör' : 'View Full Catalog'} →
              </Link>
            </div>
            <p className="text-slate-400 text-xs md:text-sm mb-6 leading-relaxed">
              {lang === 'tr'
                ? 'Favori uygulamanıza veya platformunuza kayıt olurken onay kodlarınızı anında almak için hazırladığımız özel sayfaları keşfedin:'
                : 'Signing up for an app or game? Click below for tailored guides and instant OTP confirmation for top platforms:'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { slug: 'instagram', icon: '📸', title: 'Temp Mail for Instagram', descTr: 'Instagram doğrulama kodlarını anında alın', descEn: 'Receive 6-digit Instagram verification codes in seconds' },
                { slug: 'chatgpt', icon: '🤖', title: 'Temp Mail for ChatGPT', descTr: 'ChatGPT ve OpenAI üyelik onayları', descEn: 'Instant verification for ChatGPT & OpenAI developer accounts' },
                { slug: 'discord', icon: '🎮', title: 'Temp Mail for Discord', descTr: 'Discord sunucu ve bot doğrulama kodları', descEn: 'Get Discord server joins and bot verification PINs easily' },
                { slug: 'roblox', icon: '🎲', title: 'Temp Mail for Roblox', descTr: 'Roblox hesap açma ve güvenlik kodları', descEn: 'Quick Roblox account signups & security PINs' },
                { slug: 'telegram', icon: '✈️', title: 'Temp Mail for Telegram', descTr: 'Telegram Web ve 2FA giriş onayları', descEn: 'Telegram Web & 2FA email verification made easy' },
                { slug: 'netflix', icon: '🎬', title: 'Temp Mail for Netflix', descTr: 'Netflix deneme sürümü ve üyelik onayları', descEn: 'Clean Netflix trial signups without inbox clutter' },
                { slug: 'spotify', icon: '🎵', title: 'Temp Mail for Spotify', descTr: 'Spotify ücretsiz deneme aktivasyonları', descEn: 'Activate Spotify trials without giving up your main email' },
                { slug: 'tiktok', icon: '🎵', title: 'Temp Mail for TikTok', descTr: 'TikTok yan hesap ve profil aktivasyonları', descEn: 'Create quick TikTok alt accounts smoothly' },
                { slug: 'steam', icon: '🎮', title: 'Temp Mail for Steam', descTr: 'Steam Guard 5 haneli giriş kodları', descEn: 'Receive Steam Guard 5-character security codes instantly' },
                { slug: 'amazon', icon: '🛒', title: 'Temp Mail for Amazon', descTr: 'Amazon ve AWS deneme hesabı onayları', descEn: 'Keep Amazon marketing & AWS trial notifications separate' },
                { slug: 'linkedin', icon: '💼', title: 'Temp Mail for LinkedIn', descTr: 'LinkedIn hesabı ve araştırma kalkanı', descEn: 'Browse LinkedIn & connect privately without spam' }
              ].map(target => (
                <Link
                  key={target.slug}
                  to={`/temp-mail-for-${target.slug}`}
                  className="bg-[#050508] p-3.5 rounded-xl border border-white/5 hover:border-red-500/40 hover:bg-white/[0.03] transition-all group block"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{target.icon}</span>
                    <h3 className="text-[13px] font-bold text-white group-hover:text-red-400 transition-colors font-['Sora']">{target.title}</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{lang === 'tr' ? target.descTr : target.descEn}</p>
                </Link>
              ))}
            </div>
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
              <HowToStep step={1} label={lang === 'tr' ? 'MephistoMail\'i açın' : 'Open MephistoMail'} desc={t.artUseP1} />
              <HowToStep step={2} label={lang === 'tr' ? 'Adresinizi kopyalayın ve kullanın' : 'Copy your ready address'} desc={t.artUseP2} />
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
                  <CompareRow feature={lang === 'tr' ? 'Anında Mesaj Teslimatı' : 'Instant Email Arrival'} me={true} m={false} g={false} t10={false} />
                  <CompareRow feature={lang === 'tr' ? 'Sıfır Kayıt & Tam Gizlilik' : 'Zero Registration & Privacy First'} me={true} m={false} g={false} t10={false} />
                  <CompareRow feature={lang === 'tr' ? 'Özel Adres Seçimi' : 'Custom Email Names'} me={true} m={true} g={true} t10={false} />
                  <CompareRow feature={lang === 'tr' ? 'Şifre Oluşturucu' : 'Password Creator Tool'} me={true} m={false} g={false} t10={false} />
                  <CompareRow feature={lang === 'tr' ? 'QR İle Mobile Aktarım' : 'QR Mobile Sync'} me={true} m={false} g={false} t10={false} />
                  <CompareRow feature={lang === 'tr' ? 'Aynı Anda 100 Gelen Kutusu' : '100 Active Inboxes'} me={true} m={false} g={false} t10={false} />
                  <CompareRow feature={lang === 'tr' ? 'Tamamen Ücretsiz (Reklamsız)' : '100% Free & No Ads'} me={true} m={false} g={true} t10={true} />
                  <CompareRow feature={lang === 'tr' ? 'Çoklu Dil Desteği' : 'Multi-Language Support'} me={true} m={false} g={false} t10={true} />
                  <CompareRow feature={lang === 'tr' ? 'Mobil ve Masaüstü Uygulaması' : 'Mobile & Desktop App'} me={true} m={false} g={false} t10={false} />
                  <CompareRow feature={lang === 'tr' ? 'Otomatik Silme Sayacı' : 'Self-Destruct Timer'} me={true} m={false} g={false} t10={true} />
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
              { name: 'Ahmet K.', role: 'Yazılım Geliştirici', text: 'Projelerimi test ederken MephistoMail\'i sürekli kullanıyorum. Doğrulama kodları o kadar hızlı geliyor ki hiç vakit kaybetmiyorum!', stars: 5 },
              { name: 'Elif D.', role: 'Freelancer', text: 'Her yeni siteye kaydolurken buradayım! Gerçek kutum bülten çöplüğüne dönmekten kurtuldu, arayüzü de çok pratik.', stars: 5 },
              { name: 'Mert Y.', role: 'Öğrenci', text: 'Ücretsiz denemeleri ve yeni uygulamaları test etmek için birebir. Üye olma şartı olmaması harika bir kolaylık.', stars: 5 },
              { name: 'Zeynep A.', role: 'UX Tasarımcı', text: 'Sade ve şık tasarımıyla diğer tüm servislerden ayrılıyor. Karanlık teması akşamları göz yormuyor.', stars: 5 },
              { name: 'Can B.', role: 'DevOps Mühendisi', text: 'Geliştirici ekibimiz için harika bir yardımcı oldu. Kodlarımızda e-posta testlerini saniyeler içinde tamamlıyoruz.', stars: 5 },
              { name: 'Selin T.', role: 'Dijital Pazarlamacı', text: 'Mobil aktarım özelliği harika çalışıyor! QR kodunu telefonumla tarayıp anında mobilden devam edebiliyorum.', stars: 4 },
            ] : [
              { name: 'Alex M.', role: 'Software Engineer', text: 'I use MephistoMail whenever I test new apps. Verification codes arrive almost instantly—it\'s so smooth!', stars: 5 },
              { name: 'Sarah L.', role: 'Freelancer', text: 'My personal email inbox is finally spam-free! I use MephistoMail for all new site signups and it works like a charm.', stars: 5 },
              { name: 'James R.', role: 'Student', text: 'Hands down the easiest temp mail tool I\'ve used. No registration, no ads cluttering the screen—just instant email.', stars: 5 },
              { name: 'Emma W.', role: 'UX Designer', text: 'The dark theme and modern design look awesome. It\'s clean, easy on the eyes, and super fast.', stars: 5 },
              { name: 'David K.', role: 'DevOps Engineer', text: 'Great tool for software dev and quick tests. Creating multiple inboxes in one click saves me so much time.', stars: 5 },
              { name: 'Lisa C.', role: 'Digital Marketer', text: 'The mobile QR sync is brilliant! I scan the barcode on my screen and I\'m instantly logged in on my phone.', stars: 4 },
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

const SaaSModuleCard = ({ title, desc }: { title: string, desc: string }) => (
  <div className="bg-[#050505] p-4 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all group">
    <h3 className="text-[13px] font-bold text-white mb-1.5 font-['Sora'] group-hover:text-orange-400 transition-colors">{title}</h3>
    <p className="text-[12px] text-slate-400 leading-normal">{desc}</p>
  </div>
);

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