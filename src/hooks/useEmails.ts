import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Mailbox, EmailSummary, EmailDetail, AppStats, NotificationFilter } from '../types';
import { getMessages, getMessageDetail, deleteMessage, deleteAllMessages, getRateLimitRemainingMs } from '../services/mailService';
import { playNotificationSound } from '../utils/audioNotification';
import { extractActionLinks } from '../utils/actionLinks';

const BASE_POLL_INTERVAL = 4000;
const MAX_POLL_INTERVAL = 60000;
const BACKOFF_FACTOR = 1.5;
const STATS_KEY = 'mephisto_stats';
const FILTER_KEY = 'mephisto_notif_filters';

const defaultStats: AppStats = { totalAccountsCreated: 0, totalEmailsReceived: 0, categoryBreakdown: { Verification: 0, Security: 0, Newsletter: 0, Other: 0 }, lastActivity: Date.now() };
const defaultFilters: NotificationFilter = { verification: true, security: true, newsletter: true, other: true };

const safeRead = <T,>(key: string, fallback: T): T => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } };

const isPollingAllowed = (): boolean => {
    if (typeof document !== 'undefined' && (document.hidden || document.visibilityState === 'hidden')) {
        return false;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return false;
    }
    return true;
};

export function useEmails(
    activeAccount: Mailbox | null,
    onNewEmail?: (from: string, subject: string) => void,
    autoVerifyEnabled = false,
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
    const [stats, setStats] = useState<AppStats>(() => safeRead(STATS_KEY, defaultStats));
    const [notifFilters, setNotifFilters] = useState<NotificationFilter>(() => safeRead(FILTER_KEY, defaultFilters));

    const testEmailDetailsRef = useRef<Map<string, EmailDetail>>(new Map());
    const previousIdsRef = useRef<Set<string>>(new Set());
    const autoVerifiedIdsRef = useRef<Set<string>>(new Set());
    const fetchRequestIdRef = useRef(0);
    const detailRequestIdRef = useRef(0);
    const activeAccountIdRef = useRef<string | null>(null);
    const mountedRef = useRef(true);

    const isFetchingRef = useRef(false);
    const consecutiveFailuresRef = useRef(0);
    const pollingTimeoutRef = useRef<number | null>(null);
    const fetchEmailsRef = useRef<() => Promise<void>>(() => Promise.resolve());

    const onNewEmailRef = useRef(onNewEmail);
    const onAutoVerifySuccessRef = useRef(onAutoVerifySuccess);
    const autoVerifyEnabledRef = useRef(autoVerifyEnabled);

    onNewEmailRef.current = onNewEmail;
    onAutoVerifySuccessRef.current = onAutoVerifySuccess;
    autoVerifyEnabledRef.current = autoVerifyEnabled;
    activeAccountIdRef.current = activeAccount?.id || null;

    const clearPollingTimer = useCallback(() => {
        if (pollingTimeoutRef.current !== null) {
            window.clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
        }
    }, []);

    useEffect(() => () => {
        mountedRef.current = false;
        clearPollingTimer();
        fetchRequestIdRef.current++;
        detailRequestIdRef.current++;
    }, [clearPollingTimer]);

    useEffect(() => { deletedIdsRef.current = deletedIds; }, [deletedIds]);

    // Active account switch: immediately invalidate pending in-flight requests, reset backoff, clear timers and mailbox data
    useEffect(() => {
        fetchRequestIdRef.current++;
        detailRequestIdRef.current++;
        isFetchingRef.current = false;
        consecutiveFailuresRef.current = 0;
        clearPollingTimer();

        setEmails([]);
        setSelectedEmailId(null);
        setCurrentEmailDetail(null);
        setDeletedIds(new Set());
        deletedIdsRef.current = new Set();
        previousIdsRef.current = new Set();
        autoVerifiedIdsRef.current = new Set();
        setFetchError(null);
        setProgress(0);
    }, [activeAccount?.id, clearPollingTimer]);

    useEffect(() => { try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {} }, [stats]);
    useEffect(() => { try { localStorage.setItem(FILTER_KEY, JSON.stringify(notifFilters)); } catch {} }, [notifFilters]);

    const shouldNotify = useCallback((category: string) => notifFilters[category.toLowerCase() as keyof NotificationFilter] ?? false, [notifFilters]);

    const notifyNewEmails = useCallback((newEmails: EmailSummary[]) => {
        if (!newEmails.length || !newEmails.some(e => shouldNotify(e.aiCategory))) return;
        playNotificationSound();
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
        const first = newEmails[0];
        const from = typeof first.from === 'string' ? first.from : first.from?.name || first.from?.address || 'Yeni E-Posta';
        const title = `📩 ${from}`;
        const body = first.subject || 'Yeni bir mesajınız var.';
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => reg.showNotification(title, { body, icon: '/icon.png', badge: '/icon.png', data: { url: '/' } })).catch(() => {});
        } else {
            try { new Notification(title, { body, icon: '/icon.png' }); } catch {}
        }
    }, [shouldNotify]);

    const autoVerifyEmail = useCallback(async (account: Mailbox, email: EmailSummary) => {
        if (!autoVerifyEnabledRef.current || autoVerifiedIdsRef.current.has(email.id)) return;
        autoVerifiedIdsRef.current.add(email.id);
        try {
            const detail = await getMessageDetail(account, email.id);
            if (!mountedRef.current || !detail || activeAccountIdRef.current !== account.id) return;
            const html = detail.html?.[0];
            const action = typeof html === 'string' ? extractActionLinks(html) : null;
            if (action && mountedRef.current && activeAccountIdRef.current === account.id) {
                onAutoVerifySuccessRef.current?.(action.label);
            }
        } catch {
            // Auto-verification is best-effort; never interrupt mailbox polling.
        }
    }, []);

    const scheduleNextPoll = useCallback((customDelay?: number) => {
        clearPollingTimer();
        if (!mountedRef.current || !activeAccountIdRef.current) return;
        if (!isPollingAllowed()) return;

        let delay = customDelay;
        if (delay === undefined) {
            const failures = consecutiveFailuresRef.current;
            const base = failures === 0
                ? BASE_POLL_INTERVAL
                : Math.min(MAX_POLL_INTERVAL, Math.round(BASE_POLL_INTERVAL * Math.pow(BACKOFF_FACTOR, failures)));
            const rateLimitMs = activeAccount ? getRateLimitRemainingMs(activeAccount.apiBase) : 0;
            delay = Math.max(base, rateLimitMs);
        }

        pollingTimeoutRef.current = window.setTimeout(() => {
            pollingTimeoutRef.current = null;
            fetchEmailsRef.current();
        }, delay);
    }, [activeAccount, clearPollingTimer]);

    const fetchEmails = useCallback(async () => {
        if (isFetchingRef.current) return;
        if (!activeAccount) return;
        if (!isPollingAllowed()) return;

        const rateLimitRemaining = getRateLimitRemainingMs(activeAccount.apiBase);
        if (rateLimitRemaining > 0) {
            const waitSec = Math.max(1, Math.ceil(rateLimitRemaining / 1000));
            setFetchError(`Rate limited. Retry after ${waitSec}s`);
            scheduleNextPoll(rateLimitRemaining + 500);
            return;
        }

        isFetchingRef.current = true;
        const currentAccountId = activeAccount.id;
        const currentRequestId = ++fetchRequestIdRef.current;

        try {
            const fetched = await getMessages(activeAccount);
            if (!mountedRef.current || fetchRequestIdRef.current !== currentRequestId || activeAccountIdRef.current !== currentAccountId) {
                return;
            }
            if (!Array.isArray(fetched)) return;

            consecutiveFailuresRef.current = 0;
            setFetchError(null);

            const currentDeleted = deletedIdsRef.current;
            const filtered = fetched.filter(e => !currentDeleted.has(e.id));
            const previousIds = previousIdsRef.current;
            const newEmails = filtered.filter(e => !previousIds.has(e.id));

            if (previousIds.size > 0 && newEmails.length) {
                notifyNewEmails(newEmails);
                newEmails.forEach(e => {
                    const from = typeof e.from === 'string' ? e.from : e.from?.name || e.from?.address || 'unknown';
                    onNewEmailRef.current?.(String(from), e.subject || '');
                });
                setStats(prev => {
                    const updated = { ...prev, totalEmailsReceived: prev.totalEmailsReceived + newEmails.length, lastActivity: Date.now() };
                    newEmails.forEach(e => { updated.categoryBreakdown[e.aiCategory] = (updated.categoryBreakdown[e.aiCategory] || 0) + 1; });
                    return updated;
                });
                if (autoVerifyEnabledRef.current) {
                    await Promise.allSettled(newEmails.map(email => autoVerifyEmail(activeAccount, email)));
                }
            }

            if (!mountedRef.current || fetchRequestIdRef.current !== currentRequestId || activeAccountIdRef.current !== currentAccountId) {
                return;
            }

            previousIdsRef.current = new Set(filtered.map(e => e.id));
            setEmails(prev => {
                const map = new Map<string, EmailSummary>();
                prev.forEach(item => { if (!currentDeleted.has(item.id)) map.set(item.id, item); });
                filtered.forEach(item => map.set(item.id, item));
                return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            });
        } catch (err: unknown) {
            if (!mountedRef.current || fetchRequestIdRef.current !== currentRequestId || activeAccountIdRef.current !== currentAccountId) {
                return;
            }
            consecutiveFailuresRef.current += 1;
            const message = err instanceof Error ? err.message : String(err || '');
            if (message) setFetchError(message);
        } finally {
            isFetchingRef.current = false;
            if (mountedRef.current && activeAccountIdRef.current === currentAccountId) {
                scheduleNextPoll();
            }
        }
    }, [activeAccount, autoVerifyEmail, notifyNewEmails, scheduleNextPoll]);

    fetchEmailsRef.current = fetchEmails;

    const handleManualRefresh = useCallback(async () => {
        if (!activeAccount) return;
        setIsLoadingEmails(true);
        setProgress(25);
        clearPollingTimer();
        await fetchEmails();
        if (!mountedRef.current) return;
        setProgress(100);
        window.setTimeout(() => {
            if (mountedRef.current) {
                setIsLoadingEmails(false);
                setProgress(0);
            }
        }, 300);
    }, [activeAccount, clearPollingTimer, fetchEmails]);

    // Polling lifecycle: manage visibility, network state, and initial/recurring fetches
    useEffect(() => {
        if (!activeAccount) return;

        const handleResume = () => {
            if (isPollingAllowed()) {
                clearPollingTimer();
                fetchEmailsRef.current();
            } else {
                clearPollingTimer();
            }
        };

        const handleOffline = () => {
            clearPollingTimer();
        };

        document.addEventListener('visibilitychange', handleResume);
        window.addEventListener('online', handleResume);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('focus', handleResume);

        if (isPollingAllowed()) {
            fetchEmailsRef.current();
        }

        return () => {
            clearPollingTimer();
            document.removeEventListener('visibilitychange', handleResume);
            window.removeEventListener('online', handleResume);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('focus', handleResume);
        };
    }, [activeAccount, clearPollingTimer]);

    // Handle live simulated Test OTP events from AddressBar / Bulk / Burn / Checker pages
    useEffect(() => {
        const handleTestOtpEvent = (e: Event) => {
            const custom = e as CustomEvent;
            const detail = custom.detail;
            if (!detail || !detail.id) return;

            const testSummary: EmailSummary = {
                id: String(detail.id),
                from: String(detail.from || 'security@verify-service.com'),
                subject: String(detail.subject || '🔐 Doğrulama Kodu'),
                intro: String(detail.body || detail.subject || ''),
                seen: false,
                createdAt: new Date().toISOString(),
                aiCategory: 'Verification',
            };

            const testDetail: EmailDetail = {
                ...testSummary,
                text: String(detail.body || ''),
                html: [`<div style="font-family:system-ui,-apple-system,sans-serif;padding:24px;background:#0c0d12;color:#f8fafc;border-radius:16px;border:1px solid rgba(249,115,22,0.2);"><div style="display:inline-block;padding:4px 12px;background:rgba(249,115,22,0.15);border:1px solid rgba(249,115,22,0.3);border-radius:8px;font-size:12px;font-weight:bold;color:#fb923c;margin-bottom:12px;">MephistoMail Live OTP Demo</div><h2 style="font-size:18px;font-weight:bold;margin:0 0 16px 0;color:#ffffff;">${detail.subject}</h2><div style="font-size:14px;line-height:1.6;color:#cbd5e1;background:#14161f;padding:16px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);white-space:pre-wrap;">${detail.body}</div><div style="margin-top:16px;font-size:11px;color:#64748b;">Sender: ${detail.from} &bull; Received via MephistoMail Test Channel</div></div>`],
                hasAttachments: false,
                attachments: [],
                headerFields: {
                    From: String(detail.from || 'security@verify-service.com'),
                    Subject: String(detail.subject || '🔐 Doğrulama Kodu'),
                    Date: new Date().toISOString(),
                    'Content-Type': 'text/html',
                },
            };

            testEmailDetailsRef.current.set(testSummary.id, testDetail);
            setEmails(prev => [testSummary, ...prev.filter(item => item.id !== testSummary.id)]);
            notifyNewEmails([testSummary]);
            const from = typeof testSummary.from === 'string' ? testSummary.from : testSummary.from?.name || testSummary.from?.address || 'security@verify-service.com';
            onNewEmailRef.current?.(from, testSummary.subject);
        };

        window.addEventListener('mephisto-test-otp', handleTestOtpEvent);
        return () => window.removeEventListener('mephisto-test-otp', handleTestOtpEvent);
    }, [notifyNewEmails]);

    useEffect(() => {
        if (!selectedEmailId || !activeAccount) {
            setCurrentEmailDetail(null);
            setIsLoadingDetail(false);
            return;
        }

        // Check in-memory test email detail cache first
        if (testEmailDetailsRef.current.has(selectedEmailId)) {
            setCurrentEmailDetail(testEmailDetailsRef.current.get(selectedEmailId) || null);
            setIsLoadingDetail(false);
            return;
        }

        const currentAccountId = activeAccount.id;
        const currentDetailId = ++detailRequestIdRef.current;
        setIsLoadingDetail(true);

        getMessageDetail(activeAccount, selectedEmailId)
            .then(detail => {
                if (mountedRef.current && detailRequestIdRef.current === currentDetailId && activeAccountIdRef.current === currentAccountId) {
                    setCurrentEmailDetail(detail || null);
                }
            })
            .catch(err => {
                if (mountedRef.current && detailRequestIdRef.current === currentDetailId && activeAccountIdRef.current === currentAccountId) {
                    console.warn('Email detail fetch failed:', err);
                }
            })
            .finally(() => {
                if (mountedRef.current && detailRequestIdRef.current === currentDetailId) {
                    setIsLoadingDetail(false);
                }
            });

        const reqRef = detailRequestIdRef;
        return () => {
            reqRef.current++;
        };
    }, [selectedEmailId, activeAccount]);

    const handleDeleteEmail = useCallback(async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setEmails(prev => prev.filter(email => email.id !== id));
        setDeletedIds(prev => new Set(prev).add(id));
        previousIdsRef.current.delete(id);
        if (selectedEmailId === id) {
            setSelectedEmailId(null);
            setCurrentEmailDetail(null);
        }
        if (activeAccount) {
            try { await deleteMessage(activeAccount, id); } catch (err) { console.warn('Email delete failed:', err); }
        }
    }, [activeAccount, selectedEmailId]);

    const handleDeleteAllEmails = useCallback(async () => {
        const allIds = emails.map(e => e.id);
        setDeletedIds(prev => {
            const next = new Set(prev);
            allIds.forEach(id => next.add(id));
            return next;
        });
        previousIdsRef.current.clear();
        setEmails([]);
        setSelectedEmailId(null);
        setCurrentEmailDetail(null);
        if (activeAccount) {
            try {
                await deleteAllMessages(activeAccount);
            } catch (err) {
                console.warn('Batch delete all emails failed:', err);
            }
        }
    }, [emails, activeAccount]);

    const filteredEmails = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return emails;
        return emails.filter(e => {
            const from = typeof e.from === 'string' ? e.from : `${e.from?.name || ''} ${e.from?.address || ''}`;
            return `${from} ${e.subject || ''} ${e.intro || ''}`.toLowerCase().includes(q);
        });
    }, [emails, searchQuery]);

    const incrementAccountStat = useCallback(() => setStats(prev => ({ ...prev, totalAccountsCreated: prev.totalAccountsCreated + 1, lastActivity: Date.now() })), []);

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
        incrementAccountStat
    };
}