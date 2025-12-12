'use client';

import { useEffect, useState } from 'react';
import { onForegroundMessage, requestNotificationPermission } from '@/lib/firebase';

type PushNotificationSetupProps = {
  userId?: string;
};

export function PushNotificationSetup({ userId }: PushNotificationSetupProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }

    onForegroundMessage((payload) => {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/icon-192.png',
      });
    });
  }, []);

  const handleEnable = async () => {
    if (!userId) return;

    const token = await requestNotificationPermission();
    if (token) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/push/register-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fcmToken: token,
        }),
      });
      setEnabled(true);
    }
  };

  return (
    <button
      onClick={handleEnable}
      className="flex items-center gap-2 rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600"
    >
      {enabled ? '🔔 알림 활성화됨' : '🔕 푸시 알림 켜기'}
    </button>
  );
}
