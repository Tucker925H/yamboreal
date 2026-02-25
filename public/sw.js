self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Yamboreal', {
      body: data.body || '今すぐ撮影！',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.url || '/' // 通知クリック時の遷移先
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
