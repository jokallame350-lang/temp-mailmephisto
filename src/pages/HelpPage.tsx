import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Mail, Shield, Clock, Users, Globe, Lock, Zap, MessageCircle, Github } from 'lucide-react';
import { Language } from '../translations';
import SEOPageMeta from '../components/SEOPageMeta';

interface HelpPageProps {
    lang: Language;
}

const faqs = {
    en: [
        { q: 'What is MephistoMail?', a: 'MephistoMail is a free temporary email service that allows you to create anonymous disposable email addresses instantly. No registration required — perfect for protecting your privacy online.' },
        { q: 'How do I create a temporary email?', a: 'Simply visit MephistoMail and a temporary email address is automatically generated for you. Click "Copy" to copy it and use it wherever you need.' },
        { q: 'How long does my temporary email last?', a: 'Your temporary email remains active as long as your browser session is open. You can also set auto-delete timers for individual accounts.' },
        { q: 'Can I receive OTP verification codes?', a: 'Yes! MephistoMail uses WebSocket technology for instant email delivery, making it perfect for receiving OTP codes, verification links, and confirmation emails.' },
        { q: 'Is MephistoMail free?', a: 'Yes, MephistoMail is 100% free with no ads, no registration, and no premium restrictions. Create unlimited temporary email addresses at zero cost.' },
        { q: 'Do you store my emails?', a: 'No. MephistoMail uses a RAM-only architecture — your emails are never written to disk. When your session ends, all data is permanently gone.' },
        { q: 'Can I use MephistoMail for Instagram/Twitter?', a: 'Yes, you can use MephistoMail to receive verification codes from social media platforms like Instagram, Twitter, Discord, and many more.' },
        { q: 'How many accounts can I create?', a: 'You can manage up to 100 temporary email accounts simultaneously. Each has its own inbox and can be managed independently.' },
        { q: 'Can I choose my own email address?', a: 'Yes! Use the "Change" button to customize your email username. You can choose from multiple available domains.' },
        { q: 'Is MephistoMail safe?', a: 'Absolutely. MephistoMail uses end-to-end encryption, zero-logging policy, and RAM-only storage. We never track your activity or sell your data.' },
        { q: 'Can I send emails with MephistoMail?', a: 'MephistoMail is designed for receiving emails only. For sending, you should use your regular email provider.' },
        { q: 'Does MephistoMail work on mobile?', a: 'Yes, MephistoMail is fully responsive and works on all devices — smartphones, tablets, and desktops. It\'s also a Progressive Web App (PWA).' },
        { q: 'What is the difference between MephistoMail and Mailinator?', a: 'MephistoMail offers stronger privacy (RAM-only storage, zero logging), instant WebSocket delivery, up to 100 simultaneous accounts, and a modern dark-mode interface — all for free.' },
        { q: 'Can I use keyboard shortcuts?', a: 'Yes! Press N for new account, R to refresh, C to copy address, and ? to see all available shortcuts.' },
    ],
    tr: [
        { q: 'MephistoMail nedir?', a: 'MephistoMail, anonim geçici e-posta adresleri oluşturmanıza olanak tanıyan ücretsiz bir temp mail servisidir. Kayıt gerektirmez — çevrimiçi gizliliğinizi korumak için idealdir.' },
        { q: 'Geçici e-posta nasıl oluştururum?', a: 'MephistoMail\'i ziyaret ettiğinizde otomatik olarak bir geçici e-posta adresi oluşturulur. "Kopyala" butonuna tıklayarak adresi kopyalayın ve istediğiniz yerde kullanın.' },
        { q: 'Geçici e-postam ne kadar süre aktif kalır?', a: 'Geçici e-postanız tarayıcı oturumunuz açık olduğu sürece aktif kalır. Ayrıca hesaplar için otomatik silme zamanlayıcıları ayarlayabilirsiniz.' },
        { q: 'OTP doğrulama kodlarını alabilir miyim?', a: 'Evet! MephistoMail, anlık e-posta teslimatı için WebSocket teknolojisi kullanır — OTP kodları, doğrulama linkleri ve onay e-postaları saniyeler içinde gelir.' },
        { q: 'MephistoMail ücretsiz mi?', a: 'Evet, MephistoMail %100 ücretsizdir; reklam, kayıt veya premium kısıtlama yoktur. Sıfır maliyetle sınırsız geçici e-posta adresi oluşturabilirsiniz.' },
        { q: 'E-postalarımı saklıyor musunuz?', a: 'Hayır. MephistoMail, RAM-only mimari kullanır — e-postalarınız asla diske yazılmaz. Oturumunuz sona erdiğinde tüm veriler kalıcı olarak silinir.' },
        { q: 'MephistoMail\'i Instagram/Twitter için kullanabilir miyim?', a: 'Evet, Instagram, Twitter, Discord ve birçok sosyal medya platformundan doğrulama kodları almak için MephistoMail\'i kullanabilirsiniz.' },
        { q: 'Kaç hesap oluşturabilirim?', a: 'Aynı anda 100 adete kadar geçici e-posta hesabı yönetebilirsiniz. Her birinin kendi gelen kutusu vardır ve bağımsız olarak yönetilebilir.' },
        { q: 'Kendi e-posta adresimi seçebilir miyim?', a: 'Evet! "Değiştir" butonunu kullanarak e-posta kullanıcı adınızı özelleştirebilirsiniz. Birden fazla mevcut domain arasından seçim yapabilirsiniz.' },
        { q: 'MephistoMail güvenli mi?', a: 'Kesinlikle. MephistoMail, uçtan uca şifreleme, sıfır kayıt politikası ve yalnızca RAM depolama kullanır. Aktivitenizi asla izlemez veya verilerinizi satmayız.' },
        { q: 'MephistoMail ile e-posta gönderebilir miyim?', a: 'MephistoMail yalnızca e-posta almak için tasarlanmıştır. Göndermek için normal e-posta sağlayıcınızı kullanmalısınız.' },
        { q: 'MephistoMail mobilde çalışır mı?', a: 'Evet, MephistoMail tamamen responsive\'dir ve tüm cihazlarda çalışır — akıllı telefonlar, tabletler ve masaüstü bilgisayarlar. Ayrıca Progressive Web App (PWA) olarak da kullanılabilir.' },
        { q: 'MephistoMail ile Mailinator arasındaki fark nedir?', a: 'MephistoMail daha güçlü gizlilik (RAM-only depolama, sıfır kayıt), anlık WebSocket teslimatı, 100 eş zamanlı hesap ve modern koyu tema arayüzü sunar — hepsi ücretsiz.' },
        { q: 'Klavye kısayollarını kullanabilir miyim?', a: 'Evet! Yeni hesap için N, yenileme için R, adresi kopyalamak için C ve tüm kısayolları görmek için ? tuşuna basın.' },
    ],
};

const HelpPage: React.FC<HelpPageProps> = ({ lang }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const items = faqs[lang];

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <SEOPageMeta lang={lang} page="help" />
            {/* Header */}
            <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 text-white hover:text-red-400 transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">MephistoMail</span>
                    </Link>
                    <h1 className="text-lg font-bold tracking-tight">
                        {lang === 'tr' ? 'Yardım Merkezi' : 'Help Center'}
                    </h1>
                    <div className="w-24" />
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                        {lang === 'tr' ? 'Yardım' : 'Help'}
                        <span className="text-red-500"> {lang === 'tr' ? 'Merkezi' : 'Center'}</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        {lang === 'tr'
                            ? 'MephistoMail hakkında sıkça sorulan sorular ve detaylı yanıtlar.'
                            : 'Frequently asked questions and detailed answers about MephistoMail.'}
                    </p>
                </div>
            </section>

            {/* Quick Links */}
            <section className="pb-12 px-6">
                <div className="max-w-4xl mx-auto grid md:grid-cols-4 gap-4">
                    {[
                        { icon: Mail, label: lang === 'tr' ? 'Geçici Mail' : 'Temp Mail', color: 'from-red-500/20 to-orange-500/20' },
                        { icon: Shield, label: lang === 'tr' ? 'Gizlilik' : 'Privacy', color: 'from-blue-500/20 to-cyan-500/20' },
                        { icon: Zap, label: lang === 'tr' ? 'Hız' : 'Speed', color: 'from-yellow-500/20 to-amber-500/20' },
                        { icon: Globe, label: lang === 'tr' ? 'Özellikler' : 'Features', color: 'from-purple-500/20 to-pink-500/20' },
                    ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-2`}>
                                    <Icon size={18} className="text-white/80" />
                                </div>
                                <span className="text-sm font-medium text-slate-300">{item.label}</span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* FAQ Accordion */}
            <section className="pb-20 px-6" itemScope itemType="https://schema.org/FAQPage">
                <div className="max-w-4xl mx-auto space-y-2">
                    <h2 className="text-2xl font-bold mb-6">
                        {lang === 'tr' ? 'Sıkça Sorulan Sorular' : 'Frequently Asked Questions'}
                    </h2>
                    {items.map((item, index) => (
                        <div
                            key={index}
                            itemScope
                            itemProp="mainEntity"
                            itemType="https://schema.org/Question"
                            className="border border-white/[0.06] rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.03] transition-colors"
                            >
                                <span itemProp="name" className="text-sm font-medium text-white pr-4">{item.q}</span>
                                <ChevronDown
                                    size={16}
                                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {openIndex === index && (
                                <div
                                    itemScope
                                    itemProp="acceptedAnswer"
                                    itemType="https://schema.org/Answer"
                                    className="px-4 pb-4"
                                >
                                    <p itemProp="text" className="text-slate-400 text-sm leading-relaxed">{item.a}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact & Open Source */}
            <section className="py-12 px-6 border-t border-white/5 text-center">
                <MessageCircle size={24} className="text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2">
                    {lang === 'tr' ? 'Hâlâ sorunuz mu var?' : 'Still have questions?'}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                    {lang === 'tr' ? 'Bize e-posta gönderin veya GitHub depomuzu ziyaret edin.' : 'Send us an email or visit our GitHub repository.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6">
                    <a href="mailto:jokallame0@gmail.com" className="text-red-400 text-sm font-medium hover:underline flex items-center gap-1.5">
                        <Mail size={16} />
                        jokallame0@gmail.com
                    </a>
                    <a href="https://github.com/jokallame350-lang/temp-mailmephisto" target="_blank" rel="noopener noreferrer" className="text-purple-400 text-sm font-medium hover:underline flex items-center gap-1.5">
                        <Github size={16} />
                        GitHub Repository
                    </a>
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

export default HelpPage;
