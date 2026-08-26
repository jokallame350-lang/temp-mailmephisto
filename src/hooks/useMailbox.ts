import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Mailbox } from '../types';
import { generateMailbox, createCustomMailbox, fetchDomains, storeCredentials, onTokenRefresh } from '../services/mailService';

const STORAGE_KEY = 'nexus_accounts_v5';
const MAX_ACTIVE_ACCOUNTS = 100;

export function useMailbox() {
    const [accounts, setAccounts] = useState<Mailbox[]>([]);
    const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
    const [isLoadingAccount, setIsLoadingAccount] = useState(false);
    const isCreatingRef = useRef(false);
    const isFirstLoadRef = useRef(true);

    const activeAccount = useMemo(
        () => accounts.find(a => a.id === activeAccountId) || null,
        [accounts, activeAccountId]
    );

    // Magic URL oluşturucu helper
    const getMagicUrl = useCallback((address?: string) => {
        const targetAddress = address || activeAccount?.address;
        if (!targetAddress || typeof window === 'undefined') return '';
        const url = new URL(window.location.href);
        url.searchParams.set('mailbox', targetAddress);
        return url.toString();
    }, [activeAccount?.address]);

    const createQuickAccount = useCallback(async (skipCreditCheck: boolean = false) => {
        if (isCreatingRef.current || accounts.length >= MAX_ACTIVE_ACCOUNTS) {
            return { success: false, reason: accounts.length >= MAX_ACTIVE_ACCOUNTS ? 'capacity' : 'busy' };
        }

        isCreatingRef.current = true;
        setIsLoadingAccount(true);

        try {
            const newMailbox: Mailbox = { ...await generateMailbox(), createdAt: Date.now() };
            if (!newMailbox || !newMailbox.address || newMailbox.id === 'error') {
                throw new Error('Connection failed');
            }
            // Store credentials for token refresh
            if (newMailbox.password) {
                storeCredentials(newMailbox.id, newMailbox.address, newMailbox.password);
            }
            setAccounts(prev => [newMailbox, ...prev]);
            setActiveAccountId(newMailbox.id);
            return { success: true };
        } catch (e) {
            console.error('Account creation failed:', e);
            return { success: false, reason: 'error' };
        } finally {
            setIsLoadingAccount(false);
            isCreatingRef.current = false;
        }
    }, [accounts.length]);

    // İlk yüklemede localStorage'dan hesapları ve URL param'dan mailbox'ı geri yükle
    useEffect(() => {
        const initMailbox = async () => {
            let domainMap: Record<string, string> = {};
            try {
                const domainRes = await fetchDomains();
                domainMap = domainRes?.domainProviderMap || {};
            } catch (err) {
                console.warn('Domain fetch failed:', err);
            }

            const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
            const targetMailbox = urlParams?.get('mailbox')?.trim();

            const saved = localStorage.getItem(STORAGE_KEY);
            let validAccounts: Mailbox[] = [];
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const now = Date.now();
                        validAccounts = parsed.filter((a: Mailbox) => {
                            if (!a.createdAt) return true;
                            return now - a.createdAt < 24 * 60 * 60 * 1000;
                        });
                        validAccounts.forEach((a: Mailbox) => {
                            if (a.password && a.id && a.address) {
                                storeCredentials(a.id, a.address, a.password);
                            }
                        });
                    }
                } catch { /* parse error */ }
            }

            // URL param ile gelen ?mailbox=xyz@domain.com adresini geri yükle veya oluştur
            if (targetMailbox && targetMailbox.includes('@')) {
                const existing = validAccounts.find(a => a.address.toLowerCase() === targetMailbox.toLowerCase());
                if (existing) {
                    setAccounts(validAccounts);
                    setActiveAccountId(existing.id);
                    isFirstLoadRef.current = false;
                    return;
                } else {
                    const parts = targetMailbox.split('@');
                    const username = parts[0];
                    const domain = parts.slice(1).join('@');
                    if (username && domain) {
                        setIsLoadingAccount(true);
                        try {
                            const provider = domainMap[domain] || 'guerrilla';
                            const newMailbox = await createCustomMailbox(username, domain, provider);
                            const mailboxWithDate: Mailbox = { ...newMailbox, createdAt: Date.now() };
                            if (newMailbox.password) {
                                storeCredentials(newMailbox.id, newMailbox.address, newMailbox.password);
                            }
                            const updated = [mailboxWithDate, ...validAccounts];
                            setAccounts(updated);
                            setActiveAccountId(mailboxWithDate.id);
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                        } catch (err) {
                            console.error('Failed to restore URL mailbox:', err);
                            if (validAccounts.length > 0) {
                                setAccounts(validAccounts);
                                setActiveAccountId(validAccounts[0].id);
                            } else {
                                await createQuickAccount(true);
                            }
                        } finally {
                            setIsLoadingAccount(false);
                            isFirstLoadRef.current = false;
                        }
                        return;
                    }
                }
            }

            if (validAccounts.length > 0) {
                setAccounts(validAccounts);
                setActiveAccountId(validAccounts[0].id);
                isFirstLoadRef.current = false;
                if (validAccounts.length !== (saved ? JSON.parse(saved).length : 0)) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(validAccounts));
                }
                return;
            }

            // Hiç hesap yoksa yeni oluştur (ilk kullanım — ücretsiz)
            await createQuickAccount(true);
            isFirstLoadRef.current = false;
        };

        initMailbox();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Aktif e-posta değiştikçe tarayıcı URL param'ını (?mailbox=xyz@domain.com) senkronize et
    useEffect(() => {
        if (typeof window === 'undefined' || isFirstLoadRef.current) return;
        const url = new URL(window.location.href);
        if (activeAccount?.address) {
            if (url.searchParams.get('mailbox') !== activeAccount.address) {
                url.searchParams.set('mailbox', activeAccount.address);
                window.history.replaceState(null, '', url.toString());
            }
        } else {
            if (url.searchParams.has('mailbox')) {
                url.searchParams.delete('mailbox');
                window.history.replaceState(null, '', url.toString());
            }
        }
    }, [activeAccount?.address]);

    // Token refresh listener — update token in accounts when auto-refreshed
    useEffect(() => {
        const unsubscribe = onTokenRefresh((mailboxId: string, newToken: string) => {
            setAccounts(prev => {
                const updated = prev.map(a =>
                    a.id === mailboxId ? { ...a, token: newToken } : a
                );
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });
        });
        return () => {
            unsubscribe();
        };
    }, []);

    // Hesaplar değiştiğinde localStorage'a kaydet
    useEffect(() => {
        if (accounts.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
        }
    }, [accounts]);

    // Otomatik silme zamanlayıcısı
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setAccounts(prev => {
                const filtered = prev.filter(a => {
                    if (!a.autoDeleteMinutes || !a.createdAt) return true;
                    return now - a.createdAt < a.autoDeleteMinutes * 60 * 1000;
                });
                if (filtered.length !== prev.length) {
                    if (filtered.length === 0) {
                        localStorage.removeItem(STORAGE_KEY);
                        setActiveAccountId(null);
                        setTimeout(() => createQuickAccount(true), 100);
                    } else {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
                        if (!filtered.find(a => a.id === activeAccountId)) {
                            setActiveAccountId(filtered[0].id);
                        }
                    }
                    return filtered;
                }
                return prev;
            });
        }, 10000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeAccountId]);

    const handleCreateCustom = useCallback(async (username: string, domain: string, apiBase: string) => {
        setIsLoadingAccount(true);
        try {
            const newMailbox: Mailbox = { ...await createCustomMailbox(username, domain, apiBase), createdAt: Date.now() };
            if (!newMailbox || newMailbox.id === 'error') {
                throw new Error('Connection failed');
            }
            // Store credentials for token refresh
            if (newMailbox.password) {
                storeCredentials(newMailbox.id, newMailbox.address, newMailbox.password);
            }
            setAccounts(prev => [newMailbox, ...prev]);
            setActiveAccountId(newMailbox.id);
            return { success: true };
        } catch (e: any) {
            const isTaken = e?.message?.includes('alınmış') || e?.message?.includes('taken');
            return { success: false, reason: isTaken ? 'taken' : 'error' };
        } finally {
            setIsLoadingAccount(false);
        }
    }, []);

    const deleteAccount = useCallback((id: string) => {
        const newAccounts = accounts.filter(a => a.id !== id);
        setAccounts(newAccounts);

        if (newAccounts.length > 0) {
            if (activeAccountId === id) {
                setActiveAccountId(newAccounts[0].id);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newAccounts));
        } else {
            localStorage.removeItem(STORAGE_KEY);
            setActiveAccountId(null);
            setTimeout(() => createQuickAccount(false), 100);
        }
    }, [accounts, activeAccountId, createQuickAccount]);

    const updateAccountLabel = useCallback((id: string, label: string, labelColor: string) => {
        setAccounts(prev => prev.map(a => a.id === id ? { ...a, label, labelColor } : a));
    }, []);

    const setAutoDelete = useCallback((id: string, minutes: number | undefined) => {
        setAccounts(prev => prev.map(a => a.id === id ? { ...a, autoDeleteMinutes: minutes, createdAt: a.createdAt || Date.now() } : a));
    }, []);

    const bulkCopyAddresses = useCallback(() => {
        const addresses = accounts.map(a => a.address).join('\n');
        navigator.clipboard.writeText(addresses);
        return addresses;
    }, [accounts]);

    const addCustomAccount = useCallback((mailbox: Mailbox) => {
        setAccounts(prev => [mailbox, ...prev]);
        setActiveAccountId(mailbox.id);
    }, []);

    return {
        accounts,
        activeAccount,
        activeAccountId,
        isLoadingAccount,
        setActiveAccountId,
        createQuickAccount,
        handleCreateCustom,
        deleteAccount,
        updateAccountLabel,
        setAutoDelete,
        bulkCopyAddresses,
        addCustomAccount,
        getMagicUrl,
        MAX_ACTIVE_ACCOUNTS,
    };
}

