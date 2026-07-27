import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import App from '../App';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Language, translations } from '../translations';
import { ShieldCheck, MessageSquare, CheckCircle, Zap, ArrowRight, Info, HelpCircle } from 'lucide-react';

interface ServiceMailPageProps {
  lang: Language;
}

interface ServiceData {
  id: string;
  name: string;
  badge: string;
  color: string;
  titleTr: string;
  titleEn: string;
  descriptionTr: string;
  descriptionEn: string;
  whyTr: string[];
  whyEn: string[];
  faqsTr: { q: string; a: string }[];
  faqsEn: { q: string; a: string }[];
}

const SERVICES_MAP: Record<string, ServiceData> = {
  discord: {
    id: 'discord',
    name: 'Discord',
    badge: '🎮 Gaming & Community',
    color: 'from-indigo-600 to-purple-600',
    titleTr: 'Discord İçin Geçici E-posta (Temp Mail) - Anında Kod Alın',
    titleEn: 'Temp Mail for Discord - Instant Verification Code Generator',
    descriptionTr: 'Discord kayıtları ve sunucu doğrulamaları için anında kullan-at e-posta adresi oluşturun. İki Faktörlü Doğrulama (2FA) ve aktivasyon kodlarını saniyeler içinde alın.',
    descriptionEn: 'Generate instant disposable email addresses for Discord sign-ups and server verifications. Receive OTP codes in sub-3 seconds with zero logs.',
    whyTr: [
      'Ana e-postanızı oyun sunucularında ve Discord botlarında vermekten kurtulun.',
      'Saniyeler içinde 6 haneli Discord doğrulama kodunu alın.',
      'Çoklu Discord bot ve sunucu testleri için sınırsız geçici e-posta üretin.'
    ],
    whyEn: [
      'Avoid sharing your primary inbox with random Discord servers and bots.',
      'Receive 6-digit Discord verification codes within 2-3 seconds.',
      'Generate unlimited addresses for testing Discord bots and integrations.'
    ],
    faqsTr: [
      { q: 'Discord geçici e-posta adreslerini kabul ediyor mu?', a: 'Evet! MephistoMail sürekli güncellenen temiz domain listesi sunduğu için Discord doğrulama kodlarını sorunsuz şekilde alır.' },
      { q: 'Discord doğrulama kodum ne kadar sürede düşer?', a: 'WebSocket ve SSE altyapımız sayesinde doğrulama kodunuz 1 ila 3 saniye içinde ekranınızdaki bildirimde görünür.' }
    ],
    faqsEn: [
      { q: 'Does Discord accept temporary email addresses?', a: 'Yes! MephistoMail uses fresh, regularly rotated domains ensuring Discord verification emails arrive smoothly.' },
      { q: 'How fast will I get my Discord OTP code?', a: 'Our SSE and WebSocket real-time delivery ensures your 6-digit code arrives in 1 to 3 seconds.' }
    ]
  },
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT & OpenAI',
    badge: '🤖 AI Tools',
    color: 'from-emerald-600 to-teal-600',
    titleTr: 'ChatGPT & OpenAI İçin Geçici Mail - Ücretsiz Hesap Doğrulama',
    titleEn: 'Temp Mail for ChatGPT & OpenAI - Free Verification Email',
    descriptionTr: 'ChatGPT, OpenAI API ve Claude kayıtları için güvenli geçici mail oluşturun. Kişisel e-posta adresinizi yapay zeka araçlarına bağlamadan anonim kalın.',
    descriptionEn: 'Create secure disposable email addresses for ChatGPT, OpenAI API, and Claude registrations. Protect your identity while using AI tools.',
    whyTr: [
      'ChatGPT ve OpenAI API için kişisel e-posta kullanmanıza gerek kalmaz.',
      'Birden fazla test hesabı açarak API ve AI sorgu limitlerini aşabilirsiniz.',
      'E-posta gelen kutunuza pazarlama ve güncelleme mailleri gelmesini önler.'
    ],
    whyEn: [
      'No need to expose your primary email address for ChatGPT or OpenAI sign-ups.',
      'Easily test multiple AI developer accounts without cluttering your main inbox.',
      'Instant OTP detection automatically highlights your OpenAI verification code.'
    ],
    faqsTr: [
      { q: 'ChatGPT doğrulama e-postası hemen gelir mi?', a: 'Evet, OpenAI doğrulama linkleri 1-3 saniye içinde MephistoMail gelen kutunuza otomatik düşer.' },
      { q: 'Geçici e-posta ile OpenAI API hesabı açabilir miyim?', a: 'Evet, e-posta doğrulama adımını başarıyla geçebilirsiniz.' }
    ],
    faqsEn: [
      { q: 'Does ChatGPT send the confirmation email immediately?', a: 'Yes, OpenAI verification links land in your MephistoMail inbox within seconds.' },
      { q: 'Can I use this for OpenAI API testing?', a: 'Absolutely. It is ideal for developer testing without polluting your work email.' }
    ]
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    badge: '📸 Social Media',
    color: 'from-pink-600 to-rose-600',
    titleTr: 'Instagram İçin Geçici E-posta - Anonim Hesap Doğrulama',
    titleEn: 'Temp Mail for Instagram - Anonymous Account Verification',
    descriptionTr: 'İkinci Instagram hesapları veya test profilleri oluştururken kendi e-postanızı vermeyin. Anında kullan-at e-posta ile Instagram aktivasyon kodunu alın.',
    descriptionEn: 'Create secondary Instagram profiles without linking your personal email. Receive Instagram activation codes instantly.',
    whyTr: [
      'Kişisel e-postanızı anonim veya işletme Instagram hesaplarına bağlamayın.',
      'Instagram 6 haneli doğrulama kodlarını anında Toast bildirimi ile kopyalayın.',
      'Veri sızıntılarında spam e-posta almaktan korunun.'
    ],
    whyEn: [
      'Keep your main email detached from side or test Instagram accounts.',
      'Copy 6-digit Instagram security codes with a single click.',
      'Zero log policy guarantees complete privacy.'
    ],
    faqsTr: [
      { q: 'Instagram geçici maile doğrulama kodu gönderiyor mu?', a: 'Evet, MephistoMail alan adları Instagram e-posta doğrulaması ile %100 uyumludur.' }
    ],
    faqsEn: [
      { q: 'Does Instagram send verification codes to temp mail?', a: 'Yes, MephistoMail rotated domains work seamlessly with Instagram email verification.' }
    ]
  },
  spotify: {
    id: 'spotify',
    name: 'Spotify',
    badge: '🎵 Music Streaming',
    color: 'from-green-600 to-emerald-700',
    titleTr: 'Spotify Ücretsiz Deneme İçin Geçici Mail Generator',
    titleEn: 'Temp Mail for Spotify - Free Trial & Account Generator',
    descriptionTr: 'Spotify hesabı açarken spam e-postalardan kaçının. Anında kullan-at e-posta ile müzik keyfini kişisel mailinizi riske atmadan çıkarın.',
    descriptionEn: 'Sign up for Spotify without giving away your primary inbox. Get instant verification for seamless music streaming.',
    whyTr: [
      'Pazarlama e-postalarından ve sürekli kampanya bildirimlerinden kurtulun.',
      'Tek tıkla yeni Spotify test hesabı oluşturun.',
      'Hesap aktivasyon linkine anında ulaşın.'
    ],
    whyEn: [
      'Prevent endless promotional emails from clogging your primary inbox.',
      'Quickly create Spotify accounts for device testing.',
      'Instant action link extraction lets you verify your account in one click.'
    ],
    faqsTr: [
      { q: 'Spotify onay linki hemen geliyor mu?', a: 'Evet, MephistoMail akıllı buton tespiti sayesinde onay linkini otomatik ayıklar ve gösterir.' }
    ],
    faqsEn: [
      { q: 'Will I get the Spotify activation button automatically?', a: 'Yes! Our Smart Action Link feature highlights the Spotify confirmation button instantly.' }
    ]
  },
  netflix: {
    id: 'netflix',
    name: 'Netflix',
    badge: '🎬 Streaming',
    color: 'from-red-600 to-rose-700',
    titleTr: 'Netflix Kayıt İçin Geçici E-posta - Spam Korumalı Temp Mail',
    titleEn: 'Temp Mail for Netflix Sign-ups - Privacy Shield Generator',
    descriptionTr: 'Netflix ve yayın servisleri için geçici e-posta adresi edinin. Gerçek e-postanızı reklam verenlerden koruyun.',
    descriptionEn: 'Generate disposable email addresses for Netflix and streaming platform registrations.',
    whyTr: [
      'Üçüncü taraf reklam verenlerin mailinizi ele geçirmesini engeller.',
      'Anında kullan-at adres oluşturun.'
    ],
    whyEn: [
      'Protects your inbox from third-party advertising databases.',
      'Generates instant disposable addresses with zero trace.'
    ],
    faqsTr: [
      { q: 'Netflix kayıt doğrulaması çalışıyor mu?', a: 'Evet, gelen onay mailleri anında kutunuzda görünür.' }
    ],
    faqsEn: [
      { q: 'Does Netflix confirmation work?', a: 'Yes, incoming confirmation messages appear live on your screen.' }
    ]
  },
  roblox: {
    id: 'roblox',
    name: 'Roblox',
    badge: '🎮 Gaming',
    color: 'from-blue-600 to-cyan-600',
    titleTr: 'Roblox İçin Geçici E-posta (Temp Mail) - Anında Kod Alın',
    titleEn: 'Temp Mail for Roblox - Instant Account Security',
    descriptionTr: 'Roblox oyuncu hesapları ve alt profiller için kullan-at e-posta oluşturun.',
    descriptionEn: 'Generate temporary email addresses for Roblox gaming accounts and sub-profiles.',
    whyTr: [
      'Oyuncu hesaplarınızı ana maile bağlamadan güvende tutun.',
      'Roblox 6 haneli pin kodlarını anında kopyalayın.'
    ],
    whyEn: [
      'Keep secondary gaming profiles decoupled from your main identity.',
      'Instant OTP detection auto-extracts 6-digit Roblox PINs.'
    ],
    faqsTr: [
      { q: 'Roblox PIN mailleri ne kadar sürede gelir?', a: 'Real-time SSE altyapısı ile 1-3 saniyede ulaşır.' }
    ],
    faqsEn: [
      { q: 'How fast do Roblox PIN emails arrive?', a: 'Powered by SSE, emails land in 1-3 seconds.' }
    ]
  }
};

export const ServiceMailPage: React.FC<ServiceMailPageProps> = ({ lang }) => {
  const { service = 'discord' } = useParams<{ service: string }>();
  const data = SERVICES_MAP[service.toLowerCase()] || SERVICES_MAP.discord;

  const isTr = lang === 'tr';
  const title = isTr ? data.titleTr : data.titleEn;
  const desc = isTr ? data.descriptionTr : data.descriptionEn;
  const whyList = isTr ? data.whyTr : data.whyEn;
  const faqs = isTr ? data.faqsTr : data.faqsEn;

  useEffect(() => {
    document.title = `${title} | MephistoMail`;

    // FAQ Schema JSON-LD Inject
    const schemaId = 'faq-jsonld-service';
    let script = document.getElementById(schemaId);
    if (!script) {
      script = document.createElement('script');
      script.id = schemaId;
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(f => ({
        '@type': 'Question',
        'name': f.q,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': f.a
        }
      }))
    });
  }, [title, faqs]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-red-300">
      <SEOHead lang={lang} />

      {/* Hero Service Banner */}
      <header className="border-b border-slate-800/80 bg-gradient-to-b from-[#12121e] to-[#0a0a0f] py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>{data.badge}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {title}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl">
              {desc}
            </p>
          </div>
          <Link
            to="/"
            className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium text-sm transition-all shadow-lg shadow-red-500/25 flex items-center gap-2"
          >
            <span>{isTr ? 'Tüm Servisler' : 'All Services'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Mailbox Dashboard Component */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-12">
        <div className="bg-[#12121e]/90 border border-slate-800/90 rounded-2xl shadow-2xl p-4 sm:p-6 backdrop-blur-xl">
          <App />
        </div>

        {/* Why Use for this Service Section */}
        <section className="grid md:grid-cols-2 gap-8 items-start">
          <div className="bg-[#12121e]/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-red-400" />
              <span>{isTr ? `Neden ${data.name} İçin Kullan-At Mail?` : `Why Use Temp Mail for ${data.name}?`}</span>
            </h2>
            <ul className="space-y-3">
              {whyList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick FAQ Card */}
          <div className="bg-[#12121e]/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              <span>{isTr ? 'Sıkça Sorulan Sorular' : 'Frequently Asked Questions'}</span>
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                  <h3 className="text-sm font-semibold text-slate-200">{faq.q}</h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cross-Links to other Services */}
        <section className="border-t border-slate-800/80 pt-8">
          <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
            {isTr ? 'Diğer Popüler Servisler İçin Temp Mail' : 'Temp Mail for Other Popular Platforms'}
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.values(SERVICES_MAP).map(item => (
              <Link
                key={item.id}
                to={`/temp-mail-for-${item.id}`}
                className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                  item.id === data.id
                    ? 'bg-red-500/20 border-red-500/50 text-red-300'
                    : 'bg-[#12121e] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer lang={lang} />
    </div>
  );
};

export default ServiceMailPage;
