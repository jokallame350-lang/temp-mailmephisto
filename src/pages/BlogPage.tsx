import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, ArrowRight } from 'lucide-react';
import { Language } from '../translations';
import { blogPosts } from '../data/blogContent';
import SEOPageMeta from '../components/SEOPageMeta';

interface BlogPageProps {
    lang: Language;
}

const BlogPage: React.FC<BlogPageProps> = ({ lang }) => {
    const posts = blogPosts[lang];

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <SEOPageMeta lang={lang} page="blog" />

            {/* Header */}
            <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 text-white hover:text-red-400 transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">MephistoMail</span>
                    </Link>
                    <h1 className="text-lg font-bold tracking-tight">
                        Blog
                    </h1>
                    <div className="w-24" />
                </div>
            </header>

            {/* Hero */}
            <section className="py-10 sm:py-16 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
                        {lang === 'tr' ? 'Gizlilik & Güvenlik' : 'Privacy & Security'}
                        <span className="text-red-500"> Blog</span>
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto">
                        {lang === 'tr'
                            ? 'Geçici e-posta, çevrimiçi gizlilik ve dijital güvenlik hakkında en güncel makaleler ve rehberler.'
                            : 'Latest articles and guides about temporary email, online privacy, and digital security.'}
                    </p>
                </div>
            </section>

            {/* Blog Grid */}
            <section className="pb-16 sm:pb-20 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post, index) => {
                        const Icon = post.icon;
                        return (
                            <Link
                                to={`/blog/${post.id}`}
                                key={post.id}
                                className="group bg-white/[0.03] border border-white/[0.06] rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/[0.06] hover:border-red-500/20 transition-all duration-300 cursor-pointer block"
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
                            </Link>
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
