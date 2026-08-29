import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Mailbox } from '../types';
import { generateMailbox, createCustomMailbox, fetchDomains, storeCredentials, clearCredentials, onTokenRefresh } from '../services/mailService';

export const STORAGE_KEY = 'nexus_accounts_v5';
export const MAX_ACTIVE_ACCOUNTS = 100;
export const ACCOUNT_LIFETIME_MS = 24 * 60 * 60 * 1000;

export const cleanupLegacyStorage = () => {
    if (typeof localStorage === 'undefined') return;
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            // 1. Obsolete account keys (nexus_accounts_v1..v4, mephisto_accounts, legacy unversioned keys)
            if (
                (key.startsWith('nexus_accounts') && key !== STORAGE_KEY) ||
                key.startsWith('mephisto_accounts') ||
                key === 'accounts' ||
                key === 'mailboxes'
            ) {
                keysToRemove.push(key);
            }

            // 2. Obsolete inbox keys: mephisto_inbox_v1_..., mephisto_inbox_<addr> (not v2)
            if (
                key.startsWith('mephisto_inbox_') &&
                !key.startsWith('mephisto_inbox_v2_')
            ) {
                keysToRemove.push(key);
            }

            // 3. Obsolete deleted keys: mephisto_deleted_... (not v1)
            if (
                key.startsWith('mephisto_deleted_') &&
                !key.startsWith('mephisto_deleted_v1_')
            ) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(k => {
            try {
                localStorage.removeItem(k);
            } catch {}
        });
    } catch {}
};

export const safeParseAccounts = (raw: string | null): Mailbox[] => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const now = Date.now();
        return parsed
            .filter((a: Mailbox) => a && typeof a.id === 'string' && typeof a.address === 'string' && (!a.createdAt || now - a.createdAt < ACCOUNT_LIFETIME_MS))
            .map((a: any) => {
                const {
                    password: _p,
                    token: _t,
                    sid_token: _st,
                    auth: _au,
                    headers: _h,
                    credentials: _c,
                    ...safeAccount
                } = a;
                return {
                    ...safeAccount,
                    token: undefined,
                    password: undefined,
                } as Mailbox;
            });
    } catch { return []; }
};

export const getInitialAccounts = (): Mailbox[] => {
    if (typeof window === 'undefined') return [];
    cleanupLegacyStorage();
    return safeParseAccounts(localStorage.getItem(STORAGE_KEY));
};

export const getInitialActiveId = (initialAccounts: Mailbox[]): string | null => {
    if (typeof window === 'undefined' || !initialAccounts.length) return null;
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const targetMailbox = urlParams.get('mailbox')?.trim()?.toLowerCase();
        if (targetMailbox && /^[^@\s]+@[^@\s]+$/.test(targetMailbox)) {
            const exactMatch = initialAccounts.find(a => a.address.toLowerCase() === targetMailbox);
            if (exactMatch) return exactMatch.id;

            const targetUser = targetMailbox.split('@')[0];
            const aliasMatch = initialAccounts.find(a => 
                a.apiBase === 'guerrilla' && a.address.split('@')[0].toLowerCase() === targetUser
            );
            if (aliasMatch) return aliasMatch.id;
        }
    } catch {}
    return initialAccounts[0].id;
};

export function useMailbox() {
    const [accounts, setAccounts] = useState<Mailbox[]>(getInitialAccounts);
    const [activeAccountId, setActiveAccountId] = useState<string | null>(() => getInitialActiveId(accounts));
    const [isLoadingAccount, setIsLoadingAccount] = useState(false);
    const isCreatingRef = useRef(false);
    const isFirstLoadRef = useRef(accounts.length === 0);
    const mountedRef = useRef(true);

    useEffect(() => () => { mountedRef.current = false; }, []);

    const activeAccount = useMemo(() => accounts.find(a => a.id === activeAccountId) || null, [accounts, activeAccountId]);

    useEffect(() => {
        if (!activeAccount?.address || typeof window === 'undefined') return;
        try {
            const url = new URL(window.location.href);
            if (url.searchParams.get('mailbox') !== activeAccount.address) {
                url.searchParams.set('mailbox', activeAccount.address);
                window.history.replaceState(null, '', url.toString());
            }
        } catch {}
    }, [activeAccount?.address]);

    const persist = useCallback((items: Mailbox[]) => {
        try {
            const safeItems = items.map((account: any) => {
                const {
                    password: _p,
                    token: _t,
                    sid_token: _st,
                    auth: _au,
                    headers: _h,
                    credentials: _c,
                    ...safeAccount
                } = account;
                return safeAccount as Mailbox;
            });
            if (safeItems.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(safeItems)); else localStorage.removeItem(STORAGE_KEY);
        } catch {}
    }, []);

    const getMagicUrl = useCallback((address?: string) => {
        const targetAddress = address || activeAccount?.address;
        if (!targetAddress || typeof window === 'undefined') return '';
        const url = new URL(window.location.href);
        url.searchParams.set('mailbox', targetAddress);
        return url.toString();
    }, [activeAccount?.address]);

    const createQuickAccount = useCallback(async (_skipCreditCheck = false) => {
        if (isCreatingRef.current || accounts.length >= MAX_ACTIVE_ACCOUNTS) return { success: false, reason: accounts.length >= MAX_ACTIVE_ACCOUNTS ? 'capacity' : 'busy' };
        isCreatingRef.current = true;
        if (mountedRef.current) setIsLoadingAccount(true);
        try {
            const generated = await generateMailbox();
            if (!generated?.address || generated.id === 'error') throw new Error('Connection failed');
            const newMailbox: Mailbox = { ...generated, createdAt: Date.now() };
            if (newMailbox.password) storeCredentials(newMailbox.id, newMailbox.address, newMailbox.password);
            if (mountedRef.current) {
                setAccounts(prev => { const updated = [newMailbox, ...prev].slice(0, MAX_ACTIVE_ACCOUNTS); persist(updated); return updated; });
                setActiveAccountId(newMailbox.id);
            }
            return { success: true };
        } catch (e) {
            console.error('Account creation failed:', e);
            return { success: false, reason: 'error' };
        } finally {
            if (mountedRef.current) setIsLoadingAccount(false);
            isCreatingRef.current = false;
        }
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
                const normalizedTarget = targetMailbox.toLowerCase();
                const targetUser = normalizedTarget.split('@')[0];
                const exactMatch = validAccounts.find(a => a.address.toLowerCase() === normalizedTarget);
                const aliasMatch = !exactMatch
                    ? validAccounts.find(a => a.apiBase === 'guerrilla' && a.address.split('@')[0].toLowerCase() === targetUser)
                    : undefined;
                const existing = exactMatch || aliasMatch;
                if (existing) {
                    if (!cancelled) {
                        setAccounts(validAccounts);
                        setActiveAccountId(existing.id);
                        isFirstLoadRef.current = false;
                    }
                    return;
                }
                const [username, ...domainParts] = targetMailbox.split('@');
                const domain = domainParts.join('@').toLowerCase();
                if (username && domain) {
                    if (!cancelled) setIsLoadingAccount(true);
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
            if (validAccounts.length) {
                if (!cancelled) {
                    setAccounts(validAccounts);
                    setActiveAccountId(prev => prev && validAccounts.some(a => a.id === prev) ? prev : validAccounts[0].id);
                    isFirstLoadRef.current = false;
                }
                return;
            }
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
        const unsubscribe = onTokenRefresh((mailboxId: string, newToken: string) => {
            if (!mountedRef.current) return;
            setAccounts(prev => { const updated = prev.map(a => a.id === mailboxId ? { ...a, token: newToken } : a); persist(updated); return updated; });
        });
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
                return filtered;
            });
        }, 10000);
        return () => window.clearInterval(interval);
    }, [persist]);

    useEffect(() => {
        if (activeAccountId && accounts.length > 0 && !accounts.some(a => a.id === activeAccountId)) {
            setActiveAccountId(accounts[0]?.id || null);
        } else if (accounts.length === 0 && activeAccountId !== null) {
            setActiveAccountId(null);
        }
    }, [accounts, activeAccountId]);

    const handleCreateCustom = useCallback(async (username: string, domain: string, apiBase: string) => {
        if (!username || !domain || accounts.length >= MAX_ACTIVE_ACCOUNTS) return { success: false, reason: 'capacity' };
        if (mountedRef.current) setIsLoadingAccount(true);
        try {
            const created = await createCustomMailbox(username, domain, apiBase);
            if (!created?.address || created.id === 'error') throw new Error('Connection failed');
            const newMailbox: Mailbox = { ...created, createdAt: Date.now() };
            if (newMailbox.password) storeCredentials(newMailbox.id, newMailbox.address, newMailbox.password);
            if (mountedRef.current) {
                setAccounts(prev => { const updated = [newMailbox, ...prev].slice(0, MAX_ACTIVE_ACCOUNTS); persist(updated); return updated; });
                setActiveAccountId(newMailbox.id);
            }
            return { success: true };
        } catch (e: any) { const msg = String(e?.message || '').toLowerCase(); return { success: false, reason: msg.includes('taken') || msg.includes('alınmış') ? 'taken' : 'error' }; }
        finally { if (mountedRef.current) setIsLoadingAccount(false); }
    }, [accounts.length, persist]);

    const deleteAccount = useCallback((id: string) => {
        clearCredentials(id);
        setAccounts(prev => { const updated = prev.filter(a => a.id !== id); persist(updated); return updated; });
        if (activeAccountId === id) setActiveAccountId(accounts.find(a => a.id !== id)?.id || null);
    }, [accounts, activeAccountId, persist]);
    const updateAccountLabel = useCallback((id: string, label: string, labelColor: string) => setAccounts(prev => prev.map(a => a.id === id ? { ...a, label, labelColor } : a)), []);
    const setAutoDelete = useCallback((id: string, minutes: number | undefined) => setAccounts(prev => prev.map(a => a.id === id ? { ...a, autoDeleteMinutes: minutes, createdAt: a.createdAt || Date.now() } : a)), []);
    const bulkCopyAddresses = useCallback(() => { const addresses = accounts.map(a => a.address).join('\n'); navigator.clipboard?.writeText(addresses).catch(() => {}); return addresses; }, [accounts]);
    const addCustomAccount = useCallback((mailbox: Mailbox) => {
        if (mailbox.password) storeCredentials(mailbox.id, mailbox.address, mailbox.password);
        setAccounts(prev => { const updated = [mailbox, ...prev].slice(0, MAX_ACTIVE_ACCOUNTS); persist(updated); return updated; });
    }, [persist]);

    const changeDomain = useCallback(async (newDomain: string) => {
        if (!activeAccount || !newDomain) return { success: false };
        const username = activeAccount.address.split('@')[0];
        if (activeAccount.address.split('@')[1]?.toLowerCase() === newDomain.toLowerCase()) return { success: true, address: activeAccount.address };
        if (mountedRef.current) setIsLoadingAccount(true);
        try {
            const domainRes = await fetchDomains();
            const provider = domainRes?.domainProviderMap?.[newDomain] || 'guerrilla';
            const created = await createCustomMailbox(username, newDomain, provider);
            if (!created?.address || created.id === 'error') throw new Error('Mailbox creation failed');
            const mailboxWithDate: Mailbox = { ...created, createdAt: Date.now() };
            if (mailboxWithDate.password) storeCredentials(mailboxWithDate.id, mailboxWithDate.address, mailboxWithDate.password);
            if (mountedRef.current) {
                setAccounts(prev => { const updated = [mailboxWithDate, ...prev]; persist(updated); return updated; });
                setActiveAccountId(mailboxWithDate.id);
            }
            return { success: true, address: mailboxWithDate.address };
        } catch (err) { console.error('Failed to change domain:', err); return { success: false }; }
        finally { if (mountedRef.current) setIsLoadingAccount(false); }
    }, [activeAccount, persist]);

    return { accounts, activeAccount, activeAccountId, isLoadingAccount, setActiveAccountId, createQuickAccount, handleCreateCustom, changeDomain, deleteAccount, updateAccountLabel, setAutoDelete, bulkCopyAddresses, addCustomAccount, getMagicUrl, MAX_ACTIVE_ACCOUNTS };
}