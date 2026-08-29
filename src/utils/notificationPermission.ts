const NOTIFICATION_PROMPTED_KEY = 'mephisto_notification_prompted_v1';

/** Request permission only after a user gesture, never on initial page load. */
export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    const permission = await Notification.requestPermission();
    try { localStorage.setItem(NOTIFICATION_PROMPTED_KEY, 'true'); } catch { /* storage may be unavailable */ }
    return permission;
  } catch {
    return Notification.permission;
  }
};

export const notificationPermissionState = (): NotificationPermission | 'unsupported' => {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
};

export const hasNotificationPromptBeenShown = (): boolean => {
  try { return localStorage.getItem(NOTIFICATION_PROMPTED_KEY) === 'true'; } catch { return false; }
};
