/* TrafficIQ — trusted-users.js (Legends Leaderboard) */
'use strict';

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAKGbbt_ARGWep8ggPuk_iE6R1xALkmJM8",
  authDomain: "trafficiq-3ef14.firebaseapp.com",
  projectId: "trafficiq-3ef14",
  storageBucket: "trafficiq-3ef14.firebasestorage.app",
  messagingSenderId: "97313655693",
  appId: "1:97313655693:web:fee4304d7815bdceaf0bc4",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

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
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uDark; varying vec2 vUv;
      float grid(vec2 uv,float s,float t){vec2 g=abs(fract(uv/s-.5)-.5)/fwidth(uv/s);return 1.0-min(min(g.x,g.y),1.0)*t;}
      float road(float c,float p,float w){return smoothstep(w,w*.4,abs(c-p));}
      float streak(vec2 uv,float ry,float off,float spd,float len){
        float x=fract(uv.x*.6+uTime*spd+off);
        return smoothstep(len,0.0,x)*smoothstep(0.0,0.01,x)*road(uv.y,ry,0.006);
      }
      void main(){
        vec2 uv=vUv;
        vec3 bg=mix(vec3(0.906,0.937,0.980),vec3(0.016,0.031,0.082),uDark);
        float g=grid(uv*vec2(6.0,4.0),1.0,1.8);
        vec3 col=mix(bg,mix(vec3(0.85,0.88,0.92),vec3(0.06,0.12,0.22),uDark),g*mix(0.25,0.12,uDark));
        float roads=max(max(road(uv.y,.25,.018),road(uv.y,.50,.022)),max(road(uv.y,.75,.018),max(road(uv.x,.33,.016),road(uv.x,.66,.016))));
        col=mix(col,mix(vec3(0.78,0.82,0.88),vec3(0.08,0.14,0.28),uDark),roads);
        col=mix(col,vec3(1.0,0.85,0.15),road(uv.y,.50,.002)*.55*uDark);
        vec2 fl=vec2(1.0-uv.x,uv.y);
        col+=vec3(0.9,0.15,0.1)*(streak(uv,.498,0.,.18,.08)+streak(uv,.502,.3,.14,.06))*uDark;
        col+=vec3(0.85,0.90,1.0)*(streak(fl,.495,.1,.22,.07)+streak(fl,.505,.6,.17,.05))*uDark;
        float v=length(uv-.5)*1.2; col*=1.0-v*v*mix(.2,.5,uDark);
        gl_FragColor=vec4(col,mix(.22,.72,uDark));
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  let t = 0;
  (function tick(){ requestAnimationFrame(tick); t+=0.008; mat.uniforms.uTime.value=t; renderer.render(scene,camera); })();
  addEventListener('resize', () => renderer.setSize(innerWidth, innerHeight));
  window._bgMat = mat;
})();

/* ══ STATE ══ */
const S = {
  theme:       localStorage.getItem('tiq-theme') || 'dark',
  myName:      localStorage.getItem('tiq-name')  || '',
  coins:       0,
  initialised: false,
};

/* ══ REWARD RANGES ══ */
const REWARD_RANGES = {
  recharge20:    100,
  voucher50:     250,
  verifiedBadge: 350,
  legendStatus:  1000,
};

/* ══ BADGE RANGES ══ */
const BADGE_RANGES = {
  newcomer: 1200,
  pro:      1400,
  onfire:   1600,
  elite:    1700,
  verified: 1800,
  legend:   2000,
};

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

/* ══ HELPERS ══ */
function initials(name) {
  if (!name) return '??';
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}
function roleColor(coins) {
  return coins >= 500 ? 'g' : 'b';
}

/* ══ COIN FLOAT ANIMATION ══ */
function spawnCoinFloat(el, text) {
  const rect = el.getBoundingClientRect();
  const div  = document.createElement('div');
  div.className   = 'coin-float';
  div.textContent = text || '🪙';
  div.style.left  = (rect.left + rect.width / 2) + 'px';
  div.style.top   = (rect.top - 10) + 'px';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1000);
}

/* ══ DISMISS LOADING OVERLAY ══
   Called once after first render is fully painted.
   Uses requestAnimationFrame to ensure DOM is painted before hiding.
*/
function dismissOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  const layout  = document.getElementById('mainLayout');
  const topbar  = document.getElementById('topbar');

  // Wait two animation frames so the rendered DOM is actually painted
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Reveal real UI
      layout.classList.add('visible');
      topbar.classList.add('visible');

      // Fade out overlay
      overlay.classList.add('hidden');

      // Remove overlay from DOM after transition completes
      setTimeout(() => {
        overlay.remove();
      }, 600);
    });
  });
}

/* ══ BUILD PODIUM ══ */
function buildPodium(users) {
  const podium = document.getElementById('podium');
  podium.innerHTML = '';
  const top3 = users.slice(0, 3);
  if (!top3.length) {
    podium.innerHTML = `<div style="color:var(--sub);font-size:.75rem;text-align:center;padding:30px 0;width:100%">No data yet — be the first Legend! 🏆</div>`;
    return;
  }
  [1, 0, 2].forEach(i => {
    const u = top3[i];
    if (!u) return;
    const rank      = i + 1;
    const slotClass = ['first','second','third'][i];
    const crown     = rank === 1 ? '<span class="pod-crown">👑</span>' : '';
    const slot      = document.createElement('div');
    slot.className  = `podium-slot ${slotClass}`;
    slot.innerHTML  = `
      <div class="pod-av-wrap">
        ${crown}
        <div class="pod-av ${u.role}" title="${u.name}">${u.init}</div>
        <div class="pod-rank-badge rank-${rank}">${rank}</div>
      </div>
      <div class="pod-name">${u.name.split(' ')[0]}</div>
      <div class="pod-score">${u.coins} coins</div>
      <div class="pod-coins">🪙 ${u.coins.toLocaleString()}</div>
      <div class="pod-platform">#${rank}</div>`;
    podium.appendChild(slot);
  });
}

/* ══ BUILD RANK LIST (4+) ══ */
function buildRankList(users) {
  const list = document.getElementById('rankList');
  list.innerHTML = '';
  if (users.length <= 3) {
    list.innerHTML = `<div style="color:var(--sub);font-size:.72rem;text-align:center;padding:16px 0">Only top 3 so far!</div>`;
    return;
  }
  users.slice(3).forEach((u, i) => {
    const rank = i + 4;
    const row  = document.createElement('div');
    row.className = 'rank-row';
    row.innerHTML = `
      <span class="rr-num">${rank}</span>
      <div class="rr-av ${u.role}">${u.init}</div>
      <div class="rr-info">
        <div class="rr-name">${u.name}</div>
        <div class="rr-badges"><span class="badge-chip bc-cyan">🪙 ${u.coins} coins</span></div>
      </div>
      <div class="rr-right">
        <span class="rr-score">${u.coins}</span>
        <span class="rr-coins">👍 ${u.likeCount} likes</span>
        <span class="rr-move same">—</span>
      </div>`;
    row.addEventListener('click', () => spawnCoinFloat(row, `🪙 ${u.coins}`));
    list.appendChild(row);
  });
}

/* ══ MY RANK ══ */
function buildMyRank(users) {
  const card = document.getElementById('myRankCard');
  const idx  = S.myName ? users.findIndex(u => u.name === S.myName) : -1;
  const rank = idx >= 0 ? idx + 1 : '—';
  const me   = idx >= 0 ? users[idx] : null;
  S.coins    = me ? me.coins : 0;

  card.innerHTML = `
    <span class="rr-num" style="color:var(--c);font-size:.85rem">${rank}</span>
    <div class="rr-av b">${initials(S.myName || 'You')}</div>
    <div class="rr-info">
      <div class="rr-name">${S.myName || 'You'}</div>
      <div class="rr-badges"><span class="badge-chip bc-cyan">👤 Active</span></div>
    </div>
    <div class="rr-right">
      <span class="rr-score" style="font-size:.85rem">${S.coins}</span>
      <span class="rr-coins">🪙 ${S.coins.toLocaleString()}</span>
    </div>`;
}

/* ══ BUILD WALLET ══ */
function buildWallet(coins) {
  const thresholds = [100, 250, 350, 1000];
  const next = thresholds.find(t => coins < t) || thresholds[thresholds.length - 1];
  const pct  = Math.min(100, Math.round((coins / next) * 100));

  document.getElementById('walletCoins').textContent = coins.toLocaleString();
  document.getElementById('walletPct').textContent   = pct + '%';
  setTimeout(() => {
    const fill = document.getElementById('walletFill');
    if (fill) fill.style.width = pct + '%';
  }, 400);

  const meta = document.querySelector('.wallet-meta');
  if (meta) meta.innerHTML = `${coins.toLocaleString()} / ${next} coins · <strong>${Math.max(0, next - coins)} more to go</strong>`;
}

/* ══ BUILD REWARDS ══ */
function buildRewards(userCoins) {
  const grid = document.getElementById('rewardsGrid');
  grid.innerHTML = '';

  const REWARD_DEFS = [
    { key:'recharge20',    ico:'📱', displayName:'₹20 Recharge',   fill:'linear-gradient(90deg,#00cfff,#7b61ff)' },
    { key:'voucher50',     ico:'🎫', displayName:'₹50 Voucher',    fill:'linear-gradient(90deg,#f59e0b,#ef4444)' },
    { key:'verifiedBadge', ico:'🛡️', displayName:'Verified Badge', fill:'linear-gradient(90deg,#22c55e,#00cfff)' },
    { key:'legendStatus',  ico:'🏆', displayName:'Legend Status',  fill:'linear-gradient(90deg,#f59e0b,#a78bfa)' },
  ];

  REWARD_DEFS.forEach(def => {
    const required    = REWARD_RANGES[def.key];
    const progress    = Math.min(100, Math.round((userCoins / required) * 100));
    const unlocked    = userCoins >= required;
    const close       = !unlocked && progress >= 70;
    const detailLabel = unlocked ? 'Unlocked! 🎉' : `${Math.max(0, required - userCoins)} coins needed`;
    const statusTxt   = unlocked ? '✓ Unlocked' : close ? '⚡ Almost There' : '🔒 Locked';
    const statusCls   = unlocked ? 'unlocked'   : close ? 'close'          : 'locked';

    const card = document.createElement('div');
    card.className = `reward-card ${unlocked ? 'unlocked' : close ? '' : 'locked'}`;
    card.innerHTML = `
      <div class="rw-ico">${def.ico}</div>
      <div class="rw-name">${def.displayName}</div>
      <div class="rw-req">
        <strong>${required} Coins</strong><br>
        <span class="rr-need">${detailLabel}</span>
      </div>
      <div class="rw-progress-wrap">
        <div class="rw-bar">
          <div class="rw-fill" style="width:0%;background:${def.fill}" data-target="${progress}"></div>
        </div>
        <div class="rw-pct">${progress}%</div>
      </div>
      <span class="rw-status ${statusCls}">${statusTxt}</span>`;
    card.addEventListener('click', () => {
      if (!card.classList.contains('locked'))
        spawnCoinFloat(card, unlocked ? '✅ Unlocked!' : '⚡ Almost!');
    });
    grid.appendChild(card);
  });
}

/* ══ BUILD EARN LIST ══ */
function buildEarnList() {
  const list = document.getElementById('earnList');
  list.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'earn-row';
  row.innerHTML = `
    <div class="earn-ico">💬</div>
    <div class="earn-info">
      <div class="earn-name">Message Liked</div>
      <div class="earn-desc">Someone likes your traffic report — earn 5 coins per like</div>
    </div>
    <div class="earn-coins">🪙 +5</div>`;
  row.addEventListener('click', () => spawnCoinFloat(row, '+5'));
  list.appendChild(row);
}

/* ══ BUILD BADGE GRID ══ */
function buildBadges(userCoins) {
  const grid = document.getElementById('badgeGrid');
  grid.innerHTML = '';

  const BADGE_DEFS = [
    { key:'newcomer', ico:'🔰', name:'Newcomer',  color:'#94a3b8' },
    { key:'pro',      ico:'⭐', name:'Pro',       color:'#00cfff' },
    { key:'onfire',   ico:'🔥', name:'On Fire',   color:'#ff8c42' },
    { key:'elite',    ico:'💎', name:'Elite',     color:'#a78bfa' },
    { key:'verified', ico:'🛡️', name:'Verified',  color:'#22c55e' },
    { key:'legend',   ico:'🏆', name:'Legend',    color:'#f59e0b' },
  ];

  BADGE_DEFS.forEach(b => {
    const required  = BADGE_RANGES[b.key];
    const progress  = Math.min(100, Math.round((userCoins / required) * 100));
    const earned    = userCoins >= required;
    const remaining = Math.max(0, required - userCoins);

    const iconStyle = earned ? '' : 'filter:grayscale(1) brightness(0.4) contrast(0.6);opacity:0.45;';
    const fillColor = earned ? b.color : '#334155';
    const subTxt    = earned ? `${required} coins — Earned! 🎉` : `${remaining} more coins to unlock`;

    const card = document.createElement('div');
    card.className = `badge-card ${earned ? 'earned' : 'locked-b'}`;
    card.innerHTML = `
      <div class="badge-ico" style="${iconStyle}">${b.ico}</div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-sub">${subTxt}</div>
      <div class="badge-prog">
        <div class="badge-prog-fill" style="width:0%;background:${fillColor}" data-target="${progress}"></div>
      </div>`;
    if (earned) card.addEventListener('click', () => spawnCoinFloat(card, '🎖 Earned!'));
    grid.appendChild(card);
  });
}

/* ══ ANIMATE ALL PROGRESS BARS ══ */
function animateBars() {
  document.querySelectorAll('[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target) || 0;
    setTimeout(() => { el.style.width = target + '%'; }, 600 + Math.random() * 300);
  });
}

/* ══ RANK TICKER ══ */
function startRankTicker() {
  setInterval(() => {
    const rows = document.querySelectorAll('.rank-row');
    if (!rows.length) return;
    const row = rows[Math.floor(Math.random() * rows.length)];
    if (window.gsap) {
      gsap.fromTo(row,
        { backgroundColor: 'rgba(0,207,255,0.08)' },
        { backgroundColor: 'transparent', duration: 1.2, ease: 'power2.out' }
      );
    }
  }, 5000);
}

/* ══ COIN PULSE ══ */
function startCoinPulse() {
  setInterval(() => {
    const el = document.getElementById('walletCoins');
    if (el && S.coins > 0 && window.gsap) {
      gsap.fromTo(el,
        { scale: 1.15, color: '#fbbf24' },
        { scale: 1, color: 'var(--cgold)', duration: .4, ease: 'back.out(2)' }
      );
    }
  }, 8000);
}

/* ══ ENTRANCE ANIMATIONS (after overlay dismissed) ══ */
function playEntrance() {
  if (!window.gsap) return;
  gsap.from('.podium-slot', { y: 30, opacity: 0, stagger: .12, duration: .55, ease: 'back.out(1.4)', delay: .05 });
  gsap.from('.rank-row',    { x: -20, opacity: 0, stagger: .07, duration: .4,  ease: 'power2.out',   delay: .1  });
  gsap.from('.reward-card', { y: 14, opacity: 0, stagger: .08, duration: .4,   ease: 'power2.out',   delay: .15 });
  gsap.from('.badge-card',  { scale: .88, opacity: 0, stagger: .06, duration: .35, ease: 'back.out(1.5)', delay: .2 });
  gsap.from('.wallet-card', { y: 14, opacity: 0, duration: .45, ease: 'power2.out', delay: .05 });
}

/* ══ CORE RENDER ══ */
async function render() {
  let likesSnap;
  try {
    likesSnap = await getDocs(collection(db, 'message_likes'));
  } catch(e) {
    console.error('message_likes fetch failed', e);
    // Even on error, dismiss overlay so page isn't stuck
    if (!S.initialised) {
      S.initialised = true;
      dismissOverlay();
    }
    return;
  }

  /* Build user list */
  const userList = [];
  likesSnap.forEach(d => {
    const data      = d.data();
    const name      = (data.authorName && data.authorName.trim()) ? data.authorName.trim() : d.id;
    const likeCount = typeof data.likeCount === 'number' ? data.likeCount : 0;
    if (likeCount <= 0) return;
    userList.push({
      name,
      likeCount,
      coins: likeCount * 5,
      role:  roleColor(likeCount * 5),
      init:  initials(name),
    });
  });

  userList.sort((a, b) => b.coins - a.coins);

  /* Topbar stats */
  document.getElementById('tbUsers').textContent = userList.length;
  const me = userList.find(u => u.name === S.myName);
  document.getElementById('tbCoins').textContent = (me ? me.coins : 0).toLocaleString();

  /* Build all sections */
  buildPodium(userList);
  buildRankList(userList);
  buildMyRank(userList);
  buildWallet(S.coins);
  buildRewards(S.coins);
  buildEarnList();
  buildBadges(S.coins);
  animateBars();

  /* First render: dismiss overlay, then animate entrance */
  if (!S.initialised) {
    S.initialised = true;
    dismissOverlay();
    // Play entrance animations after overlay fade completes
    setTimeout(() => playEntrance(), 550);
  }
}

/* ══ ENTRY POINT ══ */
window.addEventListener('DOMContentLoaded', async () => {
  await render();

  /* Live updates — silent re-render, no overlay */
  onSnapshot(collection(db, 'message_likes'), () => { render(); });

  startRankTicker();
  startCoinPulse();
});