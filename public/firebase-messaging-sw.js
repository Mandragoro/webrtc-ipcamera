/* eslint-disable no-restricted-globals */
/* eslint-env serviceworker */
/* global firebase */

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/8.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.0.0/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "AIzaSyDMJJHrTZUEZZLV74_WG1M5SBflQDftY2I",
  authDomain: "android-ipcamera.firebaseapp.com",
  databaseURL: "https://android-ipcamera.firebaseio.com",
  projectId: "android-ipcamera",
  storageBucket: "android-ipcamera.appspot.com",
  messagingSenderId: "280857518166",
  appId: "1:280857518166:web:169cce4745a0b5e6475bf7"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.data.title;
  const notificationOptions = {
    body: payload.data.body,
    icon: payload.data.icon,
    badge: payload.data.badge,
    data: payload.data.click_action,
    image: payload.data.image,
    tag: payload.data.tag,
  };

  self.addEventListener('notificationclick', function(event) {
    // console.log(event)
    event.notification.close();
    // if (event.action === 'archive') {
    //   // Archive action was clicked
    //   archiveEmail();
    // } else {
    //   // Main body of notification was clicked
    //   clients.openWindow('/orders');
    // }
    clients.openWindow('/#');
  }, false);

  return self.registration.showNotification(notificationTitle, notificationOptions);

});