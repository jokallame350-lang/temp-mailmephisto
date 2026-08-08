import React, { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
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
  route?: string;
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
  students: {
    id: 'students',
    name: 'Student Perks & .EDU Hub',
    badge: '🎓 Student & Developer Perks',
    color: 'from-blue-600 to-indigo-600',
    titleTr: 'Öğrenci İndirimleri & .EDU Mail Rehberi - GitHub Pack, Notion, Spotify & JetBrains',
    titleEn: 'Student Perks & .EDU Mail Guide - GitHub Student Pack, Notion, Spotify & JetBrains',
    descriptionTr: 'Öğrenciler ve yazılımcılar için GitHub Student Developer Pack, Notion Plus, Figma Pro, JetBrains ve Spotify öğrenci indirimlerini doğrulama rehberi.',
    descriptionEn: 'Verification guide and student discount hub for GitHub Student Developer Pack, Notion Plus, Figma Pro, JetBrains, and Spotify Student.',
    whyTr: [
      'GitHub Student Developer Pack ($200+ Değerinde Copilot ve Azure Kredisi) doğrulama rehberi.',
      'Notion Plus, Figma Pro ve JetBrains Ultimate öğrenci lisanslarını anında aktifleştirin.',
      'Kişisel e-posta kutunuzu öğrenci bültenleri ve kampanya spamlerinden koruyun.'
    ],
    whyEn: [
      'GitHub Student Developer Pack ($200+ Value with Copilot & Azure Credits) guide.',
      'Instantly activate Notion Plus, Figma Pro, and JetBrains Ultimate student licenses.',
      'Protect your main inbox from student newsletter spam and marketing drips.'
    ],
    faqsTr: [
      { q: '.EDU mail ile GitHub Student Pack nasıl doğrulanır?', a: 'Üniversiteniz tarafından verilen resmi .edu adresinizi veya partner alan adını doğrulama ekranına girerek gelen 6 haneli kodu saniyeler içinde MephistoMail kutunuzdan kopyalayabilirsiniz.' },
      { q: 'Özel üniversite alan adımı MephistoMail üzerinde kullanabilir miyim?', a: 'Evet! Sitemizdeki "Özel Domain" özelliğini kullanarak kendi alan adınızı saniyeler içinde bağlayabilir ve maillerinizi alabilirsiniz.' }
    ],
    faqsEn: [
      { q: 'How to verify GitHub Student Pack with a student email?', a: 'Enter your university email address or partner domain on the student portal and copy the 6-digit OTP code directly from MephistoMail.' },
      { q: 'Can I use my custom university domain with MephistoMail?', a: 'Yes! Using our Custom Domain feature, you can connect any domain name to receive temp emails.' }
    ]
  },
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
  'claude-ai': {
    id: 'claude-ai',
    name: 'Claude AI & Anthropic',
    badge: '🤖 AI Tools',
    color: 'from-amber-700 to-orange-700',
    titleTr: 'Claude AI İçin Geçici Mail (Temp Mail) - Anthropic Hesap Açma',
    titleEn: 'Temp Mail for Claude AI & Anthropic - Instant Verification',
    descriptionTr: 'Claude AI, Anthropic Console ve AI geliştirici hesapları için anında kullan-at e-posta adresi oluşturun. OTP kodlarını saniyeler içinde alın.',
    descriptionEn: 'Generate instant disposable email handles for Claude AI, Anthropic Console, and LLM testing accounts without exposing your primary inbox.',
    whyTr: [
      'Anthropic ve Claude AI kayıtlarında kişisel e-posta adresinizi gizleyin.',
      'Çoklu AI test ve geliştirici hesaplarını spam riski olmadan yönetin.',
      'Doğrulama mailindeki onay butonunu akıllı link tespitiyle anında tıklayın.'
    ],
    whyEn: [
      'Keep your primary email private when registering for Claude AI and Anthropic.',
      'Create multiple developer & prompting sandbox accounts seamlessly.',
      'Extract verification links instantly with zero log overhead.'
    ],
    faqsTr: [
      { q: 'Claude AI doğrulama maili hemen geliyor mu?', a: 'Evet, Anthropic onay mailleri 1-3 saniyede MephistoMail kutunuza yansır.' }
    ],
    faqsEn: [
      { q: 'Does Claude AI send verification emails immediately?', a: 'Yes! Anthropic confirmation links land in your inbox within 1 to 3 seconds.' }
    ]
  },
  midjourney: {
    id: 'midjourney',
    name: 'Midjourney & AI Art',
    badge: '🎨 AI Image Generators',
    color: 'from-purple-600 to-indigo-700',
    titleTr: 'Midjourney İçin Geçici Mail - Ücretsiz Görsel Üretim Hesapları',
    titleEn: 'Temp Mail for Midjourney - Free AI Image Account Generator',
    descriptionTr: 'Midjourney, Discord ve AI görsel üretim araçları için anonim e-posta adresi edinin. Kişisel mailinizi vermeden yeni hesaplar açın.',
    descriptionEn: 'Generate volatile temporary email addresses for Midjourney and Discord AI generation channels without spam.',
    whyTr: [
      'Midjourney ve Discord AI bot kayıtlarında kişisel gelen kutunuzu koruyun.',
      'Yeni AI görsel deneme hesaplarını saniyeler içinde doğrulayın.',
      'Spam ve pazarlama duyurularını otomatik engelleyin.'
    ],
    whyEn: [
      'Shield your main inbox from AI art platform promotional blasts.',
      'Verify new Midjourney test profiles in under 3 seconds.',
      'RAM-only volatile storage deletes all records on session close.'
    ],
    faqsTr: [
      { q: 'Midjourney doğrulama kodu çalışıyor mu?', a: 'Evet, Discord ve Midjourney üzerinden gelen 6 haneli pinler anında ekranda görünür.' }
    ],
    faqsEn: [
      { q: 'Does Midjourney OTP verification work?', a: 'Yes! Verification PINs arrive live on your screen in real time.' }
    ]
  },
  canva: {
    id: 'canva',
    name: 'Canva & Graphic Design',
    badge: '🎨 Design & Video',
    color: 'from-cyan-500 to-teal-600',
    titleTr: 'Canva Pro & Tasarım Araçları İçin Geçici Mail',
    titleEn: 'Temp Mail for Canva Pro & Graphic Design Tool Sign-ups',
    descriptionTr: 'Canva, Figma ve grafik tasarım araçlarına kayıt olurken kişisel e-postanızı gizli tutun. Ücretsiz deneme üyeliklerini anında başlatın.',
    descriptionEn: 'Create instant temporary emails for Canva, Figma, and design platform sign-ups without clogged inboxes.',
    whyTr: [
      'Canva ücretsiz deneme ve tasarım indirmelerinde spam maillerden kurtulun.',
      'Tasarım şablonlarını spamsız anında indirin.',
      'Auto-Verify kalkanı ile onay linkini otomatik aktifleştirin.'
    ],
    whyEn: [
      'Avoid endless design updates in your personal inbox.',
      'Download graphic assets and templates anonymously.',
      'Background Auto-Verify engine processes activation link handshakes.'
    ],
    faqsTr: [
      { q: 'Canva doğrulama linki hemen gelir mi?', a: 'Evet, Canva aktivasyon linkleri 1-3 saniyede kutunuza düşer.' }
    ],
    faqsEn: [
      { q: 'How fast do Canva confirmation emails land?', a: 'Confirmation links arrive within 1 to 3 seconds.' }
    ]
  },
  epicgames: {
    id: 'epicgames',
    name: 'Epic Games Store',
    badge: '🎮 Gaming & Store',
    color: 'from-[#2a2a2a] to-[#121212]',
    titleTr: 'Epic Games İçin Geçici E-posta - Anında 2FA & Kod Alın',
    titleEn: 'Temp Mail for Epic Games Store - Instant 2FA & Account Generator',
    descriptionTr: 'Epic Games Store ücretsiz oyun talepleri, alt hesaplar ve 2FA güvenlik kodları için kullan-at mail adresi edinin.',
    descriptionEn: 'Generate instant temporary email addresses for Epic Games free game claims, alt profiles, and 2FA codes.',
    whyTr: [
      'Epic Games ücretsiz oyun ve hediyelerini ana mailinizi vermeden toplayın.',
      '2FA güvenlik kodlarını 2 saniyede ekranınızda görüntüleyin.',
      'Sınırsız oyun içi test hesabı açın.'
    ],
    whyEn: [
      'Claim weekly Epic Games Store free games without inbox clutter.',
      'Receive 2FA security codes in sub-3 seconds.',
      'Isolate secondary gaming handles from your primary identity.'
    ],
    faqsTr: [
      { q: 'Epic Games 2FA mailleri düşüyor mu?', a: 'Evet, Epic Games güvenlik kodları ve 2FA mailleri 1-3 saniyede canlı kutunuza yansır.' }
    ],
    faqsEn: [
      { q: 'Do Epic Games 2FA security codes arrive quickly?', a: 'Yes, 2FA codes land live on screen in 1 to 3 seconds.' }
    ]
  },
  twitch: {
    id: 'twitch',
    name: 'Twitch Drops & Live',
    badge: '📺 Streaming & Drops',
    color: 'from-purple-700 to-violet-900',
    titleTr: 'Twitch Yayın & Drop Ödülleri İçin Geçici E-posta',
    titleEn: 'Temp Mail for Twitch Drops, Live Streams & Alt Profiles',
    descriptionTr: 'Twitch yayın hesapları, Drop ödül toplamaları ve sohbet hesapları için anonim geçici e-posta oluşturun.',
    descriptionEn: 'Claim Twitch Drop rewards and create streamer alt handles with zero inbox risk.',
    whyTr: [
      'Twitch Drop ganimetlerini asıl e-postanızı bağlamadan toplayın.',
      'Sohbet ve topluluk yan hesaplarını hızlıca açın.',
      'Pazarlama maillerini otomatik çöp kutusuna yollayın.'
    ],
    whyEn: [
      'Collect Twitch Drop game loot safely.',
      'Quickly launch secondary stream community handles.',
      'Prevent promo spam from filling your personal inbox.'
    ],
    faqsTr: [
      { q: 'Twitch onay kodunu hemen alabilir miyim?', a: 'Evet, Twitch 6 haneli doğrulama pinleri anında ekranda görünür.' }
    ],
    faqsEn: [
      { q: 'Can I get Twitch verification PINs right away?', a: 'Yes, 6-digit Twitch security PINs arrive in sub-3 seconds.' }
    ]
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok Creator & Ads',
    badge: '🎵 Social Media & Video',
    color: 'from-pink-500 to-cyan-500',
    titleTr: 'TikTok İçin Geçici Mail - Anonim Profil & Reklam Hesabı',
    titleEn: 'Temp Mail for TikTok Creator & Business Ad Accounts',
    descriptionTr: 'TikTok yan hesapları, Reklam Yöneticisi testleri ve içerik üretici profilleri için geçici mail adresi oluşturun.',
    descriptionEn: 'Create secondary TikTok profiles and Ad Manager testing handles without personal inbox exposure.',
    whyTr: [
      'TikTok İşletme ve Reklam Yöneticisi hesaplarını spamsız test edin.',
      '6 haneli TikTok giriş ve kayıt OTP kodlarını 2 saniyede kopyalayın.',
      'Kişisel verilerinizi sosyal medya veri madencilerinden gizleyin.'
    ],
    whyEn: [
      'Test TikTok Ad Manager features without linking main work emails.',
      'Copy 6-digit TikTok auth codes in 2 seconds.',
      'Keep your main identity detached from social media algorithms.'
    ],
    faqsTr: [
      { q: 'TikTok doğrulama kodu ne kadar sürede gelir?', a: 'TikTok onay mailleri 1-3 saniye içinde canlı bildirimle ekranınıza ulaşır.' }
    ],
    faqsEn: [
      { q: 'How fast do TikTok verification codes arrive?', a: 'TikTok OTP emails land on your screen in 1 to 3 seconds.' }
    ]
  },
  steam: {
    id: 'steam',
    name: 'Steam Gaming',
    badge: '🎮 Steam Guard & Gaming',
    color: 'from-[#171a21] to-[#1b2838]',
    titleTr: 'Steam İçin Geçici Mail - Steam Guard & Yan Oyun Hesapları',
    titleEn: 'Temp Mail for Steam Guard & Gaming Alt Accounts',
    descriptionTr: 'Steam Guard doğrulama kodları, takas onayları ve oyun içi alt profiller için anonim kullan-at e-posta edinin.',
    descriptionEn: 'Get instant temporary email addresses for Steam Guard verification, trade confirms, and gaming alt accounts.',
    whyTr: [
      'Steam Guard 5 haneli güvenlik kodlarını 2 saniyede alın.',
      'Yan oyun ve smurf hesaplarınızı ana mailinizden ayırın.',
      'Veri sızıntılarında Steam kimliğinizi koruyun.'
    ],
    whyEn: [
      'Fetch 5-character Steam Guard auth codes in 2 seconds.',
      'Isolate smurf and alt gaming handles from work/personal email.',
      'Maintain strict zero-log security across sessions.'
    ],
    faqsTr: [
      { q: 'Steam Guard e-posta kodları çalışıyor mu?', a: 'Evet, Steam Guard güvenlik kodları anında otomatik tespit edilir ve öne çıkarılır.' }
    ],
    faqsEn: [
      { q: 'Does Steam Guard email OTP work?', a: 'Yes! Steam Guard codes are extracted automatically upon arrival.' }
    ]
  },
  github: {
    id: 'github',
    name: 'GitHub & Developer Accounts',
    badge: '💻 Developer Platform',
    color: 'from-slate-700 to-slate-900',
    titleTr: 'GitHub İçin Geçici Mail - Geliştirici & Test Hesapları',
    titleEn: 'Temp Mail for GitHub - Developer & CI/CD Testing Accounts',
    descriptionTr: 'GitHub, GitLab ve Bitbucket organizasyon testlerinde şirket adresinizi koruyun. Anonim geliştirici hesapları oluşturun.',
    descriptionEn: 'Protect your professional developer email during GitHub organization testing, bot creation, and CI/CD runs.',
    whyTr: [
      'CI/CD ve bot hesaplarında şirket e-posta kutunuzu kirletmeyin.',
      'GitHub 2FA ve doğrulama kodlarını anında kopyalayın.',
      'Açık kaynak ve test projelerinde gizli kalın.'
    ],
    whyEn: [
      'Keep your work email clean when testing automated bots and repos.',
      'Copy GitHub 2FA codes in sub-3 seconds.',
      'Zero-disk RAM storage ensures total privacy.'
    ],
    faqsTr: [
      { q: 'GitHub üyelik mailleri düşüyor mu?', a: 'Evet, GitHub doğrulama ve OTP mailleri 1-3 saniyede kutunuza yansır.' }
    ],
    faqsEn: [
      { q: 'Do GitHub activation emails arrive live?', a: 'Yes, GitHub OTPs and confirmation links arrive in 1 to 3 seconds.' }
    ]
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon & AWS Free Tier',
    badge: '🛒 Shopping & Cloud',
    color: 'from-amber-500 to-orange-600',
    titleTr: 'Amazon Prime & AWS İçin Geçici Mail Generator',
    titleEn: 'Temp Mail for Amazon Prime & AWS Free Tier Accounts',
    descriptionTr: 'Amazon alışveriş, Prime video denemeleri ve AWS bulut testleri için spamsız kullan-at e-posta üretin.',
    descriptionEn: 'Generate disposable email addresses for Amazon shopping claims, Prime Video trials, and AWS sandbox environments.',
    whyTr: [
      'Amazon reklam ve pazarlama duyurularından ana mailinizi koruyun.',
      'AWS bulut test ortamları için geçici geliştirici mailleri kullanın.',
      'OTP onay kodlarını anında kopyalayın.'
    ],
    whyEn: [
      'Shield your primary inbox from constant promotional emails.',
      'Use volatile handles for AWS sandbox developer testing.',
      'Instantly extract Amazon OTP security codes.'
    ],
    faqsTr: [
      { q: 'Amazon OTP kodu hemen geliyor mu?', a: 'Evet, Amazon 6 haneli güvenlik kodları 1-3 saniyede ekrana gelir.' }
    ],
    faqsEn: [
      { q: 'Does Amazon send the OTP code instantly?', a: 'Yes, 6-digit Amazon OTPs land on your screen within seconds.' }
    ]
  },
  vinted: {
    id: 'vinted',
    name: 'Vinted Shopping',
    badge: '👗 Second-Hand Fashion',
    color: 'from-teal-600 to-emerald-700',
    titleTr: 'Vinted İkinci El Alışveriş İçin Geçici E-posta',
    titleEn: 'Temp Mail for Vinted Marketplace & Seller Accounts',
    descriptionTr: 'Vinted ikinci el kıyafet ve alışveriş platformunda alıcı/satıcılarla gizli kalın. Pazarlama spamlerinden korunun.',
    descriptionEn: 'Keep your personal email safe while shopping and selling on Vinted second-hand marketplace.',
    whyTr: [
      'Satıcı ve alıcı bildirimleri için gerçek e-postanızı vermeyin.',
      'Vinted hesap onay maillerini 2 saniyede alın.',
      'Tek tıkla adresi imha edin.'
    ],
    whyEn: [
      'Prevent buyer/seller spam from flooding your personal inbox.',
      'Receive Vinted activation codes in under 3 seconds.',
      'Destroy temporary handles with one click.'
    ],
    faqsTr: [
      { q: 'Vinted onay maili düşüyor mu?', a: 'Evet, Vinted aktivasyon linkleri anında canlı gelen kutunuza yansır.' }
    ],
    faqsEn: [
      { q: 'Do Vinted confirmation links arrive fast?', a: 'Yes, activation links appear in your live inbox in 1-3 seconds.' }
    ]
  },
  saas: {
    id: 'saas',
    name: 'SaaS Platforms & B2B Apps',
    badge: '🚀 B2B & Software Tools',
    color: 'from-blue-600 to-indigo-800',
    titleTr: 'SaaS Platformları & B2B Yazılımlar İçin Geçici Mail',
    titleEn: 'Temp Mail for SaaS Platforms, B2B Apps & Software Demos',
    descriptionTr: 'SaaS ürün demoları, B2B yazılım denemeleri ve web seminerleri için satış aramaları (sales call) ve spam maillerden korunun.',
    descriptionEn: 'Test SaaS demos, software trials, and webinar sign-ups without getting hounded by sales reps.',
    whyTr: [
      'Satış ekiplerinin (SDR) telefon ve e-posta takibinden kurtulun.',
      'Yazılım demolarını anında anonim test edin.',
      'Auto-Verify ile üyelik linklerini otomatik aktifleştirin.'
    ],
    whyEn: [
      'Avoid unwanted sales follow-ups and SDR cadence drips.',
      'Evaluate software tools anonymously in seconds.',
      'Auto-Verify engine handles activation link handshakes automatically.'
    ],
    faqsTr: [
      { q: 'SaaS aktivasyon mailleri çalışır mı?', a: 'Evet, B2B platformların e-posta doğrulama adımlarını 1-3 saniyede geçersiniz.' }
    ],
    faqsEn: [
      { q: 'Do SaaS activation links work reliably?', a: 'Yes! B2B platform activation emails arrive in 1 to 3 seconds.' }
    ]
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook / Meta',
    badge: '👥 Social & Meta Accounts',
    color: 'from-blue-700 to-sky-700',
    titleTr: 'Facebook İçin Geçici Mail - Anonim Profil & Reklam Testleri',
    titleEn: 'Temp Mail for Facebook - Meta Alt Profiles & Ad Account Testing',
    descriptionTr: 'Facebook yan hesapları, Meta Business Manager testleri ve gruplar için kendi e-postanızı riske atmadan kullan-at mail adresi edinin.',
    descriptionEn: 'Create secondary Facebook profiles and test Meta Business Manager workflows without risking your personal identity.',
    whyTr: [
      'Meta reklam ve işletme testlerinde ana e-postanızı gizleyin.',
      'Facebook 6 haneli güvenlik kodlarını 2 saniyede kopyalayın.',
      'Sosyal medya veri madenciliğinden korunun.'
    ],
    whyEn: [
      'Protect your primary email during Meta Business testing.',
      'Copy 6-digit Facebook verification codes instantly.',
      'Shield your identity from data harvesting.'
    ],
    faqsTr: [
      { q: 'Facebook doğrulama kodunu alabilir miyim?', a: 'Evet, Facebook e-posta onay kodları 1-3 saniyede ekranda belirir.' }
    ],
    faqsEn: [
      { q: 'Will Facebook verification codes land in my inbox?', a: 'Yes! Confirmation PINs land live on your screen in sub-3 seconds.' }
    ]
  },
  reddit: {
    id: 'reddit',
    name: 'Reddit Alt Profiles',
    badge: '🤖 Community & Forum',
    color: 'from-orange-600 to-red-600',
    titleTr: 'Reddit Yan Hesaplar (Alt Profiles) İçin Geçici E-posta',
    titleEn: 'Temp Mail for Reddit Alt Profiles & Anonymous Browsing',
    descriptionTr: 'Reddit yan hesapları (throwaway alt accounts) ve anonim topluluk katılımları için kullan-at e-posta oluşturun.',
    descriptionEn: 'Create Reddit throwaway alt profiles and join communities anonymously without sharing your primary email address.',
    whyTr: [
      'Reddit throwaway hesaplarınızı asıl kimliğinizden ayrı tutun.',
      'E-posta doğrulama linklerini 2 saniyede tıklayın.',
      'Spam ve topluluk bildirimlerinden korunun.'
    ],
    whyEn: [
      'Keep throwaway Reddit accounts completely isolated from your real identity.',
      'Click confirmation links in 2 seconds.',
      'Prevent community digest emails from clogging your primary inbox.'
    ],
    faqsTr: [
      { q: 'Reddit onay linki hemen geliyor mu?', a: 'Evet, Reddit üyelik mailleri 1-3 saniyede kutunuza düşer.' }
    ],
    faqsEn: [
      { q: 'Does Reddit send activation links fast?', a: 'Yes, activation emails land in your live inbox in 1 to 3 seconds.' }
    ]
  },
  'temp-mail-with-password': {
    id: 'temp-mail-with-password',
    route: '/temp-mail-with-password',
    name: 'Temp Mail With Password',
    badge: '🔐 Password Protected Mail',
    color: 'from-red-600 to-amber-600',
    titleTr: 'Şifreli Geçici E-posta Generator (Temp Mail with Password) - Güvenli Kullan-At Mail',
    titleEn: 'Temp Mail With Password Generator - Secure Protected Disposable Email',
    descriptionTr: 'Şifre korumalı ve güvenli geçici e-posta adresi oluşturun. İki faktörlü doğrulama, özel şifreleme ve gizli e-posta kutusu erişimi.',
    descriptionEn: 'Generate password-protected temporary email addresses. Secure your disposable inbox with custom passwords, instant access, and end-to-end privacy.',
    whyTr: [
      'Gelen kutunuzu başkalarının erişimine karşı özel şifre ile koruyun.',
      'Hassas doğrulama kodlarını ve hesap erişim bilgilerini güvenle saklayın.',
      'Tek kullanımlık adresi dilediğiniz an şifrenizle tekrar açın veya imha edin.'
    ],
    whyEn: [
      'Protect your disposable inbox from unauthorized access using custom passwords.',
      'Securely receive sensitive OTP verification codes and credential emails.',
      'Re-access your private temp inbox anytime or destroy it instantly with zero trace.'
    ],
    faqsTr: [
      { q: 'Şifreli geçici e-posta nasıl çalışır?', a: 'Oluşturduğunuz adrese özel belirlediğiniz şifre ile sadece siz erişebilirsiniz. Mail kutusu RAM bellekte şifreli tutulur.' },
      { q: 'Şifremi unutursam ne olur?', a: 'Gizlilik ve sıfır-log politikamız gereği şifreler veritabanına kaydedilmez. Adresi yenileyerek yeni şifreli mail açabilirsiniz.' }
    ],
    faqsEn: [
      { q: 'How does password-protected temp mail work?', a: 'Only you can access the inbox using your custom password. The mailbox is kept encrypted in volatile RAM.' },
      { q: 'What if I lose my password?', a: 'Due to our strict zero-log privacy policy, passwords are never stored on servers. Simply generate a new protected handle.' }
    ]
  },
  'with-password': {
    id: 'temp-mail-with-password',
    route: '/temp-mail-with-password',
    name: 'Temp Mail With Password',
    badge: '🔐 Password Protected Mail',
    color: 'from-red-600 to-amber-600',
    titleTr: 'Şifreli Geçici E-posta Generator (Temp Mail with Password) - Güvenli Kullan-At Mail',
    titleEn: 'Temp Mail With Password Generator - Secure Protected Disposable Email',
    descriptionTr: 'Şifre korumalı ve güvenli geçici e-posta adresi oluşturun. İki faktörlü doğrulama, özel şifreleme ve gizli e-posta kutusu erişimi.',
    descriptionEn: 'Generate password-protected temporary email addresses. Secure your disposable inbox with custom passwords, instant access, and end-to-end privacy.',
    whyTr: [
      'Gelen kutunuzu başkalarının erişimine karşı özel şifre ile koruyun.',
      'Hassas doğrulama kodlarını ve hesap erişim bilgilerini güvenle saklayın.',
      'Tek kullanımlık adresi dilediğiniz an şifrenizle tekrar açın veya imha edin.'
    ],
    whyEn: [
      'Protect your disposable inbox from unauthorized access using custom passwords.',
      'Securely receive sensitive OTP verification codes and credential emails.',
      'Re-access your private temp inbox anytime or destroy it instantly with zero trace.'
    ],
    faqsTr: [
      { q: 'Şifreli geçici e-posta nasıl çalışır?', a: 'Oluşturduğunuz adrese özel belirlediğiniz şifre ile sadece siz erişebilirsiniz. Mail kutusu RAM bellekte şifreli tutulur.' },
      { q: 'Şifremi unutursam ne olur?', a: 'Gizlilik ve sıfır-log politikamız gereği şifreler veritabanına kaydedilmez. Adresi yenileyerek yeni şifreli mail açabilirsiniz.' }
    ],
    faqsEn: [
      { q: 'How does password-protected temp mail work?', a: 'Only you can access the inbox using your custom password. The mailbox is kept encrypted in volatile RAM.' },
      { q: 'What if I lose my password?', a: 'Due to our strict zero-log privacy policy, passwords are never stored on servers. Simply generate a new protected handle.' }
    ]
  },
  'custom-temp-mail-generator': {
    id: 'custom-temp-mail-generator',
    route: '/custom-temp-mail-generator',
    name: 'Custom Temp Mail Generator',
    badge: '⚙️ Custom Username & Domain',
    color: 'from-indigo-600 to-cyan-600',
    titleTr: 'Özel Kullanıcı Adlı Geçici Mail Generator (Custom Temp Mail)',
    titleEn: 'Custom Temp Mail Generator - Create Custom Username & Domain Email',
    descriptionTr: 'Kendi seçtiğiniz kullanıcı adı ve domain ile özel geçici e-posta adresi oluşturun. İstediğiniz isimle kullan-at mail adresi edinin.',
    descriptionEn: 'Generate custom temporary email addresses with your choice of username and domain name. Instant setup with zero signup required.',
    whyTr: [
      'İstediğiniz özel kullanıcı adını (örn: ahmet-test, dev-testing) anında tanımlayın.',
      'Kendi özel alan adınızı (Custom Domain) saniyeler içinde bağlayın.',
      'Rastgele harfler yerine kurumsal ve akılda kalıcı takma adlar kullanın.'
    ],
    whyEn: [
      'Instantly claim custom prefixes and usernames (e.g. dev-user, qa-test) on demand.',
      'Connect your own custom domain name for professional testing handles.',
      'Avoid awkward random strings and use branded or memorable alias prefixes.'
    ],
    faqsTr: [
      { q: 'İstediğim kullanıcı adını seçebilir miyim?', a: 'Evet! Özel Kullanıcı Adı kutusuna istediğiniz kelimeyi yazarak anında adres oluşturabilirsiniz.' },
      { q: 'Kendi domainimi kullanabilir miyim?', a: 'Evet, MephistoMail Özel Domain özelliği sayesinde kendi alan adınızı ekleyebilirsiniz.' }
    ],
    faqsEn: [
      { q: 'Can I pick any username prefix I want?', a: 'Yes! Simply type your desired prefix in the Custom Address field to generate it instantly.' },
      { q: 'Can I use my own domain with this tool?', a: 'Yes, MephistoMail supports custom domain binding for unlimited personalized handles.' }
    ]
  },
  'custom-generator': {
    id: 'custom-temp-mail-generator',
    route: '/custom-temp-mail-generator',
    name: 'Custom Temp Mail Generator',
    badge: '⚙️ Custom Username & Domain',
    color: 'from-indigo-600 to-cyan-600',
    titleTr: 'Özel Kullanıcı Adlı Geçici Mail Generator (Custom Temp Mail)',
    titleEn: 'Custom Temp Mail Generator - Create Custom Username & Domain Email',
    descriptionTr: 'Kendi seçtiğiniz kullanıcı adı ve domain ile özel geçici e-posta adresi oluşturun. İstediğiniz isimle kullan-at mail adresi edinin.',
    descriptionEn: 'Generate custom temporary email addresses with your choice of username and domain name. Instant setup with zero signup required.',
    whyTr: [
      'İstediğiniz özel kullanıcı adını (örn: ahmet-test, dev-testing) anında tanımlayın.',
      'Kendi özel alan adınızı (Custom Domain) saniyeler içinde bağlayın.',
      'Rastgele harfler yerine kurumsal ve akılda kalıcı takma adlar kullanın.'
    ],
    whyEn: [
      'Instantly claim custom prefixes and usernames (e.g. dev-user, qa-test) on demand.',
      'Connect your own custom domain name for professional testing handles.',
      'Avoid awkward random strings and use branded or memorable alias prefixes.'
    ],
    faqsTr: [
      { q: 'İstediğim kullanıcı adını seçebilir miyim?', a: 'Evet! Özel Kullanıcı Adı kutusuna istediğiniz kelimeyi yazarak anında adres oluşturabilirsiniz.' },
      { q: 'Kendi domainimi kullanabilir miyim?', a: 'Evet, MephistoMail Özel Domain özelliği sayesinde kendi alan adınızı ekleyebilirsiniz.' }
    ],
    faqsEn: [
      { q: 'Can I pick any username prefix I want?', a: 'Yes! Simply type your desired prefix in the Custom Address field to generate it instantly.' },
      { q: 'Can I use my own domain with this tool?', a: 'Yes, MephistoMail supports custom domain binding for unlimited personalized handles.' }
    ]
  },
  '1-second-temp-mail': {
    id: '1-second-temp-mail',
    route: '/1-second-temp-mail',
    name: '1 Second Temp Mail',
    badge: '⚡ Ultra-Fast 1-Second Mail',
    color: 'from-yellow-500 to-red-600',
    titleTr: '1 Saniyede Geçici E-posta Oluştur (1 Second Temp Mail) - Işık Hızında',
    titleEn: '1 Second Temp Mail Generator - Instant Ultra-Fast Disposable Email',
    descriptionTr: '1 saniye içinde kullanılabilir geçici e-posta adresi edinin. Kayıt yok, bekleme yok, ışık hızında WebSocket ve SSE canlı posta kutusu.',
    descriptionEn: 'Generate an active disposable email handle in under 1 second. Zero setup, real-time WebSocket delivery, and sub-second OTP arrival.',
    whyTr: [
      'Tek tıkla 1 saniyeden kısa sürede hazır e-posta adresi alın.',
      'Gelen e-postaları ve OTP kodlarını canlı WebSocket altyapısı ile anında görün.',
      'Zaman kaybetmeden form doğrulamalarını ve hızlı kayıtları tamamlayın.'
    ],
    whyEn: [
      'Get a fully operational disposable address in under 1000 milliseconds.',
      'View incoming emails and security OTPs in real-time via persistent WebSockets.',
      'Bypass slow sign-up forms and verify accounts with zero latency.'
    ],
    faqsTr: [
      { q: '1 saniyede mail gerçekten hazır oluyor mu?', a: 'Evet! Sayfa yüklendiği anda istemci tarafında RAM tabanlı e-posta adresi anında üretilir.' },
      { q: 'Gelen mailler kaç saniyede düşer?', a: 'Server-Sent Events (SSE) teknolojimiz sayesinde gelen mailler 1 saniyeden kısa sürede bildirim olarak gelir.' }
    ],
    faqsEn: [
      { q: 'Is the email handle really generated in 1 second?', a: 'Yes! Client-side RAM handle generation prepares your address immediately upon page load.' },
      { q: 'How fast do emails arrive?', a: 'Our Real-Time SSE engine delivers incoming messages and OTP codes in sub-second speed.' }
    ]
  },
  '1-second': {
    id: '1-second-temp-mail',
    route: '/1-second-temp-mail',
    name: '1 Second Temp Mail',
    badge: '⚡ Ultra-Fast 1-Second Mail',
    color: 'from-yellow-500 to-red-600',
    titleTr: '1 Saniyede Geçici E-posta Oluştur (1 Second Temp Mail) - Işık Hızında',
    titleEn: '1 Second Temp Mail Generator - Instant Ultra-Fast Disposable Email',
    descriptionTr: '1 saniye içinde kullanılabilir geçici e-posta adresi edinin. Kayıt yok, bekleme yok, ışık hızında WebSocket ve SSE canlı posta kutusu.',
    descriptionEn: 'Generate an active disposable email handle in under 1 second. Zero setup, real-time WebSocket delivery, and sub-second OTP arrival.',
    whyTr: [
      'Tek tıkla 1 saniyeden kısa sürede hazır e-posta adresi alın.',
      'Gelen e-postaları ve OTP kodlarını canlı WebSocket altyapısı ile anında görün.',
      'Zaman kaybetmeden form doğrulamalarını ve hızlı kayıtları tamamlayın.'
    ],
    whyEn: [
      'Get a fully operational disposable address in under 1000 milliseconds.',
      'View incoming emails and security OTPs in real-time via persistent WebSockets.',
      'Bypass slow sign-up forms and verify accounts with zero latency.'
    ],
    faqsTr: [
      { q: '1 saniyede mail gerçekten hazır oluyor mu?', a: 'Evet! Sayfa yüklendiği anda istemci tarafında RAM tabanlı e-posta adresi anında üretilir.' },
      { q: 'Gelen mailler kaç saniyede düşer?', a: 'Server-Sent Events (SSE) teknolojimiz sayesinde gelen mailler 1 saniyeden kısa sürede bildirim olarak gelir.' }
    ],
    faqsEn: [
      { q: 'Is the email handle really generated in 1 second?', a: 'Yes! Client-side RAM handle generation prepares your address immediately upon page load.' },
      { q: 'How fast do emails arrive?', a: 'Our Real-Time SSE engine delivers incoming messages and OTP codes in sub-second speed.' }
    ]
  },
  'steam-guard': {
    id: 'steam-guard',
    route: '/temp-mail-for-steam-guard',
    name: 'Steam Guard Verification',
    badge: '🛡️ Steam Guard & Security',
    color: 'from-slate-800 to-blue-900',
    titleTr: 'Steam Guard İçin Geçici E-posta (Temp Mail for Steam Guard) - OTP Kod Alın',
    titleEn: 'Temp Mail for Steam Guard - Instant Steam Verification & OTP Code',
    descriptionTr: 'Steam Guard 5 haneli güvenlik kodları, hesap kurtarma ve takas onayları için kullan-at e-posta adresi edinin.',
    descriptionEn: 'Get instant disposable emails for Steam Guard 5-character security codes, account verifications, and trade confirmations.',
    whyTr: [
      'Steam Guard 5 haneli doğrulama kodlarını 1-3 saniyede anında ekranda görün.',
      'Yan oyun ve smurf Steam hesaplarınızı kişisel e-posta adresinizden tamamen ayırın.',
      'Veri sızıntılarında Steam hesabınızın çalınmasını ve spam maillerini önleyin.'
    ],
    whyEn: [
      'Fetch 5-character Steam Guard auth PINs in real-time within 1 to 3 seconds.',
      'Keep secondary gaming and smurf accounts detached from your main personal email.',
      'Protect your main Steam identity from credential stuffing and phishing attacks.'
    ],
    faqsTr: [
      { q: 'Steam Guard doğrulama kodu otomatik tespit ediliyor mu?', a: 'Evet! Akıllı OTP motorumuz Steam Guard 5 haneli kodunu tespit edip kopyalama butonu ile sunar.' },
      { q: 'Steam bu mailleri kabul ediyor mu?', a: 'Evet, düzenli yenilenen temiz alan adlarımız Steam Guard doğrulamalarıyla %100 uyumludur.' }
    ],
    faqsEn: [
      { q: 'Is the Steam Guard code automatically highlighted?', a: 'Yes! Our Smart OTP extractor catches 5-character Steam codes and provides a one-click copy button.' },
      { q: 'Does Steam accept MephistoMail addresses?', a: 'Yes, our regularly rotated fresh domain pool passes Steam email verification effortlessly.' }
    ]
  },
  'canva-pro': {
    id: 'canva-pro',
    route: '/temp-mail-for-canva-pro',
    name: 'Canva Pro Free Trial',
    badge: '🎨 Canva Pro & Design',
    color: 'from-cyan-600 to-blue-600',
    titleTr: 'Canva Pro Ücretsiz Deneme İçin Geçici Mail (Temp Mail for Canva Pro)',
    titleEn: 'Temp Mail for Canva Pro - Free Trial Sign-up & Verification Email',
    descriptionTr: 'Canva Pro 30 günlük ücretsiz deneme ve tasarım platformu üyelikleri için kişisel mailinizi vermeden kullan-at e-posta edinin.',
    descriptionEn: 'Start 30-day Canva Pro free trials and graphic design tool registrations without cluttering your primary inbox with promotional emails.',
    whyTr: [
      'Canva Pro ücretsiz deneme süresini kişisel e-postanızı riske atmadan başlatın.',
      'Gelen doğrulama bağlantısını Auto-Verify kalkanı ile otomatik aktifleştirin.',
      'Tasarım projelerinizi tamamlayın ve pazarlama spamlerinden korunun.'
    ],
    whyEn: [
      'Activate Canva Pro trials without exposing your primary email to marketing drips.',
      'Auto-Verify engine clicks incoming Canva verification links automatically.',
      'Download high-res graphic assets anonymously with zero registration friction.'
    ],
    faqsTr: [
      { q: 'Canva Pro onay linki ne kadar sürede düşer?', a: 'Canva onay mailleri 1-3 saniyede kutunuza düşer ve onay düğmesi otomatik öne çıkarılır.' },
      { q: 'Canva Pro deneme süresi bitince spam gelir mi?', a: 'Hayır, geçici e-posta adresi imha edildiği için kişisel mailinize hiçbir spam ulaşamaz.' }
    ],
    faqsEn: [
      { q: 'How fast does the Canva Pro confirmation email arrive?', a: 'Canva activation emails land in 1 to 3 seconds with highlighted action buttons.' },
      { q: 'Will I get spam after the trial ends?', a: 'No, because the temporary mailbox is volatile, your real inbox stays 100% spam-free.' }
    ]
  },
  'claude-3-5': {
    id: 'claude-3-5',
    route: '/temp-mail-for-claude-3-5',
    name: 'Claude 3.5 Sonnet & Anthropic',
    badge: '🤖 Claude 3.5 & Anthropic',
    color: 'from-amber-600 to-orange-700',
    titleTr: 'Claude 3.5 Sonnet İçin Geçici Mail (Temp Mail for Claude 3.5) - Anthropic AI',
    titleEn: 'Temp Mail for Claude 3.5 Sonnet - Anthropic AI Account Verification',
    descriptionTr: 'Claude 3.5 Sonnet, Anthropic Console ve Claude Pro denemeleri için anında geçici mail adresi oluşturun. Kod ve onay linklerini saniyeler içinde alın.',
    descriptionEn: 'Create instant temporary email addresses for Claude 3.5 Sonnet, Anthropic Console, and LLM developer sign-ups with sub-3s delivery.',
    whyTr: [
      'Claude 3.5 Sonnet ve Anthropic API kayıtlarında kişisel e-posta adresinizi koruyun.',
      'Farklı AI geliştirme ve istem (prompting) testleri için çoklu hesaplar açın.',
      'Gelen e-posta doğrulama kodunu veya linkini tek tıkla kopyalayın.'
    ],
    whyEn: [
      'Shield your work email when registering for Claude 3.5 Sonnet and Anthropic console.',
      'Spin up multiple testing and prompt engineering sandbox accounts seamlessly.',
      'Extract verification OTPs and confirmation links instantly in real-time.'
    ],
    faqsTr: [
      { q: 'Claude 3.5 doğrulama e-postası çalışıyor mu?', a: 'Evet, Anthropic ve Claude 3.5 onay mailleri 1-3 saniyede ekranınıza gelir.' },
      { q: 'Claude API hesabı için kullanabilir miyim?', a: 'Evet, API geliştirici hesaplarının e-posta doğrulama aşaması için idealdir.' }
    ],
    faqsEn: [
      { q: 'Does Claude 3.5 verification work with temp mail?', a: 'Yes! Anthropic verification messages arrive live on your screen in 1 to 3 seconds.' },
      { q: 'Can I use this for Claude API console registration?', a: 'Absolutely. It is built for developer sandbox creation without cluttering work inboxes.' }
    ]
  },
  'midjourney-v6': {
    id: 'midjourney-v6',
    route: '/temp-mail-for-midjourney-v6',
    name: 'Midjourney v6 & Discord AI',
    badge: '🎨 Midjourney v6 AI Art',
    color: 'from-purple-700 to-indigo-800',
    titleTr: 'Midjourney v6 İçin Geçici Mail (Temp Mail for Midjourney v6) - AI Görsel',
    titleEn: 'Temp Mail for Midjourney v6 - Free AI Image Generation Accounts',
    descriptionTr: 'Midjourney v6, Discord bot kanalları ve yapay zeka görsel üreticileri için anonim e-posta adresi edinin. Spam almadan görsel üretin.',
    descriptionEn: 'Generate temporary email addresses for Midjourney v6 and Discord AI art channels without risking personal email privacy.',
    whyTr: [
      'Midjourney v6 ve Discord AI kayıtlarında kişisel mailinizi vermeden anonim kalın.',
      'Yeni AI görsel üretimi deneme hesaplarını saniyeler içinde doğrulayın.',
      'Spam ve duyuru bombardımanını otomatik engelleyin.'
    ],
    whyEn: [
      'Keep your personal inbox detached from AI art platform marketing blasts.',
      'Verify new Midjourney v6 prompt testing accounts in sub-3 seconds.',
      'RAM-only volatile storage deletes all records on browser close.'
    ],
    faqsTr: [
      { q: 'Midjourney v6 doğrulama maili ne zaman düşer?', a: 'Discord ve Midjourney v6 doğrulama kodları 1-3 saniye içinde bildirime düşer.' },
      { q: 'Midjourney web sürümünü destekliyor mu?', a: 'Evet, hem Midjourney web platformu hem Discord bot doğrulamaları ile tam uyumludur.' }
    ],
    faqsEn: [
      { q: 'How fast do Midjourney v6 confirmation emails land?', a: 'Verification codes and links land in your live inbox within 1 to 3 seconds.' },
      { q: 'Is it compatible with both Midjourney web and Discord?', a: 'Yes! It handles email verifications from both Midjourney Web and Discord integration.' }
    ]
  },
  'disposable-mail-for-developer-testing': {
    id: 'disposable-mail-for-developer-testing',
    route: '/disposable-mail-for-developer-testing',
    name: 'Developer & QA Testing Mail',
    badge: '🧪 Dev & QA Automation',
    color: 'from-emerald-700 to-teal-900',
    titleTr: 'Geliştirici & QA Testleri İçin Kullan-At E-posta (Disposable Mail for Developer Testing)',
    titleEn: 'Disposable Mail for Developer Testing - QA Automation & API Testing',
    descriptionTr: 'Yazılım geliştiriciler ve QA otomasyon mühendisleri için kullan-at e-posta servisi. Cypress, Playwright, Selenium ve REST API entegrasyonu.',
    descriptionEn: 'Disposable email service built for software developers & QA automation engineers. Full Cypress, Playwright, Selenium, and REST API support.',
    whyTr: [
      'Cypress, Playwright ve Selenium test otomasyonlarında temiz e-posta kutuları kullanın.',
      'REST API ve Webhook entegrasyonu ile e-posta içeriklerine programatik erişin.',
      'Gelen e-postaları raw JSON veya .eml formatında dışa aktarıp doğrulayın.'
    ],
    whyEn: [
      'Integrate ephemeral email boxes into Cypress, Playwright, and Selenium CI/CD pipelines.',
      'Access incoming email payloads programmatically via REST API and Webhooks.',
      'Export raw JSON and .eml email sources for automated assertions and validation.'
    ],
    faqsTr: [
      { q: 'Otomasyon testleri için API var mı?', a: 'Evet, /api-docs sayfamızdan REST API entegrasyon rehberine ulaşabilirsiniz.' },
      { q: 'Webhook bildirimi alabilir miyim?', a: 'Evet! Mail geldiğinde belirttiğiniz URL\'e anında Webhook HTTP POST isteği gönderilir.' }
    ],
    faqsEn: [
      { q: 'Is there an API available for automated test suites?', a: 'Yes! Check out our /api-docs endpoint for comprehensive REST API documentation.' },
      { q: 'Can I receive Webhook notifications on incoming mail?', a: 'Yes, webhooks fire instant HTTP POST payloads to your test listener when mail arrives.' }
    ]
  },
  'developer-testing': {
    id: 'disposable-mail-for-developer-testing',
    route: '/disposable-mail-for-developer-testing',
    name: 'Developer & QA Testing Mail',
    badge: '🧪 Dev & QA Automation',
    color: 'from-emerald-700 to-teal-900',
    titleTr: 'Geliştirici & QA Testleri İçin Kullan-At E-posta (Disposable Mail for Developer Testing)',
    titleEn: 'Disposable Mail for Developer Testing - QA Automation & API Testing',
    descriptionTr: 'Yazılım geliştiriciler ve QA otomasyon mühendisleri için kullan-at e-posta servisi. Cypress, Playwright, Selenium ve REST API entegrasyonu.',
    descriptionEn: 'Disposable email service built for software developers & QA automation engineers. Full Cypress, Playwright, Selenium, and REST API support.',
    whyTr: [
      'Cypress, Playwright ve Selenium test otomasyonlarında temiz e-posta kutuları kullanın.',
      'REST API ve Webhook entegrasyonu ile e-posta içeriklerine programatik erişin.',
      'Gelen e-postaları raw JSON veya .eml formatında dışa aktarıp doğrulayın.'
    ],
    whyEn: [
      'Integrate ephemeral email boxes into Cypress, Playwright, and Selenium CI/CD pipelines.',
      'Access incoming email payloads programmatically via REST API and Webhooks.',
      'Export raw JSON and .eml email sources for automated assertions and validation.'
    ],
    faqsTr: [
      { q: 'Otomasyon testleri için API var mı?', a: 'Evet, /api-docs sayfamızdan REST API entegrasyon rehberine ulaşabilirsiniz.' },
      { q: 'Webhook bildirimi alabilir miyim?', a: 'Evet! Mail geldiğinde belirttiğiniz URL\'e anında Webhook HTTP POST isteği gönderilir.' }
    ],
    faqsEn: [
      { q: 'Is there an API available for automated test suites?', a: 'Yes! Check out our /api-docs endpoint for comprehensive REST API documentation.' },
      { q: 'Can I receive Webhook notifications on incoming mail?', a: 'Yes, webhooks fire instant HTTP POST payloads to your test listener when mail arrives.' }
    ]
  }
};

export const ServiceMailPage: React.FC<ServiceMailPageProps> = ({ lang }) => {
  const location = useLocation();
  const pathKey = location.pathname.replace(/^\//, '').toLowerCase();
  const strippedSlug = pathKey.replace(/^temp-mail-for-/, '');
  const data = SERVICES_MAP[pathKey] || SERVICES_MAP[strippedSlug] || SERVICES_MAP.classifieds;

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

  const uniqueServices = Array.from(
    new Map(Object.values(SERVICES_MAP).map(item => [item.id, item])).values()
  );

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
            to="/services"
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
          <App hideNavbar={true} hideHeroBanner={true} hideSEOContent={true} hideFooter={true} />
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
            {uniqueServices.map(item => {
              const targetRoute = item.route || `/temp-mail-for-${item.id}`;
              return (
                <Link
                  key={item.id}
                  to={targetRoute}
                  className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                    item.id === data.id
                      ? 'bg-red-500/20 border-red-500/50 text-red-300'
                      : 'bg-[#12121e] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <Footer lang={lang} />
    </div>
  );
};

export default ServiceMailPage;
