/* TrafficIQ — shortcuts.js */
'use strict';

/* ══ THREE.JS BACKGROUND ══ */
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
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}`,
    fragmentShader: `
      uniform float uTime; uniform float uDark; varying vec2 vUv;
      float grid(vec2 uv,float s,float t){vec2 g=abs(fract(uv/s-.5)-.5)/fwidth(uv/s);return 1.0-min(min(g.x,g.y),1.0)*t;}
      float road(float c,float p,float w){return smoothstep(w,w*.4,abs(c-p));}
      float streak(vec2 uv,float ry,float off,float sp,float len){float x=fract(uv.x*.6+uTime*sp+off);float on=road(uv.y,ry,0.006);return smoothstep(len,0.0,x)*smoothstep(0.0,0.01,x)*on;}
      void main(){
        vec2 uv=vUv;
        vec3 col=mix(vec3(0.906,0.937,0.980),vec3(0.016,0.031,0.082),uDark);
        float g=grid(uv*vec2(6.0,4.0),1.0,1.8);
        col=mix(col,mix(vec3(0.85,0.88,0.92),vec3(0.06,0.12,0.22),uDark),g*mix(0.25,0.12,uDark));
        float roads=max(max(road(uv.y,.25,.018),road(uv.y,.50,.022)),max(road(uv.y,.75,.018),max(road(uv.x,.33,.016),road(uv.x,.66,.016))));
        col=mix(col,mix(vec3(0.78,0.82,0.88),vec3(0.08,0.14,0.28),uDark),roads);
        col=mix(col,vec3(1.0,0.85,0.15),road(uv.y,.50,.002)*.55*uDark);
        vec2 flip=vec2(1.0-uv.x,uv.y);
        col+=vec3(0.9,0.15,0.1)*(streak(uv,.498,0.0,.18,.08)+streak(uv,.502,.3,.14,.06))*uDark;
        col+=vec3(0.85,0.90,1.0)*(streak(flip,.495,.1,.22,.07)+streak(flip,.505,.6,.17,.05))*uDark;
        col*=1.0-length(uv-.5)*length(uv-.5)*1.44*mix(.2,.5,uDark);
        gl_FragColor=vec4(col,mix(.22,.72,uDark));
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), mat));
  let t=0;(function tick(){requestAnimationFrame(tick);t+=0.008;mat.uniforms.uTime.value=t;renderer.render(scene,camera);})();
  addEventListener('resize',()=>renderer.setSize(innerWidth,innerHeight));
  window._bgMat = mat;
})();

/* ══ VALID CITIES ══ */
const VALID_CITIES = [
  'Bhimavaram Railway Station','Government Hospital',
  'RTC Bus Stand','Sagi Ramakrishnam Raju Engineering College','Vishnu College',
];
function resolveCity(raw) {
  if (!raw) return null;
  const cleaned = String(raw).trim();
  if (VALID_CITIES.includes(cleaned)) return cleaned;
  const lower = cleaned.toLowerCase();
  const found = VALID_CITIES.find(c => c.toLowerCase() === lower);
  if (found) return found;
  return VALID_CITIES.find(c =>
    c.toLowerCase().startsWith(lower.substring(0,12)) ||
    lower.startsWith(c.toLowerCase().substring(0,12))
  ) || null;
}

/* ══ STATE ══ */
const S = {
  theme: localStorage.getItem('tiq-theme') || 'dark',
  city: (function () {
    const fromUrl = resolveCity(new URLSearchParams(location.search).get('city'));
    if (fromUrl) { localStorage.setItem('tiq-city', fromUrl); return fromUrl; }
    return resolveCity(localStorage.getItem('tiq-city')) || 'Bhimavaram Railway Station';
  })(),
  name:         localStorage.getItem('tiq-name') || 'You',
  activeCard:   null,
  _unsubCounts: null,
  _unsubFeed:   null,
  counts:       {},
  likedKeys: new Set(JSON.parse(localStorage.getItem('tiq-sc-liked-keys') || '[]')),
};

function persistLiked() {
  localStorage.setItem('tiq-sc-liked-keys', JSON.stringify([...S.likedKeys]));
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

/* ══════════════════════════════════════════════════════════════════
   SHORTCUTS DATA  —  Real GPS coordinates for Bhimavaram
   Each shortcut carries:
     routeCoords  : [[lat,lng], ...]   waypoints drawn on the map
     startLatLng  : [lat,lng]          green start marker
     endLatLng    : [lat,lng]          red end marker
     startLabel / endLabel             tooltip text
   ══════════════════════════════════════════════════════════════════ */
const CITY_SHORTCUTS = {

  /* ── BHIMAVARAM RAILWAY STATION ─────────────────────── */
  'Bhimavaram Railway Station': [
    {
      id:'brs-1', ico:'🚉',
      name:'Station Back Gate Route',
      loc:'Back Gate → NH216 Junction',
      desc:'Exit via the station back gate (west side) onto Rail Colony Road, merge onto NH216 at Narasimhapuram junction — saves 7 min vs main entrance queue.',
      tags:[{cls:'bolt',label:'⚡ Most Used'},{cls:'green',label:'–7 min'}],
      trigger:'Back Gate Route',
      startLatLng:[16.5155,81.5220], endLatLng:[16.5130,81.5270],
      startLabel:'Station Back Gate', endLabel:'NH216 Junction',
      routeCoords:[[16.5155,81.5220],[16.5148,81.5215],[16.5140,81.5225],[16.5133,81.5248],[16.5130,81.5270]],
    },
    {
      id:'brs-2', ico:'🔀',
      name:'Inner Ring Bypass',
      loc:'Station Road → Eluru Road via Ring',
      desc:'From Station Road take the inner ring near Bhimavaram Bus Depot, cut south-west through Naidupeta residential area, rejoin Eluru Road past the main signal cluster.',
      tags:[{cls:'fire',label:'🔥 Trending'},{cls:'green',label:'–5 min'}],
      trigger:'Inner Ring Bypass',
      startLatLng:[16.5168,81.5240], endLatLng:[16.5195,81.5182],
      startLabel:'Station Road', endLabel:'Eluru Road',
      routeCoords:[[16.5168,81.5240],[16.5172,81.5228],[16.5183,81.5210],[16.5191,81.5192],[16.5195,81.5182]],
    },
    {
      id:'brs-3', ico:'🛣',
      name:'Canal Road Express',
      loc:'Canal Side Road → Bhimavaram Town Centre',
      desc:'Head north via Tammileru canal-bank road. Smooth single-lane run with no signals. Reaches the municipal clock-tower junction in ~6 min.',
      tags:[{cls:'star',label:'★ Community Fav'},{cls:'amber',label:'–6 min'}],
      trigger:'Canal Road Express',
      startLatLng:[16.5160,81.5236], endLatLng:[16.5228,81.5210],
      startLabel:'Canal Side Entry', endLabel:'Town Clock Tower',
      routeCoords:[[16.5160,81.5236],[16.5175,81.5232],[16.5192,81.5223],[16.5208,81.5215],[16.5228,81.5210]],
    },
  ],

  /* ── GOVERNMENT HOSPITAL ─────────────────────────────── */
  'Government Hospital': [
    {
      id:'gh-1', ico:'🏥',
      name:'Hospital North Entry',
      loc:'North Gate → Emergency Block',
      desc:'Enter from Bhimavaram–Narasapur Road into the north gate; ambulance priority lane gives zero-delay access to Emergency & Casualty. Avoids main-gate roundabout entirely.',
      tags:[{cls:'bolt',label:'⚡ Most Used'},{cls:'green',label:'–8 min'}],
      trigger:'North Entry',
      startLatLng:[16.5440,81.5250], endLatLng:[16.5410,81.5230],
      startLabel:'NH216 North Approach', endLabel:'Emergency Block',
      routeCoords:[[16.5440,81.5250],[16.5437,81.5240],[16.5430,81.5235],[16.5420,81.5232],[16.5410,81.5230]],
    },
    {
      id:'gh-2', ico:'🔀',
      name:'Service Lane Shortcut',
      loc:'Service Lane → Pharmacy Block',
      desc:'Narrow service lane behind the hospital compound wall connects directly to pharmacy and outpatient block; skips the main roundabout on A.C. Guards Road.',
      tags:[{cls:'fire',label:'🔥 Trending'},{cls:'green',label:'–6 min'}],
      trigger:'Service Lane',
      startLatLng:[16.5420,81.5218], endLatLng:[16.5415,81.5245],
      startLabel:'Service Lane Entry', endLabel:'Pharmacy Block',
      routeCoords:[[16.5420,81.5218],[16.5418,81.5225],[16.5416,81.5235],[16.5415,81.5245]],
    },
    {
      id:'gh-3', ico:'🛣',
      name:'Bypass to Eluru Road',
      loc:'Hospital Junction → Eluru Road',
      desc:'Exit the hospital south gate, take the back street through the old market lane and emerge on Eluru Road 200 m before the main junction.',
      tags:[{cls:'star',label:'★ Community Fav'},{cls:'amber',label:'–5 min'}],
      trigger:'Eluru Road Bypass',
      startLatLng:[16.5405,81.5228], endLatLng:[16.5388,81.5210],
      startLabel:'Hospital South Gate', endLabel:'Eluru Road',
      routeCoords:[[16.5405,81.5228],[16.5400,81.5222],[16.5395,81.5218],[16.5388,81.5210]],
    },
  ],

  /* ── RTC BUS STAND ───────────────────────────────────── */
  'RTC Bus Stand': [
    {
      id:'rtc-1', ico:'🚌',
      name:'Platform 3 Exit Lane',
      loc:'Platform 3 → NH216 Direct',
      desc:'Western side exit behind Platform 3 opens onto a service road running 300 m directly to NH216 slip road — no signal crossing required.',
      tags:[{cls:'bolt',label:'⚡ Most Used'},{cls:'green',label:'–9 min'}],
      trigger:'Platform 3 Exit',
      startLatLng:[16.5448,81.5215], endLatLng:[16.5430,81.5185],
      startLabel:'Platform 3 Exit', endLabel:'NH216 Slip Road',
      routeCoords:[[16.5448,81.5215],[16.5445,81.5207],[16.5440,81.5198],[16.5435,81.5190],[16.5430,81.5185]],
    },
    {
      id:'rtc-2', ico:'🔀',
      name:'Market Road Shortcut',
      loc:'Bus Stand → Market Road → Town',
      desc:'East gate onto Market Road (Bhimavaram bazaar lane). One-way stretch flows freely away from bus stand congestion; brings you out at Ramalayam junction.',
      tags:[{cls:'fire',label:'🔥 Trending'},{cls:'green',label:'–4 min'}],
      trigger:'Market Road',
      startLatLng:[16.5452,81.5222], endLatLng:[16.5468,81.5250],
      startLabel:'Bus Stand East Gate', endLabel:'Ramalayam Junction',
      routeCoords:[[16.5452,81.5222],[16.5456,81.5228],[16.5460,81.5235],[16.5465,81.5243],[16.5468,81.5250]],
    },
    {
      id:'rtc-3', ico:'🛣',
      name:'Old Town Bypass',
      loc:'RTC Back Road → Old Town Junction',
      desc:'Old bypass road directly behind RTC passes through a quiet residential pocket and connects to Old Town T-junction — barely any traffic outside peak hours.',
      tags:[{cls:'star',label:'★ Community Fav'},{cls:'amber',label:'–5 min'}],
      trigger:'Old Town Bypass',
      startLatLng:[16.5455,81.5200], endLatLng:[16.5480,81.5178],
      startLabel:'RTC Back Road', endLabel:'Old Town Junction',
      routeCoords:[[16.5455,81.5200],[16.5460,81.5192],[16.5468,81.5185],[16.5475,81.5180],[16.5480,81.5178]],
    },
  ],

  /* ── SRKR ENGINEERING COLLEGE ───────────────────────── */
  'Sagi Ramakrishnam Raju Engineering College': [
    {
      id:'srkr-1', ico:'🎓',
      name:'College Back Road',
      loc:'Back Gate → Tadepalligudem Road',
      desc:'SRKR back gate on the south side opens onto a direct lane to Tadepalligudem Road. Completely bypasses the notorious main-gate jam during 9 AM and 4 PM rush.',
      tags:[{cls:'bolt',label:'⚡ Most Used'},{cls:'green',label:'–10 min'}],
      trigger:'College Back Road',
      startLatLng:[16.5310,81.5320], endLatLng:[16.5270,81.5368],
      startLabel:'SRKR Back Gate', endLabel:'Tadepalligudem Road',
      routeCoords:[[16.5310,81.5320],[16.5302,81.5328],[16.5295,81.5340],[16.5282,81.5352],[16.5270,81.5368]],
    },
    {
      id:'srkr-2', ico:'🔀',
      name:'Canal Junction Bypass',
      loc:'Canal Road → College Junction',
      desc:'Tammileru canal-bank road heading south from Bhimavaram town. Joins College Junction from north-west, skipping the NH216 overbridge signal.',
      tags:[{cls:'fire',label:'🔥 Trending'},{cls:'green',label:'–7 min'}],
      trigger:'Canal Junction',
      startLatLng:[16.5380,81.5260], endLatLng:[16.5310,81.5320],
      startLabel:'Canal Road (North)', endLabel:'College Junction',
      routeCoords:[[16.5380,81.5260],[16.5365,81.5268],[16.5350,81.5280],[16.5335,81.5298],[16.5320,81.5310],[16.5310,81.5320]],
    },
    {
      id:'srkr-3', ico:'🛣',
      name:'Highway Service Road',
      loc:'NH216 Service Road → College',
      desc:'NH216 service road runs parallel from the Bhimavaram bypass junction to the SRKR campus gate. Zero signals, smooth tarmac, clear even at peak hours.',
      tags:[{cls:'star',label:'★ Community Fav'},{cls:'amber',label:'–8 min'}],
      trigger:'Highway Service Road',
      startLatLng:[16.5258,81.5190], endLatLng:[16.5310,81.5320],
      startLabel:'NH216 Service Entry', endLabel:'SRKR Campus Gate',
      routeCoords:[[16.5258,81.5190],[16.5265,81.5210],[16.5272,81.5240],[16.5280,81.5268],[16.5292,81.5295],[16.5310,81.5320]],
    },
  ],

  /* ── VISHNU COLLEGE ─────────────────────────────────── */
  'Vishnu College': [
    {
      id:'vc-1', ico:'📚',
      name:'Vishnu Back Gate Lane',
      loc:'Back Lane → Bhimavaram–Narasapur Road',
      desc:'Back lane east of campus connects to Bhimavaram–Narasapur Road 400 m ahead of the main Vishnu junction. Avoids the severe queue at class-start and dispersal times.',
      tags:[{cls:'bolt',label:'⚡ Most Used'},{cls:'green',label:'–8 min'}],
      trigger:'Back Gate Lane',
      startLatLng:[16.5078,81.5200], endLatLng:[16.5045,81.5235],
      startLabel:'Vishnu Back Gate', endLabel:'Bhimavaram–Narasapur Road',
      routeCoords:[[16.5078,81.5200],[16.5073,81.5205],[16.5068,81.5212],[16.5058,81.5222],[16.5045,81.5235]],
    },
    {
      id:'vc-2', ico:'🔀',
      name:'Water Tank Road',
      loc:'Water Tank Junction → Vishnu College',
      desc:'Quiet residential street off the Bhimavaram–Narasapur Road connects directly to the college south side-gate. Used by locals to dodge the main junction signal.',
      tags:[{cls:'fire',label:'🔥 Trending'},{cls:'green',label:'–6 min'}],
      trigger:'Water Tank Road',
      startLatLng:[16.5100,81.5185], endLatLng:[16.5068,81.5212],
      startLabel:'Water Tank Junction', endLabel:'Vishnu Side Gate',
      routeCoords:[[16.5100,81.5185],[16.5095,81.5188],[16.5090,81.5192],[16.5082,81.5200],[16.5075,81.5207],[16.5068,81.5212]],
    },
    {
      id:'vc-3', ico:'🛣',
      name:'Paddy Field Bypass',
      loc:'Outer Ring Road → Vishnu College North',
      desc:'Outer ring road (Bhimavaram circular) connects to the north entrance of the Vishnu campus. Avoids town centre congestion entirely; clear even during peak.',
      tags:[{cls:'star',label:'★ Community Fav'},{cls:'amber',label:'–9 min'}],
      trigger:'Paddy Field Bypass',
      startLatLng:[16.5125,81.5150], endLatLng:[16.5068,81.5212],
      startLabel:'Outer Ring Road', endLabel:'Vishnu North Entrance',
      routeCoords:[[16.5125,81.5150],[16.5118,81.5158],[16.5110,81.5170],[16.5095,81.5185],[16.5080,81.5198],[16.5068,81.5212]],
    },
  ],
};

function getShortcuts() {
  return CITY_SHORTCUTS[S.city] || CITY_SHORTCUTS['Bhimavaram Railway Station'];
}

function matchShortcut(msgText) {
  const trimmed = msgText.trim();
  const shortcuts = getShortcuts();
  const exact = shortcuts.find(sc => sc.trigger.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;
  const contains = shortcuts.find(sc =>
    trimmed.toLowerCase().includes(sc.trigger.toLowerCase()) ||
    sc.trigger.toLowerCase().includes(trimmed.toLowerCase())
  );
  return contains || shortcuts[0];
}

function calcConf(count) {
  if (!count || count <= 0) return 0;
  return Math.min(90, count * 10);
}
function calcStatus(count) {
  if (!count || count === 0) return 'No reports yet';
  if (count === 1) return '1 report · 10% confidence';
  if (count <= 3)  return `${count} reports · ${count*10}% confidence`;
  if (count <= 6)  return `${count} reports · Growing confidence`;
  if (count <= 9)  return `${count} reports · Good confidence`;
  return `${count}+ reports · High confidence · Community verified`;
}

function renderTriggers() {
  const trigRow = document.querySelector('.triggers');
  if (!trigRow) return;
  trigRow.innerHTML = '';
  getShortcuts().forEach(sc => {
    const btn = document.createElement('button');
    btn.className   = 'trig';
    btn.dataset.msg = sc.trigger;
    btn.textContent = sc.ico + ' ' + sc.trigger;
    btn.addEventListener('click', () => trigFill(btn));
    trigRow.appendChild(btn);
  });
}

/* ══════════════════════════════════════════════════════════════════
   NAVIGATE TO MAP
   Serialises route data into sessionStorage then navigates to
   dashboard.html, which reads 'tiq-route-overlay' on load and
   draws the polyline + markers on its existing Leaflet map.
   ══════════════════════════════════════════════════════════════════ */
function navigateToMap(sc) {
  /* Pulse the CTA button */
  const cardEl = document.querySelector(`.sc-card[data-id="${sc.id}"]`);
  if (cardEl) {
    gsap.fromTo(cardEl, {scale:1}, {scale:0.96, duration:.1, yoyo:true, repeat:1, ease:'power1.inOut'});
  }

  /* Toast feedback */
  showToast(`🗺️  Tracing ${sc.ico} ${sc.name} on map…`);

  /* Persist payload — dashboard reads this on DOMContentLoaded */
  const payload = {
    id:          sc.id,
    city:        S.city,
    name:        sc.name,
    ico:         sc.ico,
    loc:         sc.loc,
    trigger:     sc.trigger,
    startLabel:  sc.startLabel,
    endLabel:    sc.endLabel,
    startLatLng: sc.startLatLng,
    endLatLng:   sc.endLatLng,
    routeCoords: sc.routeCoords,
    conf:        calcConf(S.counts[sc.id] || 0),
    count:       S.counts[sc.id] || 0,
  };
  sessionStorage.setItem('tiq-route-overlay', JSON.stringify(payload));

  /* Short delay so toast is readable, then go */
  setTimeout(() => {
    window.location.href = `dashboard.html?route=${sc.id}&city=${encodeURIComponent(S.city)}`;
  }, 700);
}

/* ══ TOAST helper ══ */
function showToast(msg) {
  let t = document.getElementById('tiq-sc-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'tiq-sc-toast';
    document.body.appendChild(t);
  }
  t.className = 'tiq-toast';
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), 2800);
}

function renderCards() {
  const inner     = document.querySelector('.panel-inner');
  const confBlock = document.getElementById('confBlock');
  inner.querySelectorAll('.sc-card').forEach(el => el.remove());

  const active = getShortcuts()
    .filter(sc => (S.counts[sc.id] || 0) > 0)
    .sort((a, b) => (S.counts[b.id] || 0) - (S.counts[a.id] || 0));

  if (active.length === 0) return;

  active.forEach((sc, idx) => {
    const count   = S.counts[sc.id] || 0;
    const conf    = calcConf(count);
    const isTop   = idx === 0;
    const dotClr  = conf >= 50 ? 'var(--cg)' : 'var(--ca)';
    const barClr  = conf >= 50 ? 'var(--cg)' : 'var(--ca)';
    const confTxt = conf >= 50 ? 'cg' : 'ca';
    const tagsHtml = sc.tags.map(t => `<span class="tag ${t.cls}">${t.label}</span>`).join('');

    const card = document.createElement('div');
    card.className  = `sc-card${isTop ? ' rank-1' : ''}`;
    card.dataset.id = sc.id;
    card.innerHTML  = `
      <div class="sc-active-ring"></div>
      <div class="sc-top">
        <span class="sc-ico">${sc.ico}</span>
        <div class="sc-info">
          <span class="sc-name">${sc.name}</span>
          <span class="sc-loc">${sc.loc}</span>
        </div>
        <span class="sc-dot" style="background:${dotClr};box-shadow:0 0 8px ${dotClr}"></span>
      </div>
      <p class="sc-desc">${sc.desc}</p>
      <div class="sc-tags">${tagsHtml}<span class="tag bolt">x${count} report${count>1?'s':''}</span></div>
      <div class="sev-row">
        <div class="sev-bar"><div class="sev-fill" style="width:${conf}%;background:${barClr}"></div></div>
        <span class="sev-txt ${confTxt}">${conf}%</span>
      </div>
      <button class="sc-map-cta" data-id="${sc.id}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        View route on map
      </button>`;

    inner.insertBefore(card, confBlock);
    gsap.fromTo(card,{x:-18,opacity:0},{x:0,opacity:1,duration:.45,ease:'power2.out',delay:idx*0.08});

    /* Card click → select + update confidence ring */
    card.addEventListener('click', (e) => {
      /* Don't re-trigger if the CTA button was what was clicked */
      if (e.target.closest('.sc-map-cta')) return;
      document.querySelectorAll('.sc-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      S.activeCard = sc.id;
      document.getElementById('feedSub').textContent = `${sc.name} · ${S.city}`;
      updateConfidenceRing(S.counts[sc.id] || 0);
      gsap.fromTo(card,{scale:.96},{scale:1,duration:.4,ease:'back.out(2)'});
    });

    /* CTA button → navigate to dashboard with route overlay */
    card.querySelector('.sc-map-cta').addEventListener('click', (e) => {
      e.stopPropagation();
      navigateToMap(sc);
    });

    if (S.activeCard === sc.id) card.classList.add('active');
  });

  if (!S.activeCard && active.length > 0) {
    const topCard = inner.querySelector('.sc-card');
    if (topCard) {
      topCard.classList.add('active');
      S.activeCard = active[0].id;
      document.getElementById('feedSub').textContent = `${active[0].name} · ${S.city}`;
      updateConfidenceRing(S.counts[active[0].id] || 0);
    }
  }
}

function updateConfidenceRing(count) {
  const conf     = calcConf(count);
  const ring     = document.getElementById('ringFill');
  const numEl    = document.getElementById('confNum');
  const statusEl = document.getElementById('confStatus');

  ring.style.strokeDashoffset = 314 - (conf / 100) * 314;
  ring.style.filter = `drop-shadow(0 0 7px ${
    conf >= 50 ? 'rgba(34,197,94,.6)' :
    conf > 0   ? 'rgba(245,158,11,.6)' : 'rgba(255,255,255,.1)'})`;

  const prev  = parseInt(numEl.textContent) || 0;
  const start = performance.now();
  (function countUp(now) {
    const p = Math.min((now - start) / 700, 1);
    numEl.textContent = Math.round(prev + (1 - Math.pow(1-p,3)) * (conf - prev));
    if (p < 1) requestAnimationFrame(countUp);
  })(start);

  statusEl.textContent = calcStatus(count);
  document.getElementById('confBlock').classList.add('active-conf');
  document.getElementById('tbConf').textContent = conf > 0 ? conf + '%' : '—';
}

/* ══ FEED ══ */
const feed       = document.getElementById('feed');
const scrollBtn  = document.getElementById('scrollBtn');
let userScrolled = false;
const renderedIds   = new Set();
const likeListeners = {};

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

function likeMessage(msgId, authorName, btnEl) {
  if (!window.db) return;
  const likeKey = S.name + '__' + msgId;
  if (S.likedKeys.has(likeKey)) return;
  if (authorName === S.name) {
    gsap.fromTo(btnEl,{x:-4},{x:0,duration:.3,ease:'elastic.out(1,.4)',clearProps:'x'});
    return;
  }
  const safeKey = (S.name + '__' + msgId).replace(/[^a-zA-Z0-9_\-]/g, '_');
  S.likedKeys.add(likeKey); persistLiked();
  btnEl.classList.add('liked'); btnEl.disabled = true;
  const countEl = btnEl.querySelector('.like-count');
  if (countEl) countEl.textContent = parseInt(countEl.textContent || '0') + 1;
  gsap.fromTo(btnEl,{scale:1.4},{scale:1,duration:.4,ease:'back.out(2)'});
  import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js').then(fs => {
    const msgLikeCountRef = fs.doc(window.db, 'messageLikeCounts', msgId);
    const authorDocRef    = fs.doc(window.db, 'message_likes', authorName);
    const likerDocRef     = fs.doc(window.db, 'message_likes', authorName, 'likers', safeKey);
    fs.setDoc(likerDocRef, { likedAt: fs.serverTimestamp(), liker: S.name, msgId, page:'shortcuts' })
    .then(() => Promise.all([
      fs.setDoc(msgLikeCountRef, { likeCount: fs.increment(1), lastUpdated: fs.serverTimestamp() }, { merge:true }),
      fs.setDoc(authorDocRef, { authorName, likeCount: fs.increment(1), lastUpdated: fs.serverTimestamp() }, { merge:true }),
    ]))
    .catch(err => {
      S.likedKeys.delete(likeKey); persistLiked();
      btnEl.classList.remove('liked'); btnEl.disabled = false;
      if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent||'1') - 1);
    });
  });
}

function subscribeLikes(msgId, btnEl) {
  import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js').then(fs => {
    if (!likeListeners[msgId]) {
      likeListeners[msgId] = {
        unsub: fs.onSnapshot(fs.doc(window.db, 'messageLikeCounts', msgId), snap => {
          const count = snap.exists() ? (snap.data().likeCount || 0) : 0;
          likeListeners[msgId]?.btns.forEach(b => {
            const c = b.querySelector('.like-count');
            if (!c) return;
            if (b.classList.contains('liked')) { if (count > parseInt(c.textContent||'0')) c.textContent = count; }
            else c.textContent = count;
          });
        }),
        btns: [],
      };
    }
    likeListeners[msgId].btns.push(btnEl);
  });
}

function addMsg({ id, name, role, badge, badgeLbl, init, msg, votes=0, own=false, ts=null, shortcutId=null }) {
  document.getElementById('emptyState')?.remove();
  if (id && renderedIds.has(id)) return;
  if (id) renderedIds.add(id);
  const sc           = shortcutId ? getShortcuts().find(s => s.id === shortcutId) : null;
  const routeLabel   = sc ? `<span class="msg-route-tag">${sc.ico} ${sc.trigger}</span>` : '';
  const isTemp       = !id || id.startsWith('temp-');
  const likeKey      = S.name + '__' + id;
  const alreadyLiked = !isTemp && S.likedKeys.has(likeKey);
  const isOwnMsg     = name === S.name;
  const el = document.createElement('div');
  el.className = `msg${own?' own':''}`;
  if (id) el.dataset.docId = id;
  el.innerHTML = `
    <div class="av ${role}" data-tip="${name} · ${badgeLbl}">${init}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-name">${name}</span>
        <span class="trust-badge ${badge}">${badgeLbl}</span>
        ${routeLabel}
        <span class="msg-time">${timeStr(ts)}</span>
      </div>
      <div class="bubble">${msg}</div>
      <div class="msg-actions">
        <button class="upvote-btn" data-base="${votes}">▲ <span class="vc">${votes}</span></button>
        ${!isTemp ? `
        <button class="like-btn${alreadyLiked?' liked':''}${isOwnMsg?' own-msg':''}"
          title="${isOwnMsg?"Can't like your own message":alreadyLiked?'Already liked':'Like this report'}"
          ${alreadyLiked||isOwnMsg?'disabled':''}>
          <svg class="like-ico" viewBox="0 0 24 24" fill="${alreadyLiked?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          <span class="like-count">0</span>
        </button>
        ${alreadyLiked?'<span class="liked-label">Liked ✓</span>':''}` : ''}
      </div>
    </div>`;
  el.querySelector('.upvote-btn')?.addEventListener('click', function() {
    const voted = this.classList.toggle('voted');
    this.querySelector('.vc').textContent = parseInt(this.dataset.base) + (voted?1:0);
    gsap.fromTo(this,{scale:.88},{scale:1,duration:.3,ease:'back.out(2)'});
  });
  if (!isTemp) {
    const btn = el.querySelector('.like-btn');
    if (btn && !isOwnMsg && !alreadyLiked) btn.addEventListener('click', () => likeMessage(id, name, btn));
    if (btn) subscribeLikes(id, btn);
  }
  feed.appendChild(el);
  if (!userScrolled) scrollToBottom();
  else scrollBtn.classList.add('show');
}

/* ══ FEED LISTENER ══ */
function startFeedListener() {
  if (!window.db || !window.fb) return;
  const { collection, query, orderBy, onSnapshot } = window.fb;
  const q = query(collection(window.db, 'shortcut_chats'), orderBy('createdAt'));
  S._unsubFeed = onSnapshot(q, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type !== 'added') return;
      const d = change.doc.data();
      if (d.city !== S.city) return;
      addMsg({
        id: change.doc.id, name: d.name||'User', role: d.role||'b',
        badge: d.badge||'local', badgeLbl: d.badgeLbl||'⌂ Local Guide',
        init: d.init||(d.name||'U').substring(0,2).toUpperCase(),
        msg: d.msg||'', votes: d.votes||0, own: d.name===S.name,
        ts: d.createdAt||null, shortcutId: d.shortcutId||null,
      });
    });
  });
}

/* ══ COUNTS LISTENER ══ */
function startCountsListener() {
  if (!window.db || !window.fb) return;
  const { collection, query, orderBy, onSnapshot } = window.fb;
  const q = query(collection(window.db, 'shortcut_chats'), orderBy('createdAt'));
  S._unsubCounts = onSnapshot(q, snapshot => {
    S.counts = {};
    snapshot.docs.forEach(docSnap => {
      const d = docSnap.data();
      if (d.city !== S.city || !d.shortcutId) return;
      S.counts[d.shortcutId] = (S.counts[d.shortcutId] || 0) + 1;
    });
    renderCards();
    if (S.activeCard) updateConfidenceRing(S.counts[S.activeCard] || 0);
  });
}

/* ══ TRIGGER FILL ══ */
function trigFill(btn) {
  document.getElementById('chatInp').value = btn.dataset.msg;
  document.getElementById('chatInp').focus();
  gsap.fromTo(btn,{scale:.9},{scale:1,duration:.3,ease:'back.out(2)'});
}

/* ══ SEND ══ */
async function sendMsg() {
  const inp = document.getElementById('chatInp');
  const txt = inp.value.trim();
  if (!txt) return;
  const matched = matchShortcut(txt);
  inp.value = '';
  gsap.fromTo('.send-btn',{scale:.88},{scale:1,duration:.28,ease:'back.out(2)'});
  const feedSub = document.getElementById('feedSub');
  feedSub.textContent = `✓ ${matched.ico} ${matched.trigger}`;
  setTimeout(() => {
    feedSub.textContent = S.activeCard
      ? (getShortcuts().find(s=>s.id===S.activeCard)?.name||'Community Feed') + ' · ' + S.city
      : 'Community Feed · ' + S.city;
  }, 2000);
  if (window.db && window.fb) {
    const { collection, doc, setDoc, serverTimestamp } = window.fb;
    const ref = doc(collection(window.db, 'shortcut_chats'));
    await setDoc(ref, {
      city: S.city, shortcutId: matched.id, name: S.name,
      role:'b', badge:'local', badgeLbl:'⌂ Local Guide',
      init: S.name.substring(0,2).toUpperCase(), msg: txt,
      votes:0, createdAt: serverTimestamp(),
    });
  }
}

document.getElementById('chatInp').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMsg();
});

/* ══ MOBILE ══ */
function togglePanel() {
  document.getElementById('panel').classList.toggle('open');
  document.getElementById('mobOverlay').classList.toggle('show');
}
document.getElementById('panTog').addEventListener('click', togglePanel);

/* ══ INIT ══ */
gsap.to('#topbar', {y:0,opacity:1,duration:.6, ease:'power3.out',delay:.1 });
gsap.to('#panel',  {x:0,opacity:1,duration:.75,ease:'power3.out',delay:.25});
const streamEl = document.querySelector('.stream');
if (streamEl) gsap.from(streamEl, {opacity:0,duration:.5,ease:'power2.out',delay:.35});
gsap.from('.conf-block', {y:14,opacity:0,duration:.55,ease:'power2.out',delay:.72});

startCountsListener();
startFeedListener();
renderTriggers();