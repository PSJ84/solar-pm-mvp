importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'FIREBASE_API_KEY_PLACEHOLDER',
  authDomain: 'PROJECT_ID.firebaseapp.com',
  projectId: 'PROJECT_ID_PLACEHOLDER',
  messagingSenderId: 'SENDER_ID_PLACEHOLDER',
  appId: 'APP_ID_PLACEHOLDER',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: payload.data?.taskId || 'default',
  });
});
