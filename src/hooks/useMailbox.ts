import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Mailbox } from '../types';
import { generateMailbox, createCustomMailbox, fetchDomains, storeCredentials, clearCredentials, onTokenRefresh } from '../services/mailService';

const STORAGE_KEY = 'nexus_accounts_v5';
const MAX_ACTIVE_ACCOUNTS = 100;
const ACCOUNT_LIFETIME_MS = 24 * 60 * 60 * 1000;

const safeParseAccounts = (raw: string | null): Mailbox[] => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const now = Date.now();
        return parsed.filter((a: Mailbox) => a && typeof a.id === 'string' && typeof a.address === 'string' && (!a.createdAt || now - a.createdAt < ACCOUNT_LIFETIME_MS));
    } catch { return []; }
};

export function useMailbox() {
    const [accounts, setAccounts] = useState<Mailbox[]>([]);
    const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
    const [isLoadingAccount, setIsLoadingAccount] = useState(false);
    const isCreatingRef = useRef(false);
    const isFirstLoadRef = useRef(true);

    const activeAccount = useMemo(() => accounts.find(a => a.id === activeAccountId) || null, [accounts, activeAccountId]);
    const persist = useCallback((items: Mailbox[]) => { try { if (items.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); else localStorage.removeItem(STORAGE_KEY); } catch {} }, []);

    const getMagicUrl = useCallback((address?: string) => {
        const targetAddress = address || activeAccount?.address;
        if (!targetAddress || typeof window === 'undefined') return '';
        const url = new URL(window.location.href);
        url.searchParams.set('mailbox', targetAddress);
        return url.toString();
    }, [activeAccount?.address]);

    const createQuickAccount = useCallback(async (_skipCreditCheck = false) => {
        if (isCreatingRef.current || accounts.length >= MAX_ACTIVE_ACCOUNTS) return { success: false, reason: accounts.length >= MAX_ACTIVE_ACCOUNTS ? 'capacity' : 'busy' };
        isCreatingRef.current = true; setIsLoadingAccount(true);
        try {
            const generated = await generateMailbox();
            if (!generated?.address || generated.id === 'error') throw new Error('Connection failed');
            const newMailbox: Mailbox = { ...generated, createdAt: Date.now() };
            if (newMailbox.password) storeCredentials(newMailbox.id, newMailbox.address, newMailbox.password);
            setAccounts(prev => { const updated = [newMailbox, ...prev].slice(0, MAX_ACTIVE_ACCOUNTS); persist(updated); return updated; });
            setActiveAccountId(newMailbox.id);
            return { success: true };
        } catch (e) { console.error('Account creation failed:', e); return { success: false, reason: 'error' }; }
        finally { setIsLoadingAccount(false); isCreatingRef.current = false; }
    }, [accounts.length, persist]);

    useEffect(() => {
        let cancelled = false;
        const initMailbox = async () => {
            let domainMap: Record<string, string> = {};
            try { domainMap = (await fetchDomains())?.domainProviderMap || {}; } catch (err) { console.warn('Domain fetch failed:', err); }
            const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
            const targetMailbox = urlParams?.get('mailbox')?.trim();
            const validAccounts = safeParseAccounts(typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);

            if (targetMailbox && /^[^@\s]+@[^@\s]+$/.test(targetMailbox)) {
                const existing = validAccounts.find(a => a.address.toLowerCase() === targetMailbox.toLowerCase());
                if (existing) { if (!cancelled) { setAccounts(validAccounts); setActiveAccountId(existing.id); isFirstLoadRef.current = false; } return; }
                const [username, ...domainParts] = targetMailbox.split('@');
                const domain = domainParts.join('@').toLowerCase();
                if (username && domain) {
                    setIsLoadingAccount(true);
                    try {
                        const provider = domainMap[domain] || 'guerrilla';
                        const created = await createCustomMailbox(username, domain, provider);
                        if (!created?.address || created.id === 'error') throw new Error('Mailbox creation failed');
                        const mailboxWithDate: Mailbox = { ...created, createdAt: Date.now() };
                        if (mailboxWithDate.password) storeCredentials(mailboxWithDate.id, mailboxWithDate.address, mailboxWithDate.password);
                        const updated = [mailboxWithDate, ...validAccounts].slice(0, MAX_ACTIVE_ACCOUNTS);
                        if (!cancelled) { setAccounts(updated); setActiveAccountId(mailboxWithDate.id); persist(updated); } else { clearCredentials(mailboxWithDate.id); }
                    } catch (err) {
                        console.error('Failed to restore URL mailbox:', err);
                        if (!cancelled && validAccounts.length) { setAccounts(validAccounts); setActiveAccountId(validAccounts[0].id); }
                    } finally { if (!cancelled) { setIsLoadingAccount(false); isFirstLoadRef.current = false; } }
                    return;
                }
            }
            if (validAccounts.length) { if (!cancelled) { setAccounts(validAccounts); setActiveAccountId(validAccounts[0].id); persist(validAccounts); isFirstLoadRef.current = false; } return; }
            if (!cancelled) await createQuickAccount(true);
            if (!cancelled) isFirstLoadRef.current = false;
        };
        initMailbox();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || isFirstLoadRef.current) return;
        const url = new URL(window.location.href);
        if (activeAccount?.address) url.searchParams.set('mailbox', activeAccount.address); else url.searchParams.delete('mailbox');
        window.history.replaceState(null, '', url.toString());
    }, [activeAccount?.address]);

    useEffect(() => {
        const unsubscribe = onTokenRefresh((mailboxId: string, newToken: string) => setAccounts(prev => { const updated = prev.map(a => a.id === mailboxId ? { ...a, token: newToken } : a); persist(updated); return updated; }));
        return unsubscribe;
    }, [persist]);

    useEffect(() => { if (accounts.length) persist(accounts); }, [accounts, persist]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            const now = Date.now();
            setAccounts(prev => {
                const expired = prev.filter(a => a.createdAt && now - a.createdAt >= Math.min(ACCOUNT_LIFETIME_MS, (a.autoDeleteMinutes || 1440) * 60000));
                if (!expired.length) return prev;
                expired.forEach(a => clearCredentials(a.id));
                const filtered = prev.filter(a => !expired.some(e => e.id === a.id));
                persist(filtered);
                if (!filtered.some(a => a.id === activeAccountId)) setActiveAccountId(filtered[0]?.id || null);
                return filtered;
            });
        }, 10000);
        return () => window.clearInterval(interval);
    }, [activeAccountId, persist]);

    const handleCreateCustom = useCallback(async (username: string, domain: string, apiBase: string) => {
        if (!username || !domain || accounts.length >= MAX_ACTIVE_ACCOUNTS) return { success: false, reason: 'capacity' };
        setIsLoadingAccount(true);
        try {
            const created = await createCustomMailbox(username, domain, apiBase);
            if (!created?.address || created.id === 'error') throw new Error('Connection failed');
            const newMailbox: Mailbox = { ...created, createdAt: Date.now() };
            if (newMailbox.password) storeCredentials(newMailbox.id, newMailbox.address, newMailbox.password);
            setAccounts(prev => { const updated = [newMailbox, ...prev].slice(0, MAX_ACTIVE_ACCOUNTS); persist(updated); return updated; });
            setActiveAccountId(newMailbox.id);
            return { success: true };
        } catch (e: any) { const msg = String(e?.message || '').toLowerCase(); return { success: false, reason: msg.includes('taken') || msg.includes('alınmış') ? 'taken' : 'error' }; }
        finally { setIsLoadingAccount(false); }
    }, [accounts.length, persist]);

    const deleteAccount = useCallback((id: string) => {
        clearCredentials(id);
        setAccounts(prev => { const updated = prev.filter(a => a.id !== id); persist(updated); return updated; });
        if (activeAccountId === id) setActiveAccountId(accounts.find(a => a.id !== id)?.id || null);
    }, [accounts, activeAccountId, persist]);
    const updateAccountLabel = useCallback((id: string, label: string, labelColor: string) => setAccounts(prev => prev.map(a => a.id === id ? { ...a, label, labelColor } : a)), []);
    const setAutoDelete = useCallback((id: string, minutes: number | undefined) => setAccounts(prev => prev.map(a => a.id === id ? { ...a, autoDeleteMinutes: minutes, createdAt: a.createdAt || Date.now() } : a)), []);
    const bulkCopyAddresses = useCallback(() => { const addresses = accounts.map(a => a.address).join('\n'); navigator.clipboard?.writeText(addresses).catch(() => {}); return addresses; }, [accounts]);
    const addCustomAccount = useCallback((mailbox: Mailbox) => setAccounts(prev => { const updated = [mailbox, ...prev].slice(0, MAX_ACTIVE_ACCOUNTS); persist(updated); return updated; }), [persist]);

    const changeDomain = useCallback(async (newDomain: string) => {
        if (!activeAccount || !newDomain) return { success: false };
        const username = activeAccount.address.split('@')[0];
        if (activeAccount.address.split('@')[1]?.toLowerCase() === newDomain.toLowerCase()) return { success: true, address: activeAccount.address };
        setIsLoadingAccount(true);
        try {
            const domainRes = await fetchDomains();
            const provider = domainRes?.domainProviderMap?.[newDomain] || 'guerrilla';
            const created = await createCustomMailbox(username, newDomain, provider);
            if (!created?.address || created.id === 'error') throw new Error('Mailbox creation failed');
            const mailboxWithDate: Mailbox = { ...created, createdAt: Date.now() };
            if (mailboxWithDate.password) storeCredentials(mailboxWithDate.id, mailboxWithDate.address, mailboxWithDate.password);
            setAccounts(prev => { const updated = [mailboxWithDate, ...prev]; persist(updated); return updated; });
            setActiveAccountId(mailboxWithDate.id);
            return { success: true, address: mailboxWithDate.address };
        } catch (err) { console.error('Failed to change domain:', err); return { success: false }; }
        finally { setIsLoadingAccount(false); }
    }, [activeAccount, persist]);

    return { accounts, activeAccount, activeAccountId, isLoadingAccount, setActiveAccountId, createQuickAccount, handleCreateCustom, changeDomain, deleteAccount, updateAccountLabel, setAutoDelete, bulkCopyAddresses, addCustomAccount, getMagicUrl, MAX_ACTIVE_ACCOUNTS };
}