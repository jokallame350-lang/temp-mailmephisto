import { useState, useCallback, useEffect, useRef } from 'react';
import { Mailbox, EmailSummary, EmailDetail, AppStats, NotificationFilter } from '../types';
import { getMessages, getMessageDetail, deleteMessage, subscribeToMailboxEvents } from '../services/mailService';
import { extractActionLinks } from '../utils/actionLinks';

const REFRESH_INTERVAL = 2500; // 2.5 saniyede bir ultra-hızlı senkronize kontrol
const REFRESH_INTERVAL_HIDDEN = 20000; // Sekme arka plandayken 20 sn
const STATS_KEY = 'mephisto_stats';
const FILTER_KEY = 'mephisto_notif_filters';

const defaultStats: AppStats = {
    totalAccountsCreated: 0,
    totalEmailsReceived: 0,
    categoryBreakdown: { Verification: 0, Security: 0, Newsletter: 0, Other: 0 },
    lastActivity: Date.now(),
};

const defaultFilters: NotificationFilter = {
    verification: true,
    security: true,
    newsletter: false,
    other: false,
};

export function useEmails(
    activeAccount: Mailbox | null,
    onNewEmail?: (from: string, subject: string) => void,
    autoVerifyEnabled?: boolean,
    onAutoVerifySuccess?: (urlLabel: string) => void
) {
    const [emails, setEmails] = useState<EmailSummary[]>([]);
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [currentEmailDetail, setCurrentEmailDetail] = useState<EmailDetail | null>(null);
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const deletedIdsRef = useRef<Set<string>>(new Set());
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isLoadingEmails, setIsLoadingEmails] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<AppStats>(() => {
        try { return JSON.parse(localStorage.getItem(STATS_KEY) || '') || defaultStats; }
        catch { return defaultStats; }
    });
    const [notifFilters, setNotifFilters] = useState<NotificationFilter>(() => {
        try { return JSON.parse(localStorage.getItem(FILTER_KEY) || '') || defaultFilters; }
        catch { return defaultFilters; }
    });

    const previousEmailCountRef = useRef(0);
    const verifiedEmailIdsRef = useRef<Set<string>>(new Set());

    // Aktif hesap değiştiğinde sıfırla
    useEffect(() => {
        deletedIdsRef.current = deletedIds;
    }, [deletedIds]);

    useEffect(() => {
        setEmails([]);
        setSelectedEmailId(null);
        setCurrentEmailDetail(null);
        setDeletedIds(new Set());
        deletedIdsRef.current = new Set();
        verifiedEmailIdsRef.current = new Set();
        setFetchError(null);
        previousEmailCountRef.current = 0;
        setProgress(0);
    }, [activeAccount?.id]);

    // Stats persist
    useEffect(() => {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }, [stats]);

    // Filter persist
    useEffect(() => {
        localStorage.setItem(FILTER_KEY, JSON.stringify(notifFilters));
    }, [notifFilters]);

    const playNotificationSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.4);
        } catch { /* Ses çalma hatası */ }
    }, []);

    const shouldNotify = useCallback((category: string) => {
        const key = category.toLowerCase() as keyof NotificationFilter;
        return notifFilters[key] ?? false;
    }, [notifFilters]);

    const fetchEmails = useCallback(async () => {
        if (!activeAccount) return;
        try {
            const fetched = await getMessages(activeAccount);
            if (fetched && Array.isArray(fetched)) {
                const currentDeletedIds = deletedIdsRef.current;
                const filtered = fetched.filter(e => !currentDeletedIds.has(e.id));

                // Yeni mail geldi mi?
                if (filtered.length > previousEmailCountRef.current && previousEmailCountRef.current !== 0) {
                    const newEmails = filtered.slice(0, filtered.length - previousEmailCountRef.current);
                    const shouldPlay = newEmails.some(e => shouldNotify(e.aiCategory));

                    if (shouldPlay) {
                        playNotificationSound();
                        if (typeof Notification !== 'undefined') {
                            if (Notification.permission === 'granted') {
                                const firstEmail = newEmails[0];
                                let fromStr = 'Yeni E-Posta';
                                if (firstEmail) {
                                    if (typeof firstEmail.from === 'string') fromStr = firstEmail.from;
                                    else if (firstEmail.from && typeof firstEmail.from === 'object') fromStr = firstEmail.from.name || firstEmail.from.address || 'Yeni E-Posta';
                                }
                                const notifTitle = `📩 ${fromStr}`;
                                const notifBody = firstEmail ? (firstEmail.subject || 'Yeni bir mesajınız var.') : 'Yeni bir mesajınız var.';

                                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                                    navigator.serviceWorker.ready.then(reg => {
                                        reg.showNotification(notifTitle, {
                                            body: notifBody,
                                            icon: '/icon.png',
                                            badge: '/icon.png',
                                            data: { url: '/' }
                                        } as any);
                                    }).catch(() => {
                                        try { new Notification(notifTitle, { body: notifBody, icon: '/icon.png' }); } catch {}
                                    });
                                } else {
                                    try { new Notification(notifTitle, { body: notifBody, icon: '/icon.png' }); } catch {}
                                }
                            } else if (Notification.permission !== 'denied') {
                                Notification.requestPermission().catch(() => {});
                            }
                        }
                    }

                    // Toast bildirimi tetikle
                    newEmails.forEach(e => {
                        let fromName = '';
                        if (typeof e.from === 'string') {
                            fromName = e.from;
                        } else if (e.from && typeof e.from === 'object') {
                            fromName = String(e.from.name || e.from.address || 'unknown');
                        } else {
                            fromName = String(e.from || 'unknown');
                        }
                        onNewEmail?.(fromName, e.subject);
                    });

                    // Otomatik Doğrulama (Auto-Verify) kontrolü — Her gelen veya listedeki yeni mail için
                    if (autoVerifyEnabled && filtered.length > 0) {
                        filtered.forEach(async (e) => {
                            if (verifiedEmailIdsRef.current.has(e.id)) return;
                            verifiedEmailIdsRef.current.add(e.id);

                            try {
                                const detail = await getMessageDetail(activeAccount, e.id);
                                if (detail) {
                                    const htmlText = detail.html && detail.html.length > 0 ? (typeof detail.html[0] === 'string' ? detail.html[0] : '') : '';
                                    const action = extractActionLinks(htmlText);
                                    if (action && action.url) {
                                        // 1. HTTP GET Fetch isteği (cors / fallback no-cors)
                                        fetch(action.url, { method: 'GET', credentials: 'omit' }).catch(() => {
                                            return fetch(action.url, { method: 'GET', mode: 'no-cors' });
                                        });

                                        // 2. Arka plan 1x1 iFrame Entegrasyonu (Tam Tarayıcı Gezinmesi ve Redirect Takibi İçin)
                                        if (typeof document !== 'undefined') {
                                            try {
                                                const iframe = document.createElement('iframe');
                                                iframe.style.position = 'fixed';
                                                iframe.style.width = '0px';
                                                iframe.style.height = '0px';
                                                iframe.style.border = 'none';
                                                iframe.style.opacity = '0';
                                                iframe.style.pointerEvents = 'none';
                                                iframe.src = action.url;
                                                document.body.appendChild(iframe);

                                                setTimeout(() => {
                                                    try {
                                                        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
                                                    } catch {}
                                                }, 6000);
                                            } catch {}
                                        }

                                        onAutoVerifySuccess?.(action.label || 'Doğrulama Linki');
                                    }
                                }
                            } catch { /* sessizce geç */ }
                        });
                    }

                    // Stats güncelle
                    setStats(prev => {
                        const updated = { ...prev };
                        updated.totalEmailsReceived += newEmails.length;
                        updated.lastActivity = Date.now();
                        newEmails.forEach(e => {
                            updated.categoryBreakdown[e.aiCategory] = (updated.categoryBreakdown[e.aiCategory] || 0) + 1;
                        });
                        return updated;
                    });
                }
                previousEmailCountRef.current = Math.max(previousEmailCountRef.current, filtered.length);

                // E-postaların geçici API takılmalarında ekrandan kaybolmaması için Merge algoritması:
                setEmails(prev => {
                    const map = new Map<string, EmailSummary>();
                    // Önceki silinmemiş e-postaları koru
                    prev.forEach(item => {
                        if (!currentDeletedIds.has(item.id)) map.set(item.id, item);
                    });
                    // Sunucudan gelen taze e-postaları ekle/güncelle
                    filtered.forEach(item => map.set(item.id, item));

                    const merged = Array.from(map.values());
                    return merged.sort((a, b) => {
                        const dateA = new Date(a.createdAt).getTime();
                        const dateB = new Date(b.createdAt).getTime();
                        if (!isNaN(dateB) && !isNaN(dateA)) return dateB - dateA;
                        return String(b.id).localeCompare(String(a.id));
                    });
                });
                setFetchError(null);
            }
        } catch (err: any) {
            console.warn('Email fetch failed:', err);
            const msg = err?.message || '';
            if (msg.includes('Rate limit')) {
                setFetchError(msg);
            }
        }
    }, [activeAccount, playNotificationSound, shouldNotify, onNewEmail]);

    const handleManualRefresh = useCallback(async () => {
        setIsLoadingEmails(true);
        setProgress(25);
        await fetchEmails();
        setProgress(100);
        setTimeout(() => {
            setIsLoadingEmails(false);
            setProgress(0);
        }, 300);
    }, [fetchEmails]);

    // Real-time SSE dinleyici (mail.tm ve mail.gw Mercure SSE hub)
    useEffect(() => {
        if (!activeAccount) return;
        const unsubscribe = subscribeToMailboxEvents(activeAccount, () => {
            setProgress(100);
            fetchEmails();
            setTimeout(() => setProgress(0), 300);
        });
        return () => {
            unsubscribe();
        };
    }, [activeAccount, fetchEmails]);

    // Otomatik e-posta çekme döngüsü (Adaptive Loop)
    useEffect(() => {
        fetchEmails();

        let dataInterval = setInterval(() => {
            setProgress(90);
            fetchEmails().then(() => {
                setProgress(100);
                setTimeout(() => setProgress(0), 200);
            });
        }, REFRESH_INTERVAL);

        const handleVisibilityChange = () => {
            clearInterval(dataInterval);
            if (document.hidden) {
                dataInterval = setInterval(fetchEmails, REFRESH_INTERVAL_HIDDEN);
            } else {
                fetchEmails();
                dataInterval = setInterval(() => {
                    setProgress(90);
                    fetchEmails().then(() => {
                        setProgress(100);
                        setTimeout(() => setProgress(0), 200);
                    });
                }, REFRESH_INTERVAL);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            clearInterval(dataInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchEmails]);

    // Seçilen e-postanın detayını çek
    useEffect(() => {
        const fetchDetail = async () => {
            if (!selectedEmailId || !activeAccount) {
                setCurrentEmailDetail(null);
                return;
            }
            setIsLoadingDetail(true);
            try {
                const detail = await getMessageDetail(activeAccount, selectedEmailId);
                if (detail) setCurrentEmailDetail(detail);
            } catch (err) {
                console.warn('Email detail fetch failed:', err);
            } finally {
                setIsLoadingDetail(false);
            }
        };
        fetchDetail();
    }, [selectedEmailId, activeAccount]);

    const handleDeleteEmail = useCallback(async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEmails(prev => prev.filter(email => email.id !== id));
        setDeletedIds(prev => new Set(prev).add(id));
        if (selectedEmailId === id) {
            setSelectedEmailId(null);
            setCurrentEmailDetail(null);
        }
        if (activeAccount) {
            await deleteMessage(activeAccount, id);
        }
    }, [activeAccount, selectedEmailId]);

    const handleDeleteAllEmails = useCallback(() => {
        const allIds = emails.map(e => e.id);
        setDeletedIds(prev => {
            const next = new Set(prev);
            allIds.forEach(id => next.add(id));
            return next;
        });
        setEmails([]);
        setSelectedEmailId(null);
        setCurrentEmailDetail(null);
        if (activeAccount) {
            allIds.forEach(id => deleteMessage(activeAccount, id));
        }
    }, [emails, activeAccount]);

    // Arama filtreleme
    const filteredEmails = searchQuery
        ? emails.filter(e => {
            const from = typeof e.from === 'string' ? e.from : `${e.from.name} ${e.from.address}`;
            const q = searchQuery.toLowerCase();
            return (
                from.toLowerCase().includes(q) ||
                e.subject.toLowerCase().includes(q) ||
                e.intro.toLowerCase().includes(q)
            );
        })
        : emails;

    const incrementAccountStat = useCallback(() => {
        setStats(prev => ({ ...prev, totalAccountsCreated: prev.totalAccountsCreated + 1, lastActivity: Date.now() }));
    }, []);

    return {
        emails: filteredEmails,
        allEmails: emails,
        selectedEmailId,
        currentEmailDetail,
        isLoadingDetail,
        isLoadingEmails,
        fetchError,
        progress,
        searchQuery,
        stats,
        notifFilters,
        setSearchQuery,
        setSelectedEmailId,
        setNotifFilters,
        handleManualRefresh,
        handleDeleteEmail,
        handleDeleteAllEmails,
        incrementAccountStat,
    };
}
