/* TrafficIQ — info-passer.js */
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

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  let t = 0;
  (function tick() {
    requestAnimationFrame(tick);
    t += 0.008;
    mat.uniforms.uTime.value = t;
    renderer.render(scene, camera);
  })();

  addEventListener('resize', () => renderer.setSize(innerWidth, innerHeight));
  window._bgMat = mat;
})();

/* ══ CITY RESOLUTION ══ */
function getCityFromURL() {
  const raw = new URLSearchParams(window.location.search).get('city');
  return raw ? decodeURIComponent(raw) : null;
}

function resolveCity() {
  const fromURL = getCityFromURL();
  if (fromURL) {
    localStorage.setItem('tiq-city', fromURL);
    return fromURL;
  }
  return localStorage.getItem('tiq-city') || 'Bhimavaram';
}

/* ══ STATE ══ */
const S = {
  theme:      localStorage.getItem('tiq-theme') || 'dark',
  name:       localStorage.getItem('tiq-name')  || 'You',
  city:       resolveCity(),
  collection: 'info-passer_messages',
  /* like persistence — keyed separately from other pages */
  likedKeys:  new Set(JSON.parse(localStorage.getItem('tiq-ip-liked-keys') || '[]')),
};

function persistLiked() {
  localStorage.setItem('tiq-ip-liked-keys', JSON.stringify([...S.likedKeys]));
}

/* ── City label ── */
function applyCityLabel() {
  const cityLabel = document.getElementById('cityLabel');
  if (cityLabel) cityLabel.textContent = S.city;
}
applyCityLabel();
window.addEventListener('DOMContentLoaded', applyCityLabel);

/* ══ ALERT INTELLIGENCE ENGINE ══ */
const ISSUE_TYPES = {
  accident:     { label:'Accident',     ico:'🚨', urg:'red',   conf:14 },
  blocked:      { label:'Road Blocked', ico:'🚧', urg:'amber', conf:12 },
  diversion:    { label:'Diversion',    ico:'🔀', urg:'amber', conf:10 },
  slow:         { label:'Slow Traffic', ico:'🐢', urg:'yel',   conf:8  },
  breakdown:    { label:'Breakdown',    ico:'🚛', urg:'red',   conf:13 },
  construction: { label:'Construction', ico:'🔧', urg:'yel',   conf:7  },
};

const ranked = {};

function updateRanked(type, loc) {
  const key = type + ':' + loc;
  if (!ranked[key]) ranked[key] = { type, loc, count: 0 };
  ranked[key].count++;
  const def = ISSUE_TYPES[type];
  ranked[key].conf = Math.min(98, ranked[key].count * def.conf + 15);
  renderRanked();
}

function renderRanked() {
  const list = Object.values(ranked).sort((a, b) => b.count - a.count);
  document.getElementById('tbAlerts').textContent = list.length;

  const el = document.getElementById('rankList');
  el.innerHTML = '';
  list.slice(0, 8).forEach((item, i) => {
    const def = ISSUE_TYPES[item.type];
    if (!def) return;
    const urgClass   = `urg-${def.urg}`;
    const badgeClass = `badge-${def.urg}`;
    const rankNum    = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;

    const card = document.createElement('div');
    card.className = `rank-card ${urgClass}${i === 0 ? ' rank-1' : ''}`;
    card.dataset.key = item.type + ':' + item.loc;
    card.innerHTML = `
      <div class="rc-head">
        <span class="rc-rank">${rankNum}</span>
        <span class="rc-ico">${def.ico}</span>
        <div class="rc-info">
          <span class="rc-type">${def.label}</span>
          <span class="rc-loc">${item.loc}</span>
        </div>
        <span class="rc-badge ${badgeClass}" title="${item.count} reports">×${item.count}</span>
        <span class="rc-pulse" style="background:var(--c${def.urg==='red'?'r':def.urg==='amber'?'a':'y'});box-shadow:0 0 7px var(--c${def.urg==='red'?'r':def.urg==='amber'?'a':'y'})"></span>
      </div>
      <div class="conf-row">
        <div class="conf-bar"><div class="conf-fill ${def.urg}" style="width:${item.conf}%"></div></div>
        <span class="conf-pct">${item.conf}%</span>
      </div>`;

    if (i === 0) gsap.fromTo(card, { scale: .96 }, { scale: 1, duration: .3, ease: 'back.out(2)' });
    el.appendChild(card);
  });
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

/* ══ CHAT FEED ══ */
const feed      = document.getElementById('feed');
const scrollBtn = document.getElementById('scrollBtn');
let userScrolled = false;

feed.addEventListener('scroll', () => {
  userScrolled = feed.scrollHeight - feed.scrollTop - feed.clientHeight > 40;
  scrollBtn.classList.toggle('show', userScrolled);
});

function scrollToBottom() {
  feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
  userScrolled = false;
  scrollBtn.classList.remove('show');
}

function timeStr(ts) {
  const d = (ts && ts.toDate) ? ts.toDate() : new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

const urgLabel = { red:'ACCIDENT', amber:'BLOCKED', yel:'SLOW', blue:'INFO' };

/* ══ LIKE A MESSAGE ══
   Dual-collection write — mirrors shortcuts.js exactly:
     messageLikeCounts/{msgId}  → per-message count (like button UI)
     message_likes/{authorName} → leaderboard total across all pages
   ══════════════════════════════════════════════════════════════════ */
function likeMessage(msgId, authorName, btnEl) {
  const likeKey = S.name + '__' + msgId;
  if (S.likedKeys.has(likeKey)) return;

  if (authorName === S.name) {
    gsap.fromTo(btnEl, { x: -4 }, { x: 0, duration: .3, ease: 'elastic.out(1,.4)', clearProps: 'x' });
    return;
  }

  const safeKey = (S.name + '__' + msgId).replace(/[^a-zA-Z0-9_\-]/g, '_');

  /* Optimistic UI */
  S.likedKeys.add(likeKey);
  persistLiked();
  btnEl.classList.add('liked');
  btnEl.disabled = true;
  const countEl = btnEl.querySelector('.like-count');
  if (countEl) countEl.textContent = parseInt(countEl.textContent || '0') + 1;
  gsap.fromTo(btnEl, { scale: 1.4 }, { scale: 1, duration: .4, ease: 'back.out(2)' });

  const { doc, setDoc, increment, serverTimestamp } = window.fb;

  const msgLikeCountRef = doc(window.db, 'messageLikeCounts', msgId);
  const authorDocRef    = doc(window.db, 'message_likes', authorName);
  const likerDocRef     = doc(window.db, 'message_likes', authorName, 'likers', safeKey);

  setDoc(likerDocRef, {
    likedAt: serverTimestamp(), liker: S.name, msgId, page: 'info-passer',
  })
  .then(() => Promise.all([
    setDoc(msgLikeCountRef,
      { likeCount: increment(1), lastUpdated: serverTimestamp() },
      { merge: true }),
    setDoc(authorDocRef,
      { authorName, likeCount: increment(1), lastUpdated: serverTimestamp() },
      { merge: true }),
  ]))
  .then(() => console.log('[TrafficIQ] ✅ Like saved (info-passer). msgId:', msgId, '| author:', authorName))
  .catch(err => {
    console.error('[TrafficIQ] Like failed:', err);
    S.likedKeys.delete(likeKey);
    persistLiked();
    btnEl.classList.remove('liked');
    btnEl.disabled = false;
    if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || '1') - 1);
  });
}

/* ══ LIVE LIKE COUNT LISTENER ══
   Watches messageLikeCounts/{msgId} — isolated per message.
   ══════════════════════════════════════════════════════════ */
const likeListeners = {};

function subscribeLikes(msgId, btnEl) {
  const { doc, onSnapshot } = window.fb;
  if (!likeListeners[msgId]) {
    likeListeners[msgId] = {
      unsub: onSnapshot(
        doc(window.db, 'messageLikeCounts', msgId),
        snap => {
          const count = snap.exists() ? (snap.data().likeCount || 0) : 0;
          likeListeners[msgId]?.btns.forEach(b => {
            const c = b.querySelector('.like-count');
            if (!c) return;
            if (b.classList.contains('liked')) {
              if (count > parseInt(c.textContent || '0')) c.textContent = count;
            } else {
              c.textContent = count;
            }
          });
        }
      ),
      btns: [],
    };
  }
  likeListeners[msgId].btns.push(btnEl);
}

/* ══ ADD ALERT ══ */
function addAlert({ id, name, role, init, msg, urg = 'blue', own = false, ts = null }) {
  const isTemp       = !id || id.startsWith('temp-');
  const likeKey      = S.name + '__' + id;
  const alreadyLiked = !isTemp && S.likedKeys.has(likeKey);
  const isOwnMsg     = name === S.name;

  const roleLabel = { g: '✓ Verified', b: 'Active User', r: '⚠ Flagged' };

  const el = document.createElement('div');
  el.className = `msg${own ? ' own' : ''}`;
  if (id) el.dataset.docId = id;

  el.innerHTML = `
    <div class="av ${role}" data-tip="${name} · ${roleLabel[role] || 'User'}">${init}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-name">${name}</span>
        <span class="msg-urg ${urg}">${urgLabel[urg] || 'INFO'}</span>
        <span class="msg-time">${timeStr(ts)}</span>
      </div>
      <div class="bubble">${msg}</div>
      <div class="msg-actions">
        <button class="upvote-btn" data-base="0">▲ <span class="vc">0</span></button>
        ${!isTemp ? `
        <button
          class="like-btn${alreadyLiked ? ' liked' : ''}${isOwnMsg ? ' own-msg' : ''}"
          title="${isOwnMsg ? "Can't like your own message" : alreadyLiked ? 'Already liked' : 'Like this alert'}"
          ${alreadyLiked || isOwnMsg ? 'disabled' : ''}
        >
          <svg class="like-ico" viewBox="0 0 24 24"
            fill="${alreadyLiked ? 'currentColor' : 'none'}"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          <span class="like-count">0</span>
        </button>
        ${alreadyLiked ? '<span class="liked-label">Liked ✓</span>' : ''}` : ''}
      </div>
    </div>`;

  /* upvote */
  el.querySelector('.upvote-btn')?.addEventListener('click', function () {
    const voted = this.classList.toggle('voted');
    this.querySelector('.vc').textContent = parseInt(this.dataset.base) + (voted ? 1 : 0);
    gsap.fromTo(this, { scale: .88 }, { scale: 1, duration: .3, ease: 'back.out(2)' });
  });

  /* like */
  if (!isTemp) {
    const btn = el.querySelector('.like-btn');
    if (btn && !isOwnMsg && !alreadyLiked) {
      btn.addEventListener('click', () => likeMessage(id, name, btn));
    }
    if (btn) subscribeLikes(id, btn);
  }

  feed.appendChild(el);
  if (!userScrolled) scrollToBottom();
  else scrollBtn.classList.add('show');
}

const typeToUrg = {
  accident:'red', blocked:'amber', diversion:'amber',
  slow:'yel', breakdown:'red', construction:'yel'
};

/* ══ TRIGGER FILL ══ */
let pendingType = 'blue';
function trigFill(btn) {
  document.getElementById('chatInp').value = btn.dataset.msg;
  document.getElementById('chatInp').focus();
  pendingType = typeToUrg[btn.dataset.type] || 'blue';
  gsap.fromTo(btn, { scale: .9 }, { scale: 1, duration: .28, ease: 'back.out(2)' });
}

/* ══ USER COUNTER ══ */
const seenUsers = new Set();
function trackUser(name) {
  if (!name || seenUsers.has(name)) return;
  seenUsers.add(name);
  document.getElementById('tbUsers').textContent = seenUsers.size;
}

/* ══ SEND ══ */
const renderedDocIds = new Set();

async function sendMsg() {
  const inp = document.getElementById('chatInp');
  const txt = inp.value.trim();
  if (!txt) return;
  const urg = pendingType;

  const detected = Object.keys(typeToUrg).find(k => txt.toLowerCase().includes(k)) || 'slow';
  const loc = S.city;

  const { collection, doc, setDoc, increment, serverTimestamp } = window.fb;

  const newDocRef = doc(collection(window.db, 'info-passer_messages'));

  /* Pre-mark so onSnapshot doesn't double-render our own message */
  renderedDocIds.add(newDocRef.id);

  addAlert({
    id:   newDocRef.id,
    name: S.name,
    role: 'b',
    init: S.name.substring(0, 2).toUpperCase(),
    msg:  txt,
    urg,
    own:  true,
  });
  trackUser(S.name);
  updateRanked(detected, loc);

  await setDoc(newDocRef, {
    name:      S.name,
    role:      'b',
    init:      S.name.substring(0, 2).toUpperCase(),
    msg:       txt,
    type:      detected,
    loc:       loc,
    urg:       urg,
    city:      S.city,
    createdAt: serverTimestamp()
  });

  /* Update left panel counters */
  const leftPanelRef = doc(window.db, 'info-passer_leftpanel', loc);
  await setDoc(leftPanelRef, {
    totalAlerts: increment(1),
    [`${detected}Count`]: increment(1),
    confidence:  increment(5),
    lastUpdated: serverTimestamp(),
    city:        S.city
  }, { merge: true });

  inp.value = '';
  pendingType = 'blue';
  gsap.fromTo(document.querySelector('.send-btn'), { scale: .88 }, { scale: 1, duration: .25, ease: 'back.out(2)' });
}

document.getElementById('chatInp').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMsg();
});

/* ══ MOBILE PANEL ══ */
function togglePanel() {
  document.getElementById('panel').classList.toggle('open');
  document.getElementById('mobOverlay').classList.toggle('show');
}
document.getElementById('panTog').addEventListener('click', togglePanel);
document.getElementById('mobOverlay').addEventListener('click', togglePanel);

/* ══ TOOLTIP ══ */
const tip = document.getElementById('av-tip');
document.addEventListener('mouseover', e => {
  const av = e.target.closest?.('.av');
  if (!av) return;
  tip.textContent = av.dataset.tip || '';
  tip.style.opacity = '1';
});
document.addEventListener('mousemove', e => {
  if (tip.style.opacity !== '1') return;
  const av = e.target.closest?.('.av');
  if (!av) { tip.style.opacity = '0'; return; }
  const rect = av.getBoundingClientRect();
  const leftEdge = Math.max(rect.left + rect.width/2, window.innerWidth * 0.28 + tip.offsetWidth/2 + 8);
  tip.style.left = leftEdge + 'px';
  tip.style.top  = (rect.top - 42) + 'px';
});
document.addEventListener('mouseout', e => {
  if (!e.target.closest?.('.av')) return;
  tip.style.opacity = '0';
});

/* ══ GSAP ENTRANCE ══ */
gsap.to('#topbar',  { y: 0, opacity: 1, duration: .6,  ease: 'power3.out', delay: .1  });
gsap.to('#panel',   { x: 0, opacity: 1, duration: .75, ease: 'power3.out', delay: .25 });
gsap.from('.stream',{ opacity: 0, duration: .5, ease: 'power2.out', delay: .35 });

/* ══ FIREBASE REAL-TIME LISTENER ══ */
const { collection, onSnapshot, query, orderBy } = window.fb;

const q = query(
  collection(window.db, S.collection),
  orderBy('createdAt')
);

onSnapshot(q, (snapshot) => {
  /* Reset ranked data */
  for (let key in ranked) delete ranked[key];

  /* Full feed rebuild */
  document.getElementById('feed').innerHTML = '';

  /* Tear down all existing like listeners to avoid memory leaks */
  Object.values(likeListeners).forEach(entry => {
    try { entry.unsub?.(); } catch(_) {}
  });
  for (let k in likeListeners) delete likeListeners[k];

  renderedDocIds.clear();
  seenUsers.clear();
  document.getElementById('tbUsers').textContent = 0;

  const counts = {};

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();

    /* Client-side city filter */
    if (data.city !== S.city) return;

    const type = data.type || 'slow';
    const loc  = data.loc  || S.city;
    const key  = type + ':' + loc;

    renderedDocIds.add(docSnap.id);
    addAlert({
      id:   docSnap.id,
      name: data.name || 'Unknown',
      role: data.role || 'b',
      init: data.init || (data.name || '?').substring(0, 2).toUpperCase(),
      msg:  data.msg  || '',
      urg:  data.urg  || 'blue',
      own:  data.name === S.name,
      ts:   data.createdAt || null,
    });
    trackUser(data.name);

    if (!counts[key]) counts[key] = { type, loc, count: 0 };
    counts[key].count++;
  });

  /* Rebuild ranked from fresh counts */
  Object.values(counts).forEach(item => {
    ranked[item.type + ':' + item.loc] = item;
  });

  renderRanked();
});