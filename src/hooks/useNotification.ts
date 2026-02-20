import { useEffect, useCallback, useState } from 'react';

export function useNotification() {
    const [permission, setPermission] = useState<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

    const requestPermission = useCallback(async () => {
        if (typeof Notification === 'undefined') return;
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
        } catch {
            // Safari eski sürümleri
        }
    }, []);

    useEffect(() => {
        if (permission === 'default') {
            // İlk email geldiğinde soracağız
        }
    }, [permission]);

    const notify = useCallback((title: string, body: string, icon?: string) => {
        if (permission !== 'granted') return;
        try {
            new Notification(title, { body, icon: icon || '/logo.svg' });
        } catch { /* */ }
    }, [permission]);

    return { permission, requestPermission, notify };
}
