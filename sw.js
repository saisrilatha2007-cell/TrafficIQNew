// ============================================
// sw.js — TrafficIQ Service Worker
// Handles background notifications + actions
// ============================================

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// ── NOTIFICATION CLICK HANDLER ──────────────
self.addEventListener('notificationclick', e => {
  const action   = e.action;
  const data     = e.notification.data || {};
  e.notification.close();

  if (action === 'confirm') {
    // Tell the page to confirm this report
    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
        list.forEach(c => c.postMessage({ type: 'CONFIRM', reportId: data.reportId }));
        if (list.length === 0) clients.openWindow('/traffic-alerts.html');
      })
    );

  } else if (action === 'report_accident') {
    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
        list.forEach(c => c.postMessage({ type: 'QUICK_REPORT', issueType: 'Accident', lat: data.lat, lng: data.lng }));
        if (list.length === 0) clients.openWindow('/traffic-alerts.html');
      })
    );

  } else if (action === 'report_heavy') {
    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
        list.forEach(c => c.postMessage({ type: 'QUICK_REPORT', issueType: 'Heavy Traffic', lat: data.lat, lng: data.lng }));
        if (list.length === 0) clients.openWindow('/traffic-alerts.html');
      })
    );

  } else if (action === 'report_block') {
    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
        list.forEach(c => c.postMessage({ type: 'QUICK_REPORT', issueType: 'Road Block', lat: data.lat, lng: data.lng }));
        if (list.length === 0) clients.openWindow('/traffic-alerts.html');
      })
    );

  } else if (action === 'no_traffic') {
    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
        list.forEach(c => c.postMessage({ type: 'ALL_CLEAR' }));
        if (list.length === 0) clients.openWindow('/traffic-alerts.html');
      })
    );

  } else {
    // Default tap — open the app
    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
        if (list.length > 0) { list[0].focus(); }
        else clients.openWindow('/traffic-alerts.html');
      })
    );
  }
});