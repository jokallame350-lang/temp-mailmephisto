import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, User, Tag, ArrowRight, Shield, Mail, Zap, Eye } from 'lucide-react';
import { translations, Language } from '../translations';
import SEOPageMeta from '../components/SEOPageMeta';

interface BlogPageProps {
    lang: Language;
}

const blogPosts = {
    en: [
        {
            id: 'what-is-temp-mail',
            title: 'What is Temporary Email? Complete Guide 2026',
            excerpt: 'Learn everything about disposable email addresses — how they work, why you need one, and how to protect your online privacy with temp mail services.',
            date: '2026-02-15',
            readTime: '8 min',
            category: 'Guide',
            icon: Mail,
        },
        {
            id: 'temp-mail-vs-regular-email',
            title: 'Temp Mail vs Regular Email: When to Use Which?',
            excerpt: 'Discover the key differences between temporary and permanent email addresses. Learn when a disposable email is the smarter choice for online security.',
            date: '2026-02-10',
            readTime: '6 min',
            category: 'Comparison',
            icon: Shield,
        },
        {
            id: 'protect-privacy-online',
            title: '10 Ways to Protect Your Privacy Online in 2026',
            excerpt: 'From disposable emails to VPNs, discover the top privacy tools and strategies to keep your personal data safe from trackers and data breaches.',
            date: '2026-02-05',
            readTime: '10 min',
            category: 'Privacy',
            icon: Eye,
        },
        {
            id: 'avoid-spam-with-temp-mail',
            title: 'How to Avoid Spam Forever Using Disposable Email',
            excerpt: 'Tired of spam flooding your inbox? Learn how temporary email addresses can permanently solve your spam problem and keep your real email clean.',
            date: '2026-01-28',
            readTime: '5 min',
            category: 'Tips',
            icon: Zap,
        },
        {
            id: 'best-temp-mail-services-2026',
            title: 'Best Temporary Email Services Compared (2026)',
            excerpt: 'We compare MephistoMail, Temp-Mail.org, Guerrilla Mail, and 10MinuteMail. Find out which disposable email service offers the best privacy and speed.',
            date: '2026-01-20',
            readTime: '12 min',
            category: 'Review',
            icon: Tag,
        },
    ],
    tr: [
        {
            id: 'gecici-mail-nedir',
            title: 'Geçici Mail Nedir? 2026 Tam Rehber',
            excerpt: 'Kullan at e-posta adresleri hakkında her şeyi öğrenin — nasıl çalışır, neden ihtiyacınız var ve temp mail servisleriyle çevrimiçi gizliliğinizi nasıl korursunuz.',
            date: '2026-02-15',
            readTime: '8 dk',
            category: 'Rehber',
            icon: Mail,
        },
        {
            id: 'gecici-mail-vs-normal-mail',
            title: 'Geçici Mail vs Normal E-posta: Hangisini Ne Zaman Kullanmalı?',
            excerpt: 'Geçici ve kalıcı e-posta adresleri arasındaki temel farkları keşfedin. Kullan at e-postanın ne zaman daha akıllıca bir seçim olduğunu öğrenin.',
            date: '2026-02-10',
            readTime: '6 dk',
            category: 'Karşılaştırma',
            icon: Shield,
        },
        {
            id: 'cevrimici-gizlilik-koruma',
            title: '2026\'da Çevrimiçi Gizliliğinizi Korumanın 10 Yolu',
            excerpt: 'Geçici e-postalardan VPN\'lere kadar, kişisel verilerinizi izleyicilerden ve veri ihlallerinden korumak için en iyi gizlilik araçlarını keşfedin.',
            date: '2026-02-05',
            readTime: '10 dk',
            category: 'Gizlilik',
            icon: Eye,
        },
        {
            id: 'spam-engelleme-temp-mail',
            title: 'Kullan At E-posta ile Spam\'den Sonsuza Kadar Kurtulun',
            excerpt: 'Gelen kutunuzun spam ile dolmasından bıktınız mı? Geçici e-posta adreslerinin spam probleminizi kalıcı olarak nasıl çözeceğini öğrenin.',
            date: '2026-01-28',
            readTime: '5 dk',
            category: 'İpuçları',
            icon: Zap,
        },
        {
            id: 'en-iyi-gecici-mail-servisleri-2026',
            title: 'En İyi Geçici Mail Servisleri Karşılaştırması (2026)',
            excerpt: 'MephistoMail, Temp-Mail.org, Guerrilla Mail ve 10MinuteMail\'i karşılaştırıyoruz. En iyi gizlilik ve hız sunan kullan at e-posta servisini bulun.',
            date: '2026-01-20',
            readTime: '12 dk',
            category: 'İnceleme',
            icon: Tag,
        },
    ],
};

const BlogPage: React.FC<BlogPageProps> = ({ lang }) => {
    const t = translations[lang];
    const posts = blogPosts[lang];

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <SEOPageMeta lang={lang} page="blog" />
            {/* Header */}
            <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 text-white hover:text-red-400 transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">MephistoMail</span>
                    </Link>
                    <h1 className="text-lg font-bold tracking-tight">
                        {lang === 'tr' ? 'Blog' : 'Blog'}
                    </h1>
                    <div className="w-24" />
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                        {lang === 'tr' ? 'Gizlilik & Güvenlik' : 'Privacy & Security'}
                        <span className="text-red-500"> Blog</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        {lang === 'tr'
                            ? 'Geçici e-posta, çevrimiçi gizlilik ve dijital güvenlik hakkında en güncel makaleler ve rehberler.'
                            : 'Latest articles and guides about temporary email, online privacy, and digital security.'}
                    </p>
                </div>
            </section>

            {/* Blog Grid */}
            <section className="pb-20 px-6">
                <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post, index) => {
                        const Icon = post.icon;
                        return (
                            <article
                                key={post.id}
                                className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-red-500/20 transition-all duration-300 cursor-pointer"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                                        {post.category}
                                    </span>
                                    <span className="text-slate-500 text-[11px] flex items-center gap-1">
                                        <Clock size={11} />
                                        {post.readTime}
                                    </span>
                                </div>

                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mb-4">
                                    <Icon size={18} className="text-red-400" />
                                </div>

                                <h2 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors mb-3 leading-tight">
                                    {post.title}
                                </h2>

                                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                    {post.excerpt}
                                </p>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 text-[11px]">{post.date}</span>
                                    <span className="text-red-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                        {lang === 'tr' ? 'Oku' : 'Read'}
                                        <ArrowRight size={14} />
                                    </span>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* SEO Content */}
            <section className="py-16 px-6 border-t border-white/5 bg-white/[0.01]">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6">
                        {lang === 'tr' ? 'Geçici Mail Hakkında Bilmeniz Gerekenler' : 'Everything You Need to Know About Temp Mail'}
                    </h2>
                    <div className="prose prose-invert prose-sm max-w-none text-slate-400 space-y-4">
                        {lang === 'tr' ? (
                            <>
                                <p>Geçici mail (temp mail), kullan at e-posta veya disposable email olarak da bilinen bu hizmet, çevrimiçi gizliliğinizi korumanın en etkili yollarından biridir. MephistoMail, ücretsiz geçici e-posta adresi oluşturmanıza olanak tanır — kayıt gerektirmez, reklam göstermez ve verilerinizi saklamaz.</p>
                                <p>2026 yılında veri ihlalleri ve spam e-postalar her zamankinden daha yaygın. Her gün milyonlarca kişi fake mail, sahte mail veya tek kullanımlık e-posta servisleri kullanarak gerçek e-posta adreslerini koruma altına alıyor. MephistoMail'in RAM-only mimarisi sayesinde e-postalarınız hiçbir zaman diske yazılmaz — bu da onu piyasadaki en güvenli geçici mail servisi yapar.</p>
                                <p>Online alışveriş kayıtları, forum üyelikleri, ücretsiz deneme abonelikleri veya OTP doğrulama kodları için geçici e-posta kullanmak, dijital ayak izinizi minimize etmenin en akıllı yoludur. Blogumuzda geçici mail kullanımı, çevrimiçi gizlilik ipuçları ve dijital güvenlik stratejileri hakkında kapsamlı rehberler bulabilirsiniz.</p>
                            </>
                        ) : (
                            <>
                                <p>Temporary email (temp mail), also known as disposable email or throwaway email, is one of the most effective ways to protect your online privacy. MephistoMail allows you to create free temporary email addresses — no registration required, no ads, and we never store your data.</p>
                                <p>In 2026, data breaches and spam emails are more prevalent than ever. Every day, millions of people use fake mail, burner email, or disposable email services to protect their real email addresses. With MephistoMail's RAM-only architecture, your emails are never written to disk — making it the most secure temp mail service on the market.</p>
                                <p>Using temporary email for online shopping registrations, forum memberships, free trial subscriptions, or OTP verification codes is the smartest way to minimize your digital footprint. In our blog, you can find comprehensive guides about temp mail usage, online privacy tips, and digital security strategies.</p>
                            </>
                        )}
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

export default BlogPage;
