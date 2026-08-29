import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Calendar, Share2, ChevronRight } from 'lucide-react';
import { Language } from '../translations';
import { blogPosts } from '../data/blogContent';
import SEOPageMeta from '../components/SEOPageMeta';

interface BlogPostPageProps {
    lang: Language;
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ lang }) => {
    const { slug } = useParams<{ slug: string }>();
    const posts = blogPosts[lang];
    const post = posts.find(p => p.id === slug);

    // If post not found, redirect to blog
    if (!post) {
        return <Navigate to="/blog" replace />;
    }

    // Get other posts for "Read More" section
    const otherPosts = posts.filter(p => p.id !== slug).slice(0, 3);

    const handleShare = async () => {
        const url = `https://mephistomail.site/blog/${post.id}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: post.title, text: post.excerpt, url });
            } catch { /* user cancelled */ }
        } else {
            navigator.clipboard.writeText(url);
        }
    };

    const Icon = post.icon;

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <SEOPageMeta lang={lang} page="blog" />

            {/* Header */}
            <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/blog" className="flex items-center gap-3 text-white hover:text-red-400 transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">
                            {lang === 'tr' ? 'Blog\'a Dön' : 'Back to Blog'}
                        </span>
                    </Link>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:border-red-500/30 text-xs font-medium transition-all"
                    >
                        <Share2 size={14} />
                        {lang === 'tr' ? 'Paylaş' : 'Share'}
                    </button>
                </div>
            </header>

            {/* Article Hero */}
            <section className="pt-12 pb-8 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-[11px] text-slate-500 mb-8" aria-label="Breadcrumb">
                        <Link to="/" className="hover:text-white transition-colors">MephistoMail</Link>
                        <ChevronRight size={10} />
                        <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
                        <ChevronRight size={10} />
                        <span className="text-slate-400">{post.category}</span>
                    </nav>

                    {/* Category & Meta */}
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                            {post.category}
                        </span>
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                            <Clock size={12} />
                            {post.readTime}
                        </span>
                    </div>

                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/10 flex items-center justify-center mb-6">
                        <Icon size={24} className="text-red-400" />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-6">
                        {post.title}
                    </h1>

                    {/* Excerpt */}
                    <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-2xl">
                        {post.excerpt}
                    </p>

                    {/* Author & Date */}
                    <div className="flex items-center gap-6 pb-8 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                                <User size={14} className="text-white" />
                            </div>
                            <span className="text-sm font-medium text-slate-300">{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                            <Calendar size={13} />
                            <time dateTime={post.date}>{post.date}</time>
                        </div>
                    </div>
                </div>
            </section>

            {/* Article Content */}
            <article className="px-6 pb-16">
                <div className="max-w-3xl mx-auto">
                    {post.content.map((section, sectionIndex) => (
                        <section key={sectionIndex} className="mb-10">
                            {section.heading && (
                                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 mt-8 tracking-tight">
                                    {section.heading}
                                </h2>
                            )}
                            {section.paragraphs.map((paragraph, pIndex) => (
                                <p
                                    key={pIndex}
                                    className="text-slate-400 text-[15px] leading-[1.85] mb-4"
                                >
                                    {paragraph}
                                </p>
                            ))}
                        </section>
                    ))}
                </div>
            </article>

            {/* CTA Banner */}
            <section className="px-6 pb-16">
                <div className="max-w-3xl mx-auto">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 p-8 md:p-12">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(239,68,68,0.08),transparent_70%)]" />
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black mb-3">
                                {lang === 'tr' ? 'Gizliliğinizi Korumaya Başlayın' : 'Start Protecting Your Privacy'}
                            </h3>
                            <p className="text-slate-400 mb-6 max-w-lg">
                                {lang === 'tr'
                                    ? 'MephistoMail ile saniyeler içinde ücretsiz geçici e-posta adresi oluşturun. Kayıt yok, izleme yok, log yok.'
                                    : 'Create a free temporary email address in seconds with MephistoMail. No registration, no tracking, no logs.'}
                            </p>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-red-500/20"
                            >
                                {lang === 'tr' ? '🔥 Geçici Mail Oluştur' : '🔥 Create Temp Mail'}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Related Articles */}
            {otherPosts.length > 0 && (
                <section className="px-6 pb-20 border-t border-white/5 pt-12">
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-xl font-bold mb-8">
                            {lang === 'tr' ? 'Diğer Makaleler' : 'More Articles'}
                        </h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            {otherPosts.map(relatedPost => {
                                const RelIcon = relatedPost.icon;
                                return (
                                    <Link
                                        key={relatedPost.id}
                                        to={`/blog/${relatedPost.id}`}
                                        className="group bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] hover:border-red-500/20 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[9px] font-bold uppercase tracking-wider">
                                                {relatedPost.category}
                                            </span>
                                            <span className="text-slate-500 text-[10px]">{relatedPost.readTime}</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center mb-3">
                                            <RelIcon size={14} className="text-red-400" />
                                        </div>
                                        <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors leading-snug">
                                            {relatedPost.title}
                                        </h4>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default BlogPostPage;
