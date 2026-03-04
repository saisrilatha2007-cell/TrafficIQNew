/* TrafficIQ — time-taken.js */
'use strict';

/* ══ THREE.JS HIGHWAY BACKGROUND ══ */
(function initBG() {
  const canvas = document.getElementById('bg');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: { value: 0 }, uDark: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uDark; varying vec2 vUv;
      float grid(vec2 uv,float s,float t){vec2 g=abs(fract(uv/s-.5)-.5)/fwidth(uv/s);return 1.0-min(min(g.x,g.y),1.0)*t;}
      float road(float c,float p,float w){return smoothstep(w,w*.4,abs(c-p));}
      float streak(vec2 uv,float ry,float off,float spd,float len){
        float x=fract(uv.x*.6+uTime*spd+off);
        float onRoad=road(uv.y,ry,0.006);
        return smoothstep(len,0.0,x)*smoothstep(0.0,0.01,x)*onRoad;
      }
      void main(){
        vec2 uv=vUv;
        vec3 db=vec3(0.016,0.031,0.082),lb=vec3(0.906,0.937,0.980);
        vec3 bg=mix(lb,db,uDark);
        float g=grid(uv*vec2(6.0,4.0),1.0,1.8);
        vec3 gc=mix(vec3(0.85,0.88,0.92),vec3(0.06,0.12,0.22),uDark);
        vec3 col=mix(bg,gc,g*mix(0.25,0.12,uDark));
        float r1=road(uv.y,0.25,0.018),r2=road(uv.y,0.50,0.022),r3=road(uv.y,0.75,0.018);
        float rv1=road(uv.x,0.33,0.016),rv2=road(uv.x,0.66,0.016);
        vec3 rc=mix(vec3(0.78,0.82,0.88),vec3(0.08,0.14,0.28),uDark);
        col=mix(col,rc,max(max(r1,r2),max(r3,max(rv1,rv2))));
        col=mix(col,vec3(1.0,0.85,0.15),road(uv.y,0.50,0.002)*.55*uDark);
        float s1=streak(uv,0.498,0.0,0.18,0.08),s2=streak(uv,0.502,0.3,0.14,0.06);
        vec2 fl=vec2(1.0-uv.x,uv.y);
        float s3=streak(fl,0.495,0.1,0.22,0.07),s4=streak(fl,0.505,0.6,0.17,0.05);
        float s5=streak(uv,0.252,0.2,0.13,0.06),s6=streak(uv,0.748,0.5,0.16,0.07),s7=streak(fl,0.748,0.4,0.19,0.06);
        col+=vec3(0.9,0.15,0.1)*(s1+s2)*uDark;
        col+=vec3(0.85,0.90,1.0)*(s3+s4)*uDark;
        col+=vec3(1.0,0.80,0.2)*(s5+s6+s7)*uDark;
        col+=vec3(0.15,0.35,0.9)*(s1+s2+s3+s4+s5+s6+s7)*(1.0-uDark)*.25;
        float ix1=smoothstep(.04,.0,length(uv-vec2(.33,.50))),ix2=smoothstep(.04,.0,length(uv-vec2(.66,.50)));
        float ix3=smoothstep(.035,.0,length(uv-vec2(.33,.25))),ix4=smoothstep(.035,.0,length(uv-vec2(.66,.75)));
        float ix=max(max(ix1,ix2),max(ix3,ix4));
        col+=vec3(0.0,0.75,1.0)*ix*0.18*uDark; col+=vec3(0.1,0.4,0.9)*ix*0.10*(1.0-uDark);
        float v=length(uv-.5)*1.2; col*=1.0-v*v*mix(.2,.5,uDark);
        gl_FragColor=vec4(col,mix(.22,.72,uDark));
      }
    `,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  let t = 0;
  (function tick() { requestAnimationFrame(tick); t += 0.008; mat.uniforms.uTime.value = t; renderer.render(scene, camera); })();
  addEventListener('resize', () => renderer.setSize(innerWidth, innerHeight));
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

/* ══ STATE ══ */
const S = {
  theme: localStorage.getItem('tiq-theme') || 'dark',
  city: (function () {
    const urlParam = new URLSearchParams(location.search).get('city');
    if (urlParam && VALID_CITIES.includes(urlParam)) return urlParam;
    const stored = localStorage.getItem('tiq-city');
    if (stored && VALID_CITIES.includes(stored)) return stored;
    return VALID_CITIES[0];
  })(),
  name: localStorage.getItem('tiq-name') || 'You',
  votes: { long: 0, med: 0, short: 0 },
  prevWinner: null,
  graphHistory: [],
  userVoted: false,
  seenMsgIds: new Set(),
  _unsubMsgs: null,
  _unsubVotes: null,

  /* likedKeys = "currentUser__msgDocId" — one entry per liked message */
  likedKeys: new Set(JSON.parse(localStorage.getItem('tiq-tt-liked-keys') || '[]')),
};

function persistLiked() {
  localStorage.setItem('tiq-tt-liked-keys', JSON.stringify([...S.likedKeys]));
}

const VOTE_WEIGHTS = { long: 75, med: 30, short: 7 };

/*
  likeListeners: keyed by msgId (NOT authorName).
  Each entry watches messageLikeCounts/{msgId} for the per-message count,
  completely isolated from other pages and other messages by the same author.
*/
const likeListeners = {};


/* ══ THEME ══ */
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('themeBtn').textContent = t === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('tiq-theme', S.theme = t);
  if (window._bgMat) window._bgMat.uniforms.uDark.value = t === 'dark' ? 1 : 0;
  redrawGraph();
}
setTheme(S.theme);
document.getElementById('themeBtn').addEventListener('click', () => setTheme(S.theme === 'dark' ? 'light' : 'dark'));


/* ══ COUNT-UP UTIL ══ */
const _timers = {};
function animCount(id, target, suffix = '') {
  if (_timers[id]) cancelAnimationFrame(_timers[id]);
  const el = document.getElementById(id);
  if (!el) return;
  const from = parseFloat(el.textContent) || 0;
  const dur = 650, t0 = performance.now();
  function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (target - from) * e) + suffix;
    if (p < 1) _timers[id] = requestAnimationFrame(step);
  }
  _timers[id] = requestAnimationFrame(step);
}


/* ══ POLL UPDATE ══ */
function updatePoll() {
  const { long, med, short } = S.votes;
  const total = long + med + short;

  animCount('tbTotal', total);

  const pLong = total ? Math.round(long / total * 100) : 0;
  const pMed = total ? Math.round(med / total * 100) : 0;
  const pShort = total ? 100 - pLong - pMed : 0;

  document.getElementById('pb-long').style.width = pLong + '%';
  document.getElementById('pb-med').style.width = pMed + '%';
  document.getElementById('pb-short').style.width = pShort + '%';

  animCount('pp-long', pLong, '%');
  animCount('pp-med', pMed, '%');
  animCount('pp-short', pShort, '%');

  document.getElementById('pv-long').textContent = long + ' vote' + (long !== 1 ? 's' : '');
  document.getElementById('pv-med').textContent = med + ' vote' + (med !== 1 ? 's' : '');
  document.getElementById('pv-short').textContent = short + ' vote' + (short !== 1 ? 's' : '');

  const winner = total === 0 ? null
    : long >= med && long >= short ? 'long'
      : med >= long && med >= short ? 'med'
        : 'short';

  const colorMap = { long: 'red-win', med: 'amber-win', short: 'green-win' };

  ['long', 'med', 'short'].forEach(k => {
    const card = document.getElementById(`pc-${k}`);
    const wb = document.getElementById(`wb-${k}`);
    card.classList.remove('winner', 'red-win', 'amber-win', 'green-win');
    wb.style.opacity = '0';
    if (k === winner && total > 0) {
      card.classList.add('winner', colorMap[k]);
      wb.style.opacity = '1';
      if (winner !== S.prevWinner) {
        gsap.fromTo(card, { scale: .96 }, { scale: 1, duration: .45, ease: 'back.out(2)' });
      }
    }
  });
  S.prevWinner = winner;

  if (total > 0) {
    const avg = Math.round(
      (long * VOTE_WEIGHTS.long + med * VOTE_WEIGHTS.med + short * VOTE_WEIGHTS.short) / total
    );
    animCount('avgNum', avg);
    document.getElementById('avgNum').style.color =
      avg >= 60 ? 'var(--cr)' : avg >= 20 ? 'var(--ca)' : 'var(--cg)';
  }

  updateTrend(winner);

  S.graphHistory.push({ long: pLong, med: pMed, short: pShort, ts: Date.now() });
  if (S.graphHistory.length > 30) S.graphHistory.shift();
  redrawGraph();
}


/* ══ TREND ARROW ══ */
function updateTrend(winner) {
  const wrap = document.getElementById('trendArrowWrap');
  const svg = document.getElementById('trendSvg');
  const label = document.getElementById('trendLabel');
  const sub = document.getElementById('trendSub');

  wrap.classList.remove('up', 'down', 'stable');

  if (!winner) {
    label.textContent = 'Calculating…';
    sub.textContent = 'Awaiting votes';
    svg.setAttribute('stroke', 'var(--sub)');
    return;
  }

  if (winner === 'long') {
    wrap.classList.add('up');
    svg.setAttribute('stroke', 'var(--cr)');
    svg.innerHTML = '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>';
    label.textContent = 'Delay increasing';
    sub.textContent = 'Majority: 1+ hour';
    gsap.fromTo(svg, { y: 3 }, { y: 0, duration: .5, ease: 'back.out(2)', repeat: -1, yoyo: true });
  } else if (winner === 'short') {
    wrap.classList.add('down');
    svg.setAttribute('stroke', 'var(--cg)');
    svg.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 19 19 12"/>';
    label.textContent = 'Delay clearing';
    sub.textContent = 'Majority: <10 min';
    gsap.fromTo(svg, { y: -3 }, { y: 0, duration: .5, ease: 'back.out(2)', repeat: -1, yoyo: true });
  } else {
    wrap.classList.add('stable');
    svg.setAttribute('stroke', 'var(--ca)');
    svg.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>';
    label.textContent = 'Delay stable';
    sub.textContent = 'Majority: ~30 min';
    gsap.killTweensOf(svg);
    gsap.set(svg, { y: 0 });
  }
}


/* ══ MINI GRAPH ══ */
function redrawGraph() {
  const canvas = document.getElementById('graphCanvas');
  if (!canvas) return;
  const dpr = Math.min(devicePixelRatio, 2);
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = (rect.width || 200) * dpr;
  canvas.height = 70 * dpr;
  canvas.style.width = (rect.width || 200) + 'px';
  canvas.style.height = '70px';

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const hist = S.graphHistory;

  ctx.clearRect(0, 0, W, H);

  if (hist.length < 2) {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach(y => {
      ctx.beginPath(); ctx.moveTo(0, H * y); ctx.lineTo(W, H * y); ctx.stroke();
    });
    return;
  }

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const lines = [
    { key: 'long', color: isDark ? '#ef4444' : '#dc2626' },
    { key: 'med', color: isDark ? '#f59e0b' : '#d97706' },
    { key: 'short', color: isDark ? '#22c55e' : '#16a34a' },
  ];

  lines.forEach(({ key, color }) => {
    const pts = hist.map((d, i) => ({
      x: (i / (hist.length - 1)) * W,
      y: H - (d[key] / 100) * H * 0.9 - H * 0.05,
    }));

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, color + '44');
    grad.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, H);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 * dpr;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4 * dpr;
    ctx.stroke();
    ctx.shadowBlur = 0;
  });

  lines.forEach(({ key, color }) => {
    const last = hist[hist.length - 1];
    const y = H - (last[key] / 100) * H * 0.9 - H * 0.05;
    ctx.beginPath();
    ctx.arc(W - 2, y, 3 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 * dpr;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}


/* ══ LIKE A MESSAGE ══
   Dual-collection write — identical pattern to enter-traffic.js and shortcuts.js:
   ─────────────────────────────────────────────────────────
   messageLikeCounts/{msgId}
     likeCount: N              ← per-message count → drives the like button UI

   message_likes/{authorName}
     authorName, likeCount     ← leaderboard total across ALL pages
     likers/{safeKey}          ← idempotency guard, prevents double-liking
   ─────────────────────────────────────────────────────────
══ */
function likeMessage(msgId, authorName, btnEl) {
  if (!window._db) return;

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

  import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js').then(fs => {
    const msgLikeCountRef = fs.doc(window._db, 'messageLikeCounts', msgId);
    const authorDocRef = fs.doc(window._db, 'message_likes', authorName);
    const likerDocRef = fs.doc(window._db, 'message_likes', authorName, 'likers', safeKey);

    // Step 1: Record liker (idempotency guard)
    fs.setDoc(likerDocRef, {
      likedAt: fs.serverTimestamp(),
      liker: S.name,
      msgId: msgId,
      page: 'time-taken',
    })
      .then(() => Promise.all([
        // Step 2a: Per-message count → shown on like button
        fs.setDoc(msgLikeCountRef, {
          likeCount: fs.increment(1),
          lastUpdated: fs.serverTimestamp(),
        }, { merge: true }),

        // Step 2b: Author leaderboard total → shown on leaderboard
        fs.setDoc(authorDocRef, {
          authorName: authorName,
          likeCount: fs.increment(1),
          lastUpdated: fs.serverTimestamp(),
        }, { merge: true }),
      ]))
      .then(() => {
        console.log('[TrafficIQ] ✅ Like saved (time-taken). msgId:', msgId, '| author:', authorName);
      })
      .catch(err => {
        console.error('[TrafficIQ] Like failed:', err);
        S.likedKeys.delete(likeKey);
        persistLiked();
        btnEl.classList.remove('liked');
        btnEl.disabled = false;
        if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || '1') - 1);
      });
  });
}


/* ══ SUBSCRIBE TO LIVE LIKE COUNT ══
   Watches messageLikeCounts/{msgId} — NOT message_likes/{authorName}.
   Each button shows only that specific message's like count,
   completely isolated from other pages and other messages.
══ */
function subscribeLikes(msgId, btnEl) {
  import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js').then(fs => {
    if (!likeListeners[msgId]) {
      likeListeners[msgId] = {
        unsub: fs.onSnapshot(
          fs.doc(window._db, 'messageLikeCounts', msgId),
          snap => {
            const count = snap.exists() ? (snap.data().likeCount || 0) : 0;
            likeListeners[msgId]?.btns.forEach(b => {
              const c = b.querySelector('.like-count');
              if (!c) return;
              if (b.classList.contains('liked')) {
                // Optimistic-liked: only update upward to avoid flicker
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
  });
}


/* ══ FEED HELPERS ══ */
const feed = document.getElementById('feed');
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

function timeStr(ts) {
  const n = ts ? new Date(ts) : new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

function addMsg({ id = null, name, role, init, vote = null, msg, own = false, ts = null }) {
  if (id && S.seenMsgIds.has(id)) return;
  if (id) S.seenMsgIds.add(id);

  const el = document.createElement('div');
  el.className = `msg${own ? ' own' : ''}`;
  if (id) el.dataset.msgId = id;

  const chipLabel = { long: '🔴 1+ hr', med: '🟡 30 min', short: '🟢 <10 min' };
  const chip = vote ? `<span class="vote-chip ${vote}">${chipLabel[vote]}</span>` : '';
  const bubClass = vote ? `bubble ${vote}-bub` : 'bubble';
  const isTemp = !id || id.startsWith('temp-');
  const likeKey = S.name + '__' + id;
  const alreadyLiked = !isTemp && S.likedKeys.has(likeKey);
  const isOwnMsg = name === S.name;

  el.innerHTML = `
    <div class="av ${role}" data-tip="${name}">${init}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-name">${name}</span>
        ${chip}
        <span class="msg-time">${timeStr(ts)}</span>
      </div>
      <div class="${bubClass}">${msg}</div>
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

  /* Like handler — pass id (msgId), NOT name (authorName) */
  if (!isTemp) {
    const btn = el.querySelector('.like-btn');
    if (btn && !isOwnMsg && !alreadyLiked) {
      btn.addEventListener('click', () => likeMessage(id, name, btn));
    }
    // Subscribe by msgId so each button shows its own isolated count
    if (btn) subscribeLikes(id, btn);
  }

  feed.appendChild(el);
  if (!userScrolled) scrollToBottom();
  else scrollBtn.classList.add('show');
}

function roleFromVote(vote) {
  return vote === 'long' ? 'r' : vote === 'med' ? 'a' : vote === 'short' ? 'g' : 'b';
}

function initials(name) {
  return (name || 'U').substring(0, 2).toUpperCase();
}


/* ══ UPDATE UI WITH CITY NAME ══ */
function updateCityUI(cityName) {
  document.getElementById('tbCity').textContent = cityName;
  document.getElementById('feedHdrSub').textContent = cityName + ' · Real-time delay reports';
}


/* ══ OPTIMISTIC MESSAGE ══ */
function showMsgOptimistic(name, msg, vote) {
  const tempId = 'temp-' + Date.now();
  S.seenMsgIds.add(tempId);
  addMsg({
    id: tempId,
    name: name,
    role: roleFromVote(vote),
    init: initials(name),
    vote: vote || null,
    msg: msg,
    own: true,
    ts: null,
  });
}


/* ══ ATTACH REAL-TIME LISTENERS ══ */
function attachCityListeners(db, cityName) {
  const {
    collection, addDoc, onSnapshot,
    query, orderBy, limit, where,
    doc, setDoc,
    serverTimestamp, increment
  } = window._firestoreApi;

  // Detach previous listeners
  if (S._unsubMsgs) S._unsubMsgs();
  if (S._unsubVotes) S._unsubVotes();

  // Unsubscribe all per-message like listeners
  Object.values(likeListeners).forEach(obj => obj.unsub && obj.unsub());
  for (const k in likeListeners) delete likeListeners[k];

  // Reset for new city
  feed.innerHTML = '';
  S.seenMsgIds = new Set();
  S.votes = { long: 0, med: 0, short: 0 };
  S.graphHistory = [];
  S.prevWinner = null;
  updatePoll();

  /* ── timeTakenMessages ── */
  const msgsQ = query(
    collection(db, 'timeTakenMessages'),
    where('city', '==', cityName),
    orderBy('timestamp', 'asc'),
    limit(100)
  );

  S._unsubMsgs = onSnapshot(msgsQ,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          const own = d.name === S.name;

          if (own) {
            const tempMsgs = feed.querySelectorAll('[data-msg-id^="temp-"]');
            tempMsgs.forEach(el => {
              const bubble = el.querySelector('.bubble');
              if (bubble && bubble.textContent === d.message) el.remove();
            });
          }

          addMsg({
            id: change.doc.id,
            name: d.name || 'Anonymous',
            role: roleFromVote(d.voteType),
            init: initials(d.name),
            vote: d.voteType || null,
            msg: d.message || '',
            own,
            ts: d.timestamp?.toMillis?.() || null,
          });
        }
      });
    },
    (err) => {
      console.error('Messages listener error:', err);
      if (err.code === 'failed-precondition') {
        const div = document.createElement('div');
        div.style.cssText = 'padding:12px 18px;font-size:.75rem;color:var(--ca);text-align:center;';
        div.textContent = '⚠️ Firestore index needed. Check console for link.';
        feed.appendChild(div);
      }
    }
  );

  /* ── timeTakenVotes ── */
  const votesRef = doc(db, 'timeTakenVotes', cityName);

  S._unsubVotes = onSnapshot(votesRef,
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        S.votes.long = d.long || 0;
        S.votes.med = d.med || 0;
        S.votes.short = d.short || 0;
        updatePoll();
      }
    },
    (err) => console.error('Votes listener error:', err)
  );

  /* ── Save to Firestore ── */
  window._saveToFirestore = async (name, msg, vote) => {
    try {
      await addDoc(collection(db, 'timeTakenMessages'), {
        name,
        message: msg,
        voteType: vote || null,
        city: cityName,
        timestamp: serverTimestamp(),
      });
      if (vote) {
        await setDoc(votesRef, {
          [vote]: increment(1),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };
}


/* ══ WAIT FOR FIREBASE ══ */
function waitForFirebase(cb) {
  if (window._db && window._firestoreApi) { cb(window._db); return; }
  const t = setInterval(() => {
    if (window._db && window._firestoreApi) { clearInterval(t); cb(window._db); }
  }, 80);
}

waitForFirebase((db) => {
  updateCityUI(S.city);
  attachCityListeners(db, S.city);
  trackOnlinePresence(db);
});


/* ══ ONLINE PRESENCE TRACKING ══ */
function trackOnlinePresence(db) {
  const { doc, setDoc, onSnapshot, serverTimestamp, increment, collection, deleteDoc } = window._firestoreApi;

  // Unique session ID for this browser tab
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const presenceRef = doc(db, 'timeTakenPresence', sessionId);
  const counterRef = doc(db, 'timeTakenOnlineCount', 'counter');
  let registered = false;

  // Register this user as online
  function goOnline() {
    if (registered) return;
    registered = true;
    setDoc(presenceRef, {
      name: S.name,
      city: S.city,
      page: 'time-taken',
      online: true,
      lastSeen: serverTimestamp(),
    }).then(() => {
      // Increment global online counter
      setDoc(counterRef, { count: increment(1) }, { merge: true });
    }).catch(err => console.error('[TrafficIQ] Presence set failed:', err));
  }

  // Remove presence on leave
  function goOffline() {
    if (!registered) return;
    registered = false;
    try {
      setDoc(counterRef, { count: increment(-1) }, { merge: true }).catch(() => { });
      deleteDoc(presenceRef).catch(() => { });
    } catch (e) { /* best effort */ }
  }

  // Heartbeat: update lastSeen every 30s so stale sessions can be cleaned
  setInterval(() => {
    if (registered) {
      setDoc(presenceRef, { lastSeen: serverTimestamp() }, { merge: true }).catch(() => { });
    }
  }, 30000);

  // Listen for real online count
  onSnapshot(counterRef, (snap) => {
    const count = snap.exists() ? Math.max(0, snap.data().count || 0) : 0;
    const el = document.getElementById('tbOnline');
    if (el) animCount('tbOnline', count);
  });

  goOnline();

  // Cleanup on page leave
  window.addEventListener('beforeunload', goOffline);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') goOffline();
    else goOnline();
  });
}


/* ══ CAST VOTE ══ */
function castVote(key, btn) {
  if (S.userVoted) return;
  S.userVoted = true;
  document.querySelectorAll('.ip-btn').forEach(b => b.classList.add('voted'));
  gsap.fromTo(btn, { scale: .88 }, { scale: 1, duration: .35, ease: 'back.out(2)' });

  const msgs = {
    long: ["Reporting 1+ hour delay from where I am. Not moving at all.", "It's bad — easily over an hour. Voted accordingly."],
    med: ['Around 30 minutes delay here. Signal is slow but moving.', 'Voted 30 mins — traffic is moderate but steady.'],
    short: ['Almost through! Less than 10 mins from here. Clearing fast!', 'Quick update: voted <10 min. Road opened up!'],
  };
  const msg = msgs[key][Math.floor(Math.random() * msgs[key].length)];

  showMsgOptimistic(S.name, msg, key);
  if (window._saveToFirestore) window._saveToFirestore(S.name, msg, key);
}


/* ══ TRIGGER SEND ══ */
function trigSend(btn) {
  const msg = btn.dataset.msg;
  const vote = btn.dataset.vote;
  const inp = document.getElementById('chatInp');
  inp.value = msg;
  inp.focus();
  inp.dataset.pendingVote = vote || '';
  gsap.fromTo(btn, { scale: .9 }, { scale: 1, duration: .3, ease: 'back.out(2)' });
}


/* ══ MANUAL SEND ══ */
function sendMsg() {
  const inp = document.getElementById('chatInp');
  const txt = inp.value.trim();
  if (!txt) return;

  const vote = inp.dataset.pendingVote || null;
  inp.value = '';
  inp.dataset.pendingVote = '';

  gsap.fromTo('.send-btn', { scale: .88 }, { scale: 1, duration: .28, ease: 'back.out(2)' });

  showMsgOptimistic(S.name, txt, vote || null);
  if (window._saveToFirestore) window._saveToFirestore(S.name, txt, vote || null);
}

document.getElementById('chatInp').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMsg();
});


/* ══ MOBILE PANEL ══ */
const panel = document.getElementById('panel');
const overlay = document.getElementById('mobOverlay');
function togglePanel() { panel.classList.toggle('open'); overlay.classList.toggle('show'); }
document.getElementById('panTog').addEventListener('click', togglePanel);


/* ══ GSAP ENTRANCE ══ */
window.addEventListener('DOMContentLoaded', () => {
  gsap.to('#topbar', { y: 0, opacity: 1, duration: .6, ease: 'power3.out', delay: .1 });
  gsap.to('#panel', { x: 0, opacity: 1, duration: .75, ease: 'power3.out', delay: .25 });
  gsap.from('.stream', { opacity: 0, duration: .5, ease: 'power2.out', delay: .35 });
  gsap.from('.poll-card', { x: -18, opacity: 0, stagger: .1, duration: .5, ease: 'power2.out', delay: .4 });
  gsap.from('.trend-block', { y: 12, opacity: 0, duration: .5, ease: 'power2.out', delay: .62 });
  gsap.from('.graph-block', { y: 12, opacity: 0, duration: .5, ease: 'power2.out', delay: .70 });
  gsap.from('.avg-block', { y: 12, opacity: 0, duration: .5, ease: 'power2.out', delay: .78 });
  setTimeout(redrawGraph, 500);
});

window.addEventListener('resize', redrawGraph);