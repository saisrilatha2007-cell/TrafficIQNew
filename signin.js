/* TrafficIQ — signin.js */

/* ══ 1. CITY CANVAS — buildings, road, traffic trails ══ */
(function() {
  const canvas = document.getElementById('roadCanvas');
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
  resize();
  addEventListener('resize', resize);

  /* ── Buildings ── */
  const BUILDINGS = [];
  function genBuildings() {
    BUILDINGS.length = 0;
    const count = Math.floor(W / 38);
    for (let i = 0; i < count; i++) {
      const bw = 28 + Math.random() * 40;
      const bh = 80 + Math.random() * (H * 0.45);
      BUILDINGS.push({
        x: (W / count) * i + Math.random() * 10,
        w: bw,
        h: bh,
        windows: generateWindows(bw, bh),
        layer: Math.random() > 0.5 ? 'far' : 'near',
      });
    }
  }

  function generateWindows(bw, bh) {
    const wins = [];
    const cols = Math.floor(bw / 10);
    const rows = Math.floor(bh / 14);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.35) {
          wins.push({
            cx: 4 + c * 10 + Math.random() * 2,
            cy: 6 + r * 14 + Math.random() * 2,
            lit: Math.random() > 0.3,
            flicker: Math.random() > 0.85,
            flickerTimer: Math.random() * 200,
          });
        }
      }
    }
    return wins;
  }

  genBuildings();
  addEventListener('resize', genBuildings);

  /* ── Traffic streaks ── */
  const STREAKS = [];
  function newStreak() {
    const side = Math.random() > 0.5;
    return {
      x: side ? W * 0.5 - 40 - Math.random() * 160 : W * 0.5 + 40 + Math.random() * 160,
      y: H + Math.random() * H * 0.2,
      len: 70 + Math.random() * 180,
      speed: 1.8 + Math.random() * 3,
      isRed: !side,
      alpha: 0.3 + Math.random() * 0.5,
      w: 1.5 + Math.random() * 2,
    };
  }
  for (let i = 0; i < 24; i++) { const s = newStreak(); s.y = Math.random() * H; STREAKS.push(s); }

  let frame = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    frame++;

    /* Sky gradient */
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#010310');
    sky.addColorStop(0.6, '#040820');
    sky.addColorStop(1, '#0a0d28');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    /* Stars */
    if (frame % 3 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (let i = 0; i < 3; i++) {
        const sx = Math.random() * W;
        const sy = Math.random() * H * 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* Far buildings (dimmer) */
    drawBuildings('far', 0.45);

    /* Road surface */
    const roadTop = H * 0.6;
    const roadGrad = ctx.createLinearGradient(0, roadTop, 0, H);
    roadGrad.addColorStop(0, 'rgba(12,14,30,0.9)');
    roadGrad.addColorStop(1, 'rgba(4,6,14,1)');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, roadTop, W, H - roadTop);

    /* Perspective lane lines */
    const vx = W * 0.5, vy = H * 0.6;
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const bx = W * 0.05 + (W * 0.9) * t;
      const lGrad = ctx.createLinearGradient(vx, vy, bx, H);
      lGrad.addColorStop(0, 'rgba(255,255,255,0)');
      lGrad.addColorStop(0.5, 'rgba(255,255,255,0.06)');
      lGrad.addColorStop(1, 'rgba(255,255,255,0.14)');
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(bx, H);
      ctx.strokeStyle = lGrad;
      ctx.lineWidth = i === 0 || i === 6 ? 2 : 0.7;
      ctx.setLineDash(i === 0 || i === 6 ? [] : [16, 16]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    /* Near buildings (in front of road edge) */
    drawBuildings('near', 0.85);

    /* Traffic streaks */
    STREAKS.forEach(s => {
      const g = ctx.createLinearGradient(s.x, s.y, s.x, s.y - s.len);
      const clr = s.isRed ? `rgba(255,30,55,${s.alpha})` : `rgba(255,175,30,${s.alpha})`;
      g.addColorStop(0, clr);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x, s.y - s.len);
      ctx.strokeStyle = g;
      ctx.lineWidth = s.w;
      ctx.lineCap = 'round';
      ctx.stroke();
      s.y -= s.speed;
      if (s.y + s.len < roadTop) { Object.assign(s, newStreak()); }
    });

    /* Ambient glows */
    [
      [W * 0.15, H * 0.88, 'rgba(255,30,55,0.07)', W * 0.25],
      [W * 0.85, H * 0.85, 'rgba(255,160,30,0.06)', W * 0.22],
      [W * 0.5,  H * 0.65, 'rgba(79,195,247,0.04)', W * 0.3],
    ].forEach(([gx, gy, color, r]) => {
      const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
      glow.addColorStop(0, color);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    });

    requestAnimationFrame(draw);
  }

  function drawBuildings(layer, opacity) {
    const roadY = H * 0.6;
    BUILDINGS.filter(b => b.layer === layer).forEach(b => {
      const bx = b.x;
      const by = roadY - b.h;

      /* Building body */
      const bGrad = ctx.createLinearGradient(bx, by, bx, roadY);
      if (layer === 'far') {
        bGrad.addColorStop(0, `rgba(18,22,50,${opacity})`);
        bGrad.addColorStop(1, `rgba(10,14,35,${opacity})`);
      } else {
        bGrad.addColorStop(0, `rgba(22,28,65,${opacity})`);
        bGrad.addColorStop(1, `rgba(14,18,45,${opacity})`);
      }
      ctx.fillStyle = bGrad;
      ctx.fillRect(bx, by, b.w, b.h);

      /* Building edge highlight */
      ctx.strokeStyle = `rgba(79,195,247,${0.04 * opacity})`;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(bx, by, b.w, b.h);

      /* Windows */
      b.windows.forEach(win => {
        if (win.flicker) {
          win.flickerTimer++;
          if (win.flickerTimer > 120 + Math.random() * 300) {
            win.lit = !win.lit;
            win.flickerTimer = 0;
          }
        }
        if (!win.lit) return;

        const wx = bx + win.cx;
        const wy = by + win.cy;
        const isBlue = Math.random() > 0.7;
        ctx.fillStyle = isBlue
          ? `rgba(120,200,255,${0.55 * opacity})`
          : `rgba(255,220,120,${0.6 * opacity})`;
        ctx.fillRect(wx, wy, 5, 7);

        /* Window glow */
        const wglow = ctx.createRadialGradient(wx + 2.5, wy + 3.5, 0, wx + 2.5, wy + 3.5, 8);
        wglow.addColorStop(0, isBlue ? `rgba(120,200,255,${0.08 * opacity})` : `rgba(255,220,120,${0.08 * opacity})`);
        wglow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = wglow;
        ctx.fillRect(wx - 5, wy - 5, 15, 17);
      });
    });
  }

  draw();
})();


/* ══ 2. PARTICLES ══ */
(function() {
  const c = document.getElementById('particles');
  for (let i = 0; i < 45; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const sz = 1 + Math.random() * 2.5;
    const blue = Math.random() > 0.55;
    p.style.cssText = `
      left:${Math.random()*100}%;
      bottom:${Math.random()*25}%;
      width:${sz}px; height:${sz}px;
      background:${blue ? `rgba(79,195,247,${0.3+Math.random()*0.4})` : `rgba(255,107,53,${0.2+Math.random()*0.4})`};
      animation-duration:${7+Math.random()*13}s;
      animation-delay:${Math.random()*8}s;
    `;
    c.appendChild(p);
  }
})();


/* ══ 3. TAB SWITCH ══ */
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', (i === 0) === (tab === 'signin')));
  document.getElementById('tabSlider').style.transform = tab === 'signin' ? 'translateX(0)' : 'translateX(calc(100% + 4px))';
  const show = tab === 'signin' ? 'signinPanel' : 'signupPanel';
  const hide = tab === 'signin' ? 'signupPanel' : 'signinPanel';
  document.getElementById(hide).classList.add('hidden');
  const el = document.getElementById(show);
  el.classList.remove('hidden');
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearErrors();
}


/* ══ 4. PASSWORD TOGGLE ══ */
function togglePwd(id, btn) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}


/* ══ 5. PASSWORD STRENGTH ══ */
function checkStrength(v) {
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v)) s++;
  if (/[0-9]/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  if (v.length >= 14) s++;
  const levels = [
    ['0%','transparent',''],
    ['25%','rgba(255,45,85,0.8)','Weak'],
    ['50%','rgba(255,149,0,0.85)','Fair'],
    ['75%','rgba(255,204,0,0.85)','Good'],
    ['90%','rgba(52,199,89,0.85)','Strong'],
    ['100%','rgba(52,199,89,1)','Very Strong ✦'],
  ];
  const [pct, clr, lbl] = levels[Math.min(s, 5)];
  const fill = document.getElementById('sFill');
  fill.style.width = v ? pct : '0%';
  fill.style.background = clr;
  document.getElementById('sLbl').textContent = v ? lbl : '';
}


/* ══ 6. VALIDATION ══ */
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = v => /^[6-9]\d{9}$/.test(v.replace(/\s/g,''));
const isPlate = v => /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/.test(v.replace(/\s/g,''));

function setErr(id, msg) { const e = document.getElementById(id); if(e) e.textContent = msg; }
function clearErrors() {
  document.querySelectorAll('.err').forEach(e => e.textContent = '');
  document.querySelectorAll('.field-input').forEach(i => i.classList.remove('valid','invalid'));
}
function mark(id, ok) {
  const el = document.getElementById(id);
  if(el) { el.classList.toggle('valid', ok); el.classList.toggle('invalid', !ok); }
}


/* ══ 7. SIGN IN ══ */
function handleSignIn() {
  clearErrors();
  const id  = document.getElementById('si-id').value.trim();
  const pwd = document.getElementById('si-pwd').value;
  let ok = true;

  if (!id || (!isEmail(id) && !isPhone(id))) {
    setErr('err-si-id', 'Enter valid email or 10-digit mobile.'); mark('si-id', false); ok = false;
  } else { mark('si-id', true); }

  if (pwd.length < 6) {
    setErr('err-si-pwd', 'Minimum 6 characters required.'); mark('si-pwd', false); ok = false;
  } else { mark('si-pwd', true); }

  if (!ok) return;

  const btn = document.querySelector('#signinPanel .submit-btn');
  simulateLoad(btn, () => { window.location.href = 'dashboard.html'; });
}


/* ══ 8. SIGN UP ══ */
function handleSignUp() {
  clearErrors();
  const name    = document.getElementById('su-name').value.trim();
  const email   = document.getElementById('su-email').value.trim();
  const mobile  = document.getElementById('su-mobile').value.trim();
  const plate   = document.getElementById('su-plate').value.trim().toUpperCase();
  const pwd     = document.getElementById('su-pwd').value;
  const confirm = document.getElementById('su-confirm').value;
  const agreed  = document.getElementById('agreeTerms').checked;
  let ok = true;

  if (name.length < 2)       { setErr('err-su-name','Enter your full name.'); mark('su-name',false); ok=false; } else mark('su-name',true);
  if (!isEmail(email))       { setErr('err-su-email','Enter a valid email.'); mark('su-email',false); ok=false; } else mark('su-email',true);
  if (!isPhone(mobile))      { setErr('err-su-mobile','Enter 10-digit mobile.'); mark('su-mobile',false); ok=false; } else mark('su-mobile',true);
  if (plate && !isPlate(plate)) { setErr('err-su-plate','Format: MH12AB1234'); mark('su-plate',false); ok=false; } else if(plate) mark('su-plate',true);
  if (pwd.length < 8)        { setErr('err-su-pwd','Minimum 8 characters.'); mark('su-pwd',false); ok=false; } else mark('su-pwd',true);
  if (pwd !== confirm)       { setErr('err-su-confirm','Passwords do not match.'); mark('su-confirm',false); ok=false; } else if(confirm) mark('su-confirm',true);
  if (!agreed)               { setErr('err-terms','Please agree to Terms.'); ok=false; }

  if (!ok) return;

  const btn = document.querySelector('#signupPanel .submit-btn');
  simulateLoad(btn, () => { window.location.href = 'dashboard.html'; });
}


/* ══ 9. LOADING SIMULATION ══ */
function simulateLoad(btn, cb) {
  const txt = btn.querySelector('.btn-text');
  const spin = btn.querySelector('.btn-spin');
  btn.disabled = true; txt.hidden = true; spin.hidden = false;
  setTimeout(() => { spin.hidden = true; txt.hidden = false; btn.disabled = false; cb(); }, 1600);
}


/* ══ 10. LIVE INPUT HELPERS ══ */
document.addEventListener('DOMContentLoaded', () => {
  // Mobile digits only
  document.getElementById('su-mobile')?.addEventListener('input', function() {
    this.value = this.value.replace(/\D/g,'').slice(0,10);
  });
  // Plate uppercase + alphanumeric only
  document.getElementById('su-plate')?.addEventListener('input', function() {
    const pos = this.selectionStart;
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
    this.setSelectionRange(pos, pos);
  });
  // Live confirm match
  document.getElementById('su-confirm')?.addEventListener('input', function() {
    const match = this.value === document.getElementById('su-pwd').value;
    if (this.value) { setErr('err-su-confirm', match ? '' : 'Passwords do not match.'); mark('su-confirm', match); }
  });
});