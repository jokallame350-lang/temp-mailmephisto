import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import App from '../App';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { SEOContent } from '../components/SEOContent';
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
  },
  discounts: {
    id: 'discounts',
    name: 'İndirim Kuponları & E-Ticaret',
    badge: '🎟️ Promo Codes & Deals',
    color: 'from-orange-600 to-amber-600',
    titleTr: 'İndirim Kuponu & İlk Alışveriş Kodu Almak İçin Geçici Mail',
    titleEn: 'Temp Mail for Discount Codes & First-Order Promo Claims',
    descriptionTr: 'E-ticaret sitelerinin "E-postanızı girin %15 indirim kazanın" kampanyaları için kişisel mailinizi vermeden anında kullan-at e-posta oluşturun.',
    descriptionEn: 'Claim first-order promotional codes and discount vouchers instantly without sacrificing your personal inbox to marketing spam.',
    whyTr: [
      'Ana e-postanızı mağazaların günlük reklam ve kampanya bombardımanından koruyun.',
      'Farklı indirim kodları için istediğiniz kadar tek kullanımlık adres üretin.',
      'Aktivasyon veya kupon maili 2 saniyede ekranınıza düşsün.'
    ],
    whyEn: [
      'Protect your main inbox from endless store marketing newsletters.',
      'Generate unlimited addresses to claim promo codes repeatedly.',
      'Coupon links and code emails land on your screen in 2 seconds.'
    ],
    faqsTr: [
      { q: 'İndirim kodunu nasıl alırım?', a: 'Mağazanın kayıt formuna MephistoMail adresinizi yazın. Kupon maili 1-3 saniyede ekranınızda görünecektir.' }
    ],
    faqsEn: [
      { q: 'How fast do promo code emails arrive?', a: 'Promo code emails land in your live inbox in under 3 seconds.' }
    ]
  },
  'free-trials': {
    id: 'free-trials',
    name: 'Ücretsiz Deneme (Free Trials)',
    badge: '🎬 Subscription Trials',
    color: 'from-purple-600 to-pink-600',
    titleTr: 'Ücretsiz Deneme Süreleri (Free Trial) İçin Geçici E-posta',
    titleEn: 'Temp Mail for Free Trial Subscriptions & SaaS Testing',
    descriptionTr: 'Canva, Adobe, VPN ve dijital servislerin 7-14 günlük ücretsiz deneme üyeliklerini kişisel mailinizi riske atmadan başlatın.',
    descriptionEn: 'Start 7-day or 14-day free trials on SaaS, design, and VPN tools without cluttering your primary email with subscription alerts.',
    whyTr: [
      'Ücretsiz deneme sürelerini ana adresinizi vermeden deneyin.',
      'Deneme süresi bittiğinde otomatik iptal edemeseniz bile spam maillerden korunun.',
      'Otomatik doğrulama (Auto-Verify) kalkanı onay linklerini arka planda hemen tıklar.'
    ],
    whyEn: [
      'Test premium software tiers without exposing your real email address.',
      'Avoid unwanted recurring marketing follow-ups after trial period ends.',
      'Auto-Verify engine handles activation link handshakes automatically.'
    ],
    faqsTr: [
      { q: 'Otomatik doğrulama deneme üyeliklerinde çalışır mı?', a: 'Evet, Auto-Verify özelliğimiz üyelik onay bağlantılarını arka planda otomatik tıklar.' }
    ],
    faqsEn: [
      { q: 'Does Auto-Verify work with free trial activation links?', a: 'Yes, our background DOM engine automatically processes confirmation link handshakes.' }
    ]
  },
  'wifi-login': {
    id: 'wifi-login',
    name: 'Wi-Fi & Hotspot Girişi',
    badge: '🌐 Wi-Fi Access Shield',
    color: 'from-cyan-600 to-blue-600',
    titleTr: 'Havaalanı, Kafe & Otel Wi-Fi Girişleri İçin Kullan-At Mail',
    titleEn: 'Temp Mail for Airport, Hotel & Cafe Wi-Fi Captive Portals',
    descriptionTr: 'Havaalanı, AVM, otel ve kafe Wi-Fi portal girişlerinde istenen zorunlu e-posta doğrulamasını spamsız 5 saniyede geçin.',
    descriptionEn: 'Bypass mandatory email verification screens on airport, hotel, and public Wi-Fi networks safely and anonymously.',
    whyTr: [
      'Kamuya açık Wi-Fi ağlarında kişisel e-postanızı ve kimliğinizi koruyun.',
      'Doğrulama linki veya 4 haneli SMS/E-posta kodunu anında ekranda görün.',
      'Fiziksel konumunuzun e-posta üzerinden takip edilmesini engelleyin.'
    ],
    whyEn: [
      'Protect your real identity and email address on public hotspot networks.',
      'Instantly view Wi-Fi confirmation PINs and verification buttons.',
      'Prevent location-tracking ad servers from profiling your visits.'
    ],
    faqsTr: [
      { q: 'Havaalanı Wi-Fi onay mailleri düşüyor mu?', a: 'Evet, kamu ağlarındaki tüm doğrulama mailleri 1-3 saniyede ekranınıza gelir.' }
    ],
    faqsEn: [
      { q: 'Do airport Wi-Fi confirmation emails land immediately?', a: 'Yes, portal verification emails arrive within 1 to 3 seconds.' }
    ]
  },
  downloads: {
    id: 'downloads',
    name: 'Ücretsiz PDF & Dosya İndirme',
    badge: '📚 PDF & File Shield',
    color: 'from-emerald-600 to-green-600',
    titleTr: 'Ücretsiz PDF, E-Kitap ve Dosya İndirmek İçin Sahte Mail',
    titleEn: 'Temp Mail for Free eBook, PDF & File Downloads',
    descriptionTr: 'E-Kitap, PDF raporu ve dosya indirmek için e-posta adresi şart koşan sitelerden güvenle dosya indirin.',
    descriptionEn: 'Download free whitepapers, PDFs, and eBooks from websites requiring an email address without risking your personal inbox.',
    whyTr: [
      'İndirme linki içeren mailleri anında görüntüleyin ve dosyayı kaydedin.',
      'Rehber ve şablon indirme sitelerinin e-bülten tuzağına düşmeyin.',
      'Tek kullanımlık adresi işiniz bitince kapatın.'
    ],
    whyEn: [
      'Receive download links and file attachments instantly.',
      'Avoid newsletter traps when grabbing free templates and guides.',
      'Volatile RAM storage deletes all downloaded trace data on tab close.'
    ],
    faqsTr: [
      { q: 'Maildeki indirme bağlantısına tıklayabilir miyim?', a: 'Evet, MephistoMail indirme linklerini ve eylem butonlarını doğrudan öne çıkarır.' }
    ],
    faqsEn: [
      { q: 'Can I click download links inside incoming emails?', a: 'Yes! Action links and download buttons are extracted and highlighted automatically.' }
    ]
  },
  gaming: {
    id: 'gaming',
    name: 'Oyun & Yan Hesaplar',
    badge: '🎮 Gaming & Alt Accounts',
    color: 'from-violet-600 to-indigo-600',
    titleTr: 'Oyun & Yan Hesaplar (Steam, Epic, Twitch) İçin Temp Mail',
    titleEn: 'Temp Mail for Gaming, Steam, Epic Games & Alt Accounts',
    descriptionTr: 'Steam, Epic Games, Twitch Drop ödülleri ve oyun içi yan hesaplar (Alt Accounts) için temiz kullan-at mail adresi edinin.',
    descriptionEn: 'Create secondary gaming profiles for Steam, Epic Games, Roblox, and Twitch Drop reward claims without primary email exposure.',
    whyTr: [
      'Yan oyun profillerinizi asıl kimliğinizden tamamen ayırın.',
      'Twitch drop ve oyun içi hediye kodlarını anında kopyalayın.',
      'Oyun sunucu spamlerinden korunun.'
    ],
    whyEn: [
      'Keep secondary game profiles isolated from your primary identity.',
      'Copy Twitch drop codes and reward keys in real-time.',
      'Shield your primary inbox from game server newsletter noise.'
    ],
    faqsTr: [
      { q: 'Oyun doğrulama kodları ne zaman gelir?', a: 'Real-time WebSocket altyapısı ile kodlar 1-3 saniyede bildirime düşer.' }
    ],
    faqsEn: [
      { q: 'How fast do game security PINs arrive?', a: 'Powered by SSE & WebSockets, PINs arrive in sub-3 seconds.' }
    ]
  },
  'qa-testing': {
    id: 'qa-testing',
    name: 'Yazılım Testi & QA Otomasyonu',
    badge: '🧪 QA & Dev Testing',
    color: 'from-amber-600 to-red-600',
    titleTr: 'Yazılım Testi & QA Otomasyonu İçin Geçici E-posta',
    titleEn: 'Developer Temp Mail for QA Testing & Automation Flows',
    descriptionTr: 'Yazılımcılar ve QA test mühendisleri için kayıt akışları, şifre sıfırlama ve bildirim testlerine özel kullan-at e-posta servisi.',
    descriptionEn: 'Empower QA testing engineers and developers with instant disposable email accounts for automated signup & auth testing.',
    whyTr: [
      'Cypress, Playwright ve Selenium test otomasyonlarında temiz e-posta kutusu kullanın.',
      'REST API & Webhook desteği ile e-posta içeriklerine programmatik ulaşın.',
      'Gelen mailleri .eml ve JSON formatında dışa aktarın.'
    ],
    whyEn: [
      'Seamlessly integrate with Cypress, Playwright, and Selenium test suites.',
      'Access raw JSON and .eml payloads for automated validation.',
      'Programmatic Webhook notifications for instant test execution.'
    ],
    faqsTr: [
      { q: 'Test otomasyonu için API sunuyor musunuz?', a: 'Evet, /api-docs sayfamızdan REST API entegrasyon dokümanına erişebilirsiniz.' }
    ],
    faqsEn: [
      { q: 'Is there an API for test automation?', a: 'Yes, check out our /api-docs page for full REST API details.' }
    ]
  },
  'spam-protection': {
    id: 'spam-protection',
    name: 'Spam Engelleme Kalkanı',
    badge: '🛡️ Ultimate Privacy Shield',
    color: 'from-red-600 to-rose-800',
    titleTr: 'Spam Koruması & Gizlilik Kalkanı Geçici E-posta',
    titleEn: 'Temp Mail for Spam Protection & Privacy Shielding',
    descriptionTr: 'Gerçek e-posta adresinizi vermeden internette gezinin. Reklam verenlerin, veri avcılarının ve spam robotlarının hedefi olmaktan kurtulun.',
    descriptionEn: 'Surf the web without revealing your real email address. Block marketers, data brokers, and spam bots instantly.',
    whyTr: [
      'Gelen maillerdeki casus takip piksellerini (1x1 Pixel Tracker) otomatik filtreleyin.',
      'Veri sızıntılarında asıl e-postanızın ele geçirilmesini engelleyin.',
      'Sadece RAM bellekte çalışan sıfır disk kayıt mimarisi.'
    ],
    whyEn: [
      'Automatically strip 1x1 tracking pixels and location trackers.',
      'Prevent your primary email from getting leaked in data breaches.',
      'Volatile RAM-only architecture guarantees complete zero-disk privacy.'
    ],
    faqsTr: [
      { q: 'Takip pikselleri nasıl engellenir?', a: 'MephistoMail gelen HTML içeriğini ayrıştırır ve casus takip piksellerini etkisiz hale getirir.' }
    ],
    faqsEn: [
      { q: 'How are tracking pixels blocked?', a: 'MephistoMail parses incoming HTML and automatically strips 1x1 spy pixels.' }
    ]
  },
  surveys: {
    id: 'surveys',
    name: 'Online Anket & Formlar',
    badge: '📝 Form Shield',
    color: 'from-teal-600 to-cyan-600',
    titleTr: 'Online Anket & Quiz Sonuçlarını Görmek İçin Sahte Mail',
    titleEn: 'Temp Mail for Online Surveys, Quizzes & Gated Content',
    descriptionTr: 'Anket çözdükten veya kişilik testi yaptıktan sonra "Sonucunuzu görmek için e-posta girin" diyen siteleri spamsız aşın.',
    descriptionEn: 'Bypass "Enter email to see your quiz/survey results" walls without getting spammed by marketers.',
    whyTr: [
      'Anket ve test sonuçlarınızı anında ekranda görün.',
      'Daha sonra gelecek pazarlama maillerini otomatik çöp kutusuna atın.',
      'Üyelik gerektirmeyen anlık anonim deneyim.'
    ],
    whyEn: [
      'View quiz and survey results instantly without inbox clutter.',
      'Prevent follow-up marketing pitches from polluting your primary email.',
      'Zero registration required — instant browser accessibility.'
    ],
    faqsTr: [
      { q: 'Anket sonucu maile düşüyor mu?', a: 'Evet, sonuç linkleri ve mailler 1-3 saniyede canlı kutunuza yansır.' }
    ],
    faqsEn: [
      { q: 'Will the survey results arrive immediately?', a: 'Yes, incoming result emails appear on your screen within seconds.' }
    ]
  },
  'crypto-airdrops': {
    id: 'crypto-airdrops',
    name: 'Kripto Airdrop & Web3',
    badge: '🪙 Crypto Airdrops',
    color: 'from-yellow-600 to-amber-600',
    titleTr: 'Kripto Airdrop & Whitelist Kayıtları İçin Anonim E-posta',
    titleEn: 'Temp Mail for Crypto Airdrops, Presales & NFT Whitelists',
    descriptionTr: 'Kripto projeleri, NFT lansmanları ve Airdrop whitelist kayıtları için anonim geçici e-posta oluşturun.',
    descriptionEn: 'Participate in Web3 airdrops, NFT presales, and token whitelists without exposing your primary email to phishing risks.',
    whyTr: [
      'Oltalama (Phishing) saldırılarına karşı ana e-postanızı ve cüzdan bilgilerinizi koruyun.',
      'Farklı airdrop görevleri için sınırsız temp mail adresi üretin.',
      'Gelen onay butonlarına akıllı eylem linki ile tek tıkla tıklayın.'
    ],
    whyEn: [
      'Shield your primary identity from Web3 phishing attempts and spam.',
      'Create unlimited email handles for multi-account testing.',
      'Auto-extract activation links for instant confirmation.'
    ],
    faqsTr: [
      { q: 'Airdrop onay linkleri çalışıyor mu?', a: 'Evet, gelen onay linkleri anında tespit edilir ve gösterilir.' }
    ],
    faqsEn: [
      { q: 'Do Web3 confirmation links work?', a: 'Yes, confirmation links are extracted instantly in real time.' }
    ]
  },
  classifieds: {
    id: 'classifieds',
    name: 'İkinci El İlan & İletişim',
    badge: '🏷️ Classifieds & Deals',
    color: 'from-stone-600 to-zinc-600',
    titleTr: 'İkinci El İlan & Alışveriş İletişimi İçin Gizli Mail',
    titleEn: 'Temp Mail for Online Marketplace & Classifieds Communication',
    descriptionTr: 'Sahibinden, Craigslist ve online ilan sitelerinde alıcı/satıcılarla iletişim kurarken kişisel e-posta adresinizi gizli tutun.',
    descriptionEn: 'Communicate with buyers and sellers on online marketplaces without revealing your personal email address.',
    whyTr: [
      'Yabancılarla iletişim kurarken gerçek e-postanızı ve adınızı gizleyin.',
      'Satış bittiğinde adresi tek tıkla silin.',
      'Outbound Mail özelliği ile anonim olarak yanıt verin.'
    ],
    whyEn: [
      'Hide your real identity when negotiating with buyers/sellers.',
      'Destroy the temporary handle in one click after deal completion.',
      'Reply anonymously using our RAM-only Outbound Mail feature.'
    ],
    faqsTr: [
      { q: 'İlan sahibine yanıt verebilir miyim?', a: 'Evet, MephistoMail Outbound Mail özelliği ile geçici mailiniz üzerinden yanıt gönderebilirsiniz.' }
    ],
    faqsEn: [
      { q: 'Can I reply to marketplace messages?', a: 'Yes! Use our Outbound Mail feature to send anonymous replies directly.' }
    ]
  },
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
          <App hideHeroBanner={true} hideSEOContent={true} hideFooter={true} />
        </div>

        {/* Step-by-step Custom Guide for this topic */}
        <section className="bg-gradient-to-b from-[#12121e]/80 to-[#0c0c14]/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2 font-['Sora']">
            <MessageSquare className="w-5 h-5 text-orange-400" />
            <span>{isTr ? `${data.name} İçin Adım Adım Kullanım Rehberi` : `Step-by-Step Guide for ${data.name}`}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-6">
            {isTr ? 'Kişisel e-posta adresinizi vermeden 4 kolay adımda işleminizi güvenle tamamlayın:' : 'Complete your registration securely in 4 simple steps without exposing your primary inbox:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#050508] p-4 rounded-xl border border-slate-800/60 relative">
              <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center text-xs font-black mb-3">1</span>
              <h3 className="text-xs font-bold text-white mb-1">{isTr ? 'Adresi Kopyalayın' : 'Copy Address'}</h3>
              <p className="text-[11px] text-slate-400 leading-normal">{isTr ? 'Yukarıdaki panoda otomatik oluşan geçici adresi Kopyala butonuna basarak alın.' : 'Click Copy to get your instant volatile email handle.'}</p>
            </div>
            <div className="bg-[#050508] p-4 rounded-xl border border-slate-800/60 relative">
              <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center text-xs font-black mb-3">2</span>
              <h3 className="text-xs font-bold text-white mb-1">{isTr ? `${data.name} Formuna Yapıştırın` : `Paste in ${data.name}`}</h3>
              <p className="text-[11px] text-slate-400 leading-normal">{isTr ? `${data.name} kayıt veya onay ekranındaki e-posta alanına bu adresi yapıştırın.` : `Paste the handle in the ${data.name} registration form.`}</p>
            </div>
            <div className="bg-[#050508] p-4 rounded-xl border border-slate-800/60 relative">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-black mb-3">3</span>
              <h3 className="text-xs font-bold text-white mb-1">{isTr ? 'Doğrulama Kodunu Alın' : 'Get OTP Code'}</h3>
              <p className="text-[11px] text-slate-400 leading-normal">{isTr ? 'Aktivasyon maili 1-3 saniyede kutunuza düşer, Auto-Verify linki otomatik tıklar.' : 'Verification code lands in 1-3s; Auto-Verify clicks action links.'}</p>
            </div>
            <div className="bg-[#050508] p-4 rounded-xl border border-slate-800/60 relative">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-black mb-3">4</span>
              <h3 className="text-xs font-bold text-white mb-1">{isTr ? 'Sıfır İzle Kapatın' : 'Zero Trace Exit'}</h3>
              <p className="text-[11px] text-slate-400 leading-normal">{isTr ? 'İşleminiz bittiğinde sekmeyi kapatın, tüm veriler RAM\'den tamamen silinsin.' : 'Close tab when done; volatile RAM storage wipes all traces.'}</p>
            </div>
          </div>
        </section>

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

        {/* Main SEO Content Article, SaaS Modules & Comparison Table */}
        <SEOContent lang={lang} />

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
