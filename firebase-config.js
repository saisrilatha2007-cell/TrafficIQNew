import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyAKGbbt_ARGWep8ggPuk_iE6R1xALkmJM8",
  authDomain: "trafficiq-3ef14.firebaseapp.com",
  projectId: "trafficiq-3ef14",
  messagingSenderId: "97313655693",
  appId: "1:97313655693:web:fee4304d7815bdceaf0bc4"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

Notification.requestPermission().then((permission) => {
  if (permission === "granted") {

    getToken(messaging, {
      vapidKey: "BOmLruIptzj7OIqZy6v4YfR54tvk7RYM8k_h7KY5LUias4bRwatlIu0-2dMbsrwrdfZTfJAJyBq9j8puzwk3RbY"
    }).then((token) => {

      console.log("Device Token:", token);

    });

  }
});

onMessage(messaging, (payload) => {
  new Notification(payload.notification.title, {
    body: payload.notification.body
  });
});