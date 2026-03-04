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
        vec3 gridClr = mix(vec3(0.85,0.88,0.92), vec3(0.06,0.12,0.22), uDark);
        vec3 col = mix(bg, gridClr, g * mix(0.25, 0.12, uDark));

        float r1 = road(uv.y, 0.25, 0.018);
        float r2 = road(uv.y, 0.50, 0.022);
        float r3 = road(uv.y, 0.75, 0.018);
        float rv1 = road(uv.x, 0.33, 0.016);
        float rv2 = road(uv.x, 0.66, 0.016);

        vec3 roadClr = mix(vec3(0.78,0.82,0.88), vec3(0.08,0.14,0.28), uDark);
        float roads = max(max(r1, r2), max(r3, max(rv1, rv2)));
        col = mix(col, roadClr, roads);

        float hy1 = road(uv.y, 0.50, 0.002);
        col = mix(col, vec3(1.0, 0.85, 0.15), hy1 * .55 * uDark);

        float s1 = streak(uv, 0.498, 0.0, 0.18, 0.08);
        float s2 = streak(uv, 0.502, 0.3, 0.14, 0.06);
        vec2 flip = vec2(1.0 - uv.x, uv.y);
        float s3 = streak(flip, 0.495, 0.1, 0.22, 0.07);
        float s4 = streak(flip, 0.505, 0.6, 0.17, 0.05);
        float s5 = streak(uv, 0.252, 0.2, 0.13, 0.06);
        float s6 = streak(uv, 0.748, 0.5, 0.16, 0.07);
        float s7 = streak(flip, 0.748, 0.4, 0.19, 0.06);

        col += vec3(0.9, 0.15, 0.1)  * (s1+s2) * uDark;
        col += vec3(0.85,0.90, 1.0)  * (s3+s4) * uDark;
        col += vec3(1.0, 0.80, 0.2)  * (s5+s6+s7) * uDark;
        col += vec3(0.15,0.35, 0.9)  * (s1+s2+s3+s4+s5+s6+s7) * (1.0-uDark) * .25;

        float ix1 = smoothstep(.04,.0,length(uv-vec2(.33,.50)));
        float ix2 = smoothstep(.04,.0,length(uv-vec2(.66,.50)));
        float ix3 = smoothstep(.035,.0,length(uv-vec2(.33,.25)));
        float ix4 = smoothstep(.035,.0,length(uv-vec2(.66,.75)));
        float ixAll = max(max(ix1,ix2),max(ix3,ix4));
        col += vec3(0.0,0.75,1.0) * ixAll * 0.18 * uDark;
        col += vec3(0.1,0.4, 0.9) * ixAll * 0.10 * (1.0-uDark);

        float v = length(uv-.5) * 1.2;
        col *= 1.0 - v * v * mix(.2,.5,uDark);

        gl_FragColor = vec4(col, mix(.22,.72,uDark));
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
  addEventListener('resize', () => renderer.setSize(innerWidth, innerHeight));
  window._bgMat = mat;
})();

/* ══ STATE ══ */
const S = {
  theme: localStorage.getItem('tiq-theme') || 'dark',
  city:  localStorage.getItem('tiq-city')  || 'Bhimavaram Railway Station',
  name:  localStorage.getItem('tiq-name')  || 'You',
};
/* If city is empty or Unknown, try reading from cityLabel in DOM */
if (!S.city || S.city === 'Unknown' || S.city === '') {
  const labelEl = document.getElementById('cityLabel');
  if (labelEl && labelEl.textContent.trim()) {
    S.city = labelEl.textContent.trim();
    localStorage.setItem('tiq-city', S.city);
  }
}
console.log('[EntPage] Loaded for city:', S.city);

/* ══ MOOD FILTER STATE ══
   null = show all cards
   'stuck' | 'frustrated' | 'chill' | 'moving' = filter
══ */
window._activeMoodFilter = null;

/* ══ CITY → PLACES DOC ID MAP ══ */
const CITY_TO_PLACE_DOC = {
  'Bhimavaram Railway Station': 'bhimavaram_railway_station',
  'Government Hospital':        'government_hospital',
  'RTC Bus Stand':              'rtc_bus_stand',
  'Sagi Ramakrishnam Raju Engineering College': 'sagi_raju_college',
  'Vishnu College':             'vishnu_college',
};

/* Status → colour mapping */
const STATUS_COLOUR = {
  'Heavy':    { css: 'var(--cr)', cls: 'cr', tagCls: 'red'   },
  'Moderate': { css: 'var(--ca)', cls: 'ca', tagCls: 'amber' },
  'Low':      { css: 'var(--cg)', cls: 'cg', tagCls: 'green' },
  'Clear':    { css: 'var(--cg)', cls: 'cg', tagCls: 'green' },
};
function statusStyle(status) {
  return STATUS_COLOUR[status] || STATUS_COLOUR['Moderate'];
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

/* ══ CITY LABEL ══ */
const _cityLabelEl = document.getElementById('cityLabel');
if (_cityLabelEl) _cityLabelEl.textContent = S.city;

/* ══ MOOD STRIP ══ */
function setMood(btn) {
  const clickedMood = btn.dataset.mood;
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  window._activeMoodFilter = clickedMood;
  applyMoodFilter();
}

function applyMoodFilter() {
  const filter = window._activeMoodFilter;
  console.log('[Filter] Active mood:', filter);

  document.querySelectorAll('.ent-post-card').forEach(card => {
    const cardMood = (card.getAttribute('data-mood') || '').trim().toLowerCase();
    const match    = filter ? (cardMood === filter.toLowerCase()) : true;
    card.style.display = match ? '' : 'none';
    console.log('[Filter] card mood:', cardMood, '| filter:', filter, '| show:', match);
  });

  /* ent-card class is no longer used for posts but kept for safety */
  document.querySelectorAll('.ent-card').forEach(card => {
    card.style.display = filter ? 'none' : '';
  });
}

/* ══ FEED HELPERS ══ */
const feedEl   = document.getElementById('feed');
const feedWrap = document.getElementById('feedWrap');

function timeStr() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

/* ══ FIRESTORE LISTENERS ══ */
let unsubscribePosts = null;
let unsubscribePlace = null;
const sentDocIds     = new Set();

/* ══ FIX: loadLiveRoom now reads from entertainment_posts filtered by city ══ */
function loadLiveRoom() {

  /* ── POSTS: listen to entertainment_posts filtered by city ── */
  if (unsubscribePosts) unsubscribePosts();

  const postsQ = window.query(
    window.collection(window.db, 'entertainment_posts'),
    window.where('city', '==', S.city)
    /* No orderBy — avoids composite index requirement.
       renderEntPost inserts cards newest-first via insertBefore. */
  );

  console.log('[loadLiveRoom] Subscribing to entertainment_posts for city:', S.city);

  unsubscribePosts = window.onSnapshot(postsQ, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type !== 'added') return;
      const docId = change.doc.id;
      if (sentDocIds.has(docId)) return;
      sentDocIds.add(docId);
      /* renderEntPost is defined in entertainment.html inline script */
      if (typeof window.renderEntPost === 'function') {
        window.renderEntPost({ ...change.doc.data(), id: docId });
      }
    });
    /* Update post counter */
    const tbPostsEl = document.getElementById('tbPosts');
    if (tbPostsEl) tbPostsEl.textContent = snapshot.size;
  });

  /* ── PLACES listener (unchanged) ── */
  if (unsubscribePlace) unsubscribePlace();

  const placeDocId = CITY_TO_PLACE_DOC[S.city];
  if (!placeDocId) {
    console.warn('No place doc for city:', S.city);
    return;
  }

  const placeRef = window.doc(window.db, 'entertainment_places', placeDocId);
  unsubscribePlace = window.onSnapshot(placeRef, (docSnap) => {
    if (docSnap.exists()) renderPanelCard(docSnap.data());
  });
}

/* ── Panel card (unchanged) ── */
function renderPanelCard(data) {
  const panelInner = document.querySelector('#panel .panel-inner');
  if (!panelInner) return;

  panelInner.querySelectorAll('.issue-card, .empty-panel').forEach(el => el.remove());

  const status   = data.currentStatus || 'Moderate';
  const style    = statusStyle(status);
  const sevPct   = Math.min(100, (data.priority || 1) * 25);
  const sevLabel = data.priority >= 4 ? 'Critical'
    : data.priority >= 3 ? 'High'
    : data.priority >= 2 ? 'Moderate'
    : 'Low';

  const card = document.createElement('div');
  card.className = 'issue-card';
  card.innerHTML = `
    <div class="ic-top">
      <span class="ic-ico">📍</span>
      <div class="ic-info">
        <span class="ic-type">${data.name || S.city}</span>
        <span class="ic-loc">${data.shortName || ''} · ${status}</span>
      </div>
      <span class="ic-pulse" style="background:${style.css};box-shadow:0 0 8px ${style.css}"></span>
    </div>
    <div class="ic-tags">
      <span class="tag ${style.tagCls}">${status}</span>
      <span class="tag amber">~${data.avgDelayMinutes || 0} min delay</span>
      ${data.isActive ? '<span class="tag green">Active</span>' : ''}
    </div>
    <div class="sev-row">
      <div class="sev-bar">
        <div class="sev-fill" style="width:${sevPct}%;background:${style.css}"></div>
      </div>
      <span class="sev-txt ${style.cls}">${sevLabel}</span>
    </div>`;

  panelInner.appendChild(card);
  gsap.fromTo(card, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .35, ease: 'power2.out' });
}

/* ── Stubs ── */
function loadMore() {}

function closeShare() {
  document.getElementById('sharePopup').classList.remove('open');
  document.getElementById('shareOverlay').classList.remove('open');
}

function copyShareLink() {
  const inp = document.getElementById('shareLink');
  inp.select();
  document.execCommand('copy');
  const btn = document.getElementById('shareCopyBtn');
  btn.textContent = 'Copied!';
  btn.classList.add('copied');
  setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
}

function closeCommentModal(e) {
  if (!e || e.target === document.getElementById('commentModal') || e.currentTarget === document.querySelector('.modal-close')) {
    document.getElementById('commentModal').classList.remove('open');
  }
}

function submitComment() { /* comment modal - not used */ }

/* ══ GSAP ENTRANCE ══ */
window.addEventListener('DOMContentLoaded', () => {
  const _activeBtn = document.querySelector('.mood-btn.active');
  window._activeMoodFilter = _activeBtn ? _activeBtn.dataset.mood : null;

  gsap.to('#topbar',    { y: 0, opacity: 1, duration: .6,  ease: 'power3.out', delay: .1 });
  gsap.to('#moodStrip', { y: 0, opacity: 1, duration: .55, ease: 'power3.out', delay: .2 });

  if (window.db) {
    loadLiveRoom();
  } else {
    window.addEventListener('firebaseReady', loadLiveRoom);
  }
});