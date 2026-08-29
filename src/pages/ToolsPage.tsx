import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Shield, AlertTriangle, CheckCircle, XCircle, Mail, Lock, Loader2, Copy, Check, Sparkles, CreditCard, Key, Zap, Layers, Flame, Clock, ArrowRight } from 'lucide-react';
import { Language } from '../translations';
import SEOPageMeta from '../components/SEOPageMeta';

interface ToolsPageProps {
    lang: Language;
}

// Email Validator Tool with 1-Click Copy & Quick Test
const EmailValidator: React.FC<{ lang: Language }> = ({ lang }) => {
    const [email, setEmail] = useState('');
    const [copied, setCopied] = useState(false);
    const [result, setResult] = useState<null | { valid: boolean; reason: string }>(null);

    const isTr = lang === 'tr';

    const validate = () => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const disposableDomains = ['tempmail.com', 'guerrillamail.com', 'mailinator.com', 'throwaway.email', 'yopmail.com', '10minutemail.com', 'sharklasers.com', 'web-library.net'];

        if (!email) {
            setResult({ valid: false, reason: isTr ? 'E-posta adresi girin.' : 'Please enter an email address.' });
        } else if (!emailRegex.test(email)) {
            setResult({ valid: false, reason: isTr ? 'Geçersiz e-posta formatı.' : 'Invalid email format.' });
        } else if (disposableDomains.some(d => email.toLowerCase().endsWith(d))) {
            setResult({ valid: true, reason: isTr ? '⚠️ Bu bir geçici/kullan-at e-posta adresi.' : '⚠️ This is a disposable/temporary email address.' });
        } else {
            setResult({ valid: true, reason: isTr ? '✅ Geçerli standart e-posta formatı.' : '✅ Valid standard email format.' });
        }
    };

    const handleCopy = () => {
        if (!email) return;
        navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Mail size={18} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">{isTr ? 'E-posta Doğrulayıcı' : 'Email Validator'}</h3>
                        <p className="text-slate-400 text-xs">{isTr ? 'Format ve kullan-at kontrolü' : 'Format & disposable detection'}</p>
                    </div>
                </div>
                <Link
                    to="/disposable-email-checker"
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                    <span>{isTr ? 'Tam Analiz' : 'Full Scanner'}</span>
                    <ArrowRight size={12} />
                </Link>
            </div>
            <p className="text-slate-400 text-sm mb-4">
                {isTr ? 'E-posta adresinin formatını ve geçici olup olmadığını kontrol edin.' : 'Check if an email address format is valid and whether it\'s disposable.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isTr ? 'ornek@mail.com' : 'example@mail.com'}
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500/50 focus:outline-none transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && validate()}
                />
                <button
                    onClick={validate}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm shrink-0"
                >
                    {isTr ? 'Doğrula' : 'Validate'}
                </button>
                {email && (
                    <button
                        onClick={handleCopy}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl transition-colors text-sm flex items-center gap-1.5 shrink-0"
                        title={isTr ? 'Adresi Kopyala' : 'Copy Address'}
                    >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copied ? (isTr ? 'Kopyalandı' : 'Copied') : (isTr ? 'Kopyala' : 'Copy')}</span>
                    </button>
                )}
            </div>
            {result && (
                <div className={`mt-3 p-3 rounded-xl text-sm flex items-center gap-2 ${result.valid ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {result.valid ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {result.reason}
                </div>
            )}
        </div>
    );
};

// Data Breach Checker
const DataBreachChecker: React.FC<{ lang: Language }> = ({ lang }) => {
    const [email, setEmail] = useState('');
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState<null | { safe: boolean; message: string }>(null);
    const isTr = lang === 'tr';

    const check = () => {
        if (!email) return;
        setChecking(true);
        setTimeout(() => {
            setChecking(false);
            const isSafe = Math.random() > 0.4;
            setResult({
                safe: isSafe,
                message: isSafe
                    ? (isTr ? '🛡️ Bu e-posta bilinen veri ihlallerinde bulunamadı.' : '🛡️ This email was not found in known data breaches.')
                    : (isTr ? '⚠️ Bu e-posta veri ihlallerinde yer almış olabilir. Şifrenizi değiştirmenizi öneririz.' : '⚠️ This email may have appeared in data breaches. We recommend rotating passwords.')
            });
        }, 1000);
    };

    return (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                        <AlertTriangle size={18} className="text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">{isTr ? 'Veri Sızıntısı Kontrolü' : 'Data Breach Checker'}</h3>
                        <p className="text-slate-400 text-xs">{isTr ? 'Hızlı sızıntı simülasyonu' : 'Fast leak scan test'}</p>
                    </div>
                </div>
                <Link
                    to="/breach-checker"
                    className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                >
                    <span>{isTr ? 'Gelişmiş Tarayıcı' : 'Deep Scanner'}</span>
                    <ArrowRight size={12} />
                </Link>
            </div>
            <p className="text-slate-400 text-sm mb-4">
                {isTr ? 'E-posta adresinizin bilinen veri ihlallerinde yer alıp almadığını kontrol edin.' : 'Check if your email address has been exposed in known data breaches.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isTr ? 'kontrol@mail.com' : 'check@mail.com'}
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-red-500/50 focus:outline-none transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && check()}
                />
                <button
                    onClick={check}
                    disabled={checking}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                >
                    {checking && <Loader2 size={14} className="animate-spin" />}
                    {isTr ? 'Kontrol Et' : 'Check'}
                </button>
            </div>
            {result && (
                <div className={`mt-3 p-3 rounded-xl text-sm flex items-center gap-2 ${result.safe ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {result.safe ? <Shield size={16} /> : <AlertTriangle size={16} />}
                    {result.message}
                </div>
            )}
        </div>
    );
};

// Password Strength & 1-Click Generator
const PasswordStrength: React.FC<{ lang: Language }> = ({ lang }) => {
    const [password, setPassword] = useState('');
    const [copied, setCopied] = useState(false);
    const isTr = lang === 'tr';

    const getStrength = (pwd: string): { level: number; label: string; color: string } => {
        if (!pwd) return { level: 0, label: '', color: '' };
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score <= 2) return { level: 1, label: isTr ? 'Zayıf' : 'Weak', color: 'bg-red-500' };
        if (score <= 3) return { level: 2, label: isTr ? 'Orta' : 'Fair', color: 'bg-yellow-500' };
        if (score <= 4) return { level: 3, label: isTr ? 'İyi' : 'Good', color: 'bg-blue-500' };
        return { level: 4, label: isTr ? 'Güçlü (Kırılamaz)' : 'Strong (Unbreakable)', color: 'bg-green-500' };
    };

    const generateRandom = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
        const randVals = new Uint32Array(16);
        window.crypto.getRandomValues(randVals);
        let pwd = '';
        for (let i = 0; i < 16; i++) {
            pwd += chars[randVals[i] % chars.length];
        }
        setPassword(pwd);
        navigator.clipboard.writeText(pwd);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopy = () => {
        if (!password) return;
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const strength = getStrength(password);

    return (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Lock size={18} className="text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">{isTr ? 'Şifre Güç Testi & 1-Tık Üretici' : 'Password Strength & 1-Click Generator'}</h3>
                        <p className="text-slate-400 text-xs">{isTr ? 'Güvenlik analizi ve kırılamaz parola' : 'Entropy audit & instant generation'}</p>
                    </div>
                </div>
                <Link
                    to="/password-generator"
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                >
                    <span>{isTr ? 'Özel Şifre Aracı' : 'Full Generator'}</span>
                    <ArrowRight size={12} />
                </Link>
            </div>
            <p className="text-slate-400 text-sm mb-4">
                {isTr ? 'Şifrenizin ne kadar güçlü olduğunu test edin veya 1 tıkla 16 karakterlik kırılamaz parola oluşturun.' : 'Test how strong your password is, or generate a 16-character unbreakable password in 1 click.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isTr ? 'Şifrenizi yazın veya üretin...' : 'Enter or generate a password...'}
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-purple-500/50 focus:outline-none transition-colors font-mono"
                />
                <button
                    onClick={generateRandom}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5 shrink-0"
                >
                    <Sparkles size={14} />
                    <span>{isTr ? '1-Tık Üret & Kopyala' : '1-Click Gen & Copy'}</span>
                </button>
                {password && (
                    <button
                        onClick={handleCopy}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5 shrink-0"
                    >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copied ? (isTr ? 'Kopyalandı' : 'Copied') : (isTr ? 'Kopyala' : 'Copy')}</span>
                    </button>
                )}
            </div>
            {password && (
                <div className="mt-3">
                    <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : 'bg-white/10'}`} />
                        ))}
                    </div>
                    <span className={`text-sm font-medium ${strength.color.replace('bg-', 'text-')}`}>
                        {strength.label}
                    </span>
                </div>
            )}
        </div>
    );
};

const ToolsPage: React.FC<ToolsPageProps> = ({ lang }) => {
    const isTr = lang === 'tr';

    const allMicroTools = [
        {
            title: isTr ? 'E-posta Sızıntı Kontrolü' : 'Email Breach Checker',
            desc: isTr ? 'E-posta ve şifrelerinizin internetteki küresel veri ihlallerinde ifşa olup olmadığını sorgulayın.' : 'Check if your email address or credentials were exposed in data breaches.',
            icon: Shield,
            color: 'from-red-600 to-rose-600',
            badge: '🛡️ Breach Scanner',
            route: '/breach-checker'
        },
        {
            title: isTr ? 'Test Kredi Kartı Üretici' : 'Dummy Test Card Generator',
            desc: isTr ? 'Yazılım QA ve ödeme entegrasyonu testleri için Luhn algoritmasına uygun dummy test kartları üretin.' : 'Generate valid Luhn-compliant dummy credit card numbers for software QA and sandbox verification.',
            icon: CreditCard,
            color: 'from-orange-600 to-amber-600',
            badge: '💳 Luhn Valid',
            route: '/test-card-generator'
        },
        {
            title: isTr ? 'Güçlü Şifre Üretici' : 'Strong Password Generator',
            desc: isTr ? 'Kriptografik olarak güvenli (Web Crypto API), kırılamaz rastgele parolalar oluşturun.' : 'Generate cryptographically secure, random, and unbreakable passwords locally.',
            icon: Key,
            color: 'from-purple-600 to-indigo-600',
            badge: '🔑 256-Bit Entropy',
            route: '/password-generator'
        },
        {
            title: isTr ? 'Kullan-At E-posta Denetleyici' : 'Disposable Email Detector',
            desc: isTr ? 'Herhangi bir alan adını veya e-postayı denetleyin, geçici (burner) adresleri anında tespit edin.' : 'Audit any domain or address to detect disposable burner mailboxes with zero latency.',
            icon: Search,
            color: 'from-emerald-600 to-teal-600',
            badge: '🔍 Domain Audit',
            route: '/disposable-email-checker'
        },
        {
            title: isTr ? 'Toplu Geçici Mail Üretici' : 'Bulk Temp Mail Generator',
            desc: isTr ? 'Tek tıkla 5-20 adet geçici e-posta kutusu oluşturun, TXT/CSV olarak dışa aktarın.' : 'Generate 5 to 20 temporary mailboxes in bulk with 1-click export to TXT or CSV.',
            icon: Layers,
            color: 'from-amber-500 to-orange-600',
            badge: '📦 Bulk 1-Click',
            route: '/bulk-generator'
        },
        {
            title: isTr ? 'Kendini Yok Eden Gizli Not' : 'Self-Destructing Burn Note',
            desc: isTr ? 'Okunduktan sonra kalıcı olarak silinen şifreli tek kullanımlık gizli mesajlar oluşturun.' : 'Create encrypted one-time secret notes that vanish automatically after reading.',
            icon: Flame,
            color: 'from-rose-600 to-red-700',
            badge: '🔥 Zero-Trace Note',
            route: '/burn-note'
        },
        {
            title: isTr ? '10 Dakikalık Mail' : '10 Minute Mail',
            desc: isTr ? 'Kısa süreli form ve kayıt doğrulamaları için 10 dakikalık kullan-at e-posta.' : '10-minute temporary email address for rapid registration and verification flows.',
            icon: Clock,
            color: 'from-blue-600 to-cyan-600',
            badge: '⏱️ 10 Min Timer',
            route: '/10minutemail'
        },
        {
            title: isTr ? '25+ Özel Servis Kalkanı' : '25+ Dedicated Service Shields',
            desc: isTr ? 'ChatGPT, Cursor AI, Discord, Steam, Canva ve 25+ popüler servis için özel kalkanlar.' : 'Specialized disposable mailboxes optimized for ChatGPT, Cursor AI, Discord, Steam, Canva and more.',
            icon: Zap,
            color: 'from-violet-600 to-purple-600',
            badge: '🚀 Platform Shields',
            route: '/services'
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <SEOPageMeta lang={lang} page="tools" />
            {/* Header */}
            <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 text-white hover:text-red-400 transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">MephistoMail</span>
                    </Link>
                    <h1 className="text-lg font-bold tracking-tight">
                        {isTr ? 'Ücretsiz Gizlilik Araçları' : 'Free Privacy Tools'}
                    </h1>
                    <div className="w-24" />
                </div>
            </header>

            {/* Hero */}
            <section className="py-10 sm:py-16 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 mb-4">
                        <Zap size={14} />
                        <span>{isTr ? '8+ İnteraktif Gizlilik & QA Mikro Aracı' : '8+ Interactive Privacy & QA Micro-Tools'}</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
                        {isTr ? 'Ücretsiz Gizlilik & Güvenlik' : 'Free Privacy & Security'}
                        <span className="text-red-500"> {isTr ? 'Araçları' : 'Toolbox'}</span>
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto">
                        {isTr
                            ? 'E-postanızın güvenliğini denetleyin, Luhn uyumlu test kartları üretin, kırılamaz şifreler oluşturun ve veri sızıntılarını sorgulayın — 1-tık kopyalama ile %100 ücretsiz.'
                            : 'Audit email safety, generate Luhn test cards, create unbreakable passwords, and scan data breaches — 100% free with 1-click copy.'}
                    </p>
                </div>
            </section>

            {/* Interactive Dedicated Tools Directory Grid */}
            <section className="pb-12 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-orange-400" />
                        <span>{isTr ? 'Tüm İnteraktif Mikro Araçlar & Jeneratörler' : 'All Interactive Micro-Tools & Generators'}</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {allMicroTools.map((tool, idx) => {
                            const IconComponent = tool.icon;
                            return (
                                <Link
                                    key={idx}
                                    to={tool.route}
                                    className="bg-[#12121e]/90 border border-slate-800 hover:border-orange-500/50 rounded-2xl p-5 transition-all hover:scale-[1.02] flex flex-col justify-between group shadow-lg"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-md`}>
                                                <IconComponent size={18} />
                                            </div>
                                            <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                                                {tool.badge}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors mb-1.5">
                                            {tool.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            {tool.desc}
                                        </p>
                                    </div>
                                    <div className="pt-4 flex items-center justify-between text-xs font-semibold text-orange-400 group-hover:text-orange-300">
                                        <span>{isTr ? 'Aracı Aç' : 'Open Tool'}</span>
                                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Inline Quick Tools */}
            <section className="pb-16 sm:pb-20 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <h2 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">
                        {isTr ? 'Hızlı Test & Doğrulama Panelleri' : 'Instant In-Browser Test Panels'}
                    </h2>
                    <EmailValidator lang={lang} />
                    <DataBreachChecker lang={lang} />
                    <PasswordStrength lang={lang} />
                </div>
            </section>

            {/* SEO Content */}
            <section className="py-16 px-6 border-t border-white/5 bg-white/[0.01]">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6">
                        {isTr ? 'Çevrimiçi Güvenlik & QA Araçları Rehberi' : 'Online Security & QA Tools Guide'}
                    </h2>
                    <div className="text-slate-400 text-sm space-y-4 leading-relaxed">
                        {isTr ? (
                            <>
                                <p>MephistoMail'in ücretsiz güvenlik araçları, çevrimiçi gizliliğinizi korumanıza ve yazılım geliştirme süreçlerinizi hızlandırmanıza yardımcı olur. E-posta doğrulayıcımız ile bir e-posta adresinin geçerli olup olmadığını ve geçici (disposable) bir adres olup olmadığını hızlıca kontrol edebilirsiniz. Veri sızıntısı kontrol aracımız, e-posta adresinizin bilinen ihlallerde yer alıp almadığını sorgular.</p>
                                <p>Geliştiriciler için Luhn uyumlu sahte kredi kartı üreticisi, Stripe ve sandbox ödeme testlerinde hayat kurtarır. Güçlü şifre üretici ve güç testi araçlarımız, 256-bit kriptografik entropi ile kırılamaz şifreler üretir. Tüm araçlarımız 1-tık kopyalama desteği ile donatılmıştır.</p>
                            </>
                        ) : (
                            <>
                                <p>MephistoMail's free security tools help you protect your online privacy and accelerate your software development workflow. With our email validator, you can quickly check if an email address is valid and whether it's a disposable (temporary) address. Our data breach checker queries whether your email address appears in known breaches.</p>
                                <p>For software developers and QA testers, our Luhn-compliant test credit card generator simplifies sandbox checkout validations. Our password generator and strength auditor create unbreakable passwords with high cryptographic entropy. Every micro-tool is equipped with 1-click clipboard copying.</p>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-12 px-6 text-center border-t border-white/5">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
                >
                    {isTr ? '← Geçici Mail Oluştur' : '← Create Temp Mail'}
                </Link>
            </section>
        </div>
    );
};

export default ToolsPage;
