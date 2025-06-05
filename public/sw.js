// public/sw.js
self.addEventListener('push', (event) => {
    let data = {}
    if (event.data) {
      data = event.data.json()
    }
  
    const title = data.title || '새로운 알림'
    const options = {
      body: data.body || '내용이 없습니다.',
      icon: data.icon || '/icon-192x192.png',
      data: data.url || '/',
    }
  
    event.waitUntil(
      self.registration.showNotification(title, options)
    )
  })
  
  self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const navigateTo = event.notification.data
  
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === navigateTo && 'focus' in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(navigateTo)
        }
      })
    )
  })
  