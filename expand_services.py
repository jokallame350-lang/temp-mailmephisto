import re

new_services = """  'cursor-ai': {
    id: 'cursor-ai',
    name: 'Cursor AI IDE',
    badge: '🤖 AI Coding Assistant',
    color: 'from-blue-600 to-cyan-600',
    titleTr: 'Cursor AI Pro Deneme İçin Geçici Mail — Claude 3.5 & GPT-4o Doğrulama',
    titleEn: 'Temp Mail for Cursor AI Pro Trial — Claude 3.5 & GPT-4o Verification',
    descriptionTr: 'Cursor AI kodlama editörünün Pro deneme sürümlerini ve API token hesaplarını test etmek için 1 saniyelik geçici e-posta.',
    descriptionEn: 'Instant temporary email to verify Cursor AI Pro trials, Claude 3.5 Sonnet limits, and developer accounts without spam.',
    whyTr: [
      'Cursor AI Pro ücretsiz deneme sürümüne 1 saniyede OTP ile kaydolun.',
      'Kişisel gelen kutunuzu kodlama bültenleri ve pazarlama maillerinden koruyun.',
      'Sıfır log RAM mimarisi ile %100 anonim geliştirici deneyimi.'
    ],
    whyEn: [
      'Sign up for Cursor AI Pro trials with instant OTP verification codes in 1 second.',
      'Shield your primary inbox from developer newsletters and marketing drips.',
      '100% anonymous developer workflow powered by RAM-only zero-log storage.'
    ],
    faqsTr: [
      { q: 'Cursor AI doğrulama kodu MephistoMail kutuma düşer mi?', a: 'Evet! Canlı WebSocket altyapımız sayesinde doğrulama kodu sayfayı yenilemeden 1 saniyede ekranınıza gelir.' },
      { q: 'Cursor AI için birden fazla e-posta alabilir miyim?', a: 'Evet! MephistoMail üzerinde aynı anda 100 adede kadar eşzamanlı geçici e-posta kutusu yönetebilirsiniz.' }
    ],
    faqsEn: [
      { q: 'Will I receive Cursor AI OTP verification codes instantly?', a: 'Yes! Our real-time WebSocket delivers verification emails to your inbox within 1 second without page refresh.' },
      { q: 'Can I manage multiple emails for Cursor AI testing?', a: 'Yes! MephistoMail supports up to 100 simultaneous volatile inboxes.' }
    ]
  },
  'v0-dev': {
    id: 'v0-dev',
    name: 'Vercel v0.dev AI',
    badge: '⚡ AI Frontend UI Generator',
    color: 'from-zinc-700 to-black',
    titleTr: 'v0.dev (Vercel) İçin Geçici Mail — AI UI & Frontend Testi',
    titleEn: 'Temp Mail for v0.dev (Vercel AI) — Free UI Prototyping',
    descriptionTr: 'Vercel v0.dev yapay zeka arayüz üreticisi hesaplarınızı hızlıca doğrulamak için anlık geçici e-posta servisi.',
    descriptionEn: 'Disposable email service to test and verify Vercel v0.dev AI frontend prototype accounts instantly.',
    whyTr: [
      'v0.dev UI prototip oluşturma hesaplarınızı anında aktifleştirin.',
      'Kişisel e-postanızı gereksiz bildirimlerden koruyun.'
    ],
    whyEn: [
      'Activate v0.dev prototyping accounts within 1 second.',
      'Keep your primary email free from unnecessary marketing.'
    ],
    faqsTr: [
      { q: 'v0.dev için geçici mail güvenli midir?', a: 'Evet, MephistoMail gelen mailleri diskte tutmaz, tamamen RAM üzerinde çalışır.' }
    ],
    faqsEn: [
      { q: 'Is temp mail safe for v0.dev testing?', a: 'Yes, MephistoMail processes all emails in RAM with zero persistent disk logs.' }
    ]
  },
  'bolt-new': {
    id: 'bolt-new',
    name: 'Bolt.new AI StackBlitz',
    badge: '⚡ In-Browser Fullstack AI',
    color: 'from-orange-600 to-amber-600',
    titleTr: 'Bolt.new (StackBlitz) İçin Geçici Mail — Fullstack AI Testi',
    titleEn: 'Temp Mail for Bolt.new (StackBlitz) — Fullstack AI Sandbox',
    descriptionTr: 'Bolt.new WebContainer ortamında projelerinizi test etmek için anında geçici e-posta.',
    descriptionEn: 'Instant disposable email to verify Bolt.new fullstack development sandboxes.',
    whyTr: ['Bolt.new hesaplarını saniyeler içinde doğrulayın.'],
    whyEn: ['Verify Bolt.new accounts in seconds.'],
    faqsTr: [{ q: 'Bolt.new mailleri hızlı gelir mi?', a: 'Evet, 1 saniyede canlı WebSocket ile gelir.' }],
    faqsEn: [{ q: 'Do Bolt.new verification emails arrive fast?', a: 'Yes, within 1 second via live WebSocket push.' }]
  },
  'tradingview': {
    id: 'tradingview',
    name: 'TradingView Pro',
    badge: '📈 Financial Charts & Indicators',
    color: 'from-blue-700 to-indigo-800',
    titleTr: 'TradingView Pro Deneme İçin Geçici Mail — İndikatör & Grafik Testi',
    titleEn: 'Temp Mail for TradingView Pro Trial — Real-Time Stock & Crypto Charts',
    descriptionTr: 'TradingView Pro ve Premium deneme sürümlerini test etmek için güvenli geçici e-posta.',
    descriptionEn: 'Disposable email to test TradingView Pro & Premium free trials without marketing spam.',
    whyTr: ['TradingView 30 günlük Pro denemelerinizi spam almadan başlatın.'],
    whyEn: ['Start TradingView 30-day Pro trials without receiving promotional spam.'],
    faqsTr: [{ q: 'TradingView onay kodu gelir mi?', a: 'Evet, anında gelen kutunuzda görüntülenir.' }],
    faqsEn: [{ q: 'Will TradingView activation emails arrive?', a: 'Yes, instantly in your MephistoMail inbox.' }]
  },
  'coursera': {
    id: 'coursera',
    name: 'Coursera & Online Courses',
    badge: '🎓 Free Education & Audit',
    color: 'from-blue-600 to-blue-900',
    titleTr: 'Coursera & Online Kurslar İçin Geçici Mail — Ücretsiz Deneme Rehberi',
    titleEn: 'Temp Mail for Coursera & Online Courses — Free Learning Shield',
    descriptionTr: 'Coursera, edX ve Udemy gibi online eğitim platformlarında ücretsiz deneme başlatmak için geçici e-posta.',
    descriptionEn: 'Temporary email addresses for Coursera Plus trials, edX course audits, and educational sign-ups.',
    whyTr: ['Eğitim bültenlerinin kişisel gelen kutunuzu doldurmasını engelleyin.'],
    whyEn: ['Prevent course marketing emails from cluttering your primary inbox.'],
    faqsTr: [{ q: 'Coursera sertifika mailleri alınabilir mi?', a: 'Evet, geçici gelen kutunuza tüm onay ve ders mailleri anında ulaşır.' }],
    faqsEn: [{ q: 'Can I receive Coursera verification emails?', a: 'Yes, all confirmation emails arrive instantly in your inbox.' }]
  },
  'github-copilot': {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    badge: '💻 AI Pair Programmer',
    color: 'from-purple-700 to-indigo-900',
    titleTr: 'GitHub Copilot Deneme İçin Geçici Mail — AI Kodlama Kalkanı',
    titleEn: 'Temp Mail for GitHub Copilot Trial — Developer Privacy Shield',
    descriptionTr: 'GitHub Copilot ve VS Code uzantılarını test etmek için anlık geçici e-posta adresi.',
    descriptionEn: 'Instant throwaway email for GitHub Copilot trial verifications and developer testing.',
    whyTr: ['Geliştirici hesaplarınızı spamden uzak tutun.'],
    whyEn: ['Keep your developer workflow clean from promotional spam.'],
    faqsTr: [{ q: 'GitHub OTP kodları destekleniyor mu?', a: 'Evet, 6 haneli kodlar otomatik algılanır ve panoya kopyalanabilir.' }],
    faqsEn: [{ q: 'Are GitHub OTP codes supported?', a: 'Yes, 6-digit verification codes are auto-detected with 1-click copy.' }]
  },
  'perplexity-ai': {
    id: 'perplexity-ai',
    name: 'Perplexity AI Pro',
    badge: '🔍 AI Research Engine',
    color: 'from-teal-600 to-cyan-700',
    titleTr: 'Perplexity Pro AI İçin Geçici Mail — Hızlı Araştırma & Test',
    titleEn: 'Temp Mail for Perplexity Pro AI — Fast Research & Trial Verification',
    descriptionTr: 'Perplexity AI arama motorunun Pro özelliklerini test etmek için geçici e-posta.',
    descriptionEn: 'Disposable email addresses for Perplexity Pro AI research trials.',
    whyTr: ['Perplexity Pro deneme hesaplarını saniyeler içinde oluşturun.'],
    whyEn: ['Create Perplexity Pro trial accounts in seconds.'],
    faqsTr: [{ q: 'Giriş linki (Magic link) çalışır mı?', a: 'Evet, Perplexity sihirli giriş linkine tıklayarak direkt giriş yapabilirsiniz.' }],
    faqsEn: [{ q: 'Do Perplexity magic sign-in links work?', a: 'Yes, you can click magic sign-in links directly from your inbox.' }]
  },
  'elevenlabs': {
    id: 'elevenlabs',
    name: 'ElevenLabs AI Voice',
    badge: '🎙️ AI Voice Cloning & TTS',
    color: 'from-amber-600 to-rose-600',
    titleTr: 'ElevenLabs AI Ses Klonlama İçin Geçici Mail — Ücretsiz Deneme',
    titleEn: 'Temp Mail for ElevenLabs AI Voice — Free TTS & Voice Cloning Trial',
    descriptionTr: 'ElevenLabs metinden sese ve ses klonlama hesaplarını test etmek için 1 saniyelik geçici mail.',
    descriptionEn: 'Instant temporary email to test ElevenLabs voice cloning and text-to-speech credits.',
    whyTr: ['ElevenLabs hesap onay maillerini 1 saniyede alın.'],
    whyEn: ['Receive ElevenLabs account confirmation emails in 1 second.'],
    faqsTr: [{ q: 'ElevenLabs doğrulama mailleri geliyor mu?', a: 'Evet, canlı WebSocket ile anında gelir.' }],
    faqsEn: [{ q: 'Do ElevenLabs verification emails arrive?', a: 'Yes, delivered instantly via real-time WebSocket.' }]
  },
  'notion-ai': {
    id: 'notion-ai',
    name: 'Notion AI Workspace',
    badge: '📝 Connected AI Workspace',
    color: 'from-slate-800 to-black',
    titleTr: 'Notion AI & Çalışma Alanı İçin Geçici Mail',
    titleEn: 'Temp Mail for Notion AI & Workspace Signups',
    descriptionTr: 'Notion çalışma alanlarını ve Notion AI özelliklerini test etmek için geçici e-posta.',
    descriptionEn: 'Disposable temporary email for testing Notion workspaces and Notion AI credits.',
    whyTr: ['Notion bülten spamlerini engelleyin.'],
    whyEn: ['Block marketing clutter from your inbox.'],
    faqsTr: [{ q: 'Notion davetiyeleri alınabilir mi?', a: 'Evet, çalışma alanı davet linkleri anında gelir.' }],
    faqsEn: [{ q: 'Can I receive workspace invitations?', a: 'Yes, workspace invite links arrive instantly.' }]
  },
  'figma': {
    id: 'figma',
    name: 'Figma & FigJam Pro',
    badge: '🎨 Collaborative UI Design',
    color: 'from-purple-600 to-pink-600',
    titleTr: 'Figma & FigJam İçin Geçici Mail — UI/UX Tasarım Doğrulama',
    titleEn: 'Temp Mail for Figma & FigJam — UI/UX Design Verification',
    descriptionTr: 'Figma ve FigJam tasarım araçlarını test etmek için anlık geçici e-posta.',
    descriptionEn: 'Disposable email address for Figma and FigJam team trials.',
    whyTr: ['Figma tasarım bildirimlerini kişisel mailinizden uzak tutun.'],
    whyEn: ['Keep design notifications separate from your primary inbox.'],
    faqsTr: [{ q: 'Figma onay mailleri hızlı mı?', a: 'Evet, 1 saniyede ekranınızda belirir.' }],
    faqsEn: [{ q: 'Are Figma emails instant?', a: 'Yes, displayed in 1 second.' }]
  },
"""

with open("src/pages/ServiceMailPage.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Insert new services before 'discord: {'
if "'cursor-ai':" not in code:
    code = code.replace("  discord: {", new_services + "  discord: {", 1)
    with open("src/pages/ServiceMailPage.tsx", "w", encoding="utf-8") as f:
        f.write(code)
    print("Added new services to ServiceMailPage.tsx")
else:
    print("Services already exist in ServiceMailPage.tsx")
