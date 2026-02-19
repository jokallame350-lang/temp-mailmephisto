import { useState, useCallback, useEffect, useRef } from 'react';
import { Mailbox, EmailSummary, EmailDetail, AppStats, NotificationFilter } from '../types';
import { getMessages, getMessageDetail, deleteMessage } from '../services/mailService';

const REFRESH_INTERVAL = 7000;
const REFRESH_INTERVAL_HIDDEN = 30000; // Sekme arka plandayken daha yavaş
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
    onNewEmail?: (from: string, subject: string) => void
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

    // Aktif hesap değiştiğinde sıfırla
    // Keep deletedIdsRef in sync
    useEffect(() => {
        deletedIdsRef.current = deletedIds;
    }, [deletedIds]);

    useEffect(() => {
        setEmails([]);
        setSelectedEmailId(null);
        setCurrentEmailDetail(null);
        setDeletedIds(new Set());
        deletedIdsRef.current = new Set();
        setFetchError(null);
        previousEmailCountRef.current = 0;
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
            // Web Audio API ile yerel bildirim sesi (CDN gerektirmez)
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
            if (fetched) {
                const currentDeletedIds = deletedIdsRef.current;
                const filtered = fetched.filter(e => !currentDeletedIds.has(e.id));

                // Yeni mail geldi mi?
                if (filtered.length > previousEmailCountRef.current && previousEmailCountRef.current !== 0) {
                    const newEmails = filtered.slice(0, filtered.length - previousEmailCountRef.current);
                    const shouldPlay = newEmails.some(e => shouldNotify(e.aiCategory));

                    if (shouldPlay) {
                        playNotificationSound();
                        if (Notification.permission === 'granted') {
                            new Notification('Mephisto', { body: 'New message!', icon: '/logo.png' });
                        }
                    }

                    // Toast bildirimi tetikle
                    newEmails.forEach(e => {
                        const fromName = typeof e.from === 'string' ? e.from : (e.from.name || e.from.address);
                        onNewEmail?.(fromName, e.subject);
                    });

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
                previousEmailCountRef.current = filtered.length;
                // Sort by createdAt date (descending) — NOT by id which can be UUID
                setEmails(filtered.sort((a, b) => {
                    const dateA = new Date(a.createdAt).getTime();
                    const dateB = new Date(b.createdAt).getTime();
                    if (!isNaN(dateB) && !isNaN(dateA)) return dateB - dateA;
                    // Fallback: string comparison
                    return String(b.id).localeCompare(String(a.id));
                }));
                setFetchError(null);
            }
            setProgress(0);
        } catch (err: any) {
            console.warn('Email fetch failed:', err);
            const msg = err?.message || '';
            if (msg.includes('Rate limit')) {
                setFetchError(msg);
            }
        }
        // deletedIds is accessed via ref, so it doesn't need to be a dependency
    }, [activeAccount, playNotificationSound, shouldNotify, onNewEmail]);

    const handleManualRefresh = useCallback(async () => {
        setIsLoadingEmails(true);
        await fetchEmails();
        setIsLoadingEmails(false);
    }, [fetchEmails]);

    // Otomatik e-posta çekme döngüsü (sekme görünürlüğüne göre adaptif)
    useEffect(() => {
        fetchEmails();
        let progressInterval = setInterval(() => setProgress(prev => prev >= 100 ? 0 : prev + 1.5), 100);
        let dataInterval = setInterval(fetchEmails, REFRESH_INTERVAL);

        const handleVisibilityChange = () => {
            clearInterval(dataInterval);
            clearInterval(progressInterval);
            if (document.hidden) {
                // Arka planda yavaş polling
                dataInterval = setInterval(fetchEmails, REFRESH_INTERVAL_HIDDEN);
                progressInterval = setInterval(() => setProgress(prev => prev >= 100 ? 0 : prev + 0.35), 100);
            } else {
                // Ön planda hızlı polling + anında kontrol
                fetchEmails();
                dataInterval = setInterval(fetchEmails, REFRESH_INTERVAL);
                progressInterval = setInterval(() => setProgress(prev => prev >= 100 ? 0 : prev + 1.5), 100);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            clearInterval(progressInterval);
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
