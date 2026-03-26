import { useEffect, useCallback, useRef } from 'react';

export function useNotifications() {
  const activeNotifs = useRef(new Map());

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    const result = await Notification.requestPermission();
    return result;
  }, []);

  const showNotification = useCallback((title, body, tag) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    // Close previous with same tag
    if (tag && activeNotifs.current.has(tag)) {
      activeNotifs.current.get(tag).close();
    }

    const notif = new Notification(title, {
      body,
      tag: tag || undefined,
      icon: '/icon.svg',
      badge: '/icon.svg',
    });

    if (tag) activeNotifs.current.set(tag, notif);

    notif.onclose = () => {
      if (tag) activeNotifs.current.delete(tag);
    };

    return notif;
  }, []);

  // Listen for server-sent reminder triggers
  const BASE_URL = import.meta.env.VITE_API_URL || '';
  
  useEffect(() => {
    const es = new EventSource(`${BASE_URL}/api/assistant/triggers`);
    
    es.onmessage = (e) => {
      if (!e.data || e.data.startsWith(':')) return;
      try {
        const { reminder } = JSON.parse(e.data);
        showNotification(
          '⏰ Eslatma',
          reminder.title,
          reminder.id
        );
      } catch {}
    };

    es.onerror = () => {
      // SSE reconnects automatically
    };

    return () => es.close();
  }, [showNotification]);

  return { requestPermission, showNotification };
}
