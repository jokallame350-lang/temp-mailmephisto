import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Code2, Copy, CheckCircle, Terminal, Zap, Lock, Globe, Clock } from 'lucide-react';
import { Language } from '../translations';
import SEOPageMeta from '../components/SEOPageMeta';

interface ApiDocsPageProps {
    lang: Language;
}

interface CodeBlockProps {
    code: string;
    language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'bash' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group rounded-xl overflow-hidden border border-white/[0.06] bg-[#0d0d12]">
            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{language}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-white transition-colors"
                >
                    {copied ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm text-slate-300 leading-relaxed font-mono">
                <code>{code}</code>
            </pre>
        </div>
    );
};

const ApiDocsPage: React.FC<ApiDocsPageProps> = ({ lang }) => {
    const t = {
        en: {
            title: 'API Documentation',
            subtitle: 'Integrate MephistoMail temporary email into your applications with our RESTful API.',
            comingSoon: 'Full API Coming Soon',
            comingSoonDesc: 'Our public REST API is currently in development. Below is a preview of the planned endpoints and usage examples.',
            overview: 'API Overview',
            overviewDesc: 'The MephistoMail API provides programmatic access to create temporary email addresses, receive emails, and manage mailboxes. Perfect for automated testing, CI/CD pipelines, and integration with your applications.',
            baseUrl: 'Base URL',
            auth: 'Authentication',
            authDesc: 'The API uses Bearer token authentication. API keys will be available for free upon launch.',
            rateLimit: 'Rate Limiting',
            rateLimitDesc: 'Free tier: 100 requests/minute. No paid tier — all features are free.',
            endpoints: 'Endpoints',
            createMailbox: 'Create Mailbox',
            createMailboxDesc: 'Creates a new temporary mailbox and returns the email address and auth token.',
            getEmails: 'List Emails',
            getEmailsDesc: 'Retrieves all emails received by a mailbox.',
            getEmail: 'Get Email Detail',
            getEmailDesc: 'Retrieves the full content of a specific email including HTML body and attachments.',
            deleteMailbox: 'Delete Mailbox',
            deleteMailboxDesc: 'Permanently deletes a mailbox and all associated emails.',
            sdks: 'SDKs & Libraries',
            sdksDesc: 'Official SDKs will be released alongside the API:',
            useCases: 'Use Cases',
            useCaseTest: 'Automated Testing',
            useCaseTestDesc: 'Generate unique email addresses for each test run. Verify sign-up flows, OTP codes, and email delivery automatically.',
            useCaseCiCd: 'CI/CD Pipelines',
            useCaseCiCdDesc: 'Integrate temp mail into your deployment pipeline to test email functionality on every push.',
            useCaseBot: 'Bot & Automation',
            useCaseBotDesc: 'Create disposable inboxes programmatically for web scraping, monitoring, and automation tasks.',
            notifyMe: 'Notify Me When API Launches',
            notifyPlaceholder: 'your@email.com',
            notifyButton: 'Get Notified',
        },
        tr: {
            title: 'API Dokümantasyonu',
            subtitle: 'MephistoMail geçici e-postayı RESTful API\'mız ile uygulamalarınıza entegre edin.',
            comingSoon: 'Tam API Yakında Geliyor',
            comingSoonDesc: 'Genel REST API\'mız şu anda geliştirme aşamasında. Aşağıda planlanan uç noktaların ve kullanım örneklerinin bir önizlemesi yer almaktadır.',
            overview: 'API Genel Bakış',
            overviewDesc: 'MephistoMail API, geçici e-posta adresleri oluşturmak, e-postalar almak ve posta kutularını yönetmek için programatik erişim sağlar. Otomatik testler, CI/CD pipeline\'ları ve uygulama entegrasyonları için mükemmel.',
            baseUrl: 'Base URL',
            auth: 'Kimlik Doğrulama',
            authDesc: 'API, Bearer token kimlik doğrulaması kullanır. API anahtarları lansman sırasında ücretsiz olarak sunulacaktır.',
            rateLimit: 'Hız Sınırlama',
            rateLimitDesc: 'Ücretsiz katman: 100 istek/dakika. Ücretli katman yok — tüm özellikler ücretsiz.',
            endpoints: 'Uç Noktalar',
            createMailbox: 'Posta Kutusu Oluştur',
            createMailboxDesc: 'Yeni bir geçici posta kutusu oluşturur ve e-posta adresi ile kimlik doğrulama token\'ı döndürür.',
            getEmails: 'E-postaları Listele',
            getEmailsDesc: 'Bir posta kutusu tarafından alınan tüm e-postaları getirir.',
            getEmail: 'E-posta Detayı',
            getEmailDesc: 'HTML gövdesi ve ekler dahil olmak üzere belirli bir e-postanın tam içeriğini getirir.',
            deleteMailbox: 'Posta Kutusunu Sil',
            deleteMailboxDesc: 'Bir posta kutusunu ve ilişkili tüm e-postaları kalıcı olarak siler.',
            sdks: 'SDK\'lar & Kütüphaneler',
            sdksDesc: 'Resmi SDK\'lar API ile birlikte yayınlanacaktır:',
            useCases: 'Kullanım Alanları',
            useCaseTest: 'Otomatik Test',
            useCaseTestDesc: 'Her test çalıştırması için benzersiz e-posta adresleri oluşturun. Kayıt akışlarını, OTP kodlarını ve e-posta teslimini otomatik olarak doğrulayın.',
            useCaseCiCd: 'CI/CD Pipeline\'ları',
            useCaseCiCdDesc: 'Her push\'ta e-posta işlevselliğini test etmek için dağıtım pipeline\'ınıza temp mail entegre edin.',
            useCaseBot: 'Bot & Otomasyon',
            useCaseBotDesc: 'Web scraping, izleme ve otomasyon görevleri için programatik olarak kullan at gelen kutuları oluşturun.',
            notifyMe: 'API Lansmanında Bilgilendir',
            notifyPlaceholder: 'email@adresiniz.com',
            notifyButton: 'Bilgilendir',
        }
    };

    const txt = t[lang];

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <SEOPageMeta lang={lang} page="tools" />

            {/* Header */}
            <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 text-white hover:text-red-400 transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">MephistoMail</span>
                    </Link>
                    <h1 className="text-lg font-bold tracking-tight">{txt.title}</h1>
                    <div className="w-24" />
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-500/10 flex items-center justify-center mx-auto mb-6">
                        <Code2 size={28} className="text-purple-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                        {txt.title}
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-6">
                        {txt.subtitle}
                    </p>
                    {/* Coming Soon Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-bold">
                        <Zap size={14} />
                        {txt.comingSoon}
                    </div>
                </div>
            </section>

            {/* Overview */}
            <section className="px-6 pb-12">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
                        <h2 className="text-xl font-bold mb-4">{txt.overview}</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">{txt.overviewDesc}</p>

                        {/* Info Grid */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Globe size={14} className="text-blue-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white">{txt.baseUrl}</span>
                                </div>
                                <code className="text-red-400 text-xs font-mono">https://api.mephistomail.site/v1</code>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Lock size={14} className="text-green-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white">{txt.auth}</span>
                                </div>
                                <p className="text-slate-500 text-xs">{txt.authDesc}</p>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={14} className="text-orange-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white">{txt.rateLimit}</span>
                                </div>
                                <p className="text-slate-500 text-xs">{txt.rateLimitDesc}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Endpoints */}
            <section className="px-6 pb-12">
                <div className="max-w-4xl mx-auto space-y-6">
                    <h2 className="text-2xl font-bold">{txt.endpoints}</h2>

                    {/* POST /mailboxes */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-wider">POST</span>
                            <code className="text-sm font-mono text-white">/v1/mailboxes</code>
                            <span className="text-slate-500 text-xs ml-auto">{txt.createMailbox}</span>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-400 text-sm mb-4">{txt.createMailboxDesc}</p>
                            <CodeBlock language="bash" code={`curl -X POST https://api.mephistomail.site/v1/mailboxes \\
  -H "Content-Type: application/json" \\
  -d '{"ttl": 3600}'`} />
                            <div className="mt-4">
                                <CodeBlock language="json" code={`{
  "id": "mb_a1b2c3d4e5",
  "address": "x7k9m2@mephistomail.site",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "created_at": "2026-02-20T00:31:00Z",
  "expires_at": "2026-02-20T01:31:00Z"
}`} />
                            </div>
                        </div>
                    </div>

                    {/* GET /mailboxes/:id/messages */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-wider">GET</span>
                            <code className="text-sm font-mono text-white">/v1/mailboxes/:id/messages</code>
                            <span className="text-slate-500 text-xs ml-auto">{txt.getEmails}</span>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-400 text-sm mb-4">{txt.getEmailsDesc}</p>
                            <CodeBlock language="bash" code={`curl https://api.mephistomail.site/v1/mailboxes/mb_a1b2c3d4e5/messages \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."`} />
                            <div className="mt-4">
                                <CodeBlock language="json" code={`{
  "messages": [
    {
      "id": "msg_f6g7h8i9",
      "from": "noreply@example.com",
      "subject": "Verify your email",
      "preview": "Your verification code is 847291",
      "received_at": "2026-02-20T00:32:15Z",
      "has_attachments": false
    }
  ],
  "total": 1
}`} />
                            </div>
                        </div>
                    </div>

                    {/* GET /mailboxes/:id/messages/:msgId */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-wider">GET</span>
                            <code className="text-sm font-mono text-white">/v1/mailboxes/:id/messages/:msgId</code>
                            <span className="text-slate-500 text-xs ml-auto">{txt.getEmail}</span>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-400 text-sm mb-4">{txt.getEmailDesc}</p>
                            <CodeBlock language="bash" code={`curl https://api.mephistomail.site/v1/mailboxes/mb_a1b2c3d4e5/messages/msg_f6g7h8i9 \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."`} />
                            <div className="mt-4">
                                <CodeBlock language="json" code={`{
  "id": "msg_f6g7h8i9",
  "from": "noreply@example.com",
  "to": "x7k9m2@mephistomail.site",
  "subject": "Verify your email",
  "text_body": "Your verification code is 847291",
  "html_body": "<div>Your verification code is <b>847291</b></div>",
  "received_at": "2026-02-20T00:32:15Z",
  "attachments": []
}`} />
                            </div>
                        </div>
                    </div>

                    {/* DELETE /mailboxes/:id */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-wider">DELETE</span>
                            <code className="text-sm font-mono text-white">/v1/mailboxes/:id</code>
                            <span className="text-slate-500 text-xs ml-auto">{txt.deleteMailbox}</span>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-400 text-sm mb-4">{txt.deleteMailboxDesc}</p>
                            <CodeBlock language="bash" code={`curl -X DELETE https://api.mephistomail.site/v1/mailboxes/mb_a1b2c3d4e5 \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."`} />
                            <div className="mt-4">
                                <CodeBlock language="json" code={`{
  "success": true,
  "message": "Mailbox permanently deleted"
}`} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Code Examples */}
            <section className="px-6 pb-12">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6">{txt.sdks}</h2>
                    <p className="text-slate-400 text-sm mb-6">{txt.sdksDesc}</p>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Python Example */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-blue-500/10 text-blue-400">Python</span>
                            </div>
                            <CodeBlock language="python" code={`import mephistomail

# Create a temporary mailbox
mailbox = mephistomail.create(ttl=3600)
print(f"Email: {mailbox.address}")

# Wait for an email
email = mailbox.wait_for_email(timeout=60)
print(f"From: {email.sender}")
print(f"Subject: {email.subject}")

# Extract OTP code
otp = email.extract_otp()
print(f"OTP: {otp}")

# Cleanup
mailbox.delete()`} />
                        </div>

                        {/* JavaScript Example */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-yellow-500/10 text-yellow-400">JavaScript</span>
                            </div>
                            <CodeBlock language="javascript" code={`const MephistoMail = require('mephistomail');

// Create a temporary mailbox
const mailbox = await MephistoMail.create({ 
  ttl: 3600 
});
console.log(\`Email: \${mailbox.address}\`);

// Wait for incoming email
const email = await mailbox.waitForEmail({
  timeout: 60000
});
console.log(\`OTP: \${email.extractOTP()}\`);

// Cleanup
await mailbox.delete();`} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Use Cases */}
            <section className="px-6 pb-16 border-t border-white/5 pt-12">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-8">{txt.useCases}</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center mb-4">
                                <Terminal size={18} className="text-green-400" />
                            </div>
                            <h3 className="font-bold text-sm mb-2">{txt.useCaseTest}</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">{txt.useCaseTestDesc}</p>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center mb-4">
                                <Zap size={18} className="text-blue-400" />
                            </div>
                            <h3 className="font-bold text-sm mb-2">{txt.useCaseCiCd}</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">{txt.useCaseCiCdDesc}</p>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 flex items-center justify-center mb-4">
                                <Code2 size={18} className="text-purple-400" />
                            </div>
                            <h3 className="font-bold text-sm mb-2">{txt.useCaseBot}</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">{txt.useCaseBotDesc}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-12 px-6 text-center border-t border-white/5">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
                >
                    {lang === 'tr' ? '← Geçici Mail Oluştur' : '← Create Temp Mail'}
                </Link>
            </section>
        </div>
    );
};

export default ApiDocsPage;
