importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAKGbbt_ARGWep8ggPuk_iE6R1xALkmJM8",
  authDomain: "trafficiq-3ef14.firebaseapp.com",
  projectId: "trafficiq-3ef14",
  messagingSenderId: "97313655693",
  appId: "1:97313655693:web:fee4304d7815bdceaf0bc4"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon.png"
  });
});