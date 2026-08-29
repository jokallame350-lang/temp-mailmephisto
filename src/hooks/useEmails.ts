import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Mailbox, EmailSummary, EmailDetail, AppStats, NotificationFilter } from '../types';
import { getMessages, getMessageDetail, deleteMessage, deleteAllMessages, getRateLimitRemainingMs, MailboxFetchError } from '../services/mailService';
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

export const getInboxCacheKey = (account: Mailbox | null): string | null => {
    const trimmed = account?.address?.trim()?.toLowerCase();
    if (!trimmed) return null;
    return `mephisto_inbox_v2_${trimmed}`;
};

export const getDeletedCacheKey = (account: Mailbox | null): string | null => {
    const trimmed = account?.address?.trim()?.toLowerCase();
    if (!trimmed) return null;
    return `mephisto_deleted_v1_${trimmed}`;
};

export const safeReadDeletedIds = (account: Mailbox | null): Set<string> => {
    if (!account?.address) return new Set();
    const key = getDeletedCacheKey(account);
    if (!key) return new Set();
    try {
        const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return new Set();
        const ids = parsed
            .filter((item: any) => typeof item === 'string' || typeof item === 'number')
            .map((item: any) => String(item).trim())
            .filter(Boolean)
            .slice(0, 500);
        return new Set(ids);
    } catch {
        return new Set();
    }
};

export const safeSaveDeletedIds = (account: Mailbox | null, ids: Set<string> | string[]) => {
    if (!account?.address) return;
    const key = getDeletedCacheKey(account);
    if (!key) return;
    try {
        const arr = Array.from(ids)
            .filter((item: any) => item !== null && item !== undefined && typeof item !== 'boolean')
            .map(id => String(id).trim())
            .filter(Boolean)
            .slice(0, 500);
        const json = JSON.stringify(arr);
        localStorage.setItem(key, json);
        sessionStorage.setItem(key, json);
    } catch {}
};

export const safeClearDeletedIds = (account: Mailbox | null) => {
    if (!account?.address) return;
    const key = getDeletedCacheKey(account);
    try {
        if (key) {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        }
    } catch {}
};

export {
    safeReadDeletedIds as safeReadDeleted,
    safeSaveDeletedIds as safeSaveDeleted,
    safeClearDeletedIds as safeClearDeleted,
};

export const safeReadInbox = (account: Mailbox | null): EmailSummary[] => {
    if (!account?.address) return [];
    const key = getInboxCacheKey(account);
    const legacyKey = `mephisto_inbox_${account.address.toLowerCase().trim()}`;

    try {
        const raw = (key && localStorage.getItem(key)) ||
                    (key && sessionStorage.getItem(key)) ||
                    localStorage.getItem(legacyKey);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((item: any) => item && typeof item.id === 'string' && item.from && item.subject !== undefined)
            .map((item: any) => ({
                id: String(item.id),
                from: item.from,
                subject: String(item.subject || ''),
                intro: String(item.intro || ''),
                seen: Boolean(item.seen),
                createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
                aiCategory: (item.aiCategory || 'Other') as any,
            }))
            .slice(0, 200);
    } catch {
        return [];
    }
};

export const safeSaveInbox = (account: Mailbox | null, list: EmailSummary[], allowEmpty = false) => {
    if (!account?.address) return;
    const key = getInboxCacheKey(account);
    if (!key) return;
    try {
        if (list.length === 0 && !allowEmpty) {
            return;
        }
        const safeList = list.slice(0, 200).map(e => ({
            id: String(e.id),
            from: e.from,
            subject: String(e.subject || ''),
            intro: String(e.intro || ''),
            seen: Boolean(e.seen),
            createdAt: typeof e.createdAt === 'string' ? e.createdAt : new Date().toISOString(),
            aiCategory: e.aiCategory || 'Other',
        }));
        const json = JSON.stringify(safeList);
        localStorage.setItem(key, json);
        sessionStorage.setItem(key, json);
    } catch {}
};

export const safeClearInbox = (account: Mailbox | null) => {
    if (!account?.address) return;
    const key = getInboxCacheKey(account);
    try {
        if (key) {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        }
        localStorage.removeItem(`mephisto_inbox_${account.address.toLowerCase().trim()}`);
    } catch {}
};

export function useEmails(
    activeAccount: Mailbox | null,
    allAccounts: Mailbox[] = [],
    onNewEmail?: (from: string, subject: string) => void,
    autoVerifyEnabled = false,
    onAutoVerifySuccess?: (urlLabel: string) => void
) {
    const [deletedIds, setDeletedIds] = useState<Set<string>>(() => safeReadDeletedIds(activeAccount));
    const deletedIdsRef = useRef<Set<string>>(safeReadDeletedIds(activeAccount));

    const [emails, setEmails] = useState<EmailSummary[]>(() => {
        const cached = safeReadInbox(activeAccount);
        const deleted = safeReadDeletedIds(activeAccount);
        return cached.filter(e => !deleted.has(e.id));
    });
    const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [currentEmailDetail, setCurrentEmailDetail] = useState<EmailDetail | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isLoadingEmails, setIsLoadingEmails] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<AppStats>(() => safeRead(STATS_KEY, defaultStats));
    const [notifFilters, setNotifFilters] = useState<NotificationFilter>(() => safeRead(FILTER_KEY, defaultFilters));

    const testEmailDetailsRef = useRef<Map<string, EmailDetail>>(new Map());
    const previousIdsRef = useRef<Set<string>>(
        new Set(safeReadInbox(activeAccount).filter(e => !safeReadDeletedIds(activeAccount).has(e.id)).map(e => e.id))
    );
    const isFirstFetchRef = useRef(true);
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

    useEffect(() => {
        deletedIdsRef.current = deletedIds;
    }, [deletedIds]);

    // Active account switch: immediately load cached inbox & deleted IDs for that account so UI never blanks out
    useEffect(() => {
        fetchRequestIdRef.current++;
        detailRequestIdRef.current++;
        isFetchingRef.current = false;
        consecutiveFailuresRef.current = 0;
        clearPollingTimer();

        const initialDeleted = safeReadDeletedIds(activeAccount);
        const cached = safeReadInbox(activeAccount).filter(e => !initialDeleted.has(e.id));
        setEmails(cached);
        setSelectedEmailId(null);
        setCurrentEmailDetail(null);
        setDeletedIds(initialDeleted);
        deletedIdsRef.current = initialDeleted;
        previousIdsRef.current = new Set(cached.map(e => e.id));
        isFirstFetchRef.current = true;
        autoVerifiedIdsRef.current = new Set();
        setFetchError(null);
        setProgress(0);
    }, [activeAccount, clearPollingTimer]);

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
            setFetchError('rate_limited');
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
            const isFirstFetch = isFirstFetchRef.current;
            const newEmails = isFirstFetch ? [] : filtered.filter(e => !previousIds.has(e.id));

            if (!isFirstFetch && previousIds.size > 0 && newEmails.length) {
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

            isFirstFetchRef.current = false;

            if (!mountedRef.current || fetchRequestIdRef.current !== currentRequestId || activeAccountIdRef.current !== currentAccountId) {
                return;
            }

            previousIdsRef.current = new Set(filtered.map(e => e.id));
            setEmails(prev => {
                const cached = safeReadInbox(activeAccount);
                const map = new Map<string, EmailSummary>();
                cached.forEach(item => { if (!currentDeleted.has(item.id)) map.set(item.id, item); });
                prev.forEach(item => { if (!currentDeleted.has(item.id)) map.set(item.id, item); });
                filtered.forEach(item => map.set(item.id, item));
                const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                safeSaveInbox(activeAccount, merged);
                return merged;
            });
        } catch (err: unknown) {
            if (!mountedRef.current || fetchRequestIdRef.current !== currentRequestId || activeAccountIdRef.current !== currentAccountId) {
                return;
            }
            consecutiveFailuresRef.current += 1;
            if (err instanceof MailboxFetchError && err.code === 'RATE_LIMITED') {
                setFetchError('rate_limited');
            } else {
                const message = err instanceof Error ? err.message : String(err || '');
                if (message) setFetchError(message);
            }
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
            try { sessionStorage.setItem(`mephisto_test_detail_${testSummary.id}`, JSON.stringify(testDetail)); } catch {}
            setEmails(prev => {
                const next = [testSummary, ...prev.filter(item => item.id !== testSummary.id)];
                safeSaveInbox(activeAccount, next);
                return next;
            });
            notifyNewEmails([testSummary]);
            const from = typeof testSummary.from === 'string' ? testSummary.from : testSummary.from?.name || testSummary.from?.address || 'security@verify-service.com';
            onNewEmailRef.current?.(from, testSummary.subject);
        };

        window.addEventListener('mephisto-test-otp', handleTestOtpEvent);
        return () => window.removeEventListener('mephisto-test-otp', handleTestOtpEvent);
    }, [activeAccount, notifyNewEmails]);

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

        try {
            const rawTest = sessionStorage.getItem(`mephisto_test_detail_${selectedEmailId}`);
            if (rawTest) {
                const parsed = JSON.parse(rawTest);
                if (parsed && parsed.id === selectedEmailId) {
                    testEmailDetailsRef.current.set(selectedEmailId, parsed);
                    setCurrentEmailDetail(parsed);
                    setIsLoadingDetail(false);
                    return;
                }
            }
        } catch {}

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

    // Background polling for all secondary open accounts so mail sent to any open mailbox is captured
    useEffect(() => {
        if (!allAccounts || allAccounts.length <= 1) return;
        let isSyncing = false;

        const syncSecondaryAccounts = async () => {
            if (isSyncing || !mountedRef.current || !isPollingAllowed()) return;
            isSyncing = true;
            try {
                const secondary = allAccounts.filter(acc => acc.id !== activeAccount?.id);
                // Sync up to 8 secondary mailboxes per tick to prevent network congestion when managing up to 100 accounts
                const batchSize = Math.min(secondary.length, 8);
                const accountsToSync = secondary.slice(0, batchSize);

                for (const acc of accountsToSync) {
                    if (!mountedRef.current || !isPollingAllowed()) break;
                    try {
                        const msgs = await getMessages(acc);
                        if (Array.isArray(msgs)) {
                            const deletedForAcc = safeReadDeletedIds(acc);
                            const filteredMsgs = msgs.filter(m => !deletedForAcc.has(m.id));
                            const existing = safeReadInbox(acc);
                            const map = new Map<string, EmailSummary>();
                            existing.forEach(m => { if (!deletedForAcc.has(m.id)) map.set(m.id, m); });
                            filteredMsgs.forEach(m => map.set(m.id, m));
                            const merged = Array.from(map.values())
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .slice(0, 200);
                            safeSaveInbox(acc, merged, true);
                            const unread = merged.filter(m => !m.seen).length;
                            setUnreadMap(prev => prev[acc.id] === unread ? prev : { ...prev, [acc.id]: unread });
                        }
                    } catch {}
                }
            } finally {
                isSyncing = false;
            }
        };

        const interval = window.setInterval(syncSecondaryAccounts, 8000);
        const initialTimer = window.setTimeout(syncSecondaryAccounts, 1500);

        return () => {
            window.clearInterval(interval);
            window.clearTimeout(initialTimer);
        };
    }, [allAccounts, activeAccount?.id]);

    const handleDeleteEmail = useCallback(async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const nextDeleted = new Set(deletedIdsRef.current).add(id);
        setDeletedIds(nextDeleted);
        deletedIdsRef.current = nextDeleted;
        safeSaveDeletedIds(activeAccount, nextDeleted);

        setEmails(prev => {
            const next = prev.filter(email => email.id !== id && !nextDeleted.has(email.id));
            safeSaveInbox(activeAccount, next, true);
            return next;
        });

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
        const nextDeleted = new Set(deletedIdsRef.current);
        allIds.forEach(id => nextDeleted.add(id));
        setDeletedIds(nextDeleted);
        deletedIdsRef.current = nextDeleted;
        safeSaveDeletedIds(activeAccount, nextDeleted);

        previousIdsRef.current.clear();
        setEmails([]);
        safeClearInbox(activeAccount);
        safeSaveInbox(activeAccount, [], true);
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
        unreadMap,
        setSearchQuery,
        setSelectedEmailId,
        setNotifFilters,
        handleManualRefresh,
        handleDeleteEmail,
        handleDeleteAllEmails,
        incrementAccountStat
    };
}