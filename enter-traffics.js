import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, onSnapshot,
  doc, updateDoc, increment, query, orderBy, setDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAKGbbt_ARGWep8ggPuk_iE6R1xALkmJM8",
  authDomain: "trafficiq-3ef14.firebaseapp.com",
  databaseURL: "https://trafficiq-3ef14-default-rtdb.firebaseio.com",
  projectId: "trafficiq-3ef14",
  storageBucket: "trafficiq-3ef14.firebasestorage.app",
  messagingSenderId: "97313655693",
  appId: "1:97313655693:web:fee4304d7815bdceaf0bc4",
  measurementId: "G-N8CC0BE6HS"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const params = new URLSearchParams(window.location.search);
const urlCity = params.get("city");

if (urlCity) {
  localStorage.setItem("tiq-city", urlCity);
}

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
/* TrafficIQ — time-taken.js
Go/NoGo Decision Intelligence
Same architecture as enter-traffic.js
 ─────────────────────────────────────────────── */
'use strict';

/* ══ THREE.JS HIGHWAY BACKGROUND (same shader) ══ */
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
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uDark; varying vec2 vUv;
      float grid(vec2 uv,float s,float t){vec2 g=abs(fract(uv/s-.5)-.5)/fwidth(uv/s);return 1.0-min(min(g.x,g.y),1.0)*t;}
      float road(float c,float p,float w){return smoothstep(w,w*.4,abs(c-p));}
      float streak(vec2 uv,float ry,float off,float spd,float len){
        float x=fract(uv.x*.6+uTime*spd+off);
        float onRoad=road(uv.y,ry,0.006);
        float trail=smoothstep(len,0.0,x)*smoothstep(0.0,0.01,x);
        return trail*onRoad;
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
      }
    `,
  });
  const geo = new THREE.PlaneGeometry(2, 2);
  scene.add(new THREE.Mesh(geo, mat));
  let t = 0;
  (function tick() { requestAnimationFrame(tick); t += 0.008; mat.uniforms.uTime.value = t; renderer.render(scene, camera); })();
  addEventListener('resize', () => renderer.setSize(innerWidth, innerHeight));
  window._bgMat = mat;
})();


/* ══ STATE ══ */
const S = {
  theme: localStorage.getItem('tiq-theme') || 'dark',
  city:  localStorage.getItem('tiq-city')  || 'Mumbai',
  name:  localStorage.getItem('tiq-name')  || 'You',
  goVotes: 0,
  noVotes: 0,
  userVoted: false,
};

const SESSION_ID = crypto.randomUUID();
const presenceRef = doc(db, "trafficRooms", ROOM_ID, "presence", SESSION_ID);
const presenceCol = collection(db, "trafficRooms", ROOM_ID, "presence");

async function updatePresence() {
  await setDoc(presenceRef, {
    lastSeen: serverTimestamp()
  });
}

updatePresence();
setInterval(updatePresence, 15000);

onSnapshot(presenceCol, (snapshot) => {
  const now = Date.now();
  let online = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.lastSeen) return;
    const lastSeen = data.lastSeen.toMillis();
    if (now - lastSeen < 30000) {
      online++;
    }
  });
  document.getElementById("tbOnline").textContent = online;
});

/* ══ THEME ══ */
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('themeBtn').textContent = t === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('tiq-theme', S.theme = t);
  if (window._bgMat) window._bgMat.uniforms.uDark.value = t === 'dark' ? 1 : 0;
}
setTheme(S.theme);
document.getElementById('themeBtn').addEventListener('click', () => setTheme(S.theme === 'dark' ? 'light' : 'dark'));
document.getElementById('tbCity').textContent = S.city;


/* ══ VOTE ENGINE ══ */
const REASONS = {
  go:    ['Traffic clearing in ~10 mins', 'Road looks manageable now', 'Alternate lane open, moving well', 'Service road bypass confirmed clear'],
  avoid: ['Accident reported ahead', 'Heavy congestion at junction', 'Avoid flyover — completely jammed', '30+ min delay reported by locals'],
};

function getTopReason() {
  const src = S.goVotes >= S.noVotes ? REASONS.go : REASONS.avoid;
  return src[Math.floor(Math.random() * src.length)];
}

function calcRisk() {
  const total = S.goVotes + S.noVotes;
  if (!total) return 0;
  const avoidRatio = S.noVotes / total;
  return Math.round(10 + avoidRatio * 85);
}

let countTimers = {};

function animateCount(elId, target, suffix = '') {
  if (countTimers[elId]) cancelAnimationFrame(countTimers[elId]);
  const el = document.getElementById(elId);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const dur = 700;
  const t0 = performance.now();
  function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(start + (target - start) * ease) + suffix;
    if (p < 1) countTimers[elId] = requestAnimationFrame(step);
  }
  countTimers[elId] = requestAnimationFrame(step);
}

function updatePanel() {
  const total = S.goVotes + S.noVotes;
  const goP   = total ? Math.round((S.goVotes / total) * 100) : 0;
  const noP   = total ? 100 - goP : 0;
  const risk  = calcRisk();
  const majority = goP >= noP ? 'go' : 'avoid';

  animateCount('tbVotes', total);

  document.getElementById('vbGo').style.width = goP + '%';
  document.getElementById('vbNo').style.width = noP + '%';
  animateCount('yesPct', goP, '%');
  animateCount('noPct', noP, '%');
  animateCount('totalVotes', total);

  const majGo    = document.getElementById('majGo');
  const majAvoid = document.getElementById('majAvoid');
  majGo.classList.toggle('dominant', majority === 'go');
  majAvoid.classList.toggle('dominant', majority === 'avoid');

  const ring = document.getElementById('riskFill');
  const offset = 314 - (risk / 100) * 314;
  ring.style.strokeDashoffset = offset;
  animateCount('riskNum', risk);

  const riskNumEl = document.getElementById('riskNum');
  const stop1 = document.getElementById('riskStop1');
  const stop2 = document.getElementById('riskStop2');
  let rColor, rLabel, rGlow;
  if (risk < 35) {
    rColor = '#22c55e'; rLabel = 'Low Risk — Safe to proceed'; rGlow = 'rgba(34,197,94,.5)';
  } else if (risk < 65) {
    rColor = '#f59e0b'; rLabel = 'Moderate Risk — Use caution'; rGlow = 'rgba(245,158,11,.5)';
  } else {
    rColor = '#ef4444'; rLabel = 'High Risk — Consider avoiding'; rGlow = 'rgba(239,68,68,.5)';
  }
  riskNumEl.style.color = rColor;
  stop1.setAttribute('stop-color', rColor);
  stop2.setAttribute('stop-color', rColor);
  ring.style.filter = `drop-shadow(0 0 6px ${rGlow})`;
  document.getElementById('riskLabelTxt').textContent = rLabel;

  const badge   = document.getElementById('recBadge');
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
      dot.style.background = '#22c55e';
      dot.style.boxShadow  = '0 0 6px rgba(34,197,94,.6)';
    } else {
      dot.style.background = '#ef4444';
      dot.style.boxShadow  = '0 0 6px rgba(239,68,68,.6)';
    }
    const card = document.getElementById('reasonCard');
    gsap.fromTo(card, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: .4, ease: 'power2.out' });
  }
}

onSnapshot(roomRef, (docSnap) => {
  if (!docSnap.exists()) return;
  const data = docSnap.data();
  S.goVotes = data.goVotes || 0;
  S.noVotes = data.noVotes || 0;
  updatePanel();
});

/* Cast vote from GO/AVOID big buttons */
async function castVote(type, btn) {
  try {
    console.log("Vote attempt started");
    if (S.userVoted) return;
    S.userVoted = true;

    await updateDoc(roomRef, {
      [type === "go" ? "goVotes" : "noVotes"]: increment(1),
      lastVoteAt: serverTimestamp()
    });

    console.log("Vote successfully stored");

    const rc = btn.querySelector('.ripple-c');
    const rip = document.createElement('span');
    rip.className = 'ripple';
    rip.style.cssText = `width:100px;height:100px;left:0px;top:0px`;
    rc.appendChild(rip);
    setTimeout(() => rip.remove(), 600);

    gsap.fromTo(btn, { scale: .92 }, { scale: 1, duration: .35, ease: 'back.out(2)' });

    document.getElementById('goBtn').classList.add('voted');
    document.getElementById('avoidBtn').classList.add('voted');

    const msgs = {
      go:    ['I just voted GO — traffic looks fine from my end.', 'Went in — it\'s moving. Voted GO!'],
      avoid: ['Voted AVOID — don\'t risk it right now.', 'Voting NO — still pretty bad ahead.'],
    };

    const txt = msgs[type][Math.floor(Math.random() * msgs[type].length)];

    await addDoc(messagesRef, {
      name: S.name,
      role: type === 'go' ? 'g' : 'r',
      init: S.name.substring(0, 2).toUpperCase(),
      vote: type,
      msg: txt,
      createdAt: serverTimestamp()
    });

  } catch (err) {
    console.error("Vote failed:", err);
  }
}


/* ══ FEED ══ */
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

function timeStr() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

function addMsg({ name, role, init, vote = null, msg, own = false }) {
  const el = document.createElement('div');
  el.className = `msg${own ? ' own' : ''}`;

  const voteChip = vote
    ? `<span class="vote-chip ${vote}">${vote === 'go' ? '✓ GO' : '✕ AVOID'}</span>`
    : '';

  const bubbleClass = vote ? `bubble ${vote}-bubble` : 'bubble';

  el.innerHTML = `
    <div class="av ${role}" data-tip="${name}">${init}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-name">${name}</span>
        ${voteChip}
        <span class="msg-time">${timeStr()}</span>
      </div>
      <div class="${bubbleClass}">${msg}</div>
    </div>
  `;

  feed.appendChild(el);
  if (!userScrolled) scrollToBottom();
  else scrollBtn.classList.add('show');
}

const q = query(messagesRef, orderBy("createdAt"));

onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach(change => {
    const m = change.doc.data();
    if (change.type === "added") {
      addMsg({
        name: m.name,
        role: m.role,
        init: m.init,
        vote: m.vote,
        msg: m.msg,
        own: m.name === S.name
      });
    }
  });
});


/* ══ TRIGGER SEND ══ */
async function trigSend(btn) {
  if (S.userVoted) return;
  S.userVoted = true;

  const msg  = btn.dataset.msg;
  const vote = btn.dataset.vote;

  await updateDoc(roomRef, {
    [vote === 'go' ? 'goVotes' : 'noVotes']: increment(1),
    lastVoteAt: serverTimestamp()
  });

  await addDoc(messagesRef, {
    name: S.name,
    role: vote === 'go' ? 'g' : 'r',
    init: S.name.substring(0, 2).toUpperCase(),
    vote,
    msg,
    createdAt: serverTimestamp()
  });

  document.getElementById('goBtn').classList.add('voted');
  document.getElementById('avoidBtn').classList.add('voted');

  gsap.fromTo(btn, { scale: .9 }, { scale: 1, duration: .3, ease: 'back.out(2)' });
}


/* ══ SEND (manual input) ══ */
async function sendMsg() {
  const inp = document.getElementById('chatInp');
  const txt = inp.value.trim();
  if (!txt) return;

  await addDoc(messagesRef, {
    name: S.name,
    role: "b",
    init: S.name.substring(0, 2).toUpperCase(),
    vote: null,
    msg: txt,
    createdAt: serverTimestamp()
  });

  inp.value = "";
}
document.getElementById('chatInp').addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });

/* ══ MOBILE PANEL TOGGLE ══ */
const panel = document.getElementById('panel');
const overlay = document.getElementById('mobOverlay');

function togglePanel() {
  panel.classList.toggle('open');
  overlay.classList.toggle('show');
}

/* Desktop panel toggle button (top-right) */
document.getElementById('panTog').addEventListener('click', togglePanel);


/* ══ GSAP ENTRANCE ══ */
window.addEventListener('DOMContentLoaded', () => {
  gsap.to('#topbar',     { y: 0, opacity: 1, duration: .6, ease: 'power3.out', delay: .1 });
  gsap.to('#panel',      { x: 0, opacity: 1, duration: .75, ease: 'power3.out', delay: .25 });
  gsap.from('.stream',   { opacity: 0, duration: .5, ease: 'power2.out', delay: .35 });
  gsap.from('.question-block', { y: 14, opacity: 0, duration: .5, ease: 'power2.out', delay: .42 });
  gsap.from('.majority-block', { y: 14, opacity: 0, duration: .5, ease: 'power2.out', delay: .52 });
  gsap.from('.votebar-block',  { y: 14, opacity: 0, duration: .5, ease: 'power2.out', delay: .6 });
  gsap.from('.risk-block',     { y: 14, opacity: 0, duration: .5, ease: 'power2.out', delay: .68 });
  gsap.from('.rec-block',      { y: 14, opacity: 0, duration: .5, ease: 'power2.out', delay: .74 });
  gsap.from('.reason-block',   { y: 14, opacity: 0, duration: .5, ease: 'power2.out', delay: .80 });
  gsap.from('.vote-btns',      { y: 14, opacity: 0, duration: .5, ease: 'power2.out', delay: .86 });

  document.getElementById("goBtn")
    .addEventListener("click", function () { castVote("go", this); });

  document.getElementById("avoidBtn")
    .addEventListener("click", function () { castVote("avoid", this); });

  document.getElementById("scrollBtn")
    .addEventListener("click", scrollToBottom);

  document.querySelector(".send-btn")
    .addEventListener("click", sendMsg);

  /* Overlay click closes panel */
  document.getElementById("mobOverlay")
    .addEventListener("click", togglePanel);

  /* Mobile hamburger menu button */
  const mobMenuBtn = document.getElementById("mobMenuBtn");
  if (mobMenuBtn) {
    mobMenuBtn.addEventListener("click", togglePanel);
  }

  /* Close button inside the panel */
  const panelCloseBtn = document.getElementById("panelCloseBtn");
  if (panelCloseBtn) {
    panelCloseBtn.addEventListener("click", togglePanel);
  }

  /* ══ TRIGGER PREFILL ══ */
  const triggerButtons = document.querySelectorAll(".trig");
  const chatInput = document.getElementById("chatInp");

  triggerButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const message = btn.dataset.msg;
      chatInput.value = message;
      chatInput.focus();
      chatInput.setSelectionRange(message.length, message.length);
    });
  });
});