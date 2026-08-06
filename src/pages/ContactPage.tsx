import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, Send, Shield, Clock, Globe, CheckCircle, Github, Twitter, ExternalLink } from 'lucide-react';
import { Language } from '../translations';
import SEOPageMeta from '../components/SEOPageMeta';

interface ContactPageProps {
    lang: Language;
}

const ContactPage: React.FC<ContactPageProps> = ({ lang }) => {
    const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In production, this would send to an API endpoint
        // For now, open mailto link
        const mailtoLink = `mailto:support@mephistomail.site?subject=${encodeURIComponent(formState.subject)}&body=${encodeURIComponent(`From: ${formState.name} (${formState.email})\n\n${formState.message}`)}`;
        window.open(mailtoLink, '_blank');
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
    };

    const t = {
        en: {
            pageTitle: 'Contact Us',
            pageSubtitle: 'Have a question, suggestion, or found a bug? We\'d love to hear from you.',
            nameLabel: 'Your Name',
            namePlaceholder: 'John Doe',
            emailLabel: 'Your Email',
            emailPlaceholder: 'you@example.com',
            subjectLabel: 'Subject',
            subjectPlaceholder: 'How can we help?',
            messageLabel: 'Message',
            messagePlaceholder: 'Tell us what\'s on your mind...',
            sendButton: 'Send Message',
            sentMessage: 'Message sent! We\'ll get back to you soon.',
            faqTitle: 'Frequently Asked',
            faqSubtitle: 'Quick answers before you reach out',
            responseTime: 'Response Time',
            responseDesc: 'We typically respond within 24 hours on business days.',
            privacyTitle: 'Your Privacy',
            privacyDesc: 'We never share your contact info. Messages are handled securely.',
            globalTitle: 'Global Support',
            globalDesc: 'We support English and Turkish. Feel free to write in either language.',
            supportChannels: 'Support Channels',
            emailSupport: 'Email Support',
            emailSupportDesc: 'For general inquiries and support requests',
            bugReport: 'Bug Reports',
            bugReportDesc: 'Found a bug? Report it on GitHub Issues',
            featureRequest: 'Feature Requests',
            featureRequestDesc: 'Suggest new features and improvements',
        },
        tr: {
            pageTitle: 'İletişim',
            pageSubtitle: 'Bir sorunuz, öneriniz veya bulduğunuz bir hata mı var? Sizden duymak isteriz.',
            nameLabel: 'Adınız',
            namePlaceholder: 'Ahmet Yılmaz',
            emailLabel: 'E-posta Adresiniz',
            emailPlaceholder: 'siz@example.com',
            subjectLabel: 'Konu',
            subjectPlaceholder: 'Size nasıl yardımcı olabiliriz?',
            messageLabel: 'Mesaj',
            messagePlaceholder: 'Aklınızdakileri bize anlatın...',
            sendButton: 'Mesaj Gönder',
            sentMessage: 'Mesaj gönderildi! En kısa sürede dönüş yapacağız.',
            faqTitle: 'Sık Sorulanlar',
            faqSubtitle: 'Bize yazmadan önce hızlı cevaplar',
            responseTime: 'Yanıt Süresi',
            responseDesc: 'İş günlerinde genellikle 24 saat içinde yanıt veriyoruz.',
            privacyTitle: 'Gizliliğiniz',
            privacyDesc: 'İletişim bilgilerinizi asla paylaşmayız. Mesajlar güvenli şekilde işlenir.',
            globalTitle: 'Global Destek',
            globalDesc: 'İngilizce ve Türkçe destek sunuyoruz. İstediğiniz dilde yazabilirsiniz.',
            supportChannels: 'Destek Kanalları',
            emailSupport: 'E-posta Desteği',
            emailSupportDesc: 'Genel sorular ve destek talepleri için',
            bugReport: 'Hata Bildirimi',
            bugReportDesc: 'Bir hata mı buldunuz? GitHub Issues üzerinden bildirin',
            featureRequest: 'Özellik İstekleri',
            featureRequestDesc: 'Yeni özellikler ve iyileştirmeler önerin',
        }
    };

    const txt = t[lang];

    const faqs = lang === 'en' ? [
        { q: 'Is MephistoMail really free?', a: 'Yes, 100% free. No hidden costs, no premium tiers, no ads. All features are available at no charge.' },
        { q: 'How long do temporary emails last?', a: 'As long as your browser session is open. You can also set auto-delete timers from 5 minutes to 24 hours.' },
        { q: 'Can I send emails with temp mail?', a: 'MephistoMail is designed for receiving emails only. This prevents abuse and spam.' },
        { q: 'Do you store my data?', a: 'No. We use RAM-only (volatile memory) storage. When your session ends, everything is permanently deleted. Zero logs.' },
    ] : [
        { q: 'MephistoMail gerçekten ücretsiz mi?', a: 'Evet, %100 ücretsiz. Gizli maliyet yok, premium katman yok, reklam yok. Tüm özellikler ücretsiz.' },
        { q: 'Geçici e-postalar ne kadar süre kalır?', a: 'Tarayıcı oturumunuz açık olduğu sürece. Ayrıca 5 dakika ile 24 saat arası otomatik silme zamanlayıcıları ayarlayabilirsiniz.' },
        { q: 'Temp mail ile e-posta gönderebilir miyim?', a: 'MephistoMail sadece e-posta almak için tasarlanmıştır. Bu, kötüye kullanım ve spam\'i önler.' },
        { q: 'Verilerimi saklıyor musunuz?', a: 'Hayır. Sadece RAM (uçucu bellek) depolama kullanıyoruz. Oturumunuz sona erdiğinde her şey kalıcı olarak silinir. Sıfır log.' },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <SEOPageMeta lang={lang} page="help" />

            {/* Header */}
            <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 text-white hover:text-red-400 transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">MephistoMail</span>
                    </Link>
                    <h1 className="text-lg font-bold tracking-tight">{txt.pageTitle}</h1>
                    <div className="w-24" />
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/10 flex items-center justify-center mx-auto mb-6">
                        <MessageSquare size={28} className="text-red-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                        {txt.pageTitle}
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        {txt.pageSubtitle}
                    </p>
                </div>
            </section>

            {/* Support Channels */}
            <section className="px-6 pb-12">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">{txt.supportChannels}</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Email Support */}
                        <a
                            href="mailto:support@mephistomail.site"
                            className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-red-500/20 transition-all duration-300"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center mb-4">
                                <Mail size={18} className="text-red-400" />
                            </div>
                            <h3 className="font-bold text-white group-hover:text-red-400 transition-colors mb-1">{txt.emailSupport}</h3>
                            <p className="text-slate-500 text-sm">{txt.emailSupportDesc}</p>
                            <span className="text-red-400/70 text-xs mt-3 flex items-center gap-1">
                                support@mephistomail.site <ExternalLink size={10} />
                            </span>
                        </a>

                        {/* Bug Reports */}
                        <a
                            href="https://github.com/jokallame350-lang/temp-mailmephisto/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-purple-500/20 transition-all duration-300"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 flex items-center justify-center mb-4">
                                <Github size={18} className="text-purple-400" />
                            </div>
                            <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors mb-1">{txt.bugReport}</h3>
                            <p className="text-slate-500 text-sm">{txt.bugReportDesc}</p>
                            <span className="text-purple-400/70 text-xs mt-3 flex items-center gap-1">
                                GitHub Issues <ExternalLink size={10} />
                            </span>
                        </a>

                        {/* Feature Requests */}
                        <a
                            href="https://github.com/jokallame350-lang/temp-mailmephisto/discussions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-green-500/20 transition-all duration-300"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center mb-4">
                                <Send size={18} className="text-green-400" />
                            </div>
                            <h3 className="font-bold text-white group-hover:text-green-400 transition-colors mb-1">{txt.featureRequest}</h3>
                            <p className="text-slate-500 text-sm">{txt.featureRequestDesc}</p>
                            <span className="text-green-400/70 text-xs mt-3 flex items-center gap-1">
                                GitHub Discussions <ExternalLink size={10} />
                            </span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Contact Form + Info Grid */}
            <section className="px-6 pb-16">
                <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-5">
                    {/* Contact Form */}
                    <div className="md:col-span-3">
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
                            {submitted ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                                        <CheckCircle size={32} className="text-green-400" />
                                    </div>
                                    <p className="text-lg font-bold text-green-400 mb-2">{txt.sentMessage}</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{txt.nameLabel}</label>
                                            <input
                                                type="text"
                                                required
                                                value={formState.name}
                                                onChange={e => setFormState(p => ({ ...p, name: e.target.value }))}
                                                placeholder={txt.namePlaceholder}
                                                className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{txt.emailLabel}</label>
                                            <input
                                                type="email"
                                                required
                                                value={formState.email}
                                                onChange={e => setFormState(p => ({ ...p, email: e.target.value }))}
                                                placeholder={txt.emailPlaceholder}
                                                className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{txt.subjectLabel}</label>
                                        <input
                                            type="text"
                                            required
                                            value={formState.subject}
                                            onChange={e => setFormState(p => ({ ...p, subject: e.target.value }))}
                                            placeholder={txt.subjectPlaceholder}
                                            className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{txt.messageLabel}</label>
                                        <textarea
                                            required
                                            rows={5}
                                            value={formState.message}
                                            onChange={e => setFormState(p => ({ ...p, message: e.target.value }))}
                                            placeholder={txt.messagePlaceholder}
                                            className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all resize-none"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                                    >
                                        <Send size={16} />
                                        {txt.sendButton}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Info Cards */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Clock size={14} className="text-blue-400" />
                                </div>
                                <h3 className="font-bold text-sm">{txt.responseTime}</h3>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed">{txt.responseDesc}</p>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <Shield size={14} className="text-green-400" />
                                </div>
                                <h3 className="font-bold text-sm">{txt.privacyTitle}</h3>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed">{txt.privacyDesc}</p>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                    <Globe size={14} className="text-orange-400" />
                                </div>
                                <h3 className="font-bold text-sm">{txt.globalTitle}</h3>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed">{txt.globalDesc}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="px-6 pb-20 border-t border-white/5 pt-12">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black tracking-tight mb-2">{txt.faqTitle}</h2>
                        <p className="text-slate-500 text-sm">{txt.faqSubtitle}</p>
                    </div>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <details
                                key={i}
                                className="group bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/10 transition-colors"
                            >
                                <summary className="px-6 py-4 cursor-pointer text-sm font-bold text-white flex items-center justify-between list-none">
                                    {faq.q}
                                    <span className="text-slate-500 group-open:rotate-45 transition-transform duration-200 text-lg">+</span>
                                </summary>
                                <div className="px-6 pb-4 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-3">
                                    {faq.a}
                                </div>
                            </details>
                        ))}
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

export default ContactPage;
