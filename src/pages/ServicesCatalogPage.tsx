import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import App from '../App';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Language } from '../translations';
import { Zap, ArrowRight, ShieldCheck, Search, Filter, Mail, CheckCircle } from 'lucide-react';

interface ServicesCatalogPageProps {
  lang: Language;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: 'social' | 'ai' | 'shopping' | 'trials' | 'security';
  badge: string;
  icon: string;
  color: string;
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  featuresTr: string[];
  featuresEn: string[];
}

const CATALOG_ITEMS: CatalogItem[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT & OpenAI',
    category: 'ai',
    badge: '🤖 AI Tools',
    icon: '🤖',
    color: 'from-emerald-600 to-teal-600',
    titleTr: 'ChatGPT & OpenAI API Doğrulama',
    titleEn: 'ChatGPT & OpenAI API Verification',
    descTr: 'Yapay zeka testleri ve OpenAI API kayıtlarında kişisel mailinizi koruyun.',
    descEn: 'Protect your inbox during AI platform sign-ups and API developer testing.',
    featuresTr: ['1-3s Anlık OTP Kodu', 'API Limit Esnetme', 'Spamsız Test'],
    featuresEn: ['Sub-3s OTP Codes', 'API Limit Bypass', 'Spam-free Testing']
  },
  {
    id: 'discord',
    name: 'Discord',
    category: 'social',
    badge: '🎮 Gaming & Community',
    icon: '💬',
    color: 'from-indigo-600 to-purple-600',
    titleTr: 'Discord Bot & Sunucu Doğrulama',
    titleEn: 'Discord Bot & Server Verification',
    descTr: 'Discord kayıtları ve sunucu doğrulama kodlarını saniyeler içinde alın.',
    descEn: 'Receive 6-digit Discord verification PINs and server OTPs instantly.',
    featuresTr: ['6 Haneli Kod Takibi', 'Bot Test Desteği', 'Temiz Domain'],
    featuresEn: ['6-Digit PIN Extraction', 'Bot Testing', 'Fresh Domains']
  },
  {
    id: 'classifieds',
    name: 'İkinci El İlan & İletişim',
    category: 'shopping',
    badge: '🏷️ Marketplace & Deals',
    icon: '🏷️',
    color: 'from-stone-600 to-zinc-600',
    titleTr: 'İkinci El İlan Gizlilik Kalkanı',
    titleEn: 'Classifieds & Marketplace Shield',
    descTr: 'Sahibinden ve online pazaryerlerinde alıcı/satıcılarla gizli iletişim kurun.',
    descEn: 'Communicate with marketplace buyers and sellers completely anonymously.',
    featuresTr: ['Gerçek Adres Gizleme', 'Outbound Mail Yanıt', 'Tek Tıkla Silme'],
    featuresEn: ['Hide Real Identity', 'Outbound Mail Reply', 'One-Click Burn']
  },
  {
    id: 'free-trials',
    name: 'Ücretsiz Deneme (Free Trial)',
    category: 'trials',
    badge: '🎬 Subscription Trials',
    icon: '🎬',
    color: 'from-purple-600 to-pink-600',
    titleTr: 'Ücretsiz Deneme Süreleri',
    titleEn: 'Free Trial Subscriptions',
    descTr: 'SaaS yazılımları ve dijital servislerin 7-14 günlük deneme sürelerini spamsız başlatın.',
    descEn: 'Start 7-day and 14-day SaaS trial tiers without marketing follow-up noise.',
    featuresTr: ['Auto-Verify Kalkanı', 'Deneme Süresi Koruması', 'Sıfır İntro Spam'],
    featuresEn: ['Auto-Verify Engine', 'Trial Period Shield', 'Zero Spam']
  },
  {
    id: 'discounts',
    name: 'İndirim Kuponları & E-Ticaret',
    category: 'shopping',
    badge: '🎟️ Promo Codes & Deals',
    icon: '🎟️',
    color: 'from-orange-600 to-amber-600',
    titleTr: 'İndirim Kuponu & Promosyon Kodu',
    titleEn: 'Discount Vouchers & Promos',
    descTr: 'E-ticaret sitelerinin "İlk alışverişe %15 indirim" kodlarını kişisel mailiniz vermeden toplayın.',
    descEn: 'Claim first-order promotional discounts and coupon codes endlessly.',
    featuresTr: ['Kupon Kodu Ayıklama', 'Mağaza Spam Engeli', 'Sınırsız Kupon'],
    featuresEn: ['Coupon Extraction', 'Store Spam Barrier', 'Unlimited Claims']
  },
  {
    id: 'wifi-login',
    name: 'Wi-Fi & Hotspot Girişi',
    category: 'security',
    badge: '🌐 Wi-Fi Access Shield',
    icon: '🌐',
    color: 'from-cyan-600 to-blue-600',
    titleTr: 'Havaalanı & Otel Wi-Fi Girişi',
    titleEn: 'Airport & Hotel Wi-Fi Login',
    descTr: 'Havaalanı, otel ve kafe Wi-Fi portal girişlerindeki e-posta doğrulamasını spamsız 5 saniyede geçin.',
    descEn: 'Bypass mandatory captive portal verification screens on public Wi-Fi networks.',
    featuresTr: ['Konum Takibi Engeli', 'Hızlı OTP Gösterimi', 'Güvenli Hotspot'],
    featuresEn: ['Block Location Trackers', 'Fast OTP Display', 'Secure Hotspots']
  },
  {
    id: 'downloads',
    name: 'PDF & E-Kitap İndirme',
    category: 'trials',
    badge: '📚 PDF & File Shield',
    icon: '📚',
    color: 'from-emerald-600 to-green-600',
    titleTr: 'Ücretsiz PDF & E-Kitap İndirme',
    titleEn: 'Free eBook & PDF Downloads',
    descTr: 'Rapor, şablon ve e-kitap indirmek için e-posta şart koşan sitelerden güvenle dosya indirin.',
    descEn: 'Download whitepapers, PDFs, and eBooks requiring email verification safely.',
    featuresTr: ['İndirme Bağlantısı Ayıklama', 'Bülten Tuzağı Kalkanı', 'Hızlı İndirme'],
    featuresEn: ['Download Link Extractor', 'Newsletter Trap Shield', 'Instant Delivery']
  },
  {
    id: 'gaming',
    name: 'Oyun & Yan Hesaplar',
    category: 'social',
    badge: '🎮 Gaming & Alt Accounts',
    icon: '🎮',
    color: 'from-violet-600 to-indigo-600',
    titleTr: 'Oyun & Alt Account Kalkanı',
    titleEn: 'Gaming Alt Accounts Shield',
    descTr: 'Steam, Epic Games, Roblox ve Twitch Drop hediyeleri için yan oyun profilleri edinin.',
    descEn: 'Create secondary gaming profiles for Steam, Epic Games, and Twitch drops.',
    featuresTr: ['Twitch Drop Toplama', 'Oyun Kodu Alma', 'Yan Profil İzolasyonu'],
    featuresEn: ['Twitch Drops', 'Game Key Receipt', 'Profile Isolation']
  },
  {
    id: 'qa-testing',
    name: 'Yazılım Testi & QA',
    category: 'ai',
    badge: '🧪 QA & Dev Testing',
    icon: '🧪',
    color: 'from-amber-600 to-red-600',
    titleTr: 'Yazılım Testi & QA Otomasyonu',
    titleEn: 'QA Testing & Automation',
    descTr: 'Cypress, Playwright ve Selenium test otomasyonlarında temiz kullan-at mail kutuları kullanın.',
    descEn: 'Integrate clean disposable email handles into Cypress and Playwright suites.',
    featuresTr: ['REST API Desteği', 'EML/JSON Export', 'Otomasyon Uyumlu'],
    featuresEn: ['REST API Access', 'EML/JSON Export', 'Automation Ready']
  },
  {
    id: 'spam-protection',
    name: 'Spam Engelleme Kalkanı',
    category: 'security',
    badge: '🛡️ Ultimate Privacy Shield',
    icon: '🛡️',
    color: 'from-red-600 to-rose-800',
    titleTr: 'Spam & Casus Piksel Kalkanı',
    titleEn: 'Spam & Tracker Shield',
    descTr: 'Gelen maillerdeki 1x1 casus takip piksellerini ve reklam avcılarını otomatik filtreleyin.',
    descEn: 'Automatically filter out 1x1 tracking pixels and location trackers in emails.',
    featuresTr: ['Casus Piksel Filtresi', 'Veri Sızıntısı Kalkanı', 'RAM-Only Depolama'],
    featuresEn: ['Tracking Pixel Stripper', 'Breach Isolation', 'RAM-Only Storage']
  },
  {
    id: 'surveys',
    name: 'Online Anket & Formlar',
    category: 'trials',
    badge: '📝 Form Shield',
    icon: '📝',
    color: 'from-teal-600 to-cyan-600',
    titleTr: 'Online Anket & Quiz Sonuçları',
    titleEn: 'Online Survey & Quiz Results',
    descTr: 'Anket çözdükten sonra "Sonucunuzu görmek için e-posta girin" diyen bariyerleri spamsız aşın.',
    descEn: 'Bypass survey and quiz result email paywalls without getting spammed.',
    featuresTr: ['Anlık Sonuç Gösterimi', 'Spamsız Deneyim', 'Kayıtsız Kullanım'],
    featuresEn: ['Instant Results', 'Spam-free Experience', 'Zero Registration']
  },
  {
    id: 'crypto-airdrops',
    name: 'Kripto Airdrop & Web3',
    category: 'security',
    badge: '🪙 Crypto Airdrops',
    icon: '🪙',
    color: 'from-yellow-600 to-amber-600',
    titleTr: 'Kripto Airdrop & Whitelist',
    titleEn: 'Crypto Airdrops & Web3 Whitelists',
    descTr: 'Web3 airdrop ve NFT whitelist kayıtlarında cüzdan bilgilerinizi ve ana mailinizi koruyun.',
    descEn: 'Protect your wallet identity and primary email during Web3 token drops.',
    featuresTr: ['Phishing Engelleme', 'Multi-Account Test', 'Akıllı Link Algılama'],
    featuresEn: ['Phishing Shield', 'Multi-Account Testing', 'Smart Link Extraction']
  },
  {
    id: 'spotify',
    name: 'Spotify Premium',
    category: 'social',
    badge: '🎵 Music Streaming',
    icon: '🎵',
    color: 'from-green-600 to-emerald-700',
    titleTr: 'Spotify Müzik Hesap Doğrulama',
    titleEn: 'Spotify Music Account Verification',
    descTr: 'Spotify üyeliklerinde kişisel gelen kutunuza pazarlama maili gelmesini önleyin.',
    descEn: 'Prevent Spotify promotional newsletters from clogging your primary inbox.',
    featuresTr: ['Onay Linki Algılama', 'Reklam Engeli', 'Anlık Aktivasyon'],
    featuresEn: ['Activation Link Detection', 'Ad Shield', 'Instant Verification']
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'social',
    badge: '📸 Social Media',
    icon: '📸',
    color: 'from-pink-600 to-rose-600',
    titleTr: 'Instagram Yan Hesap Kalkanı',
    titleEn: 'Instagram Alt Account Shield',
    descTr: 'İkinci veya işletme profilleri oluştururken kendi e-postanızı bağlamayın.',
    descEn: 'Create secondary Instagram profiles without exposing your personal email.',
    featuresTr: ['6-Haneli OTP Bildirimi', 'Anonim Profil', 'Veri Sızıntısı Kalkanı'],
    featuresEn: ['6-Digit OTP Toast', 'Anonymous Profile', 'Leak Shield']
  },
  {
    id: 'github',
    name: 'GitHub & GitLab',
    category: 'ai',
    badge: '💻 Developer Platform',
    icon: '💻',
    color: 'from-slate-600 to-slate-800',
    titleTr: 'Geliştirici & Kod Test Hesapları',
    titleEn: 'Developer & Code Testing Accounts',
    descTr: 'Yazılım projelerinizi test ederken şirket adresinizi kirletmeyin.',
    descEn: 'Keep your primary work inbox clean while running software build tests.',
    featuresTr: ['Clean Domain List', 'Fast OTP Delivery', 'Zero Storage'],
    featuresEn: ['Clean Domain List', 'Fast OTP Delivery', 'Zero Storage']
  },
  {
    id: 'telegram',
    name: 'Telegram',
    category: 'social',
    badge: '✈️ Messaging & Web App',
    icon: '✈️',
    color: 'from-sky-500 to-blue-600',
    titleTr: 'Telegram Web & Bot Kalkanı',
    titleEn: 'Telegram Web & Bot Verification Shield',
    descTr: 'Telegram web kayıtları ve 2FA e-posta onayları için kullan-at adres oluşturun.',
    descEn: 'Generate instant temporary email handles for Telegram web logins and 2FA resets.',
    featuresTr: ['1-3s 2FA OTP Teslimi', 'Bot Entegrasyonu', 'Sıfır Log'],
    featuresEn: ['Sub-3s 2FA OTP Delivery', 'Bot Integration', 'Zero Storage']
  },
  {
    id: 'roblox',
    name: 'Roblox',
    category: 'social',
    badge: '🎮 Gaming',
    icon: '🎲',
    color: 'from-blue-600 to-cyan-600',
    titleTr: 'Roblox Hesap Kalkanı',
    titleEn: 'Roblox Alt Account Shield',
    descTr: 'Roblox oyunu için yan profiller ve güvenlik PIN kodları alın.',
    descEn: 'Receive Roblox gamer profiles and instant 6-digit security PINs.',
    featuresTr: ['6-Haneli PIN Kodu', 'Yan Profil İzolasyonu', 'RAM Depolama'],
    featuresEn: ['6-Digit PIN Code', 'Alt Profile Isolation', 'RAM Storage']
  },
  {
    id: 'netflix',
    name: 'Netflix',
    category: 'trials',
    badge: '🎬 Streaming',
    icon: '🎬',
    color: 'from-red-600 to-rose-700',
    titleTr: 'Netflix Yayın Kalkanı',
    titleEn: 'Netflix Streaming Shield',
    descTr: 'Netflix ve dizi servislerinde kişisel e-postanızı spamlardan koruyun.',
    descEn: 'Protect your primary email during Netflix and video streaming signups.',
    featuresTr: ['Canlı Onay Mailler', 'Spam Engeli', 'Tek Tıkla Silme'],
    featuresEn: ['Live Confirmation', 'Spam Barrier', 'One-Click Burn']
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'social',
    badge: '🎵 Social Media',
    icon: '🎵',
    color: 'from-neutral-900 to-rose-600',
    titleTr: 'TikTok Profil Kalkanı',
    titleEn: 'TikTok Profile Registration Shield',
    descTr: 'TikTok içerik ve yan hesapları için spamsız doğrulama.',
    descEn: 'Create secondary TikTok accounts without exposing your main inbox.',
    featuresTr: ['6-Haneli OTP Toast', 'Spamsız Deneyim', 'Gizli Kaydı'],
    featuresEn: ['6-Digit OTP Toast', 'Spam-Free Experience', 'Anonymous Signup']
  },
  {
    id: 'steam',
    name: 'Steam',
    category: 'social',
    badge: '🎮 PC Gaming',
    icon: '🎮',
    color: 'from-blue-700 to-slate-900',
    titleTr: 'Steam Guard & Oyun Kalkanı',
    titleEn: 'Steam Guard & Gaming Shield',
    descTr: 'Steam Guard 5-karakter doğrulama kodlarını anında alın.',
    descEn: 'Get 5-character Steam Guard security authorization codes instantly.',
    featuresTr: ['Steam Guard Kod Alma', 'Oyun İndirim Kalkanı', 'Hızlı Teslimat'],
    featuresEn: ['Steam Guard Extraction', 'Sale Spam Barrier', 'Fast Delivery']
  },
  {
    id: 'amazon',
    name: 'Amazon & AWS',
    category: 'shopping',
    badge: '🛒 Shopping & Cloud',
    icon: '🛒',
    color: 'from-amber-500 to-orange-600',
    titleTr: 'Amazon Alışveriş & AWS Deneme Kalkanı',
    titleEn: 'Amazon Shopping & AWS Trial Shield',
    descTr: 'Amazon sipariş ve AWS geliştirici denemelerinde spamsız kullan-at adres.',
    descEn: 'Use clean disposable addresses for Amazon shopping & AWS developer sandbox testing.',
    featuresTr: ['AWS OTP Kalkanı', 'Reklam Engeli', 'Anlık OTP'],
    featuresEn: ['AWS OTP Shield', 'Ad Barrier', 'Instant OTP']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    badge: '💼 Professional Network',
    icon: '💼',
    category: 'security',
    color: 'from-blue-600 to-cyan-700',
    titleTr: 'LinkedIn Profesyonel Ağ Kalkanı',
    titleEn: 'LinkedIn Professional Privacy Shield',
    descTr: 'LinkedIn şirket araştırmaları ve profesyonel testlerde adresinizi koruyun.',
    descEn: 'Protect your career email while conducting market research and LinkedIn testing.',
    featuresTr: ['PIN Kodu Algılama', 'İş Arama Gizliliği', 'Sıfır İz'],
    featuresEn: ['PIN Extraction', 'Job Search Privacy', 'Zero Trace']
  }
];

export const ServicesCatalogPage: React.FC<ServicesCatalogPageProps> = ({ lang }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isTr = lang === 'tr';

  const filteredItems = CATALOG_ITEMS.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const title = isTr ? item.titleTr : item.titleEn;
    const desc = isTr ? item.descTr : item.descEn;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 flex flex-col font-['Sora'] selection:bg-red-500/30 selection:text-red-300">
      <SEOHead lang={lang} />
      <Header accounts={[]} currentAccount={null} onSwitchAccount={() => {}} onDeleteAccount={() => {}} lang={lang} setLang={() => {}} theme="dark" setTheme={() => {}} onOpenQR={() => {}} onOpenPass={() => {}} onOpenExtension={() => {}} onOpenStats={() => {}} onOpenFilters={() => {}} onOpenLabels={() => {}} />

      {/* Catalog Hero Banner */}
      <section className="pt-28 pb-12 px-4 sm:px-6 bg-gradient-to-b from-[#12121e] via-[#090910] to-[#050508] border-b border-slate-800/60">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Zap className="w-4 h-4" />
            <span>{isTr ? '25+ Özel Servis & Platform Kalkanı' : '25+ Platform & Service Shields'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {isTr ? 'Tüm Kullanım Alanları ve Servis Kataloğu' : 'All Use-Cases & Service Catalog'}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {isTr
              ? 'İhtiyacınıza en uygun platform kalkanını seçin. İndirim kuponlarından yapay zeka kayıtlarına kadar spamsız ve anında anonim e-postanızı oluşturun.'
              : 'Choose the dedicated shield tailored for your exact need. From promo codes to AI sign-ups, protect your identity instantly.'}
          </p>

          {/* Search & Category Filter Controls */}
          <div className="pt-6 max-w-3xl mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isTr ? 'Servis veya kullanım alanı ara... (Örn: ChatGPT, İndirim, Wi-Fi)' : 'Search services or use cases... (e.g. ChatGPT, Discount, Wi-Fi)'}
                className="w-full pl-12 pr-4 py-3 bg-[#0d0d16] border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-all shadow-inner"
              />
            </div>

            {/* Category Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeCategory === 'all'
                    ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                    : 'bg-[#0d0d16] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {isTr ? '✨ Tümü (25+)' : '✨ All (25+)'}
              </button>
              <button
                onClick={() => setActiveCategory('ai')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeCategory === 'ai'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'bg-[#0d0d16] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                🤖 {isTr ? 'AI & Geliştirici' : 'AI & Dev'}
              </button>
              <button
                onClick={() => setActiveCategory('shopping')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeCategory === 'shopping'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                    : 'bg-[#0d0d16] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                🎟️ {isTr ? 'İndirim & İlanlar' : 'Deals & Market'}
              </button>
              <button
                onClick={() => setActiveCategory('social')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeCategory === 'social'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                    : 'bg-[#0d0d16] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                🎮 {isTr ? 'Sosyal & Oyun' : 'Social & Gaming'}
              </button>
              <button
                onClick={() => setActiveCategory('trials')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeCategory === 'trials'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'bg-[#0d0d16] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                🎬 {isTr ? 'Denemeler & PDF' : 'Trials & PDFs'}
              </button>
              <button
                onClick={() => setActiveCategory('security')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeCategory === 'security'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-500/20'
                    : 'bg-[#0d0d16] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                🛡️ {isTr ? 'Güvenlik & Wi-Fi' : 'Security & Wi-Fi'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 flex-1">
        {/* Back to Home Button */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-all text-xs font-bold"
          >
            <span>← {isTr ? 'Ana Sayfaya Dön (Posta Kutuma Git)' : 'Back to Home (Go to Inbox)'}</span>
          </Link>
          <span className="text-xs text-slate-500">
            {isTr ? 'Canlı e-posta alımı sadece Ana Sayfada aktiftir.' : 'Live mailbox receiver active on Home.'}
          </span>
        </div>

        {/* Services Cards Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-orange-400" />
              <span>{isTr ? `Seçilen Servisler (${filteredItems.length})` : `Selected Services (${filteredItems.length})`}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const itemTitle = isTr ? item.titleTr : item.titleEn;
              const itemDesc = isTr ? item.descTr : item.descEn;
              const features = isTr ? item.featuresTr : item.featuresEn;

              return (
                <div
                  key={item.id}
                  className="cyber-card bg-gradient-to-b from-[#12121e]/90 to-[#0a0a10]/90 border border-slate-800/80 rounded-2xl p-6 transition-all flex flex-col justify-between group relative"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="cyber-badge px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/[0.06] text-orange-300 border border-orange-500/20">
                        {item.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                        {itemTitle}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                        {itemDesc}
                      </p>
                    </div>

                    <ul className="space-y-1.5 pt-2 border-t border-slate-800/60">
                      {features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-[11px] text-slate-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link
                      to={`/temp-mail-for-${item.id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#161624] border border-slate-700/60 hover:border-orange-500/50 hover:bg-orange-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 group/btn"
                    >
                      <span>{isTr ? 'Hemen Kullan' : 'Use Now'}</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer lang={lang} />
    </div>
  );
};

export default ServicesCatalogPage;
