/* TrafficIQ — enter-traffic.js
   City-aware live traffic room — Firestore + Realtime DB
   Collection: enter_traffic_messages (filtered by city field)
   ─────────────────────────────────── */
'use strict';

/* ══ THREE.JS HIGHWAY BACKGROUND ══ */
(function initBG() {
  const canvas = document.getElementById('bg');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: { value: 0 }, uDark: { value: 1 } },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uDark;
      varying vec2 vUv;

      float grid(vec2 uv, float spacing, float thickness) {
        vec2 g = abs(fract(uv / spacing - .5) - .5) / fwidth(uv / spacing);
        return 1.0 - min(min(g.x, g.y), 1.0) * thickness;
      }
      float road(float coord, float pos, float w) {
        return smoothstep(w, w * .4, abs(coord - pos));
      }
      float streak(vec2 uv, float roadY, float offset, float speed, float len) {
        float x = fract(uv.x * .6 + uTime * speed + offset);
        float onRoad = road(uv.y, roadY, 0.006);
        float trail = smoothstep(len, 0.0, x) * smoothstep(0.0, 0.01, x);
        return trail * onRoad;
      }

      void main() {
        vec2 uv = vUv;
        vec3 darkBg  = vec3(0.016, 0.031, 0.082);
        vec3 lightBg = vec3(0.906, 0.937, 0.980);
        vec3 bg = mix(lightBg, darkBg, uDark);

        float g = grid(uv * vec2(6.0, 4.0), 1.0, 1.8);
        vec3 gridClr = mix(vec3(0.85, 0.88, 0.92), vec3(0.06, 0.12, 0.22), uDark);
        vec3 col = mix(bg, gridClr, g * mix(0.25, 0.12, uDark));

        float r1 = road(uv.y, 0.25, 0.018);
        float r2 = road(uv.y, 0.50, 0.022);
        float r3 = road(uv.y, 0.75, 0.018);
        float rv1 = road(uv.x, 0.33, 0.016);
        float rv2 = road(uv.x, 0.66, 0.016);

        vec3 roadClr = mix(vec3(0.78, 0.82, 0.88), vec3(0.08, 0.14, 0.28), uDark);
        float roads = max(max(r1, r2), max(r3, max(rv1, rv2)));
        col = mix(col, roadClr, roads);

        float hy1 = road(uv.y, 0.50, 0.002);
        col = mix(col, vec3(1.0, 0.85, 0.15), hy1 * .55 * uDark);

        float s1 = streak(uv, 0.498, 0.0,  0.18, 0.08);
        float s2 = streak(uv, 0.502, 0.3,  0.14, 0.06);
        vec2 flip = vec2(1.0 - uv.x, uv.y);
        float s3 = streak(flip, 0.495, 0.1, 0.22, 0.07);
        float s4 = streak(flip, 0.505, 0.6, 0.17, 0.05);
        float s5 = streak(uv, 0.252, 0.2,  0.13, 0.06);
        float s6 = streak(uv, 0.748, 0.5,  0.16, 0.07);
        float s7 = streak(flip, 0.748, 0.4, 0.19, 0.06);

        col += vec3(0.9, 0.15, 0.1)  * (s1 + s2) * uDark;
        col += vec3(0.85, 0.90, 1.0) * (s3 + s4) * uDark;
        col += vec3(1.0, 0.80, 0.2)  * (s5 + s6 + s7) * uDark;
        col += vec3(0.15, 0.35, 0.9) * (s1+s2+s3+s4+s5+s6+s7) * (1.0-uDark) * .25;

        float ix1 = smoothstep(.04, .0, length(uv - vec2(.33, .50)));
        float ix2 = smoothstep(.04, .0, length(uv - vec2(.66, .50)));
        float ix3 = smoothstep(.035,.0, length(uv - vec2(.33, .25)));
        float ix4 = smoothstep(.035,.0, length(uv - vec2(.66, .75)));
        float ixAll = max(max(ix1,ix2),max(ix3,ix4));
        col += vec3(0.0, 0.75, 1.0) * ixAll * 0.18 * uDark;
        col += vec3(0.1, 0.4, 0.9)  * ixAll * 0.10 * (1.0-uDark);

        float v = length(uv - .5) * 1.2;
        col *= 1.0 - v * v * mix(.2, .5, uDark);

        gl_FragColor = vec4(col, mix(.22, .72, uDark));
      }
    `,
  });

  const geo = new THREE.PlaneGeometry(2, 2);
  scene.add(new THREE.Mesh(geo, mat));

  let t = 0;
  (function tick() {
    requestAnimationFrame(tick);
    t += 0.008;
    mat.uniforms.uTime.value = t;
    renderer.render(scene, camera);
  })();

  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); });
  window._bgMat = mat;
})();


/* ══ VALID CITIES ══ */
const VALID_CITIES = [
  'Bhimavaram Railway Station',
  'Government Hospital',
  'RTC Bus Stand',
  'Sagi Ramakrishnam Raju Engineering College',
  'Vishnu College',
];

function resolveCity(raw) {
  if (!raw) return null;
  const cleaned = String(raw).trim();
  if (VALID_CITIES.includes(cleaned)) return cleaned;
  const lower = cleaned.toLowerCase();
  const found = VALID_CITIES.find(c => c.toLowerCase() === lower);
  if (found) return found;
  const partial = VALID_CITIES.find(c =>
    c.toLowerCase().startsWith(lower.substring(0, 12)) ||
    lower.startsWith(c.toLowerCase().substring(0, 12))
  );
  return partial || null;
}

/* ══ STATE ══ */
const S = {
  theme: localStorage.getItem('tiq-theme') || 'dark',
  city: (function () {
    const urlParam = new URLSearchParams(location.search).get('city');
    const fromUrl  = resolveCity(urlParam);
    if (fromUrl) {
      localStorage.setItem('tiq-city', fromUrl);
      return fromUrl;
    }
    const stored  = localStorage.getItem('tiq-city');
    const fromLS  = resolveCity(stored);
    if (fromLS) return fromLS;
    console.warn('[TrafficIQ] Could not resolve city from URL or localStorage. Using default.');
    return 'Bhimavaram Railway Station';
  })(),
  name: localStorage.getItem('tiq-name') || 'You',
  get email() { return (firebase.auth().currentUser || {}).email || ''; },
  _unsubMessages: null,

  /*
    likedKeys stores "authorName__msgId" strings so we know:
    - which specific message the user liked (to show liked state on the button)
    - prevents double-liking the same message
  */
  likedKeys: new Set(JSON.parse(localStorage.getItem('tiq-liked-keys') || '[]')),
};

function persistLiked() {
  localStorage.setItem('tiq-liked-keys', JSON.stringify([...S.likedKeys]));
}

/* ══ THEME ══ */
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('themeBtn').textContent = t === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('tiq-theme', S.theme = t);
  if (window._bgMat) window._bgMat.uniforms.uDark.value = t === 'dark' ? 1 : 0;
}
setTheme(S.theme);
document.getElementById('themeBtn').addEventListener('click', () =>
  setTheme(S.theme === 'dark' ? 'light' : 'dark')
);

/* ══ SET CITY IN HEADER ══ */
document.getElementById('tbCity').textContent = S.city;


/* ══ CHAT FEED ══ */
const feed      = document.getElementById('feed');
const scrollBtn = document.getElementById('scrollBtn');
let userScrolled = false;

feed.addEventListener('scroll', () => {
  const atBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 40;
  userScrolled = !atBottom;
  scrollBtn.classList.toggle('show', userScrolled);
});

function scrollToBottom() {
  feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
  userScrolled = false;
  scrollBtn.classList.remove('show');
}

function timeStr(timestamp) {
  const n = timestamp ? timestamp.toDate() : new Date();
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

const renderedIds  = new Set();
const likeListeners = {}; // keyed by msgId (not authorName) for per-message counts

/* ══ LIKE A MESSAGE ══
   Dual-collection structure:
   ─────────────────────────────────────────────────────────
   messageLikeCounts/{msgId}
     likeCount: 3              ← per-message like count (shown on button)

   message_likes/{authorName}
     authorName: "Driver_484"
     likeCount:  7             ← leaderboard total (all messages, all pages)
     lastUpdated: timestamp
     likers/
       "{liker}__{msgId}": { likedAt, liker, msgId, page }
   ─────────────────────────────────────────────────────────
   Key insight:
   - Like button shows count from messageLikeCounts/{msgId}
   - Leaderboard reads message_likes/{authorName}.likeCount
   - Both are incremented atomically on each like action
══ */
function likeMessage(msgId, authorName, btnEl) {
  if (!window._db) return;

  // Unique key = who liked + which message
  const likeKey = S.name + '__' + msgId;
  if (S.likedKeys.has(likeKey)) return; // already liked this specific message

  // Can't like your own messages
  if (authorName === S.name) {
    gsap.fromTo(btnEl, { x: -4 }, { x: 0, duration: .3, ease: 'elastic.out(1,.4)', clearProps: 'x' });
    return;
  }

  // Safe doc ID for the liker sub-collection: "{liker}__{msgId}"
  const safeKey = (S.name + '__' + msgId).replace(/[^a-zA-Z0-9_\-]/g, '_');

  // ── Collection refs ──
  // Per-message like count (shown on the like button)
  const msgLikeCountRef = window._db.collection('messageLikeCounts').doc(msgId);

  // Per-author leaderboard doc (total likes across all pages)
  const authorDocRef = window._db.collection('message_likes').doc(authorName);

  // Sub-doc that prevents double-liking this specific message
  const likerRef = authorDocRef.collection('likers').doc(safeKey);

  // ── Optimistic UI update ──
  S.likedKeys.add(likeKey);
  persistLiked();
  btnEl.classList.add('liked');
  btnEl.disabled = true;
  const countEl = btnEl.querySelector('.like-count');
  if (countEl) countEl.textContent = parseInt(countEl.textContent || '0') + 1;
  gsap.fromTo(btnEl, { scale: 1.4 }, { scale: 1, duration: .4, ease: 'back.out(2)' });

  // ── Write to Firestore ──
  // Step 1: Record that this liker liked this specific message (idempotency guard)
  likerRef.set({
    likedAt: firebase.firestore.FieldValue.serverTimestamp(),
    liker:   S.name,
    msgId:   msgId,
    page:    'enter-traffic',
  })
  .then(() => {
    // Step 2a: Increment per-message like count (drives the like button UI)
    const p1 = msgLikeCountRef.set({
      likeCount:   firebase.firestore.FieldValue.increment(1),
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Step 2b: Increment author's leaderboard total (drives the leaderboard)
    const p2 = authorDocRef.set({
      authorName:  authorName,
      likeCount:   firebase.firestore.FieldValue.increment(1),
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return Promise.all([p1, p2]);
  })
  .then(() => {
    console.log('[TrafficIQ] ✅ Like saved. msgId:', msgId, '| authorName:', authorName);
  })
  .catch(err => {
    console.error('[TrafficIQ] Like failed:', err);
    // Rollback optimistic update
    S.likedKeys.delete(likeKey);
    persistLiked();
    btnEl.classList.remove('liked');
    btnEl.disabled = false;
    if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || '1') - 1);
  });
}

/* ══ SUBSCRIBE TO LIVE LIKE COUNT for a specific message ══
   Listens to messageLikeCounts/{msgId} so the button shows
   the count for THIS message only (not the author's total).

   Previously this listened to message_likes/{authorName} which
   caused all messages from the same author to show the same
   aggregated count — now each message has its own counter.
══ */
function subscribeLikes(msgId, btnEl) {
  if (!likeListeners[msgId]) {
    likeListeners[msgId] = {
      unsub: window._db.collection('messageLikeCounts').doc(msgId)
        .onSnapshot(snap => {
          const count = snap.exists ? (snap.data().likeCount || 0) : 0;
          if (likeListeners[msgId]) {
            likeListeners[msgId].btns.forEach(b => {
              const c = b.querySelector('.like-count');
              // Only update if button is not in optimistic-liked state to avoid flicker
              if (c && !b.classList.contains('liked')) {
                c.textContent = count;
              } else if (c && b.classList.contains('liked')) {
                // Show at least the server count (may be higher from others liking concurrently)
                const current = parseInt(c.textContent || '0');
                if (count > current) c.textContent = count;
              }
            });
          }
        }),
      btns: [],
    };
  }
  likeListeners[msgId].btns.push(btnEl);
}

/* ══ ADD MESSAGE TO FEED ══ */
function addMsg({ id, name, role, score, init, msg, timestamp, own = false }) {
  if (id && renderedIds.has(id)) return;
  if (id) renderedIds.add(id);

  const el = document.createElement('div');
  el.className = `msg${own ? ' own' : ''}`;

  const roleLabel    = { g: '✓ Verified', b: 'Active User', r: '⚠ Flagged' };
  const initials     = init || (name || 'UN').substring(0, 2).toUpperCase();
  const isTemp       = !id || id.startsWith('temp-');
  const likeKey      = S.name + '__' + id;
  const alreadyLiked = id && S.likedKeys.has(likeKey);
  const isOwnMsg     = name === S.name;

  el.innerHTML = `
    <div class="av ${role || 'b'}" data-tip="${name} · ${score}/100 · ${roleLabel[role] || 'Active User'}">${initials}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-name">${name}</span>
        <span class="msg-score">${score}</span>
        <span class="msg-time">${timeStr(timestamp)}</span>
      </div>
      <div class="bubble">${msg}</div>
      ${!isTemp ? `
      <div class="like-row">
        <button
          class="like-btn${alreadyLiked ? ' liked' : ''}${isOwnMsg ? ' own-msg' : ''}"
          title="${isOwnMsg ? "Can't like your own message" : alreadyLiked ? 'Already liked' : 'Like this report'}"
          ${alreadyLiked || isOwnMsg ? 'disabled' : ''}
        >
          <svg class="like-ico" viewBox="0 0 24 24" fill="${alreadyLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          <span class="like-count">0</span>
        </button>
        ${alreadyLiked ? '<span class="liked-label">Liked ✓</span>' : ''}
      </div>` : ''}
    </div>`;

  feed.appendChild(el);

  if (!isTemp) {
    const btn = el.querySelector('.like-btn');
    if (btn && !isOwnMsg && !alreadyLiked) {
      btn.addEventListener('click', () => likeMessage(id, name, btn));
    }
    // Subscribe to per-message like count (keyed by msgId, not authorName)
    if (btn) subscribeLikes(id, btn);
  }

  if (!userScrolled) scrollToBottom();
  else scrollBtn.classList.add('show');
}

/* ══ OPTIMISTIC MESSAGE ══ */
function addMsgOptimistic(name, msg) {
  const tempId = 'temp-' + Date.now();
  renderedIds.add(tempId);
  addMsg({
    id:        tempId,
    name:      name,
    role:      'b',
    score:     75,
    init:      name.substring(0, 2).toUpperCase(),
    msg:       msg,
    timestamp: null,
    own:       true,
  });
}

/* ══ TRIGGER ══ */
function trigFill(btn) {
  const inp = document.getElementById('chatInp');
  inp.value = btn.dataset.msg;
  inp.focus();
  gsap.fromTo(btn, { scale: .9 }, { scale: 1, duration: .3, ease: 'back.out(2)' });
}

/* ══ SEND ══ */
function sendMsg() {
  const inp = document.getElementById('chatInp');
  const txt = inp.value.trim();
  if (!txt) return;

  inp.value = '';
  gsap.fromTo('.send-btn', { scale: .88 }, { scale: 1, duration: .28, ease: 'back.out(2)' });

  addMsgOptimistic(S.name, txt);

  if (window._db) {
    window._db.collection('enter_traffic_messages').add({
      name:      S.name,
      role:      'b',
      score:     75,
      msg:       txt,
      city:      S.city,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    }).catch(err => console.error('Send failed:', err));

    window._db.collection('places').doc(S.city)
      .update({
        totalReports:  firebase.firestore.FieldValue.increment(1),
        lastReportAt:  firebase.firestore.FieldValue.serverTimestamp(),
        currentStatus: 'Active',
      })
      .catch(() => {
        window._db.collection('places').doc(S.city).set({
          name:          S.city,
          totalReports:  1,
          lastReportAt:  firebase.firestore.FieldValue.serverTimestamp(),
          currentStatus: 'Active',
          isActive:      true,
        }, { merge: true });
      });
  }
}

document.getElementById('chatInp').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMsg();
});

/* ══ MOBILE PANEL ══ */
const panel   = document.getElementById('panel');
const overlay = document.getElementById('mobOverlay');
function togglePanel() {
  panel.classList.toggle('open');
  overlay.classList.toggle('show');
}
document.getElementById('panTog').addEventListener('click', togglePanel);

/* ══ GSAP ENTRANCE ══ */
window.addEventListener('DOMContentLoaded', () => {
  gsap.to('#topbar', { y: 0, opacity: 1, duration: .6,  ease: 'power3.out', delay: .1  });
  gsap.to('#panel',  { x: 0, opacity: 1, duration: .75, ease: 'power3.out', delay: .25 });
  const streamEl = document.querySelector('.stream');
  if (streamEl) gsap.from(streamEl, { opacity: 0, duration: .5, ease: 'power2.out', delay: .35 });
});

/* ══ ISSUE KEYWORD DETECTOR ══ */
function detectIssueType(msg) {
  const t = (msg || '').toLowerCase();
  if (/accident|crash|collide|collision|smash|heavy traffic|30\+\s*min|30\s*\+\s*min delay/.test(t)) return 'accident';
  if (/road work|construction|repair|digging|pothole|roadwork|avoid flyover|flyover|completely jammed|jammed/.test(t)) return 'construction';
  if (/breakdown|broke down|stalled|tow|puncture|flat tyre|flat tire|truck breakdown|single lane/.test(t)) return 'breakdown';
  return null;
}

const ISSUE_DEFS = {
  accident:     { ico: '🚗', label: 'Accident',          color: 'var(--cr)', sev: 'SEVERE',   sevCls: 'cr' },
  construction: { ico: '🚧', label: 'Road Construction', color: 'var(--ca)', sev: 'MODERATE', sevCls: 'ca' },
  breakdown:    { ico: '🚛', label: 'Breakdown',         color: 'var(--cr)', sev: 'HIGH',     sevCls: 'cr' },
};

/* ══ LEFT PANEL RENDERER ══ */
function renderIssuePanel(issueCounts) {
  const container = document.querySelector('.panel-inner');
  container.querySelectorAll('.issue-card, .no-issues-msg').forEach(el => el.remove());

  const totalIssues = Object.values(issueCounts).reduce((a, b) => a + b, 0);

  if (totalIssues === 0) {
    const empty = document.createElement('div');
    empty.className = 'no-issues-msg';
    empty.style.cssText = [
      'text-align:center', 'padding:24px 12px', 'font-size:.75rem',
      'color:var(--sub)', 'line-height:1.7', 'border:1px dashed var(--bdr)',
      'border-radius:var(--r)', 'background:var(--card)',
    ].join(';');
    empty.innerHTML = `
      <div style="font-size:1.8rem;margin-bottom:8px">✅</div>
      <strong style="color:var(--cg);font-size:.78rem">No major issues</strong><br>
      Roads are clear at<br><em style="color:var(--c)">${S.city}</em><br>
      <span style="font-size:.68rem;opacity:.7;margin-top:6px;display:block">
        Issues appear here when<br>reporters mention accidents,<br>breakdowns or roadblocks.
      </span>`;
    container.appendChild(empty);
    return;
  }

  Object.keys(ISSUE_DEFS).forEach(function (key) {
    const count = issueCounts[key] || 0;
    if (count === 0) return;
    const def = ISSUE_DEFS[key];
    const pct = Math.min(15 + count * 10, 98);
    const card = document.createElement('div');
    card.className    = 'issue-card';
    card.dataset.type = key;
    card.innerHTML = `
      <div class="ic-top">
        <span class="ic-ico">${def.ico}</span>
        <div class="ic-info">
          <span class="ic-type">${def.label}</span>
          <span class="ic-loc">${count} unique reporter${count !== 1 ? 's' : ''}</span>
        </div>
        <span class="ic-pulse" style="background:${def.color};box-shadow:0 0 8px ${def.color}"></span>
      </div>
      <div class="ic-tags">
        <span class="tag ${def.sevCls === 'cr' ? 'red' : 'amber'}">${count} User${count !== 1 ? 's' : ''}</span>
        <span class="tag green">Live</span>
      </div>
      <div class="sev-row">
        <div class="sev-bar">
          <div class="sev-fill" style="width:${pct}%;background:${def.color}"></div>
        </div>
        <span class="sev-txt ${def.sevCls}">${def.sev}</span>
      </div>`;
    container.appendChild(card);
    gsap.fromTo(card, { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: .4, ease: 'power2.out' });
  });
}

/* ══ ATTACH CITY LISTENERS ══ */
function attachCityListeners(db, rdb, cityName) {
  console.log('[TrafficIQ] Loading traffic room for city:', JSON.stringify(cityName));
  document.getElementById('tbCity').textContent = cityName;

  if (S._unsubMessages) { S._unsubMessages(); S._unsubMessages = null; }

  // Unsubscribe all per-message like listeners from previous city session
  Object.values(likeListeners).forEach(obj => obj.unsub && obj.unsub());
  for (const k in likeListeners) delete likeListeners[k];

  feed.innerHTML = '';
  renderedIds.clear();

  /* ── PRESENCE ── */
  const presencePath = rdb.ref('presence/' + S.name.replace(/[.#$\[\]]/g, '_'));
  presencePath.set({ name: S.name, city: cityName, online: true });
  presencePath.onDisconnect().remove();

  rdb.ref('presence').on('value', function (snap) {
    let count = 0;
    snap.forEach(child => { if (child.val().city === cityName) count++; });
    document.getElementById('tbOnline').textContent = count;
  });

  /* ── MESSAGES ── */
  const query = db.collection('enter_traffic_messages')
    .where('city', '==', cityName)
    .orderBy('timestamp', 'asc');

  S._unsubMessages = query.onSnapshot(function (snapshot) {
    const issueUsers    = { accident: new Set(), construction: new Set(), breakdown: new Set() };
    const uniqueSenders = new Set();

    snapshot.forEach(function (doc) {
      const d = doc.data();
      if (d.city && d.city !== cityName) return;
      const name = (d.name || 'unknown').trim();
      uniqueSenders.add(name);
      const type = detectIssueType(d.msg || '');
      if (type && issueUsers[type] !== undefined) issueUsers[type].add(name);
    });

    document.getElementById('tbRep').textContent = uniqueSenders.size;
    renderIssuePanel({
      accident:     issueUsers.accident.size,
      construction: issueUsers.construction.size,
      breakdown:    issueUsers.breakdown.size,
    });

    snapshot.docChanges().forEach(function (change) {
      if (change.type !== 'added') return;
      const d  = change.doc.data();
      const id = change.doc.id;

      if (d.city && d.city !== cityName) return;

      if (d.name === S.name) {
        feed.querySelectorAll('[data-msg-id^="temp-"]').forEach(el => {
          const bubble = el.querySelector('.bubble');
          if (bubble && bubble.textContent === d.msg) el.remove();
        });
      }

      addMsg({
        id:        id,
        name:      d.name      || 'Unknown',
        role:      d.role      || 'b',
        score:     d.score     || 0,
        init:      (d.name || 'UN').substring(0, 2).toUpperCase(),
        msg:       d.msg       || '',
        timestamp: d.timestamp || null,
        own:       d.name === S.name,
      });
    });

  }, function (err) {
    console.error('enter_traffic_messages error:', err);
    if (err.code === 'failed-precondition') {
      const div = document.createElement('div');
      div.style.cssText = 'padding:12px 18px;font-size:.75rem;color:var(--ca);text-align:center;';
      div.textContent = '⚠️ Firestore index needed — check browser console for setup link.';
      feed.appendChild(div);
    }
  });
}

/* ══ WAIT FOR FIREBASE THEN INIT ══ */
function waitForDB(cb, tries) {
  tries = tries || 0;
  if (window._db && window._rdb) { cb(window._db, window._rdb); return; }
  if (tries > 50) { console.warn('Firebase not available'); return; }
  setTimeout(function () { waitForDB(cb, tries + 1); }, 100);
}

waitForDB(function (db, rdb) {
  attachCityListeners(db, rdb, S.city);
});