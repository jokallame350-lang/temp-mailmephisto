const express = require('express');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = 3847;
const DATA_DIR = __dirname;
const BROWSER_DATA = path.join(DATA_DIR, '.browser-data');
const QUEUE_FILE = path.join(DATA_DIR, 'tweet-queue.json');
const LOG_FILE = path.join(DATA_DIR, 'post-log.json');

// ============================================================================
// DATA HELPERS
// ============================================================================
function loadQueue() {
    return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
}
function saveQueue(data) {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(data, null, 2), 'utf8');
}
function loadLog() {
    if (!fs.existsSync(LOG_FILE)) {
        const empty = { posts: [] };
        fs.writeFileSync(LOG_FILE, JSON.stringify(empty, null, 2), 'utf8');
        return empty;
    }
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
}
function saveLog(data) {
    fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function addPostLog(platform, postId, text, category, url) {
    const log = loadLog();
    const shortText = text.length > 80 ? text.substring(0, 80) + '...' : text;
    const entry = {
        id: `${platform}-${postId}-${Date.now()}`,
        platform,
        postId: String(postId),
        text: shortText,
        category,
        url: url || '',
        postedAt: new Date().toISOString(),
        engagement: { likes: 0, retweets: 0, replies: 0, clicks: 0 },
        notes: ''
    };
    log.posts.push(entry);
    saveLog(log);
    return entry;
}

// ============================================================================
// TWEET GENERATOR - Her paylasimdan sonra yeni benzersiz tweet uretir
// ============================================================================
const usedTextsFile = path.join(DATA_DIR, '.used-tweets.json');

function loadUsedTexts() {
    if (!fs.existsSync(usedTextsFile)) return [];
    try { return JSON.parse(fs.readFileSync(usedTextsFile, 'utf8')); } catch (e) { return []; }
}
function saveUsedText(text) {
    const used = loadUsedTexts();
    used.push(text.substring(0, 60));
    fs.writeFileSync(usedTextsFile, JSON.stringify(used), 'utf8');
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function generateTweet(existingTexts) {
    const categories = ['competitive', 'privacy', 'otp', 'feature', 'tech', 'awareness', 'use-case', 'social-proof'];
    const category = pick(categories);

    const hooks = {
        competitive: [
            'Still paying for email aliases?',
            'Why pay $4/month for SimpleLogin when MephistoMail is FREE?',
            'Guerrilla Mail is outdated. Try MephistoMail.',
            'Email forwarding services charge you monthly. We don\'t.',
            'Paid alias services vs MephistoMail: one costs $0.',
            'Your alias service sells data. MephistoMail keeps ZERO logs.',
            'Temp-mail.org shows ads. MephistoMail? Zero ads, zero tracking.',
            'Mailinator exposes your inbox publicly. MephistoMail is private.'
        ],
        privacy: [
            'Your email = your digital identity.',
            'Every newsletter signup exposes your real email to data brokers.',
            'Data breaches exposed 4.1B records last year. Your email was probably in there.',
            'Companies sell your email to 50+ advertisers after one signup.',
            'Your inbox is a goldmine for hackers. Protect it.',
            'One signup = tracked forever. Unless you use a disposable email.',
            'Privacy isn\'t a luxury. It\'s a right.',
            'Your email address reveals more about you than you think.'
        ],
        otp: [
            'Need a quick OTP for verification? MephistoMail auto-detects them.',
            'Signing up for a trial? Use MephistoMail. OTP auto-copied to clipboard.',
            'Stop giving your real email for one-time verifications.',
            'MephistoMail catches OTP codes automatically. No manual searching.',
            'Free trial signup hack: disposable email + auto OTP detection.',
            'Getting verification codes shouldn\'t require your real email.'
        ],
        feature: [
            'RAM-only email storage. Close the tab = inbox destroyed forever.',
            'Multiple domain support. Pick the identity that fits.',
            'No registration. No login. Just instant anonymous email.',
            'MephistoMail: Copy email, receive mail, auto-grab OTP. That simple.',
            'Browser extension + Web app. Privacy everywhere you go.',
            'Dark mode, modern UI, zero JavaScript tracking. Built different.',
            'Instant email generation in under 1 second. No waiting.'
        ],
        tech: [
            'Built with RAM-only architecture. Nothing ever hits a disk.',
            'Our stack: Zero databases, zero logs, zero compromises.',
            'No cookies. No analytics. No tracking pixels. Just email.',
            'End-to-end ephemeral. From server RAM directly to your screen.',
            'Open infrastructure, transparent architecture. Privacy you can verify.'
        ],
        awareness: [
            'Did you know? Most "free" email services read your emails for ads.',
            'Your email provider knows more about you than your best friend.',
            'Every "unsubscribe" link confirms your email is active to spammers.',
            'Signing up with your real email? You\'re feeding the surveillance economy.',
            'The average person receives 121 emails/day. How many are spam from leaked signups?'
        ],
        'use-case': [
            'Testing a new SaaS product? Don\'t use your work email. Use MephistoMail.',
            'Creating multiple test accounts for development? MephistoMail has you covered.',
            'Downloading a free ebook that requires email? Disposable email time.',
            'Signing up for WiFi at a cafe? Never give your real email again.',
            'Online shopping with sketchy sites? Protect yourself with a temp email.',
            'Forum registration? Use a disposable email. Zero spam forever.'
        ],
        'social-proof': [
            'Developers are switching to MephistoMail for testing. Zero setup required.',
            'Privacy-first users love MephistoMail. No logs, no traces.',
            'Built by someone who was tired of spam. For everyone tired of spam.',
            'The temp email service that actually respects your privacy.',
            'Join thousands choosing disposable emails over data harvesting.'
        ]
    };

    const ctas = [
        '\n\nTry it free: mephistomail.site',
        '\n\nmephistomail.site - Zero traces.',
        '\n\n\u27a1 mephistomail.site',
        '\n\nCheck it out: mephistomail.site',
        '\n\nmephistomail.site\nOne click. Zero traces.',
        '\n\nmephistomail.site \ud83d\udd25',
        '\n\nFree forever: mephistomail.site',
        '\n\nmephistomail.site - Try it now.'
    ];

    const features = [
        '\u2705 No signup required',
        '\u2705 Auto OTP detection',
        '\u2705 Zero logs, RAM-only',
        '\u2705 Multiple domains',
        '\u2705 Browser extension available',
        '\u2705 No ads, no tracking',
        '\u2705 Instant email generation',
        '\u2705 Dark mode UI',
        '\u2705 Copy-paste OTP codes',
        '\u2705 Close tab = inbox gone'
    ];

    const hashtagSets = [
        '#Privacy #TempMail #CyberSecurity',
        '#Privacy #DataProtection #InfoSec',
        '#TempMail #OpenSource #Privacy',
        '#DisposableEmail #Privacy #Security',
        '#CyberSecurity #EmailPrivacy #TempMail',
        '#PrivacyMatters #TempMail #NoLogs',
        '#InfoSec #Privacy #FreeTool',
        '#DataPrivacy #TempMail #Anonymous'
    ];

    const emojis = ['\ud83d\udd12', '\ud83d\udee1\ufe0f', '\ud83d\udd25', '\u26a1', '\ud83d\ude80', '\ud83d\udc7b', '\ud83c\udfaf', '\u2728'];

    // Generate until unique
    for (let attempt = 0; attempt < 50; attempt++) {
        const hook = pick(hooks[category] || hooks.privacy);
        const selectedFeatures = shuffle(features).slice(0, Math.floor(Math.random() * 2) + 2);
        const cta = pick(ctas);
        const hashtags = pick(hashtagSets);
        const emoji = pick(emojis);

        // Randomly choose format
        const formats = [
            // Format 1: Hook + features + CTA + hashtags
            () => `${hook}\n\n${selectedFeatures.join('\n')}${cta}\n\n${hashtags}`,
            // Format 2: Hook + CTA + hashtags (short)
            () => `${emoji} ${hook}${cta}\n\n${hashtags}`,
            // Format 3: Hook + single feature + CTA
            () => `${hook}\n\n${pick(features)}${cta}\n\n${hashtags}`,
            // Format 4: Question style
            () => `${hook}\n\nMephistoMail gives you instant disposable emails.\n\n${selectedFeatures.join('\n')}${cta}\n\n${hashtags}`,
        ];

        const text = pick(formats)();

        // Check length and uniqueness
        if (text.length <= 280) {
            const isDuplicate = existingTexts.some(et =>
                et === text ||
                text.startsWith(et.substring(0, 40)) ||
                et.startsWith(text.substring(0, 40))
            );
            const usedBefore = loadUsedTexts().some(ut => text.startsWith(ut));

            if (!isDuplicate && !usedBefore) {
                return {
                    text,
                    category,
                    lang: 'en'
                };
            }
        }
    }

    // Absolute fallback with timestamp to ensure uniqueness
    const ts = Date.now().toString(36);
    return {
        text: `${pick(emojis)} MephistoMail: Free disposable email, zero logs, auto OTP.\n\nmephistomail.site\n\n${pick(hashtagSets)} [${ts}]`,
        category: 'feature',
        lang: 'en'
    };
}

function removeAndReplacePostedTweet(queue, tweetId) {
    const tweetIndex = queue.queue.findIndex(t => t.id === tweetId);
    if (tweetIndex === -1) return null;

    const posted = queue.queue[tweetIndex];
    const existingTexts = queue.queue.map(t => t.text);
    const newTweet = generateTweet(existingTexts);

    // Save text as used so it won't regenerate
    saveUsedText(posted.text);

    // Generate a new unique ID
    const maxId = Math.max(...queue.queue.map(t => t.id), 0);

    // Replace the posted tweet with a new one
    queue.queue[tweetIndex] = {
        id: maxId + 1,
        category: newTweet.category,
        lang: newTweet.lang,
        text: newTweet.text,
        posted: false,
        postedAt: null,
        platform: 'x'
    };

    saveQueue(queue);
    console.log(`[Generator] Tweet #${tweetId} silindi, yeni tweet #${maxId + 1} (${newTweet.category}) olusturuldu`);
    return queue.queue[tweetIndex];
}

// ============================================================================
// PLAYWRIGHT BROWSER (with auto-reconnect)
// ============================================================================
let browserContext = null;
let browserReady = false;
let browserError = null;
let isInitializing = false;

async function ensureBrowser() {
    if (browserReady && browserContext) {
        // Test if browser is still alive
        try {
            const pages = browserContext.pages();
            return true;
        } catch (e) {
            console.log('[Browser] Baglanti koptu, yeniden baslatiliyor...');
            browserReady = false;
            browserContext = null;
        }
    }

    if (isInitializing) {
        // Wait for current init to finish
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 1000));
            if (browserReady) return true;
        }
        return false;
    }

    await initBrowser();
    return browserReady;
}

async function initBrowser() {
    if (isInitializing) return;
    isInitializing = true;
    browserReady = false;
    browserError = null;

    try {
        console.log('[Browser] Tarayici baslatiliyor...');
        if (!fs.existsSync(BROWSER_DATA)) fs.mkdirSync(BROWSER_DATA, { recursive: true });

        browserContext = await chromium.launchPersistentContext(BROWSER_DATA, {
            headless: false,
            viewport: { width: 1280, height: 800 },
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-first-run',
                '--no-default-browser-check'
            ],
            ignoreDefaultArgs: ['--enable-automation'],
            locale: 'tr-TR'
        });

        // Listen for disconnect to auto-reconnect
        browserContext.on('close', () => {
            console.log('[Browser] Tarayici kapandi! Yeniden baslama gerekli.');
            browserReady = false;
            browserContext = null;
            isInitializing = false;
        });

        // Check if already logged into X
        const page = await browserContext.newPage();

        try {
            await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 20000 });
        } catch (e) {
            console.log('[Browser] Sayfa yukleme yavas, devam ediliyor...');
        }

        await page.waitForTimeout(3000);

        const url = page.url();
        if (url.includes('/login') || url.includes('/i/flow/login')) {
            console.log('');
            console.log('  ┌─────────────────────────────────────────────┐');
            console.log('  │  ACILAN TARAYICIDA X HESABINA GIRIS YAPIN   │');
            console.log('  │  Giris yaptiktan sonra otomatik algilanacak │');
            console.log('  └─────────────────────────────────────────────┘');
            console.log('');

            // Wait for login (check every 5 seconds for up to 5 minutes)
            let loggedIn = false;
            for (let i = 0; i < 60; i++) {
                await page.waitForTimeout(5000);
                try {
                    const currentUrl = page.url();
                    if (currentUrl.includes('/home') && !currentUrl.includes('/login')) {
                        loggedIn = true;
                        console.log('[Browser] Giris basarili!');
                        break;
                    }
                } catch (e) {
                    // Page might have been navigated
                }
            }
            if (!loggedIn) {
                console.log('[Browser] Giris zaman asimina ugradi');
            }
        } else {
            console.log('[Browser] X oturumu aktif!');
        }

        // Close the check page but keep browser open
        try { await page.close(); } catch (e) { }

        browserReady = true;
        isInitializing = false;
        console.log('[Browser] Hazir! Tweet paylasmaya baslayabilirsiniz.');
        console.log(`[Browser] Dashboard: http://localhost:${PORT}`);

    } catch (err) {
        browserError = err.message;
        isInitializing = false;
        console.error('[Browser] Hata:', err.message);
    }
}

async function postTweetViaPlaywright(text) {
    const ready = await ensureBrowser();
    if (!ready) throw new Error('Tarayici baslatilamadi. Server\'i yeniden baslatin.');

    let page = null;
    try {
        page = await browserContext.newPage();
        console.log(`[Tweet] Paylasim basliyor (${text.length} karakter)...`);

        // Navigate to compose
        await page.goto('https://x.com/compose/post', { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(3000);

        // Wait for textbox to appear
        await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 10000 });

        // Click the FIRST tweetTextarea in dialog context via JS
        await page.evaluate(() => {
            const el = document.querySelector('[data-testid="tweetTextarea_0"]');
            if (el) el.focus();
        });
        await page.waitForTimeout(500);

        // Type the tweet line by line using keyboard
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].length > 0) {
                await page.keyboard.type(lines[i], { delay: 10 });
            }
            if (i < lines.length - 1) {
                await page.keyboard.press('Enter');
                await page.waitForTimeout(30);
            }
        }

        console.log('[Tweet] Metin yazildi, gonderiliyor...');
        await page.waitForTimeout(2000);

        // Click send button using JavaScript (bypasses overlay pointer events issue)
        const clicked = await page.evaluate(() => {
            const btns = document.querySelectorAll('[data-testid="tweetButton"]');
            for (const btn of btns) {
                if (btn.offsetParent !== null) { // visible check
                    btn.click();
                    return true;
                }
            }
            // Fallback: click any visible one
            if (btns.length > 0) {
                btns[0].click();
                return true;
            }
            return false;
        });

        if (!clicked) {
            throw new Error('Gonderi butonu bulunamadi');
        }

        console.log('[Tweet] Gonderi butonuna tiklandi...');
        await page.waitForTimeout(4000);

        // Check for duplicate error
        const content = await page.content();
        if (content.includes('zaten söyledin') || content.includes('already said that')) {
            throw new Error('Bu tweet daha once paylasilmis (duplike)');
        }

        console.log('[Tweet] Basariyla paylasildi!');
        try { await page.close(); } catch (e) { }
        return { success: true };

    } catch (err) {
        if (page) { try { await page.close(); } catch (e) { } }
        throw err;
    }
}

// ============================================================================
// API ROUTES
// ============================================================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/api/status', (req, res) => {
    const queue = loadQueue();
    const log = loadLog();

    res.json({
        browser: { ready: browserReady, error: browserError, initializing: isInitializing },
        tweets: {
            total: queue.queue.length,
            posted: queue.queue.filter(t => t.posted).length,
            pending: queue.queue.filter(t => !t.posted).length
        },
        reddit: {
            total: queue.reddit_posts.length,
            posted: queue.reddit_posts.filter(p => p.posted).length,
            pending: queue.reddit_posts.filter(p => !p.posted).length
        },
        log: { totalPosts: log.posts.length, posts: log.posts.slice(-20).reverse() },
        queue: queue.queue,
        reddit_posts: queue.reddit_posts,
        competitors: queue.competitors
    });
});

// IMPORTANT: /next must come BEFORE /:id to avoid Express treating 'next' as an id
app.post('/api/tweet/next', async (req, res) => {
    try {
        const queue = loadQueue();
        const next = queue.queue.find(t => !t.posted);
        if (!next) return res.status(400).json({ error: 'Kuyrukta bekleyen tweet yok' });

        const tweetText = next.text;
        const tweetId = next.id;
        const tweetCat = next.category;

        const result = await postTweetViaPlaywright(tweetText);

        // Log the post
        const logEntry = addPostLog('x', tweetId, tweetText, tweetCat, 'https://x.com/benmxrt');

        // Remove posted tweet and generate a new one
        const freshQueue = loadQueue();
        const newTweet = removeAndReplacePostedTweet(freshQueue, tweetId);

        res.json({
            success: true,
            message: `Tweet paylasildi ve kuyruktan silindi! Yeni tweet olusturuldu.`,
            logEntry,
            tweetId,
            newTweet
        });

    } catch (err) {
        console.error('[API] Tweet hatasi:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Post specific tweet by ID
app.post('/api/tweet/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const queue = loadQueue();
        const tweet = queue.queue.find(t => t.id === id);

        if (!tweet) return res.status(404).json({ error: 'Tweet bulunamadi' });
        if (tweet.posted) return res.status(400).json({ error: 'Bu tweet zaten paylasilmis' });
        if (tweet.text.length > 280) return res.status(400).json({ error: 'Karakter limiti asiliyor' });

        const tweetText = tweet.text;
        const tweetCat = tweet.category;

        const result = await postTweetViaPlaywright(tweetText);

        // Log
        const logEntry = addPostLog('x', id, tweetText, tweetCat, 'https://x.com/benmxrt');

        // Remove and replace
        const freshQueue = loadQueue();
        const newTweet = removeAndReplacePostedTweet(freshQueue, id);

        res.json({
            success: true,
            message: `Tweet paylasildi ve silindi! Yeni tweet olusturuldu.`,
            logEntry,
            newTweet
        });

    } catch (err) {
        console.error('[API] Tweet hatasi:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Reconnect browser
app.post('/api/browser/reconnect', async (req, res) => {
    try {
        if (browserContext) {
            try { await browserContext.close(); } catch (e) { }
        }
        browserContext = null;
        browserReady = false;
        isInitializing = false;

        await initBrowser();
        res.json({ success: true, ready: browserReady });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reddit
app.post('/api/reddit/:id', async (req, res) => {
    try {
        const queue = loadQueue();
        const post = queue.reddit_posts.find(p => p.id === req.params.id);
        if (!post) return res.status(404).json({ error: 'Bulunamadi' });

        const ready = await ensureBrowser();
        if (!ready) return res.status(500).json({ error: 'Tarayici hazir degil' });

        const page = await browserContext.newPage();
        const sub = post.subreddit.replace(/^r\//, '');
        const url = `https://www.reddit.com/r/${sub}/submit?type=text&title=${encodeURIComponent(post.title)}&text=${encodeURIComponent(post.body)}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        res.json({ success: true, manual: true, message: `Reddit ${post.subreddit} sayfasi acildi - manuel onay gerekli` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/reddit/:id/posted', (req, res) => {
    const queue = loadQueue();
    const post = queue.reddit_posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Bulunamadi' });

    post.posted = true;
    post.postedAt = new Date().toISOString();
    saveQueue(queue);
    addPostLog('reddit', post.id, `${post.subreddit}: ${post.title}`, 'reddit', '');
    res.json({ success: true });
});

app.put('/api/tweet/:id/unmark', (req, res) => {
    const queue = loadQueue();
    const tweet = queue.queue.find(t => t.id === parseInt(req.params.id));
    if (!tweet) return res.status(404).json({ error: 'Bulunamadi' });

    tweet.posted = false;
    tweet.postedAt = null;
    saveQueue(queue);
    res.json({ success: true });
});

app.put('/api/log/:id/engagement', (req, res) => {
    const log = loadLog();
    const post = log.posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Bulunamadi' });

    post.engagement = { ...post.engagement, ...req.body };
    saveLog(log);
    res.json({ success: true });
});

// Schedule
app.post('/api/schedule', async (req, res) => {
    const { count = 3, delayMs = 60000 } = req.body;
    res.json({ started: true, message: `${count} tweet planlanmistir` });

    const queue = loadQueue();
    const pending = queue.queue.filter(t => !t.posted);
    const toPost = pending.slice(0, count);

    for (let i = 0; i < toPost.length; i++) {
        try {
            const tw = toPost[i];
            console.log(`[Schedule] ${i + 1}/${toPost.length} tweet paylasiliyor...`);
            await postTweetViaPlaywright(tw.text);

            addPostLog('x', tw.id, tw.text, tw.category, 'https://x.com/benmxrt');

            // Remove posted, generate new
            const freshQueue = loadQueue();
            removeAndReplacePostedTweet(freshQueue, tw.id);

            console.log(`[Schedule] Tweet #${tw.id} paylasildi ve yenisi olusturuldu!`);

            if (i < toPost.length - 1) {
                console.log(`[Schedule] ${delayMs / 1000}s bekleniyor...`);
                await new Promise(r => setTimeout(r, delayMs));
            }
        } catch (err) {
            console.error(`[Schedule] Tweet #${toPost[i].id} hatasi:`, err.message);
        }
    }
    console.log('[Schedule] Tamamlandi!');
});

// ============================================================================
// START
// ============================================================================
app.listen(PORT, async () => {
    console.log('');
    console.log('  ========================================');
    console.log('  |  MEPHISTOMAIL PROMOTION ENGINE v2.0  |');
    console.log('  |  Automated Social Media Dashboard    |');
    console.log('  ========================================');
    console.log('');
    console.log(`  Dashboard: http://localhost:${PORT}`);
    console.log('  Kapatmak icin: Ctrl+C');
    console.log('');

    await initBrowser();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n[Server] Kapatiliyor...');
    if (browserContext) {
        try { await browserContext.close(); } catch (e) { }
    }
    process.exit(0);
});
