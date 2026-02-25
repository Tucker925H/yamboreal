self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    (async () => {
      // 通知受信時に全クライアントへタイムスタンプを送信
      const allClients = await clients.matchAll({ includeUncontrolled: true });
      for (const client of allClients) {
        client.postMessage({ type: 'push-received', timestamp: Date.now() });
      }
      await self.registration.showNotification(data.title || 'Yamboreal', {
        body: data.body || '今すぐ撮影！',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: data.url || '/'
      });
    })()
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
