importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAKGbbt_ARGWep8ggPuk_iE6R1xALkmJM8",
    authDomain: "trafficiq-3ef14.firebaseapp.com",
    databaseURL: "https://trafficiq-3ef14-default-rtdb.firebaseio.com",
    projectId: "trafficiq-3ef14",
    storageBucket: "trafficiq-3ef14.firebasestorage.app",
    messagingSenderId: "97313655693",
    appId: "1:97313655693:web:fee4304d7815bdceaf0bc4",
    measurementId: "G-N8CC0BE6HS"
});

const messaging = firebase.messaging();

// Background notifications (tab closed or not active)
messaging.onBackgroundMessage(function(payload) {
    console.log('[SW] Background message received:', payload);

    const title = payload.notification?.title || '🚨 Traffic Alert Ahead';
    const body  = payload.notification?.body  || 'There is a traffic issue near you.';

    self.registration.showNotification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
        vibrate: [200, 100, 200],
        tag: 'traffic-alert',
        renotify: true
    });
});