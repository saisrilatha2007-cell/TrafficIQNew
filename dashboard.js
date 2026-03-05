/* TrafficIQ — dashboard.js (Leaflet + Firestore Presence + Route Overlay) */
'use strict';

// 🔥 Gemini API
const GEMINI_API_KEY = "AIzaSyBCbvaciaICSSvKYaqKfbWEvgnFZk5UVzs";
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/* ══════════════════════════════════════════════
   BHIMAVARAM — City data & landmarks
══════════════════════════════════════════════ */
const BHIMAVARAM = { lat: 16.5449, lon: 81.5212 };

const BHIMAVARAM_PLACES = [
  { name: 'Sagi Ramakrishnam Raju Engineering College', lat: 16.5432, lon: 81.4964, type: 'College'   },
  { name: 'Vishnu College',             lat: 16.5092, lon: 81.5219, type: 'College'   },
  { name: 'RTC Bus Stand',              lat: 16.5449, lon: 81.5205, type: 'Transport' },
  { name: 'Bhimavaram Railway Station', lat: 16.5385, lon: 81.5274, type: 'Transport' },
  { name: 'Government Hospital',        lat: 16.5438, lon: 81.5230, type: 'Hospital'  },
];

const TYPE_ICON = { College: '🎓', Transport: '🚌', Hospital: '🏥' };

/* ══════════════════════════════════════════════
   VEHICLE SVGs
══════════════════════════════════════════════ */
const VEH = {
  car: `<svg width="52" height="80" viewBox="0 0 52 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="26" cy="73" rx="18" ry="5" fill="rgba(0,0,0,0.18)"/>
  <rect x="8" y="10" width="36" height="58" rx="10" fill="#2563EB"/>
  <rect x="11" y="12" width="30" height="54" rx="8" fill="#3B82F6"/>
  <rect x="13" y="22" width="26" height="28" rx="5" fill="#1D4ED8"/>
  <rect x="15" y="24" width="11" height="24" rx="4" fill="rgba(255,255,255,0.12)"/>
  <rect x="14" y="23" width="24" height="11" rx="3" fill="#BFDBFE" fill-opacity=".9"/>
  <rect x="16" y="25" width="8" height="6" rx="2" fill="rgba(255,255,255,0.35)"/>
  <rect x="14" y="38" width="24" height="11" rx="3" fill="#BFDBFE" fill-opacity=".75"/>
  <line x1="19" y1="13" x2="19" y2="22" stroke="#1D4ED8" stroke-width="1" stroke-opacity=".6"/>
  <line x1="33" y1="13" x2="33" y2="22" stroke="#1D4ED8" stroke-width="1" stroke-opacity=".6"/>
  <line x1="19" y1="50" x2="19" y2="60" stroke="#1D4ED8" stroke-width="1" stroke-opacity=".6"/>
  <line x1="33" y1="50" x2="33" y2="60" stroke="#1D4ED8" stroke-width="1" stroke-opacity=".6"/>
  <rect x="9" y="11" width="8" height="6" rx="2" fill="#FDE68A"/>
  <rect x="35" y="11" width="8" height="6" rx="2" fill="#FDE68A"/>
  <rect x="10" y="12" width="5" height="3" rx="1" fill="#FEF3C7"/>
  <rect x="36" y="12" width="5" height="3" rx="1" fill="#FEF3C7"/>
  <rect x="17" y="10" width="18" height="4" rx="2" fill="#1E3A8A"/>
  <line x1="21" y1="10" x2="21" y2="14" stroke="#3B82F6" stroke-width=".7"/>
  <line x1="26" y1="10" x2="26" y2="14" stroke="#3B82F6" stroke-width=".7"/>
  <line x1="31" y1="10" x2="31" y2="14" stroke="#3B82F6" stroke-width=".7"/>
  <rect x="9" y="62" width="8" height="5" rx="2" fill="#EF4444"/>
  <rect x="35" y="62" width="8" height="5" rx="2" fill="#EF4444"/>
  <rect x="10" y="63" width="5" height="2.5" rx="1" fill="#FCA5A5"/>
  <rect x="36" y="63" width="5" height="2.5" rx="1" fill="#FCA5A5"/>
  <rect x="4" y="26" width="5" height="8" rx="2" fill="#1E40AF"/>
  <rect x="43" y="26" width="5" height="8" rx="2" fill="#1E40AF"/>
  <circle cx="12" cy="19" r="5" fill="#1E293B"/><circle cx="12" cy="19" r="3" fill="#475569"/><circle cx="12" cy="19" r="1.2" fill="#94A3B8"/>
  <circle cx="40" cy="19" r="5" fill="#1E293B"/><circle cx="40" cy="19" r="3" fill="#475569"/><circle cx="40" cy="19" r="1.2" fill="#94A3B8"/>
  <circle cx="12" cy="60" r="5" fill="#1E293B"/><circle cx="12" cy="60" r="3" fill="#475569"/><circle cx="12" cy="60" r="1.2" fill="#94A3B8"/>
  <circle cx="40" cy="60" r="5" fill="#1E293B"/><circle cx="40" cy="60" r="3" fill="#475569"/><circle cx="40" cy="60" r="1.2" fill="#94A3B8"/>
  <line x1="8" y1="38" x2="44" y2="38" stroke="#1D4ED8" stroke-width=".8" stroke-opacity=".5"/>
  <rect x="9" y="35" width="4" height="1.5" rx=".7" fill="#93C5FD"/>
  <rect x="39" y="35" width="4" height="1.5" rx=".7" fill="#93C5FD"/>
</svg>`,

  bike: `<svg width="36" height="82" viewBox="0 0 36 82" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="18" cy="76" rx="10" ry="4" fill="rgba(0,0,0,0.18)"/>
  <rect x="6" y="56" width="24" height="20" rx="10" fill="#0F172A"/>
  <rect x="9" y="59" width="18" height="14" rx="7" fill="#1E293B"/>
  <circle cx="18" cy="66" r="4" fill="#334155"/><circle cx="18" cy="66" r="1.8" fill="#64748B"/>
  <rect x="26" y="54" width="5" height="14" rx="2" fill="#94A3B8"/>
  <rect x="27" y="55" width="3" height="12" rx="1.5" fill="#CBD5E1"/>
  <rect x="11" y="36" width="14" height="24" rx="4" fill="#DC2626"/>
  <rect x="13" y="38" width="10" height="20" rx="3" fill="#EF4444"/>
  <rect x="12" y="32" width="12" height="10" rx="3" fill="#1E293B"/>
  <rect x="13" y="33" width="10" height="7" rx="2" fill="#334155"/>
  <rect x="11" y="18" width="14" height="16" rx="5" fill="#B91C1C"/>
  <rect x="13" y="20" width="10" height="10" rx="3" fill="#DC2626"/>
  <rect x="14" y="24" width="8" height="2" rx="1" fill="rgba(255,255,255,0.3)"/>
  <rect x="10" y="28" width="16" height="8" rx="2" fill="#374151"/>
  <rect x="12" y="29" width="12" height="5" rx="1" fill="#4B5563"/>
  <line x1="10" y1="28" x2="8" y2="42" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/>
  <line x1="26" y1="28" x2="28" y2="42" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/>
  <rect x="4" y="13" width="28" height="4" rx="2" fill="#374151"/>
  <rect x="5" y="14" width="26" height="2" rx="1" fill="#6B7280"/>
  <rect x="4" y="13" width="5" height="4" rx="2" fill="#111827"/>
  <rect x="27" y="13" width="5" height="4" rx="2" fill="#111827"/>
  <ellipse cx="18" cy="10" rx="7" ry="5" fill="#1F2937"/>
  <ellipse cx="18" cy="10" rx="5" ry="3.5" fill="#FDE68A"/>
  <ellipse cx="17" cy="9" rx="2" ry="1.5" fill="#FEF9C3"/>
  <line x1="14" y1="13" x2="12" y2="22" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/>
  <line x1="22" y1="13" x2="24" y2="22" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/>
  <rect x="6" y="4" width="24" height="18" rx="9" fill="#0F172A"/>
  <rect x="9" y="7" width="18" height="12" rx="6" fill="#1E293B"/>
  <circle cx="18" cy="13" r="3.5" fill="#334155"/><circle cx="18" cy="13" r="1.5" fill="#64748B"/>
  <rect x="14" y="56" width="8" height="3" rx="1.5" fill="#EF4444"/>
  <rect x="15" y="57" width="6" height="1.5" rx=".7" fill="#FCA5A5"/>
  <circle cx="8" cy="15" r="2" fill="#FCD34D"/>
  <circle cx="28" cy="15" r="2" fill="#FCD34D"/>
</svg>`,

  auto: `<svg width="60" height="78" viewBox="0 0 60 78" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="30" cy="72" rx="22" ry="5" fill="rgba(0,0,0,0.18)"/>
  <path d="M10 22 Q30 14 50 22 L54 62 Q30 70 6 62 Z" fill="#D97706"/>
  <path d="M13 23 Q30 16 47 23 L51 60 Q30 67 9 60 Z" fill="#F59E0B"/>
  <path d="M12 22 Q30 15 48 22 L46 34 Q30 30 14 34 Z" fill="#B45309"/>
  <path d="M14 34 Q30 30 46 34 L44 42 Q30 38 16 42 Z" fill="#BAE6FD" fill-opacity=".85"/>
  <path d="M16 35 Q22 33 28 34 L26 40 Q20 39 16 40 Z" fill="rgba(255,255,255,0.3)"/>
  <rect x="11" y="52" width="38" height="3" rx="1.5" fill="#92400E" fill-opacity=".7"/>
  <rect x="11" y="46" width="38" height="2" rx="1" fill="#1E293B" fill-opacity=".5"/>
  <ellipse cx="30" cy="16" rx="7" ry="8" fill="#0F172A"/>
  <ellipse cx="30" cy="16" rx="5" ry="6" fill="#1E293B"/>
  <circle cx="30" cy="16" r="2.5" fill="#334155"/><circle cx="30" cy="16" r="1" fill="#64748B"/>
  <ellipse cx="24" cy="19" rx="3" ry="2.5" fill="#FDE68A"/>
  <ellipse cx="36" cy="19" rx="3" ry="2.5" fill="#FDE68A"/>
  <ellipse cx="24" cy="19" rx="1.8" ry="1.4" fill="#FEF9C3"/>
  <ellipse cx="36" cy="19" rx="1.8" ry="1.4" fill="#FEF9C3"/>
  <ellipse cx="10" cy="60" rx="7" ry="8" fill="#0F172A"/>
  <ellipse cx="10" cy="60" rx="5" ry="6" fill="#1E293B"/>
  <circle cx="10" cy="60" r="2.5" fill="#334155"/><circle cx="10" cy="60" r="1" fill="#64748B"/>
  <ellipse cx="50" cy="60" rx="7" ry="8" fill="#0F172A"/>
  <ellipse cx="50" cy="60" rx="5" ry="6" fill="#1E293B"/>
  <circle cx="50" cy="60" r="2.5" fill="#334155"/><circle cx="50" cy="60" r="1" fill="#64748B"/>
  <rect x="14" y="42" width="32" height="18" rx="3" fill="#FBBF24" fill-opacity=".25"/>
  <rect x="15" y="43" width="30" height="6" rx="2" fill="#92400E" fill-opacity=".5"/>
  <rect x="22" y="38" width="16" height="5" rx="2" fill="#1E293B"/>
  <rect x="23" y="39" width="6" height="3" rx="1" fill="#22C55E" fill-opacity=".9"/>
  <rect x="31" y="39" width="6" height="3" rx="1" fill="#EF4444" fill-opacity=".7"/>
  <ellipse cx="9" cy="63" rx="3" ry="2" fill="#EF4444"/>
  <ellipse cx="51" cy="63" rx="3" ry="2" fill="#EF4444"/>
  <ellipse cx="9" cy="63" rx="1.8" ry="1.2" fill="#FCA5A5"/>
  <ellipse cx="51" cy="63" rx="1.8" ry="1.2" fill="#FCA5A5"/>
  <line x1="9" y1="34" x2="9" y2="60" stroke="#92400E" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="51" y1="34" x2="51" y2="60" stroke="#92400E" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="14" y1="22" x2="9" y2="34" stroke="#78350F" stroke-width="1.5"/>
  <line x1="46" y1="22" x2="51" y2="34" stroke="#78350F" stroke-width="1.5"/>
</svg>`,
};

/* ══════════════════════════════════════════════
   STATE — TRACK ACTIVE ROUTE
══════════════════════════════════════════════ */
const S = {
  theme:           localStorage.getItem('tiq-theme') || 'light',
  name:            localStorage.getItem('tiq-name')  || 'there',
  vehicle:         'car',
  currentPlace:    'Bhimavaram',
  currentLevel:    'Low',
  currentCong:     0,
  activeRouteId:   null,
  activeRouteData: null,
  selectedCityLat: null,
  selectedCityLon: null,
};

/* ══════════════════════════════════════════════
   LIVE USERS
══════════════════════════════════════════════ */
function updateLiveUsers(count) {
  const rctEl = document.getElementById('rct');
  const avsEl = document.getElementById('avs');
  if (rctEl) {
    const from = parseInt(rctEl.textContent) || 0;
    if (isNaN(from) || from !== count) animateCounter(rctEl, isNaN(from) ? 0 : from, count, 700);
  }
  if (avsEl) {
    const EMOJIS = ['👨', '👩', '🧑', '👦', '👧', '🧔'];
    const show   = Math.min(count, 6);
    avsEl.innerHTML = show > 0
      ? Array.from({ length: show }, (_, i) => `<div class="av">${EMOJIS[i % EMOJIS.length]}</div>`).join('')
      : '<div class="av" style="opacity:.4">👤</div>';
  }
}
window.updateLiveUsers = updateLiveUsers;
if (typeof window.__pendingUserCount === 'number') {
  updateLiveUsers(window.__pendingUserCount);
  delete window.__pendingUserCount;
}

/* ══════════════════════════════════════════════
   CITIES — FIRESTORE LIVE LISTENER
══════════════════════════════════════════════ */
let _unsubCityDoc = null;

function startCityDocListener(cityName) {
  if (_unsubCityDoc) { _unsubCityDoc(); _unsubCityDoc = null; }
  if (!cityName || cityName === 'Bhimavaram') { applyCongestionStats(0, null); return; }
  const cityDocRef = window.doc(window.db, 'cities', cityName);
  _unsubCityDoc = window.onSnapshot(cityDocRef, (snap) => {
    if (!snap.exists()) { applyCongestionStats(0, null); return; }
    const d       = snap.data();
    const congPct = typeof d.congestionIndex === 'number'
      ? Math.min(100, Math.max(0, d.congestionIndex)) : 0;
    applyCongestionStats(congPct, d);
  }, (err) => { applyCongestionStats(0, null); });
}

function applyCongestionStats(congPct, data) {
  const cfill = document.getElementById('cfill');
  if (cfill) { cfill.style.transition = 'width 1.8s cubic-bezier(.4,0,.2,1)'; cfill.style.width = congPct + '%'; }
  const clvl = document.getElementById('clvl');
  if (clvl) clvl.textContent = congPct > 70 ? 'Heavy 🔴' : congPct > 45 ? 'Moderate 🟡' : 'Low 🟢';
  if (data) {
    const adlyEl = document.getElementById('adly');
    const asptEl = document.getElementById('aspt');
    if (adlyEl && data.avgDelay) adlyEl.textContent = data.avgDelay;
    if (asptEl && data.hotspot)  asptEl.textContent = data.hotspot;
  }
}

function applySimulatedCongestion(congPct) {
  const cfill = document.getElementById('cfill');
  if (cfill) cfill.style.width = congPct + '%';
  const clvl = document.getElementById('clvl');
  if (clvl) clvl.textContent = congPct > 70 ? 'Heavy 🔴' : congPct > 45 ? 'Moderate 🟡' : 'Low 🟢';
}

let _aiTypeTimer = null;
function typeAiSummary(text) {
  const at = document.getElementById('aitxt');
  if (!at) return;
  if (_aiTypeTimer) clearInterval(_aiTypeTimer);
  at.textContent = '';
  let i = 0;
  _aiTypeTimer = setInterval(() => { at.textContent += text[i++]; if (i >= text.length) clearInterval(_aiTypeTimer); }, 18);
}

function animateCounter(el, from, to, durationMs) {
  const start = performance.now();
  const diff  = to - from;
  function step(now) {
    const t    = Math.min(1, (now - start) / durationMs);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    el.textContent = Math.round(from + diff * ease);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ══════════════════════════════════════════════
   AI SUMMARY
══════════════════════════════════════════════ */
async function generateGeminiSummary(place, trafficLevel) {
  const prompt = `You are a smart urban traffic AI assistant.\n\nTraffic near ${place} is currently ${trafficLevel}.\n\nGenerate a realistic 2-3 line live traffic update. Mention possible reasons like signals, peak hours, construction work, or local events.\n\nKeep it natural and helpful.`;
  try {
    const res  = await fetch(GEMINI_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contents:[{ parts:[{ text: prompt }] }] }) });
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Traffic data is being analyzed...';
    typeAiSummary(text);
  } catch (err) { typeAiSummary('Unable to generate AI summary at the moment.'); }
}

function onAiRefreshClick() {
  const btn = document.getElementById('aiRefreshBtn');
  if (!btn) return;
  btn.classList.add('spinning'); btn.disabled = true;
  const at = document.getElementById('aitxt');
  if (at) at.textContent = 'Generating summary…';
  generateGeminiSummary(S.currentPlace, S.currentLevel).finally(() => { btn.classList.remove('spinning'); btn.disabled = false; });
}
window.onAiRefreshClick = onAiRefreshClick;

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
function setCityEverywhere(cityName) {
  localStorage.setItem('tiq-selected-place', cityName);
  localStorage.setItem('tiq-city', cityName);
}

function updateNavLinks(cityName) {
  const pages = ['shortcuts.html','time-taken.html','enter-traffics.html','info-passer.html','entertainment.html','trusted-users.html'];
  document.querySelectorAll('.nl, #mob a').forEach(a => {
    pages.forEach(page => { if (a.href && a.href.includes(page)) a.href = `${page}?city=${encodeURIComponent(cityName)}`; });
  });
}

/* ══════════════════════════════════════════════
   LEAFLET MAP
══════════════════════════════════════════════ */
let map, userMarker = null, searchMarker = null;
const BHIMAVARAM_BOUNDS = L.latLngBounds([16.500, 81.460], [16.600, 81.560]);

function initMap() {
  map = L.map('map', {
    center:             [BHIMAVARAM.lat, BHIMAVARAM.lon],
    zoom:               15,
    minZoom:            13,
    maxZoom:            19,
    maxBounds:          BHIMAVARAM_BOUNDS,
    maxBoundsViscosity: 0.9,
    zoomControl:        true,
    attributionControl: true,
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);
  map.zoomControl.setPosition('bottomright');

  window.map = map;

  [100, 400, 800].forEach(ms => setTimeout(() => map.invalidateSize(), ms));
  window.addEventListener('resize', () => map.invalidateSize());
}

function makeVehicleIcon(type) {
  const svg   = VEH[type] || VEH.car;
  const sizes = { car:[52,80], bike:[36,82], auto:[60,78] };
  const sz    = sizes[type] || sizes.car;
  return L.divIcon({
    className:  'vehicle-marker-icon',
    html:       `<div class="vehicle-pin">${svg}<div class="pin-pulse"></div></div>`,
    iconAnchor: [sz[0]/2, sz[1]],
    iconSize:   [sz[0], sz[1]+8],
  });
}

function placeUserMarker(lat, lon, vehicleType) {
  if (S.activeRouteId) return;

  if (userMarker) map.removeLayer(userMarker);
  userMarker = L.marker([lat, lon], { icon: makeVehicleIcon(vehicleType), zIndexOffset: 1000 }).addTo(map);
  userMarker.bindPopup(
    `<b>You are here</b><br><small>${vehicleType.charAt(0).toUpperCase()+vehicleType.slice(1)}</small>`,
    { closeButton: false, offset: [0, -48] }
  );
}

/* ══════════════════════════════════════════════
   LOCATION SEARCH
══════════════════════════════════════════════ */
const locInput = document.getElementById('locInput');
const locDrop  = document.getElementById('locDrop');

function renderLocDrop(results) {
  if (!results.length) { locDrop.classList.remove('open'); return; }
  locDrop.innerHTML = results.slice(0, 8).map(p => `
    <div class="loc-item" onclick="selectPlace(${p.lat},${p.lon},'${p.name.replace(/'/g,"\\'")}','${p.type}')">
      <span>${TYPE_ICON[p.type] || '📍'}</span>
      <span>${p.name}<span class="loc-sub">, Bhimavaram</span></span>
      <span class="loc-badge">${p.type}</span>
    </div>
  `).join('');
  locDrop.classList.add('open');
}

locInput.addEventListener('input', () => {
  const q = locInput.value.toLowerCase().trim();
  if (!q) { locDrop.classList.remove('open'); return; }
  renderLocDrop(BHIMAVARAM_PLACES.filter(p => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)));
});
locInput.addEventListener('focus', () => { if (!locInput.value.trim()) renderLocDrop(BHIMAVARAM_PLACES); });
document.addEventListener('click', e => {
  const search = document.getElementById('locationSearch');
  if (search && !search.contains(e.target)) locDrop.classList.remove('open');
});

function selectPlace(lat, lon, name, type) {
  if (S.activeRouteId) dismissRouteOverlay();

  /* STORE SELECTED CITY LOCATION AS START POINT */
  S.selectedCityLat = lat;
  S.selectedCityLon = lon;

  locInput.value = name;
  locDrop.classList.remove('open');
  setCityEverywhere(name);
  updateNavLinks(name);
  localStorage.setItem('tiq-selected-lat', lat);
  localStorage.setItem('tiq-selected-lon', lon);
  if (searchMarker) { map.removeLayer(searchMarker); searchMarker = null; }
  if (userMarker)   map.removeLayer(userMarker);
  userMarker = L.marker([lat, lon], { icon: makeVehicleIcon(S.vehicle), zIndexOffset: 1000 }).addTo(map);
  userMarker.bindPopup(`<b>${name}</b><br><small>${type} · ${S.vehicle.charAt(0).toUpperCase()+S.vehicle.slice(1)}</small>`, { closeButton: false, offset: [0, -52] }).openPopup();
  map.flyTo([lat, lon], 17, { animate: true, duration: 1.1, easeLinearity: 0.3 });
  populate(name);
}
window.selectPlace = selectPlace;

function clearLocSearch() {
  if (S.activeRouteId) dismissRouteOverlay();

  locInput.value = '';
  locDrop.classList.remove('open');
  if (searchMarker) { map.removeLayer(searchMarker); searchMarker = null; }
  localStorage.removeItem('tiq-selected-place');
  localStorage.removeItem('tiq-selected-lat');
  localStorage.removeItem('tiq-selected-lon');
  localStorage.removeItem('tiq-city');
  if (_unsubCityDoc) { _unsubCityDoc(); _unsubCityDoc = null; }
  applyCongestionStats(0, null);
  const at = document.getElementById('aitxt');
  if (at) at.textContent = 'Press Refresh to generate AI summary.';
  locInput.focus();
}
window.clearLocSearch = clearLocSearch;

/* ══════════════════════════════════════════════
   GPS
══════════════════════════════════════════════ */
function showGPSToast(msg) {
  const t = document.getElementById('gpsTst');
  t.textContent = msg; t.style.display = 'block'; t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; setTimeout(() => { t.style.display = 'none'; }, 500); }, 3200);
}

function nearestPlace(lat, lon) {
  let best = null, bestDist = Infinity;
  BHIMAVARAM_PLACES.forEach(p => {
    const dlat = (lat - p.lat) * 111000;
    const dlon = (lon - p.lon) * 111000 * Math.cos(lat * Math.PI / 180);
    const dist = Math.sqrt(dlat*dlat + dlon*dlon);
    if (dist < bestDist) { bestDist = dist; best = p; }
  });
  return bestDist < 400 ? best : null;
}

function onGPSSuccess(lat, lon) {
  dismissOverlay();
  if (S.activeRouteId) return;

  const nearby = nearestPlace(lat, lon);
  if (nearby) {
    showGPSToast('📍 Near ' + nearby.name);
    placeUserMarker(nearby.lat, nearby.lon, S.vehicle);
    map.flyTo([nearby.lat, nearby.lon], 17, { animate: true, duration: 1.2 });
    setCityEverywhere(nearby.name); updateNavLinks(nearby.name);
    localStorage.setItem('tiq-selected-lat', nearby.lat);
    localStorage.setItem('tiq-selected-lon', nearby.lon);
    S.selectedCityLat = nearby.lat;
    S.selectedCityLon = nearby.lon;
    populate(nearby.name);
  } else {
    showGPSToast('✅ Location found!');
    placeUserMarker(lat, lon, S.vehicle);
    map.flyTo([lat, lon], 17, { animate: true, duration: 1.2 });
    localStorage.removeItem('tiq-selected-place'); localStorage.removeItem('tiq-city');
    S.selectedCityLat = lat;
    S.selectedCityLon = lon;
    populate('Bhimavaram');
  }
}

function dismissOverlay() {
  const ov = document.getElementById('locOverlay');
  if (!ov) return;
  ov.classList.add('hide');
  setTimeout(() => ov.remove(), 420);
}

function showOverlayError(msg) {
  const btn = document.getElementById('locOverlayBtn');
  const err = document.getElementById('locOverlayError');
  btn.classList.remove('loading');
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg> Try Again`;
  err.style.display = 'block'; err.textContent = msg;
}

function overlayAllowLocation() {
  if (!navigator.geolocation) { showOverlayError('GPS is not supported on this device.'); return; }
  const btn = document.getElementById('locOverlayBtn');
  const err = document.getElementById('locOverlayError');
  btn.classList.add('loading'); btn.innerHTML = 'Getting location…'; err.style.display = 'none';
  navigator.geolocation.getCurrentPosition(
    pos => onGPSSuccess(pos.coords.latitude, pos.coords.longitude),
    e => {
      let msg = '';
      if      (e.code === 1) msg = '🔒 Location blocked. Open browser Settings → Site Settings → Location, set to "Allow", then try again.';
      else if (e.code === 2) msg = '📡 Could not detect location. Make sure GPS is ON.';
      else                   msg = '⏱ Location timed out. Check your connection and try again.';
      showOverlayError(msg);
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}
window.overlayAllowLocation = overlayAllowLocation;

function overlaySkipLocation() {
  dismissOverlay();
  const savedPlace = localStorage.getItem('tiq-selected-place');
  const savedLat   = parseFloat(localStorage.getItem('tiq-selected-lat') || '');
  const savedLon   = parseFloat(localStorage.getItem('tiq-selected-lon') || '');
  if (savedPlace && !isNaN(savedLat) && !isNaN(savedLon)) {
    document.getElementById('cname').textContent = savedPlace;
    placeUserMarker(savedLat, savedLon, S.vehicle);
    map.setView([savedLat, savedLon], 16);
    S.selectedCityLat = savedLat;
    S.selectedCityLon = savedLon;
    populate(savedPlace); updateNavLinks(savedPlace);
  } else {
    placeUserMarker(BHIMAVARAM.lat, BHIMAVARAM.lon, S.vehicle);
    map.setView([BHIMAVARAM.lat, BHIMAVARAM.lon], 14);
    S.selectedCityLat = BHIMAVARAM.lat;
    S.selectedCityLon = BHIMAVARAM.lon;
    populate('Bhimavaram');
  }
  showGPSToast('📍 Showing Bhimavaram — search to change location');
}
window.overlaySkipLocation = overlaySkipLocation;

/* ══════════════════════════════════════════════
   VEHICLE SELECTOR
══════════════════════════════════════════════ */
const VEH_LABELS = { car: 'Car', bike: 'Motorcycle', auto: 'Auto Rickshaw' };

function showVehiclePreview(type) {
  const panel = document.getElementById('vehPreview');
  document.getElementById('vehPreviewSvg').innerHTML    = VEH[type];
  document.getElementById('vehPreviewLabel').textContent = VEH_LABELS[type] || type;
  panel.classList.add('show');
  clearTimeout(panel._timer);
  panel._timer = setTimeout(() => panel.classList.remove('show'), 2200);
}

function setV(type, btn) {
  document.querySelectorAll('.vb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  S.vehicle = type;
  showVehiclePreview(type);
  if (userMarker) userMarker.setIcon(makeVehicleIcon(type));
}
window.setV = setV;

/* ══════════════════════════════════════════════
   MAP ZOOM CONTROLS
══════════════════════════════════════════════ */
function animateZoomBtn(id) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.classList.add('zoom-active');
  setTimeout(() => btn.classList.remove('zoom-active'), 320);
}
function updateZoomPct() {
  const el = document.getElementById('zoomPct');
  if (el) el.textContent = 'Z ' + map.getZoom();
}
document.getElementById('zoomIn').addEventListener('click',    () => { animateZoomBtn('zoomIn');    map.zoomIn(1,  { animate: true }); });
document.getElementById('zoomOut').addEventListener('click',   () => { animateZoomBtn('zoomOut');   map.zoomOut(1, { animate: true }); });
document.getElementById('zoomReset').addEventListener('click', () => { animateZoomBtn('zoomReset'); map.flyTo([BHIMAVARAM.lat, BHIMAVARAM.lon], 15, { animate: true, duration: 0.8 }); });

/* ══════════════════════════════════════════════
   POPULATE CARDS
══════════════════════════════════════════════ */
function populate(locationName) {
  const displayName = locationName || 'Bhimavaram';
  document.getElementById('cname').textContent = displayName;
  document.getElementById('uname').textContent = S.name;
  const at = document.getElementById('aitxt');
  if (at) at.textContent = 'Press Refresh to generate AI summary.';
  const clvl = document.getElementById('clvl');
  if (clvl) clvl.textContent = '–';
  gsap.to('#panel', { opacity: 1, duration: .5, delay: .15 });
  gsap.fromTo('.card', { y: 16, opacity: 0 }, { y: 0, opacity: 1, stagger: .1, duration: .5, ease: 'power2.out', delay: .25 });
  const levels    = ['Low', 'Moderate', 'Heavy'];
  const randomLvl = levels[Math.floor(Math.random() * 3)];
  let   congestion = 0;
  if      (randomLvl === 'Low')      congestion = Math.floor(Math.random() * 30);
  else if (randomLvl === 'Moderate') congestion = Math.floor(Math.random() * 40) + 40;
  else                               congestion = Math.floor(Math.random() * 30) + 70;
  S.currentPlace = displayName;
  S.currentLevel = randomLvl;
  S.currentCong  = congestion;
  applySimulatedCongestion(congestion);
}

/* ══════════════════════════════════════════════
   THEME
══════════════════════════════════════════════ */
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('themeBtn').textContent = t === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('tiq-theme', S.theme = t);
}
setTheme(S.theme);
document.getElementById('themeBtn').addEventListener('click', () => setTheme(S.theme === 'dark' ? 'light' : 'dark'));

/* ══════════════════════════════════════════════
   NAV
══════════════════════════════════════════════ */
function goCityRoom() {
  gsap.to('#panel', { opacity: 0, y: 14, duration: .3, ease: 'power2.in', onComplete: () => location.href = 'enter-traffic.html' });
}
window.goCityRoom = goCityRoom;
document.getElementById('burger').addEventListener('click', () => document.getElementById('mob').classList.toggle('open'));

/* ══════════════════════════════════════════════
   ROUTE OVERLAY — PATH FROM CITY (START) TO SHORTCUT (END)
   Shows cyan polyline path with green start marker and red end marker
══════════════════════════════════════════════ */
let _routeOverlayGroup = null;

function applyRouteOverlay() {
  const raw = sessionStorage.getItem('tiq-route-overlay');
  if (!raw) return;
  let route;
  try { route = JSON.parse(raw); } catch (e) { sessionStorage.removeItem('tiq-route-overlay'); return; }
  sessionStorage.removeItem('tiq-route-overlay');

  setTimeout(() => drawRouteOnMap(route), 600);
}

function drawRouteOnMap(route) {
  /* Mark route as active */
  S.activeRouteId = route.id;
  S.activeRouteData = route;

  /* Remove previous overlay */
  if (_routeOverlayGroup) { _routeOverlayGroup.clearLayers(); map.removeLayer(_routeOverlayGroup); }
  _routeOverlayGroup = L.layerGroup().addTo(map);

  /* ═══════════════════════════════════════════════
     CREATE PATH FROM SELECTED CITY TO SHORTCUT
  ═══════════════════════════════════════════════ */
  const startLat = S.selectedCityLat;
  const startLon = S.selectedCityLon;
  const endLat = route.startLatLng[0];
  const endLon = route.startLatLng[1];

  /* Direct straight line path */
  const routePath = [[startLat, startLon], [endLat, endLon]];

  /* ── Glow underline (subtle green) ── */
  L.polyline(routePath, {
    color: '#22c55e', weight: 14, opacity: 0.12,
    lineJoin: 'round', lineCap: 'round',
  }).addTo(_routeOverlayGroup);

  /* ── Main cyan route line ── */
  const poly = L.polyline(routePath, {
    color: '#00cfff', weight: 5, opacity: 0.9,
    lineJoin: 'round', lineCap: 'round',
  }).addTo(_routeOverlayGroup);

  /* ── Animated dashes ── */
  L.polyline(routePath, {
    color: '#ffffff', weight: 2, opacity: 0.3,
    dashArray: '8 10', lineJoin: 'round', lineCap: 'round',
  }).addTo(_routeOverlayGroup);

  /* ═══════════════════════════════════════════════
     START MARKER (GREEN) — Selected City
  ═══════════════════════════════════════════════ */
  const startIcon = L.divIcon({
    html: `<div style="width:40px;height:40px;border-radius:50%;background:#22c55e;border:5px solid #fff;box-shadow:0 0 0 3px rgba(34,197,94,.5),0 6px 20px rgba(0,0,0,.4);display:grid;place-items:center;"><div style="width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:inset 0 0 4px rgba(0,0,0,.2)"></div></div>`,
    className: 'route-start-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  /* ═══════════════════════════════════════════════
     END MARKER (RED) — Shortcut Location
  ═══════════════════════════════════════════════ */
  const endIcon = L.divIcon({
    html: `<div style="width:40px;height:40px;border-radius:50%;background:#ef4444;border:5px solid #fff;box-shadow:0 0 0 3px rgba(239,68,68,.5),0 6px 20px rgba(0,0,0,.4);display:grid;place-items:center;"><div style="width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:inset 0 0 4px rgba(0,0,0,.2)"></div></div>`,
    className: 'route-end-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  L.marker([startLat, startLon], { icon: startIcon, zIndexOffset: 2000 })
    .addTo(_routeOverlayGroup)
    .bindTooltip(`📍 START: ${S.currentPlace}`, { permanent: false, direction: 'right', className: 'tiq-map-tip' });

  L.marker([endLat, endLon], { icon: endIcon, zIndexOffset: 2000 })
    .addTo(_routeOverlayGroup)
    .bindTooltip(`🏁 END: ${route.startLabel}`, { permanent: false, direction: 'right', className: 'tiq-map-tip' });

  /* Fly to fit both markers */
  map.flyToBounds(poly.getBounds(), { padding: [80, 80], duration: 1.3, easeLinearity: 0.4 });

  /* Show info panel */
  injectRoutePanel(route);
}

function dismissRouteOverlay() {
  S.activeRouteId = null;
  S.activeRouteData = null;

  if (_routeOverlayGroup) {
    _routeOverlayGroup.clearLayers();
    map.removeLayer(_routeOverlayGroup);
    _routeOverlayGroup = null;
  }

  const panel = document.getElementById('tiq-route-panel');
  if (panel) {
    panel.style.transition = 'opacity .25s, transform .25s';
    panel.style.opacity = '0';
    panel.style.transform = 'translateX(-50%) translateY(14px)';
    setTimeout(() => panel.remove(), 280);
  }
}

function injectRoutePanel(route) {
  if (!document.getElementById('tiq-rp-styles')) {
    const s = document.createElement('style');
    s.id = 'tiq-rp-styles';
    s.textContent = `
      .tiq-map-tip {
        background: rgba(6,12,30,.92) !important; color: #eef2ff !important;
        border: 1px solid rgba(0,207,255,.22) !important; border-radius: 8px !important;
        padding: 5px 10px !important; font-family:'Plus Jakarta Sans',sans-serif !important;
        font-size:.7rem !important; white-space:nowrap !important;
        box-shadow:0 4px 14px rgba(0,0,0,.35) !important; backdrop-filter:blur(10px) !important;
      }
      .tiq-map-tip::before { display:none !important; }
      [data-theme="light"] .tiq-map-tip { background:rgba(240,245,255,.95)!important; color:#0f172a!important; }

      #tiq-route-panel {
        position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
        z-index:8000; display:flex; align-items:center; gap:14px;
        min-width:300px; max-width:min(560px, 92vw);
        background:rgba(6,12,30,.93); border:1px solid rgba(0,207,255,.28);
        border-radius:16px; padding:14px 16px;
        backdrop-filter:blur(20px);
        box-shadow:0 8px 32px rgba(0,0,0,.4),0 0 0 1px rgba(0,207,255,.08);
        font-family:'Plus Jakarta Sans',sans-serif;
        animation:tiqPanelIn .4s cubic-bezier(.22,1,.36,1) both;
      }
      @keyframes tiqPanelIn { from{opacity:0;transform:translateX(-50%) translateY(18px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      [data-theme="light"] #tiq-route-panel {
        background:rgba(240,245,255,.96); border-color:rgba(26,115,232,.28);
        box-shadow:0 8px 32px rgba(0,0,0,.14);
      }
      #tiq-route-panel .trp-ico { font-size:1.75rem; flex-shrink:0; line-height:1; }
      #tiq-route-panel .trp-body { flex:1; min-width:0; }
      #tiq-route-panel .trp-name {
        font-family:'Space Grotesk',sans-serif; font-size:.92rem; font-weight:700;
        color:#00cfff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px;
      }
      [data-theme="light"] #tiq-route-panel .trp-name { color:#1a73e8; }
      #tiq-route-panel .trp-loc { font-size:.7rem; color:rgba(200,215,255,.58); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      [data-theme="light"] #tiq-route-panel .trp-loc { color:rgba(15,23,42,.52); }
      #tiq-route-panel .trp-meta { display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; }
      #tiq-route-panel .trp-badge { font-size:.6rem; font-weight:700; padding:2px 8px; border-radius:99px; letter-spacing:.04em; }
      #tiq-route-panel .trp-badge.conf { background:rgba(34,197,94,.15); color:#22c55e; border:1px solid rgba(34,197,94,.3); }
      #tiq-route-panel .trp-badge.city { background:rgba(0,207,255,.12); color:#00cfff; border:1px solid rgba(0,207,255,.25); }
      [data-theme="light"] #tiq-route-panel .trp-badge.city { color:#1a73e8; border-color:rgba(26,115,232,.3); background:rgba(26,115,232,.1); }
      #tiq-route-panel .trp-actions { display:flex; gap:7px; flex-shrink:0; align-items:center; }
      #tiq-route-panel .trp-btn { padding:7px 13px; border-radius:8px; border:none; font-family:'Plus Jakarta Sans',sans-serif; font-size:.72rem; font-weight:600; cursor:pointer; transition:all .2s; }
      #tiq-route-panel .trp-back { background:rgba(0,207,255,.1); color:#00cfff; border:1px solid rgba(0,207,255,.3); }
      #tiq-route-panel .trp-back:hover { background:rgba(0,207,255,.22); transform:translateY(-1px); }
      [data-theme="light"] #tiq-route-panel .trp-back { color:#1a73e8; border-color:rgba(26,115,232,.3); background:rgba(26,115,232,.08); }
      #tiq-route-panel .trp-close { width:30px; height:30px; padding:0; background:rgba(239,68,68,.1); color:#ef4444; border:1px solid rgba(239,68,68,.25); display:grid; place-items:center; border-radius:8px; font-size:.9rem; }
      #tiq-route-panel .trp-close:hover { background:rgba(239,68,68,.22); transform:scale(1.08); }
    `;
    document.head.appendChild(s);
  }

  document.getElementById('tiq-route-panel')?.remove();

  const panel = document.createElement('div');
  panel.id = 'tiq-route-panel';
  panel.innerHTML = `
    <div class="trp-ico">${route.ico}</div>
    <div class="trp-body">
      <div class="trp-name">${route.name}</div>
      <div class="trp-loc">${S.currentPlace} → ${route.startLabel}</div>
      <div class="trp-meta">
        ${route.conf > 0 ? `<span class="trp-badge conf">⬤ ${route.conf}% confidence</span>` : ''}
        <span class="trp-badge city">${route.city}</span>
      </div>
    </div>
    <div class="trp-actions">
      <button class="trp-btn trp-back" id="trpBackBtn">← Shortcuts</button>
      <button class="trp-btn trp-close" id="trpCloseBtn" title="Dismiss">✕</button>
    </div>`;
  document.body.appendChild(panel);

  document.getElementById('trpBackBtn').addEventListener('click', () => {
    window.location.href = `shortcuts.html?city=${encodeURIComponent(route.city)}`;
  });

  document.getElementById('trpCloseBtn').addEventListener('click', () => {
    dismissRouteOverlay();
  });

  setTimeout(() => document.getElementById('trpCloseBtn')?.click(), 45000);
}

/* ══════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  initMap();
  map.on('zoomend', updateZoomPct);
  updateZoomPct();
  gsap.to('#nav', { y: 0, opacity: 1, duration: .65, ease: 'power3.out', delay: .2 });

  applyRouteOverlay();

  if (!S.activeRouteId) {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') {
          dismissOverlay();
          navigator.geolocation.getCurrentPosition(
            pos => onGPSSuccess(pos.coords.latitude, pos.coords.longitude),
            ()  => loadSavedOrDefault(),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
        } else { loadSavedOrDefault(); }
      }).catch(() => loadSavedOrDefault());
    } else { loadSavedOrDefault(); }
  }
});

function loadSavedOrDefault() {
  const savedPlace = localStorage.getItem('tiq-selected-place');
  const savedLat   = parseFloat(localStorage.getItem('tiq-selected-lat') || '');
  const savedLon   = parseFloat(localStorage.getItem('tiq-selected-lon') || '');
  if (savedPlace && !isNaN(savedLat) && !isNaN(savedLon)) {
    document.getElementById('cname').textContent = savedPlace;
    setCityEverywhere(savedPlace); updateNavLinks(savedPlace);
    placeUserMarker(savedLat, savedLon, S.vehicle);
    map.setView([savedLat, savedLon], 16);
    S.selectedCityLat = savedLat;
    S.selectedCityLon = savedLon;
    populate(savedPlace);
  } else {
    map.setView([BHIMAVARAM.lat, BHIMAVARAM.lon], 14);
    S.selectedCityLat = BHIMAVARAM.lat;
    S.selectedCityLon = BHIMAVARAM.lon;
    populate('Bhimavaram');
  }
  setTimeout(() => map.invalidateSize(), 200);
}