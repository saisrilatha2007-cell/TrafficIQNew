import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  doc, updateDoc, setDoc, deleteDoc, increment, query, orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAKGbbt_ARGWep8ggPuk_iE6R1xALkmJM8",
  authDomain: "trafficiq-3ef14.firebaseapp.com",
  databaseURL: "https://trafficiq-3ef14-default-rtdb.firebaseio.com",
  projectId: "trafficiq-3ef14",
  storageBucket: "trafficiq-3efirebasestorage.app",
  messagingSenderId: "97313655693",
  appId: "1:97313655693:web:fee4304d7815bdceaf0bc4",
  measurementId: "G-N8CC0BE6HS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ── City / room setup ───────────────────────────── */
const params = new URLSearchParams(window.location.search);
const urlCity = params.get("city");
if (urlCity) localStorage.setItem("tiq-city", urlCity);

const ROOM_ID = localStorage.getItem("tiq-city");
if (!ROOM_ID) {
  alert("No city selected. Redirecting...");
  window.location.href = "../Home/dashboard.html";
  throw new Error("City missing");
}

const roomRef = doc(db, "trafficRooms", ROOM_ID);
const messagesRef = collection(db, "trafficRooms", ROOM_ID, "messages");

window.db = db;
window.auth = auth;

/* ══ THREE.JS HIGHWAY BACKGROUND ══ */
'use strict';
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
        vec3 db=vec3(0.016,0.031,0.082); vec3 lb=vec3(0.906,0.937,0.980);
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
        col+=vec3(0.0,0.75,1.0)*ix*0.18*uDark;
        col+=vec3(0.1,0.4,0.9)*ix*0.10*(1.0-uDark);
        float v=length(uv-.5)*1.2; col*=1.0-v*v*mix(.2,.5,uDark);
        gl_FragColor=vec4(col,mix(.22,.72,uDark));
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  let t = 0;
  (function tick() { requestAnimationFrame(tick); t += 0.008; mat.uniforms.uTime.value = t; renderer.render(scene, camera); })();
  addEventListener('resize', () => renderer.setSize(innerWidth, innerHeight));
  window._bgMat = mat;
})();

/* ══ STATE ══ */
const S = {
  theme: localStorage.getItem('tiq-theme') || 'dark',
  city: localStorage.getItem('tiq-city') || 'Mumbai',
  name: localStorage.getItem('tiq-name') || 'You',
  goVotes: 0,
  noVotes: 0,
  userVoted: false,
  /* like persistence — keyed separately from shortcuts page */
  likedKeys: new Set(JSON.parse(localStorage.getItem('tiq-tt-liked-keys') || '[]')),
};

function persistLiked() {
  localStorage.setItem('tiq-tt-liked-keys', JSON.stringify([...S.likedKeys]));
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
document.getElementById('tbCity').textContent = S.city;

/* ══ VOTE ENGINE ══ */
const REASONS = {
  go: ['Traffic clearing in ~10 mins', 'Road looks manageable now', 'Alternate lane open, moving well', 'Service road bypass confirmed clear'],
  avoid: ['Accident reported ahead', 'Heavy congestion at junction', 'Avoid flyover — completely jammed', '30+ min delay reported by locals'],
};

function getTopReason() {
  const src = S.goVotes >= S.noVotes ? REASONS.go : REASONS.avoid;
  return src[Math.floor(Math.random() * src.length)];
}

function calcRisk() {
  const total = S.goVotes + S.noVotes;
  if (!total) return 0;
  return Math.round(10 + (S.noVotes / total) * 85);
}

let countTimers = {};
function animateCount(elId, target, suffix = '') {
  if (countTimers[elId]) cancelAnimationFrame(countTimers[elId]);
  const el = document.getElementById(elId);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const t0 = performance.now();
  (function step(now) {
    const p = Math.min((now - t0) / 700, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(start + (target - start) * ease) + suffix;
    if (p < 1) countTimers[elId] = requestAnimationFrame(step);
  })(t0);
}

function updatePanel() {
  const total = S.goVotes + S.noVotes;
  const goP = total ? Math.round((S.goVotes / total) * 100) : 0;
  const noP = total ? 100 - goP : 0;
  const risk = calcRisk();
  const majority = goP >= noP ? 'go' : 'avoid';

  animateCount('tbVotes', total);
  document.getElementById('vbGo').style.width = goP + '%';
  document.getElementById('vbNo').style.width = noP + '%';
  animateCount('yesPct', goP, '%');
  animateCount('noPct', noP, '%');
  animateCount('totalVotes', total);

  document.getElementById('majGo').classList.toggle('dominant', majority === 'go');
  document.getElementById('majAvoid').classList.toggle('dominant', majority === 'avoid');

  const ring = document.getElementById('riskFill');
  ring.style.strokeDashoffset = 314 - (risk / 100) * 314;
  animateCount('riskNum', risk);

  const riskNumEl = document.getElementById('riskNum');
  const stop1 = document.getElementById('riskStop1');
  const stop2 = document.getElementById('riskStop2');
  let rColor, rLabel, rGlow;
  if (risk < 35) { rColor = '#22c55e'; rLabel = 'Low Risk — Safe to proceed'; rGlow = 'rgba(34,197,94,.5)'; }
  else if (risk < 65) { rColor = '#f59e0b'; rLabel = 'Moderate Risk — Use caution'; rGlow = 'rgba(245,158,11,.5)'; }
  else { rColor = '#ef4444'; rLabel = 'High Risk — Consider avoiding'; rGlow = 'rgba(239,68,68,.5)'; }
  riskNumEl.style.color = rColor;
  stop1.setAttribute('stop-color', rColor);
  stop2.setAttribute('stop-color', rColor);
  ring.style.filter = `drop-shadow(0 0 6px ${rGlow})`;
  document.getElementById('riskLabelTxt').textContent = rLabel;

  const badge = document.getElementById('recBadge');
  const recIcon = document.getElementById('recIcon');
  const recText = document.getElementById('recText');
  badge.classList.remove('go-rec', 'avoid-rec');
  if (!total) {
    recIcon.textContent = '—';
    recText.textContent = 'Awaiting community data';
  } else if (majority === 'go') {
    badge.classList.add('go-rec');
    recIcon.textContent = '✓';
    recText.textContent = 'Suggested: Go';
  } else {
    badge.classList.add('avoid-rec');
    recIcon.textContent = '✕';
    recText.textContent = 'Suggested: Avoid';
  }

  if (total > 0) {
    const reason = getTopReason();
    const dot = document.getElementById('reasonDot');
    const txt = document.getElementById('reasonTxt');
    txt.textContent = reason;
    if (majority === 'go') {
      dot.style.background = '#22c55e'; dot.style.boxShadow = '0 0 6px rgba(34,197,94,.6)';
    } else {
      dot.style.background = '#ef4444'; dot.style.boxShadow = '0 0 6px rgba(239,68,68,.6)';
    }
    gsap.fromTo(document.getElementById('reasonCard'),
      { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: .4, ease: 'power2.out' });
  }
}

onSnapshot(roomRef, docSnap => {
  if (!docSnap.exists()) return;
  const data = docSnap.data();
  S.goVotes = data.goVotes || 0;
  S.noVotes = data.noVotes || 0;
  updatePanel();
});

/* ══ CAST VOTE (GO / AVOID big buttons) ══ */
async function castVote(type, btn) {
  try {
    if (S.userVoted) return;
    S.userVoted = true;

    await updateDoc(roomRef, {
      [type === 'go' ? 'goVotes' : 'noVotes']: increment(1),
      lastVoteAt: serverTimestamp()
    });

    /* ripple */
    const rc = btn.querySelector('.ripple-c');
    const rip = document.createElement('span');
    rip.className = 'ripple';
    rip.style.cssText = 'width:100px;height:100px;left:0px;top:0px';
    rc.appendChild(rip);
    setTimeout(() => rip.remove(), 600);

    gsap.fromTo(btn, { scale: .92 }, { scale: 1, duration: .35, ease: 'back.out(2)' });
    document.getElementById('goBtn').classList.add('voted');
    document.getElementById('avoidBtn').classList.add('voted');

    const msgs = {
      go: ['I just voted GO — traffic looks fine from my end.', "Went in — it's moving. Voted GO!"],
      avoid: ["Voted AVOID — don't risk it right now.", 'Voting NO — still pretty bad ahead.'],
    };
    await addDoc(messagesRef, {
      name: S.name, role: type === 'go' ? 'g' : 'r',
      init: S.name.substring(0, 2).toUpperCase(), vote: type,
      msg: msgs[type][Math.floor(Math.random() * msgs[type].length)],
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Vote failed:', err);
  }
}

/* ══ LIKE A MESSAGE ══
   Dual-collection write — mirrors shortcuts.js exactly:
     messageLikeCounts/{msgId}  → per-message count shown on like button
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

  const msgLikeCountRef = doc(db, 'messageLikeCounts', msgId);
  const authorDocRef = doc(db, 'message_likes', authorName);
  const likerDocRef = doc(db, 'message_likes', authorName, 'likers', safeKey);

  setDoc(likerDocRef, {
    likedAt: serverTimestamp(), liker: S.name, msgId, page: 'time-taken',
  })
    .then(() => Promise.all([
      setDoc(msgLikeCountRef,
        { likeCount: increment(1), lastUpdated: serverTimestamp() },
        { merge: true }),
      setDoc(authorDocRef,
        { authorName, likeCount: increment(1), lastUpdated: serverTimestamp() },
        { merge: true }),
    ]))
    .then(() => console.log('[TrafficIQ] ✅ Like saved (time-taken). msgId:', msgId, '| author:', authorName))
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
   Watches messageLikeCounts/{msgId} — isolated per message,
   not per author — so each button tracks only its own message.
   ══════════════════════════════════════════════════════════ */
const likeListeners = {};

function subscribeLikes(msgId, btnEl) {
  if (!likeListeners[msgId]) {
    likeListeners[msgId] = {
      unsub: onSnapshot(
        doc(db, 'messageLikeCounts', msgId),
        snap => {
          const count = snap.exists() ? (snap.data().likeCount || 0) : 0;
          likeListeners[msgId]?.btns.forEach(b => {
            const c = b.querySelector('.like-count');
            if (!c) return;
            /* if optimistic-liked, only update upward to prevent flicker */
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

/* ══ FEED ══ */
const feed = document.getElementById('feed');
const scrollBtn = document.getElementById('scrollBtn');
let userScrolled = false;
const renderedIds = new Set();

feed.addEventListener('scroll', () => {
  userScrolled = feed.scrollHeight - feed.scrollTop - feed.clientHeight > 40;
  scrollBtn.classList.toggle('show', userScrolled);
});
function scrollToBottom() {
  feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
  userScrolled = false;
  scrollBtn.classList.remove('show');
}
function timeStr() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

/* ══ ADD MESSAGE ══ */
function addMsg({ id, name, role, init, vote = null, msg, own = false }) {
  if (id && renderedIds.has(id)) return;
  if (id) renderedIds.add(id);

  const isTemp = !id || id.startsWith('temp-');
  const likeKey = S.name + '__' + id;
  const alreadyLiked = !isTemp && S.likedKeys.has(likeKey);
  const isOwnMsg = name === S.name;

  const voteChip = vote
    ? `<span class="vote-chip ${vote}">${vote === 'go' ? '✓ GO' : '✕ AVOID'}</span>`
    : '';
  const bubbleClass = vote ? `bubble ${vote}-bubble` : 'bubble';

  const el = document.createElement('div');
  el.className = `msg${own ? ' own' : ''}`;
  if (id) el.dataset.docId = id;

  el.innerHTML = `
    <div class="av ${role}" data-tip="${name}">${init}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-name">${name}</span>
        ${voteChip}
        <span class="msg-time">${timeStr()}</span>
      </div>
      <div class="${bubbleClass}">${msg}</div>
      <div class="msg-actions">
        <button class="upvote-btn" data-base="0">▲ <span class="vc">0</span></button>
        ${!isTemp ? `
        <button
          class="like-btn${alreadyLiked ? ' liked' : ''}${isOwnMsg ? ' own-msg' : ''}"
          title="${isOwnMsg ? "Can't like your own message" : alreadyLiked ? 'Already liked' : 'Like this report'}"
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

/* ══ FIRESTORE FEED LISTENER ══ */
const q = query(messagesRef, orderBy('createdAt'));
onSnapshot(q, snapshot => {
  snapshot.docChanges().forEach(change => {
    if (change.type !== 'added') return;
    const d = change.doc.data();
    addMsg({
      id: change.doc.id,
      name: d.name || 'User',
      role: d.role || 'b',
      init: d.init || (d.name || 'U').substring(0, 2).toUpperCase(),
      vote: d.vote || null,
      msg: d.msg || '',
      own: d.name === S.name,
    });
  });
});

/* ══ TRIGGER SEND ══ */
async function trigSend(btn) {
  if (S.userVoted) return;
  S.userVoted = true;
  const msg = btn.dataset.msg;
  const vote = btn.dataset.vote;
  await updateDoc(roomRef, {
    [vote === 'go' ? 'goVotes' : 'noVotes']: increment(1),
    lastVoteAt: serverTimestamp()
  });
  await addDoc(messagesRef, {
    name: S.name, role: vote === 'go' ? 'g' : 'r',
    init: S.name.substring(0, 2).toUpperCase(), vote, msg,
    createdAt: serverTimestamp(),
  });
  document.getElementById('goBtn').classList.add('voted');
  document.getElementById('avoidBtn').classList.add('voted');
  gsap.fromTo(btn, { scale: .9 }, { scale: 1, duration: .3, ease: 'back.out(2)' });
}

/* ══ MANUAL SEND ══ */
async function sendMsg() {
  const inp = document.getElementById('chatInp');
  const txt = inp.value.trim();
  if (!txt) return;
  await addDoc(messagesRef, {
    name: S.name, role: 'b',
    init: S.name.substring(0, 2).toUpperCase(),
    vote: null, msg: txt, createdAt: serverTimestamp(),
  });
  inp.value = '';
}
document.getElementById('chatInp').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMsg();
});

/* ══ MOBILE PANEL TOGGLE ══ */
function togglePanel() {
  document.getElementById('panel').classList.toggle('open');
  document.getElementById('mobOverlay').classList.toggle('show');
}
document.getElementById('panTog').addEventListener('click', togglePanel);

/* ══ GSAP ENTRANCE + EVENT WIRING ══ */
window.addEventListener('DOMContentLoaded', () => {
  gsap.to('#topbar', { y: 0, opacity: 1, duration: .6, ease: 'power3.out', delay: .1 });
  gsap.to('#panel', { x: 0, opacity: 1, duration: .75, ease: 'power3.out', delay: .25 });
  gsap.from('.stream', { opacity: 0, duration: .5, ease: 'power2.out', delay: .35 });
  gsap.from('.question-block', { y: 14, opacity: 0, duration: .5, ease: 'power2.out', delay: .42 });
  gsap.from('.majority-block', { y: 14, opacity: 0, duration: .5, ease: 'power2.out', delay: .52 });
  gsap.from('.votebar-block', { y: 14, opacity: 0, duration: .5, ease: 'power2.out', delay: .60 });
  gsap.from('.risk-block', { y: 14, opacity: 0, duration: .5, ease: 'power2.out', delay: .68 });
  gsap.from('.rec-block', { y: 14, opacity: 0, duration: .5, ease: 'power2.out', delay: .74 });
  gsap.from('.reason-block', { y: 14, opacity: 0, duration: .5, ease: 'power2.out', delay: .80 });
  gsap.from('.vote-btns', { y: 14, opacity: 0, duration: .5, ease: 'power2.out', delay: .86 });

  document.getElementById('goBtn')
    .addEventListener('click', function () { castVote('go', this); });
  document.getElementById('avoidBtn')
    .addEventListener('click', function () { castVote('avoid', this); });
  document.getElementById('scrollBtn')
    .addEventListener('click', scrollToBottom);
  document.querySelector('.send-btn')
    .addEventListener('click', sendMsg);
  document.getElementById('mobOverlay')
    .addEventListener('click', togglePanel);

  /* Trigger buttons — prefill input */
  document.querySelectorAll('.trig').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById('chatInp');
      inp.value = btn.dataset.msg;
      inp.focus();
      inp.setSelectionRange(btn.dataset.msg.length, btn.dataset.msg.length);
    });
  });
});


/* ══ ONLINE PRESENCE TRACKING ══ */
(function trackOnlinePresence() {
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const presenceRef = doc(db, 'enterTrafficPresence', sessionId);
  const counterRef = doc(db, 'enterTrafficOnlineCount', 'counter');
  let registered = false;

  function goOnline() {
    if (registered) return;
    registered = true;
    setDoc(presenceRef, {
      name: S.name,
      city: S.city,
      page: 'enter-traffic',
      online: true,
      lastSeen: serverTimestamp(),
    }).then(() => {
      setDoc(counterRef, { count: increment(1) }, { merge: true });
    }).catch(err => console.error('[TrafficIQ] Presence set failed:', err));
  }

  function goOffline() {
    if (!registered) return;
    registered = false;
    try {
      setDoc(counterRef, { count: increment(-1) }, { merge: true }).catch(() => { });
      deleteDoc(presenceRef).catch(() => { });
    } catch (e) { /* best effort */ }
  }

  // Heartbeat: update lastSeen every 30s
  setInterval(() => {
    if (registered) {
      setDoc(presenceRef, { lastSeen: serverTimestamp() }, { merge: true }).catch(() => { });
    }
  }, 30000);

  // Listen for real online count
  onSnapshot(counterRef, (snap) => {
    const count = snap.exists() ? Math.max(0, snap.data().count || 0) : 0;
    animateCount('tbOnline', count);
  });

  goOnline();

  window.addEventListener('beforeunload', goOffline);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') goOffline();
    else goOnline();
  });
})();