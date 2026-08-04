import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Zap, Shield, RefreshCw, CheckCircle } from 'lucide-react';
import { Language } from '../translations';
import SEOPageMeta from '../components/SEOPageMeta';

interface TenMinuteMailPageProps {
    lang: Language;
}

const TenMinuteMailPage: React.FC<TenMinuteMailPageProps> = ({ lang }) => {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <SEOPageMeta lang={lang} page="10minutemail" />
            {/* Header */}
            <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 text-white hover:text-red-400 transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">MephistoMail</span>
                    </Link>
                    <h1 className="text-lg font-bold tracking-tight">
                        10 {lang === 'tr' ? 'Dakikalık Mail' : 'Minute Mail'}
                    </h1>
                    <div className="w-24" />
                </div>
            </header>

            {/* Hero */}
            <section className="py-12 sm:py-20 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                        <Clock size={16} />
                        10 {lang === 'tr' ? 'Dakika Temp Mail' : 'Minute Temp Mail'}
                    </div>
                    <h1 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tight mb-4 sm:mb-6">
                        {lang === 'tr' ? (
                            <>10 Dakikalık <span className="text-red-500">Geçici E-posta</span></>
                        ) : (
                            <>10 Minute <span className="text-red-500">Disposable Email</span></>
                        )}
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8">
                        {lang === 'tr'
                            ? 'MephistoMail ile 10 dakikalık geçici e-posta adresi oluşturun. Kayıt yok, spam yok, izleme yok. Anında kullan-at e-posta — ücretsiz ve anonim.'
                            : 'Create a 10 minute disposable email address with MephistoMail. No registration, no spam, no tracking. Instant throwaway email — free and anonymous.'}
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl text-base sm:text-lg hover:scale-105 transition-transform shadow-2xl shadow-red-500/20"
                    >
                        <Zap size={20} />
                        {lang === 'tr' ? 'Hemen Oluştur — Ücretsiz' : 'Create Now — Free'}
                    </Link>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 px-6">
                <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
                    {[
                        {
                            icon: Clock,
                            title: lang === 'tr' ? 'Anlık Oluşturma' : 'Instant Creation',
                            desc: lang === 'tr' ? 'Sayfayı açın, 10 dakikalık geçici mail adresiniz hazır. Kayıt yok, bekleme yok.' : 'Open the page, your 10 minute temp mail is ready. No registration, no waiting.',
                        },
                        {
                            icon: Shield,
                            title: lang === 'tr' ? 'Tam Gizlilik' : 'Full Privacy',
                            desc: lang === 'tr' ? 'Sıfır kayıt politikası. E-postalarınız RAM\'de tutulur, diske asla yazılmaz.' : 'Zero logging policy. Your emails are kept in RAM, never written to disk.',
                        },
                        {
                            icon: RefreshCw,
                            title: lang === 'tr' ? 'Sınırsız Yenileme' : 'Unlimited Refresh',
                            desc: lang === 'tr' ? 'İstediğiniz kadar yeni 10 dakikalık adres oluşturun. Tamamen ücretsiz.' : 'Create as many new 10 minute addresses as you want. Completely free.',
                        },
                    ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-center">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
                                    <Icon size={22} className="text-red-400" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 px-6 border-t border-white/5">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black text-center mb-12">
                        {lang === 'tr' ? '10 Dakikalık Mail Nasıl Çalışır?' : 'How Does 10 Minute Mail Work?'}
                    </h2>
                    <div className="space-y-6">
                        {[
                            {
                                step: '01',
                                title: lang === 'tr' ? 'Sayfayı Açın' : 'Open the Page',
                                desc: lang === 'tr' ? 'MephistoMail\'i ziyaret ettiğinizde otomatik olarak bir 10 dakikalık geçici e-posta adresi oluşturulur.' : 'When you visit MephistoMail, a 10 minute temporary email address is automatically generated.',
                            },
                            {
                                step: '02',
                                title: lang === 'tr' ? 'Adresi Kopyalayın' : 'Copy the Address',
                                desc: lang === 'tr' ? 'Oluşturulan geçici mail adresini tek tıkla kopyalayın ve istediğiniz yerde kullanın.' : 'Copy the generated temp mail address with one click and use it wherever you want.',
                            },
                            {
                                step: '03',
                                title: lang === 'tr' ? 'E-postaları Alın' : 'Receive Emails',
                                desc: lang === 'tr' ? 'Gelen e-postalar anında görüntülenir. OTP kodları, doğrulama linkleri — hepsi saniyeler içinde.' : 'Incoming emails are displayed instantly. OTP codes, verification links — all within seconds.',
                            },
                            {
                                step: '04',
                                title: lang === 'tr' ? 'Otomatik Silme' : 'Auto Delete',
                                desc: lang === 'tr' ? 'Süre dolduğunda tüm veriler otomatik olarak silinir. Hiçbir iz kalmaz.' : 'When time expires, all data is automatically deleted. No trace remains.',
                            },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-6 items-start bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
                                <span className="text-3xl font-black text-red-500/30 shrink-0">{item.step}</span>
                                <div>
                                    <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Use Cases */}
            <section className="py-16 px-6 border-t border-white/5 bg-white/[0.01]">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-8 text-center">
                        {lang === 'tr' ? '10 Dakikalık Mail Ne İçin Kullanılır?' : 'What is 10 Minute Mail Used For?'}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            lang === 'tr' ? 'Web sitesi kayıt formları' : 'Website registration forms',
                            lang === 'tr' ? 'Ücretsiz deneme abonelikleri' : 'Free trial subscriptions',
                            lang === 'tr' ? 'OTP ve doğrulama kodları' : 'OTP and verification codes',
                            lang === 'tr' ? 'Dosya indirme siteleri' : 'File download websites',
                            lang === 'tr' ? 'Forum ve topluluk kayıtları' : 'Forum and community signups',
                            lang === 'tr' ? 'WiFi erişim noktası girişleri' : 'WiFi hotspot logins',
                            lang === 'tr' ? 'Newsletter abonelikleri' : 'Newsletter subscriptions',
                            lang === 'tr' ? 'Tek seferlik e-posta iletişimi' : 'One-time email communication',
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                                <CheckCircle size={16} className="text-green-400 shrink-0" />
                                <span className="text-slate-300 text-sm">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SEO Long Content */}
            <section className="py-16 px-6 border-t border-white/5">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6">
                        {lang === 'tr' ? '10 Dakikalık Geçici Mail Hakkında' : 'About 10 Minute Temporary Email'}
                    </h2>
                    <div className="text-slate-400 text-sm space-y-4 leading-relaxed">
                        {lang === 'tr' ? (
                            <>
                                <p>10 dakikalık mail servisleri, kısa süreli tek kullanımlık dijital işlemler için özel olarak tasarlanmıştır. MephistoMail, e-posta trafiğini doğrudan uçucu RAM belleğe yönlendirir ve fiziksel depolama alanına hiçbir veri yazmaz.</p>
                                <p>Web platformlarında hesap açarken veya tek seferlik doğrulama kodu alırken kişisel e-posta adresinizi paylaşmak, dijital izinizi reklam verenlere açmanıza neden olur. 10 dakikalık kullan-at adresler bu riski tamamen ortadan kaldırır.</p>
                                <p>Gelişmiş WebSocket ve SSE (Server-Sent Events) protokollerimiz sayesinde gelen mailler tarayıcınız açıkken milisaniyeler içinde ekranda belirir. Manuel sayfa yenilemeye veya polling beklemelerine gerek kalmaz.</p>
                                <p>Geleneksel servislerin aksine, MephistoMail tek bir tarayıcı sekmesinde 100 eş zamanlı posta kutusu yönetmenize imkan tanır. Oturum tamamlandığında bellek otomatik olarak temizlenir.</p>
                            </>
                        ) : (
                            <>
                                <p>10 minute mail services are specifically engineered for short-lived digital interactions. MephistoMail routes incoming mail streams directly into volatile RAM memory, avoiding physical disk writes altogether.</p>
                                <p>Exposing your primary email address during routine sign-ups allows data brokers to build persistent profiles. Disposable 10-minute handles decouple your real identity from online web services.</p>
                                <p>Powered by low-latency WebSockets and Server-Sent Events (SSE), incoming messages land on your active screen in milliseconds without manual browser page reloads.</p>
                                <p>Unlike legacy throwaway email platforms, MephistoMail allows seamless switching across up to 100 active mailboxes in a single browser tab. Memory is automatically flushed upon session termination.</p>
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
                    {lang === 'tr' ? '← Hemen 10 Dakikalık Mail Oluştur' : '← Create 10 Minute Mail Now'}
                </Link>
            </section>
        </div>
    );
};

export default TenMinuteMailPage;
