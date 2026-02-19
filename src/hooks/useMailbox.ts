import { useState, useCallback, useRef, useEffect } from 'react';
import { Mailbox } from '../types';
import { generateMailbox, createCustomMailbox, fetchDomains, storeCredentials, onTokenRefresh } from '../services/mailService';
import { getCredits } from '../components/RewardedAdModal';

const STORAGE_KEY = 'nexus_accounts_v5';
const MAX_ACTIVE_ACCOUNTS = 100;
const CREDITS_KEY = 'mephisto_credits';
const FREE_CREDITS = 3;

// Kredi yönetimi — hook dışında çalışan yardımcı fonksiyonlar
function consumeOneCredit(): boolean {
    const current = getCredits();
    if (current <= 0) return false;
    localStorage.setItem(CREDITS_KEY, String(current - 1));
    return true;
}

export function useMailbox() {
    const [accounts, setAccounts] = useState<Mailbox[]>([]);
    const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
    const [isLoadingAccount, setIsLoadingAccount] = useState(false);
    const isCreatingRef = useRef(false);
    const isFirstLoadRef = useRef(true);

    const activeAccount = accounts.find(a => a.id === activeAccountId) || null;

    // İlk yüklemede localStorage'dan hesapları geri yükle
    useEffect(() => {
        fetchDomains().catch(err => console.warn('Domain fetch failed:', err));

        // İlk kez gelen kullanıcıya kredi ver
        if (localStorage.getItem(CREDITS_KEY) === null) {
            localStorage.setItem(CREDITS_KEY, String(FREE_CREDITS));
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const now = Date.now();
                    const valid = parsed.filter((a: Mailbox) => {
                        if (!a.createdAt) return true;
                        return now - a.createdAt < 24 * 60 * 60 * 1000;
                    });
                    if (valid.length > 0) {
                        setAccounts(valid);
                        setActiveAccountId(valid[0].id);
                        isFirstLoadRef.current = false;
                        // Re-store credentials for token refresh
                        valid.forEach((a: Mailbox) => {
                            if (a.password && a.id && a.address) {
                                storeCredentials(a.id, a.address, a.password);
                            }
                        });
                        if (valid.length !== parsed.length) {
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
                        }
                        return;
                    }
                }
            } catch { /* parse error */ }
        }
        // Hiç hesap yoksa yeni oluştur (ilk kullanım — ücretsiz)
        createQuickAccount(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Token refresh listener — update token in accounts when auto-refreshed
    useEffect(() => {
        onTokenRefresh((mailboxId: string, newToken: string) => {
            setAccounts(prev => {
                const updated = prev.map(a =>
                    a.id === mailboxId ? { ...a, token: newToken } : a
                );
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });
        });
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

    const createQuickAccount = useCallback(async (skipCreditCheck: boolean = false) => {
        if (isCreatingRef.current || accounts.length >= MAX_ACTIVE_ACCOUNTS) {
            return { success: false, reason: accounts.length >= MAX_ACTIVE_ACCOUNTS ? 'capacity' : 'busy' };
        }

        // Kredi kontrolü
        if (!skipCreditCheck) {
            if (!consumeOneCredit()) {
                return { success: false, reason: 'no_credits' };
            }
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
            if (!skipCreditCheck) {
                const current = getCredits();
                localStorage.setItem(CREDITS_KEY, String(current + 1));
            }
            return { success: false, reason: 'error' };
        } finally {
            setIsLoadingAccount(false);
            isCreatingRef.current = false;
        }
    }, [accounts.length]);

    const handleCreateCustom = useCallback(async (username: string, domain: string, apiBase: string) => {
        if (!consumeOneCredit()) {
            return { success: false, reason: 'no_credits' };
        }

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
            const current = getCredits();
            localStorage.setItem(CREDITS_KEY, String(current + 1));
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
        MAX_ACTIVE_ACCOUNTS,
    };
}
