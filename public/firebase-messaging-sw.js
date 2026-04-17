importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBV1GCeolvn9QbQaVEObQYh4JXxzmRz0fI",
  authDomain: "edusmart-358f2.firebaseapp.com",
  projectId: "edusmart-358f2",
  storageBucket: "edusmart-358f2.appspot.com",
  messagingSenderId: "12407352440",
  appId: "1:12407352440:web:43f5f41022135dfcbd518d",
  measurementId: "G-XLFQLLHJ5H"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // If the payload has a 'notification' object, Firebase automatically shows it.
  // We MUST NOT call showNotification here, otherwise the user gets 2 notifications.
  if (payload.notification) {
    console.log('Notification has a notification payload. Firebase will handle it automatically.');
    return;
  }

  // Fallback for data-only messages
  const notificationTitle = payload.data?.title || 'New Notification';
  
  const baseUrl = self.location.origin;
  const defaultIcon = `${baseUrl}/favicon-cropped.png`;
  const customIcon = payload.data?.icon || defaultIcon;
  
  const notificationOptions = {
    body: payload.data?.body || '',
    icon: customIcon,
    badge: defaultIcon,
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    requireInteraction: true,
    data: {
      url: baseUrl
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      const urlToOpen = event.notification.data?.url || self.location.origin;
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
