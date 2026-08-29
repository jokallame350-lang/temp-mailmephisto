import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Mailbox, EmailSummary, EmailDetail, AppStats, NotificationFilter } from '../types';
import { getMessages, getMessageDetail, deleteMessage, subscribeToMailboxEvents } from '../services/mailService';
import { playNotificationSound } from '../utils/audioNotification';
import { extractActionLinks } from '../utils/actionLinks';

const REFRESH_INTERVAL = 10000;
const REFRESH_INTERVAL_HIDDEN = 30000;
const STATS_KEY = 'mephisto_stats';
const FILTER_KEY = 'mephisto_notif_filters';

const defaultStats: AppStats = { totalAccountsCreated: 0, totalEmailsReceived: 0, categoryBreakdown: { Verification: 0, Security: 0, Newsletter: 0, Other: 0 }, lastActivity: Date.now() };
const defaultFilters: NotificationFilter = { verification: true, security: true, newsletter: true, other: true };

const safeRead = <T,>(key: string, fallback: T): T => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } };

export function useEmails(activeAccount: Mailbox | null, onNewEmail?: (from: string, subject: string) => void, autoVerifyEnabled = false, onAutoVerifySuccess?: (urlLabel: string) => void) {
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
    const previousIdsRef = useRef<Set<string>>(new Set());
    const autoVerifiedIdsRef = useRef<Set<string>>(new Set());
    const fetchingRef = useRef(false);
    const mountedRef = useRef(true);

    useEffect(() => () => { mountedRef.current = false; }, []);
    useEffect(() => { deletedIdsRef.current = deletedIds; }, [deletedIds]);
    useEffect(() => { setEmails([]); setSelectedEmailId(null); setCurrentEmailDetail(null); setDeletedIds(new Set()); deletedIdsRef.current = new Set(); previousIdsRef.current = new Set(); autoVerifiedIdsRef.current = new Set(); setFetchError(null); setProgress(0); }, [activeAccount?.id]);
    useEffect(() => { try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {} }, [stats]);
    useEffect(() => { try { localStorage.setItem(FILTER_KEY, JSON.stringify(notifFilters)); } catch {} }, [notifFilters]);

    const shouldNotify = useCallback((category: string) => notifFilters[category.toLowerCase() as keyof NotificationFilter] ?? false, [notifFilters]);
    const notifyNewEmails = useCallback((newEmails: EmailSummary[]) => {
        if (!newEmails.length || !newEmails.some(e => shouldNotify(e.aiCategory))) return;
        playNotificationSound();
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
        const first = newEmails[0];
        const from = typeof first.from === 'string' ? first.from : first.from?.name || first.from?.address || 'Yeni E-Posta';
        const title = `📩 ${from}`; const body = first.subject || 'Yeni bir mesajınız var.';
        if ('serviceWorker' in navigator) navigator.serviceWorker.ready.then(reg => reg.showNotification(title, { body, icon: '/icon.png', badge: '/icon.png', data: { url: '/' } })).catch(() => {});
        else { try { new Notification(title, { body, icon: '/icon.png' }); } catch {} }
    }, [shouldNotify]);

    // Never automatically request third-party activation links from received mail.
    // External GET requests can trigger account changes, leak mailbox context, or be abused by malicious senders.
    const autoVerifyEmail = useCallback(async (account: Mailbox, email: EmailSummary) => {
        if (!autoVerifyEnabled || autoVerifiedIdsRef.current.has(email.id)) return;
        autoVerifiedIdsRef.current.add(email.id);
        try {
            const detail = await getMessageDetail(account, email.id);
            if (!mountedRef.current || !detail) return;
            const html = detail.html?.[0];
            const action = typeof html === 'string' ? extractActionLinks(html) : null;
            if (action && mountedRef.current) onAutoVerifySuccess?.(action.label);
        } catch {
            // Auto-verification is best-effort; never interrupt mailbox polling.
        }
    }, [autoVerifyEnabled, onAutoVerifySuccess]);

    const fetchEmails = useCallback(async () => {
        if (!activeAccount || fetchingRef.current) return;
        const currentAccountId = activeAccount.id;
        fetchingRef.current = true;
        try {
            const fetched = await getMessages(activeAccount);
            if (!Array.isArray(fetched) || !mountedRef.current || activeAccount?.id !== currentAccountId) return;
            const currentDeleted = deletedIdsRef.current;
            const filtered = fetched.filter(e => !currentDeleted.has(e.id));
            const previousIds = previousIdsRef.current;
            const newEmails = filtered.filter(e => !previousIds.has(e.id));
            if (previousIds.size > 0 && newEmails.length) {
                notifyNewEmails(newEmails);
                newEmails.forEach(e => { const from = typeof e.from === 'string' ? e.from : e.from?.name || e.from?.address || 'unknown'; onNewEmail?.(String(from), e.subject || ''); });
                setStats(prev => { const updated = { ...prev, totalEmailsReceived: prev.totalEmailsReceived + newEmails.length, lastActivity: Date.now() }; newEmails.forEach(e => { updated.categoryBreakdown[e.aiCategory] = (updated.categoryBreakdown[e.aiCategory] || 0) + 1; }); return updated; });
                if (autoVerifyEnabled) await Promise.allSettled(newEmails.map(email => autoVerifyEmail(activeAccount, email)));
            }
            previousIdsRef.current = new Set(filtered.map(e => e.id));
            if (mountedRef.current && activeAccount?.id === currentAccountId) {
                setEmails(prev => { const map = new Map<string, EmailSummary>(); prev.forEach(item => { if (!currentDeleted.has(item.id)) map.set(item.id, item); }); filtered.forEach(item => map.set(item.id, item)); return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); });
                setFetchError(null);
            }
        } catch (err: unknown) {
            if (!mountedRef.current || activeAccount?.id !== currentAccountId) return;
            const message = err instanceof Error ? err.message : String(err || '');
            if (message) setFetchError(message);
        } finally { fetchingRef.current = false; }
    }, [activeAccount, autoVerifyEmail, autoVerifyEnabled, notifyNewEmails, onNewEmail]);

    const handleManualRefresh = useCallback(async () => { if (!activeAccount) return; setIsLoadingEmails(true); setProgress(25); await fetchEmails(); if (!mountedRef.current) return; setProgress(100); window.setTimeout(() => { if (mountedRef.current) { setIsLoadingEmails(false); setProgress(0); } }, 300); }, [activeAccount, fetchEmails]);
    useEffect(() => { if (!activeAccount) return; return subscribeToMailboxEvents(activeAccount, fetchEmails); }, [activeAccount, fetchEmails]);
    useEffect(() => {
        if (!activeAccount) return;
        fetchEmails();
        let intervalId = window.setInterval(fetchEmails, document.hidden ? REFRESH_INTERVAL_HIDDEN : REFRESH_INTERVAL);
        const handleVisibility = () => { window.clearInterval(intervalId); intervalId = window.setInterval(fetchEmails, document.hidden ? REFRESH_INTERVAL_HIDDEN : REFRESH_INTERVAL); if (!document.hidden) fetchEmails(); };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => { window.clearInterval(intervalId); document.removeEventListener('visibilitychange', handleVisibility); };
    }, [activeAccount, fetchEmails]);

    useEffect(() => {
        let cancelled = false;
        if (!selectedEmailId || !activeAccount) { setCurrentEmailDetail(null); return; }
        setIsLoadingDetail(true);
        getMessageDetail(activeAccount, selectedEmailId).then(detail => { if (!cancelled) setCurrentEmailDetail(detail || null); }).catch(err => { if (!cancelled) console.warn('Email detail fetch failed:', err); }).finally(() => { if (!cancelled) setIsLoadingDetail(false); });
        return () => { cancelled = true; };
    }, [selectedEmailId, activeAccount]);

    const handleDeleteEmail = useCallback(async (id: string, e?: React.MouseEvent) => { e?.stopPropagation(); setEmails(prev => prev.filter(email => email.id !== id)); setDeletedIds(prev => new Set(prev).add(id)); previousIdsRef.current.delete(id); if (selectedEmailId === id) { setSelectedEmailId(null); setCurrentEmailDetail(null); } if (activeAccount) { try { await deleteMessage(activeAccount, id); } catch (err) { console.warn('Email delete failed:', err); } } }, [activeAccount, selectedEmailId]);
    const handleDeleteAllEmails = useCallback(async () => { const allIds = emails.map(e => e.id); setDeletedIds(prev => { const next = new Set(prev); allIds.forEach(id => next.add(id)); return next; }); previousIdsRef.current.clear(); setEmails([]); setSelectedEmailId(null); setCurrentEmailDetail(null); if (activeAccount) await Promise.allSettled(allIds.map(id => deleteMessage(activeAccount, id))); }, [emails, activeAccount]);
    const filteredEmails = useMemo(() => { const q = searchQuery.trim().toLowerCase(); if (!q) return emails; return emails.filter(e => { const from = typeof e.from === 'string' ? e.from : `${e.from?.name || ''} ${e.from?.address || ''}`; return `${from} ${e.subject || ''} ${e.intro || ''}`.toLowerCase().includes(q); }); }, [emails, searchQuery]);
    const incrementAccountStat = useCallback(() => setStats(prev => ({ ...prev, totalAccountsCreated: prev.totalAccountsCreated + 1, lastActivity: Date.now() })), []);

    return { emails: filteredEmails, allEmails: emails, selectedEmailId, currentEmailDetail, isLoadingDetail, isLoadingEmails, fetchError, progress, searchQuery, stats, notifFilters, setSearchQuery, setSelectedEmailId, setNotifFilters, handleManualRefresh, handleDeleteEmail, handleDeleteAllEmails, incrementAccountStat };
}