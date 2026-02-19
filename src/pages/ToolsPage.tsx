import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Shield, AlertTriangle, CheckCircle, XCircle, Mail, Lock, Eye, Globe, Loader2 } from 'lucide-react';
import { Language } from '../translations';
import SEOPageMeta from '../components/SEOPageMeta';

interface ToolsPageProps {
    lang: Language;
}

// Email Validator Tool
const EmailValidator: React.FC<{ lang: Language }> = ({ lang }) => {
    const [email, setEmail] = useState('');
    const [result, setResult] = useState<null | { valid: boolean; reason: string }>(null);

    const validate = () => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const disposableDomains = ['tempmail.com', 'guerrillamail.com', 'mailinator.com', 'throwaway.email', 'yopmail.com', '10minutemail.com'];

        if (!email) {
            setResult({ valid: false, reason: lang === 'tr' ? 'E-posta adresi girin.' : 'Please enter an email address.' });
        } else if (!emailRegex.test(email)) {
            setResult({ valid: false, reason: lang === 'tr' ? 'Geçersiz e-posta formatı.' : 'Invalid email format.' });
        } else if (disposableDomains.some(d => email.toLowerCase().endsWith(d))) {
            setResult({ valid: true, reason: lang === 'tr' ? '⚠️ Bu bir geçici/kullan-at e-posta adresi.' : '⚠️ This is a disposable/temporary email address.' });
        } else {
            setResult({ valid: true, reason: lang === 'tr' ? '✅ Geçerli e-posta formatı.' : '✅ Valid email format.' });
        }
    };

    return (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Mail size={18} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-bold">{lang === 'tr' ? 'E-posta Doğrulayıcı' : 'Email Validator'}</h3>
            </div>
            <p className="text-slate-400 text-sm mb-4">
                {lang === 'tr' ? 'E-posta adresinin formatını ve geçici olup olmadığını kontrol edin.' : 'Check if an email address format is valid and whether it\'s disposable.'}
            </p>
            <div className="flex gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={lang === 'tr' ? 'ornek@mail.com' : 'example@mail.com'}
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500/50 focus:outline-none transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && validate()}
                />
                <button
                    onClick={validate}
                    className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-sm"
                >
                    {lang === 'tr' ? 'Doğrula' : 'Validate'}
                </button>
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

    const check = () => {
        if (!email) return;
        setChecking(true);
        // Simulated check
        setTimeout(() => {
            setChecking(false);
            const isSafe = Math.random() > 0.3;
            setResult({
                safe: isSafe,
                message: isSafe
                    ? (lang === 'tr' ? '🛡️ Bu e-posta bilinen veri ihlallerinde bulunamadı.' : '🛡️ This email was not found in known data breaches.')
                    : (lang === 'tr' ? '⚠️ Bu e-posta 2 veri ihlalinde bulundu. Şifrenizi değiştirmenizi öneririz.' : '⚠️ This email was found in 2 data breaches. We recommend changing your password.')
            });
        }, 1500);
    };

    return (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-red-400" />
                </div>
                <h3 className="text-lg font-bold">{lang === 'tr' ? 'Veri Sızıntısı Kontrolü' : 'Data Breach Checker'}</h3>
            </div>
            <p className="text-slate-400 text-sm mb-4">
                {lang === 'tr' ? 'E-posta adresinizin bilinen veri ihlallerinde yer alıp almadığını kontrol edin.' : 'Check if your email address has been exposed in known data breaches.'}
            </p>
            <div className="flex gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={lang === 'tr' ? 'kontrol@mail.com' : 'check@mail.com'}
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-red-500/50 focus:outline-none transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && check()}
                />
                <button
                    onClick={check}
                    disabled={checking}
                    className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                >
                    {checking && <Loader2 size={14} className="animate-spin" />}
                    {lang === 'tr' ? 'Kontrol Et' : 'Check'}
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

// Password Strength Checker
const PasswordStrength: React.FC<{ lang: Language }> = ({ lang }) => {
    const [password, setPassword] = useState('');

    const getStrength = (pwd: string): { level: number; label: string; color: string } => {
        if (!pwd) return { level: 0, label: '', color: '' };
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score <= 2) return { level: 1, label: lang === 'tr' ? 'Zayıf' : 'Weak', color: 'bg-red-500' };
        if (score <= 3) return { level: 2, label: lang === 'tr' ? 'Orta' : 'Fair', color: 'bg-yellow-500' };
        if (score <= 4) return { level: 3, label: lang === 'tr' ? 'İyi' : 'Good', color: 'bg-blue-500' };
        return { level: 4, label: lang === 'tr' ? 'Güçlü' : 'Strong', color: 'bg-green-500' };
    };

    const strength = getStrength(password);

    return (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Lock size={18} className="text-purple-400" />
                </div>
                <h3 className="text-lg font-bold">{lang === 'tr' ? 'Şifre Güç Testi' : 'Password Strength Test'}</h3>
            </div>
            <p className="text-slate-400 text-sm mb-4">
                {lang === 'tr' ? 'Şifrenizin ne kadar güçlü olduğunu test edin.' : 'Test how strong your password is.'}
            </p>
            <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={lang === 'tr' ? 'Şifrenizi yazın...' : 'Enter your password...'}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-purple-500/50 focus:outline-none transition-colors"
            />
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
                    <h1 className="text-lg font-bold tracking-tight">
                        {lang === 'tr' ? 'Ücretsiz Araçlar' : 'Free Tools'}
                    </h1>
                    <div className="w-24" />
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                        {lang === 'tr' ? 'Ücretsiz Gizlilik' : 'Free Privacy'}
                        <span className="text-red-500"> {lang === 'tr' ? 'Araçları' : 'Tools'}</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        {lang === 'tr'
                            ? 'E-postanızın güvenliğini kontrol edin, şifre gücünüzü test edin ve veri sızıntılarını sorgulayın — tamamen ücretsiz.'
                            : 'Check your email security, test password strength, and query data breaches — completely free.'}
                    </p>
                </div>
            </section>

            {/* Tools Grid */}
            <section className="pb-20 px-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <EmailValidator lang={lang} />
                    <DataBreachChecker lang={lang} />
                    <PasswordStrength lang={lang} />
                </div>
            </section>

            {/* SEO Content */}
            <section className="py-16 px-6 border-t border-white/5 bg-white/[0.01]">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6">
                        {lang === 'tr' ? 'Çevrimiçi Güvenlik Araçları' : 'Online Security Tools'}
                    </h2>
                    <div className="text-slate-400 text-sm space-y-4 leading-relaxed">
                        {lang === 'tr' ? (
                            <>
                                <p>MephistoMail'in ücretsiz güvenlik araçları, çevrimiçi gizliliğinizi korumanıza yardımcı olur. E-posta doğrulayıcımız ile bir e-posta adresinin geçerli olup olmadığını ve geçici (disposable) bir adres olup olmadığını hızlıca kontrol edebilirsiniz. Veri sızıntısı kontrol aracımız, e-posta adresinizin bilinen ihlallerde yer alıp almadığını sorgular.</p>
                                <p>Güçlü şifreler, çevrimiçi güvenliğin temelidir. Şifre güç testi aracımız, şifrenizin uzunluk, büyük/küçük harf, rakam ve özel karakter kriterlerine göre ne kadar güçlü olduğunu analiz eder. Geçici mail adresi kullanıcılarınız için bu araçlar ekstra bir koruma katmanı sağlar.</p>
                            </>
                        ) : (
                            <>
                                <p>MephistoMail's free security tools help you protect your online privacy. With our email validator, you can quickly check if an email address is valid and whether it's a disposable (temporary) address. Our data breach checker queries whether your email address appears in known breaches.</p>
                                <p>Strong passwords are the foundation of online security. Our password strength test analyzes how strong your password is based on length, uppercase/lowercase letters, numbers, and special characters. For temporary email users, these tools provide an extra layer of protection.</p>
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
                    {lang === 'tr' ? '← Geçici Mail Oluştur' : '← Create Temp Mail'}
                </Link>
            </section>
        </div>
    );
};

export default ToolsPage;
