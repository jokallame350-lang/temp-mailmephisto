import React, { useEffect } from 'react';
import { Language } from '../translations';

interface SEOPageMetaProps {
    lang: Language;
    page: 'blog' | 'tools' | '10minutemail' | 'help';
}

const pageMeta: Record<string, Partial<Record<Language, { title: string; description: string; keywords: string }>>> = {
    blog: {
        en: {
            title: 'Privacy & Security Blog | MephistoMail - Temp Mail Guides',
            description: 'Latest articles about temporary email, online privacy, digital security, and disposable email best practices. Learn how to protect your inbox from spam.',
            keywords: 'temp mail blog, temporary email guide, online privacy tips, disposable email article, email security, data breach protection',
        },
        tr: {
            title: 'Gizlilik & Güvenlik Blog | MephistoMail - Geçici Mail Rehberleri',
            description: 'Geçici e-posta, çevrimiçi gizlilik, dijital güvenlik ve kullan-at e-posta en iyi uygulamaları hakkında en güncel makaleler. Gelen kutunuzu spamden korumayı öğrenin.',
            keywords: 'geçici mail blog, temp mail rehber, çevrimiçi gizlilik ipuçları, kullan at mail makale, e-posta güvenliği, veri ihlali koruması',
        },
    },
    tools: {
        en: {
            title: 'Free Email Security Tools | MephistoMail - Email Validator, Data Breach Checker',
            description: 'Free online security tools: Email Validator, Data Breach Checker, and Password Strength Test. Check if your email has been compromised. Protect your privacy.',
            keywords: 'email validator, data breach checker, password strength test, email security tools, check email breach, verify email address',
        },
        tr: {
            title: 'Ücretsiz E-posta Güvenlik Araçları | MephistoMail - E-posta Doğrulayıcı, Veri Sızıntısı Kontrolü',
            description: 'Ücretsiz çevrimiçi güvenlik araçları: E-posta Doğrulayıcı, Veri Sızıntısı Kontrolü ve Şifre Güç Testi. E-postanızın güvenliğini kontrol edin.',
            keywords: 'e-posta doğrulayıcı, veri sızıntısı kontrolü, şifre güç testi, e-posta güvenlik araçları, e-posta ihlal kontrolü',
        },
    },
    '10minutemail': {
        en: {
            title: '10 Minute Mail - Free 10 Min Disposable Email | MephistoMail',
            description: 'Create a free 10 minute mail address instantly. No registration required. Receive OTP codes, verification emails, and protect your privacy with 10 minute disposable email.',
            keywords: '10 minute mail, 10 min mail, 10 minute email, 10 minute temp mail, ten minute mail, 10minutemail, disposable email 10 minutes',
        },
        tr: {
            title: '10 Dakikalık Mail - Ücretsiz 10 Dakika Geçici E-posta | MephistoMail',
            description: 'Ücretsiz 10 dakikalık geçici e-posta adresi oluşturun. Kayıt gerektirmez. OTP kodları, doğrulama e-postaları alın ve gizliliğinizi 10 dakikalık kullan-at mail ile koruyun.',
            keywords: '10 dakikalık mail, 10 dakika mail, 10 dakikalık geçici mail, 10 dakika geçici e-posta, kullan at mail 10 dakika, temp mail 10 dk',
        },
    },
    help: {
        en: {
            title: 'Help Center & FAQ | MephistoMail - Temp Mail Support',
            description: 'Find answers to frequently asked questions about MephistoMail temporary email service. Learn how to create disposable emails, receive OTP codes, and protect your privacy.',
            keywords: 'MephistoMail help, temp mail FAQ, how to use temp mail, temporary email help, disposable email questions, MephistoMail support',
        },
        tr: {
            title: 'Yardım Merkezi & SSS | MephistoMail - Geçici Mail Destek',
            description: 'MephistoMail geçici e-posta servisi hakkında sıkça sorulan soruların yanıtlarını bulun. Kullan-at e-posta oluşturmayı, OTP kodları almayı ve gizliliğinizi korumayı öğrenin.',
            keywords: 'MephistoMail yardım, geçici mail SSS, temp mail nasıl kullanılır, geçici e-posta yardım, kullan at mail sorular, MephistoMail destek',
        },
    },
};

/**
 * Sets page-specific meta tags for sub-pages (Blog, Tools, 10MinuteMail, Help).
 * Used inside each page component to override the default index.html meta tags.
 */
const SEOPageMeta: React.FC<SEOPageMetaProps> = ({ lang, page }) => {
    useEffect(() => {
        const meta = pageMeta[page]?.[lang] || pageMeta[page]?.['en'];
        if (!meta) return;

        // Set title
        document.title = meta.title;

        // Set meta description
        updateMeta('description', meta.description);

        // Set meta keywords
        updateMeta('keywords', meta.keywords);

        // Set canonical URL
        const siteUrl = 'https://mephistomail.site';
        const path = page === '10minutemail' ? '/10minutemail' : `/${page}`;
        updateLink('canonical', `${siteUrl}${path}`);

        // Set OG tags
        updateMeta('og:title', meta.title, 'property');
        updateMeta('og:description', meta.description, 'property');
        updateMeta('og:url', `${siteUrl}${path}`, 'property');

        // Set Twitter tags
        updateMeta('twitter:title', meta.title);
        updateMeta('twitter:description', meta.description);

        // HTML lang
        document.documentElement.lang = lang;

        // Cleanup: restore default title on unmount
        return () => {
            document.title = lang === 'tr'
                ? 'MephistoMail - Geçici E-posta'
                : 'MephistoMail - Temp Mail';
        };
    }, [lang, page]);

    return null;
};

function updateMeta(name: string, content: string, attr: string = 'name') {
    let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
    }
    meta.content = content;
}

function updateLink(rel: string, href: string) {
    const selector = `link[rel="${rel}"]:not([hreflang])`;
    let link = document.querySelector(selector) as HTMLLinkElement;
    if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
    }
    link.href = href;
}

export default SEOPageMeta;
