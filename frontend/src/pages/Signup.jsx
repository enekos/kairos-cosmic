// Signup page — formerly signup.html. Heavy DOM/canvas work is preserved in a
// single useEffect that scopes its querySelectors to the page root ref.
import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KAIROS_DATA } from '../data/data.js';

const SIGNUP_STYLE = `
  .signup-step-2 .auth-form { max-width: none; padding: 80px 6vw 80px; }
  .signup-step-2 .auth-wrap { grid-template-columns: 1fr; }
  .signup-step-2 .auth-stage { display: none; }
  .signup-step-3 .auth-wrap { grid-template-columns: 1fr; min-height: 100vh; }
  .signup-step-3 .auth-form { display: none; }
  .signup-step-3 .auth-stage { border-right: none; }
  .signup-step-3 .auth-stage svg.fly { display: block; width: 100%; height: 100%; }
  .signup-step-3 .complete-overlay { position: absolute; inset: 0; z-index: 3;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 40px; pointer-events: none; }
  .signup-step-3 .complete-overlay .pre { font-size: 11px; letter-spacing: .24em;
    text-transform: uppercase; color: var(--ink-3); margin-bottom: 22px;
    opacity: 0; transition: opacity .8s 1.4s; }
  .signup-step-3 .complete-overlay h1 { font-family: var(--serif); font-weight: 400;
    font-size: clamp(56px, 7vw, 108px); line-height: .95; margin: 0 0 18px;
    letter-spacing: -.012em; opacity: 0; transition: opacity 1s 1.6s; }
  .signup-step-3 .complete-overlay h1 em { font-style: italic; color: var(--warm); }
  .signup-step-3 .complete-overlay .sub { font-family: var(--serif); font-style: italic;
    font-size: 22px; color: var(--ink-2); max-width: 560px; margin: 0 0 40px;
    opacity: 0; transition: opacity .8s 1.9s; }
  .signup-step-3 .complete-overlay .actions { display: flex; gap: 14px;
    pointer-events: auto; opacity: 0; transition: opacity .8s 2.4s; }
  .signup-step-3.revealed .complete-overlay .pre,
  .signup-step-3.revealed .complete-overlay h1,
  .signup-step-3.revealed .complete-overlay .sub,
  .signup-step-3.revealed .complete-overlay .actions { opacity: 1; }
`;

export default function Signup() {
  const pageRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('page');
    return () => document.body.classList.remove('page');
  }, []);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return undefined;

    const D = KAIROS_DATA;
    const form = page.querySelector('#authForm');
    const stageCanvas = page.querySelector('#stageCanvas');

    // Calibration grid setup
    function pickGridPhotos() {
      const out = [];
      D.CLUSTERS.forEach(c => {
        const ps = D.PHOTOS.filter(p => p.cluster === c.id);
        const picked = ps.slice().sort((a, b) => b.weight - a.weight)
          .slice(0, c.size === 'large' ? 3 : 2);
        picked.forEach(p => out.push(p));
      });
      let s = 31;
      out.sort(() => { s = (s * 1664525 + 1013904223) >>> 0; return (s / 0xffffffff) - 0.5; });
      return out.slice(0, 24);
    }
    const gridPhotos = pickGridPhotos();
    const grid = page.querySelector('#calibGrid');
    const picked = [];

    const cellListeners = [];
    gridPhotos.forEach((p) => {
      const cell = document.createElement('div');
      cell.className = 'calib-cell';
      cell.dataset.id = p.id;
      const img = document.createElement('img');
      img.src = p.thumb;
      img.alt = '';
      img.loading = 'lazy';
      cell.appendChild(img);
      const handler = () => togglePick(p, cell);
      cell.addEventListener('click', handler);
      cellListeners.push({ cell, handler });
      grid.appendChild(cell);
    });

    function togglePick(p, cell) {
      const idx = picked.indexOf(p.id);
      if (idx >= 0) {
        picked.splice(idx, 1);
        cell.classList.remove('picked');
        cell.removeAttribute('data-rank');
      } else if (picked.length < 9) {
        picked.push(p.id);
        cell.classList.add('picked');
        cell.setAttribute('data-rank', picked.length);
      }
      page.querySelectorAll('.calib-cell.picked').forEach(c => {
        const i = picked.indexOf(c.dataset.id) + 1;
        c.setAttribute('data-rank', i);
      });
      page.querySelector('#picked-count').textContent = picked.length;
      page.querySelector('#min-req').classList.toggle('met', picked.length >= 5);
      page.querySelector('#go-step3').disabled = picked.length < 5;
      updateReadout();
    }

    function updateReadout() {
      if (picked.length === 0) {
        page.querySelector('#ro-embed').textContent = '— · —';
        page.querySelector('#ro-cluster').textContent = 'awaiting picks';
        page.querySelector('#ro-neigh').textContent = '—';
        page.querySelector('#ro-span').textContent = '—';
        return;
      }
      const pickedPs = picked.map(id => D.PHOTOS.find(p => p.id === id));
      const cx = pickedPs.reduce((a, p) => a + p.x, 0) / pickedPs.length;
      const cy = pickedPs.reduce((a, p) => a + p.y, 0) / pickedPs.length;
      const counts = {};
      pickedPs.forEach(p => { counts[p.cluster] = (counts[p.cluster] || 0) + 1; });
      const dom = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      const domLabel = D.CLUSTERS.find(c => c.id === dom).label;
      const spread = new Set(pickedPs.map(p => p.cluster)).size;
      const neighs = D.PHOTOS
        .filter(p => !picked.includes(p.id))
        .map(p => ({ p, d: Math.hypot(p.x - cx, p.y - cy) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 3)
        .map(x => '@' + x.p.author)
        .join(' · ');
      page.querySelector('#ro-embed').textContent =
        `${(cx / 100).toFixed(2)} · ${(cy / 100).toFixed(2)}`;
      page.querySelector('#ro-cluster').textContent =
        domLabel + (spread > 2 ? ` (+${spread - 1} adj)` : '');
      page.querySelector('#ro-neigh').textContent = neighs;
      page.querySelector('#ro-span').textContent = spread + (spread === 1 ? ' cluster' : ' clusters');
    }

    const goStep2El = page.querySelector('#go-step2');
    const onGoStep2 = () => {
      const handle = page.querySelector('#f-handle').value.trim();
      const email = page.querySelector('#f-email').value.trim();
      if (!handle.match(/^[a-z][a-z0-9_.]{2,13}$/) || !email.includes('@')) {
        alert('Pick a lowercase handle (3-14 chars) and a valid email.');
        return;
      }
      sessionStorage.setItem('kairos-handle', handle);
      sessionStorage.setItem('kairos-email', email);
      form.querySelector('[data-step="1"]').style.display = 'none';
      form.querySelector('[data-step="2"]').style.display = 'block';
      page.classList.add('signup-step-2');
    };
    goStep2El.addEventListener('click', onGoStep2);

    const backTo1 = page.querySelector('#back-to-1');
    const onBackTo1 = (e) => {
      e.preventDefault();
      form.querySelector('[data-step="2"]').style.display = 'none';
      form.querySelector('[data-step="1"]').style.display = 'block';
      page.classList.remove('signup-step-2');
    };
    backTo1.addEventListener('click', onBackTo1);

    const goStep3El = page.querySelector('#go-step3');
    const onGoStep3 = () => {
      if (picked.length < 5) return;
      enterStep3();
    };
    goStep3El.addEventListener('click', onGoStep3);

    function enterStep3() {
      page.classList.remove('signup-step-2');
      page.classList.add('signup-step-3');
      page.querySelector('.auth-stage-label').style.display = 'none';
      stageCanvas.style.display = 'none';
      page.querySelector('#flySvg').style.display = 'block';
      page.querySelector('#completeOverlay').style.display = 'flex';
      const pickedPs = picked.map(id => D.PHOTOS.find(p => p.id === id));
      const cx = pickedPs.reduce((a, p) => a + p.x, 0) / pickedPs.length;
      const cy = pickedPs.reduce((a, p) => a + p.y, 0) / pickedPs.length;
      const counts = {};
      pickedPs.forEach(p => { counts[p.cluster] = (counts[p.cluster] || 0) + 1; });
      const dom = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      const domLabel = D.CLUSTERS.find(c => c.id === dom).label;
      page.querySelector('#welcomeHandle').textContent =
        sessionStorage.getItem('kairos-handle') || 'stranger';
      page.querySelector('#welcomeCluster').textContent = domLabel.toLowerCase();
      runFlyAnimation(cx, cy);
      setTimeout(() => page.classList.add('revealed'), 100);
    }

    // Stage canvas drifting animation
    let stageRaf = 0;
    let stageStopped = false;
    (function setupStage() {
      const ctx = stageCanvas.getContext('2d');
      function resize() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = stageCanvas.clientWidth, h = stageCanvas.clientHeight;
        stageCanvas.width = w * dpr; stageCanvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      resize();
      window.addEventListener('resize', resize);

      const drift = D.PHOTOS.filter((_, i) => i % 8 === 0).slice(0, 14);
      const imgs = new Map();
      drift.forEach(p => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = p.thumb;
        imgs.set(p.id, img);
      });
      const positions = drift.map((p, i) => ({
        cx: 0.2 + ((i * 73) % 100) / 100 * 0.65,
        cy: 0.15 + ((i * 137) % 100) / 100 * 0.7,
        r: 0.03 + (i % 3) * 0.025,
        speed: 0.06 + (i % 5) * 0.02,
        phase: i * 0.7,
        size: p.weight > 1.4 ? 90 : p.weight > 1.1 ? 72 : 58,
        p,
      }));
      const t0 = performance.now();
      function draw() {
        if (stageStopped) return;
        if (stageCanvas.style.display === 'none') {
          stageRaf = requestAnimationFrame(draw); return;
        }
        const w = stageCanvas.clientWidth, h = stageCanvas.clientHeight;
        const t = (performance.now() - t0) / 1000;
        ctx.fillStyle = '#050507';
        ctx.fillRect(0, 0, w, h);
        const grad = ctx.createRadialGradient(w * 0.55, h * 0.45, 0, w * 0.55, h * 0.45, Math.max(w, h) * 0.6);
        grad.addColorStop(0, 'rgba(232,184,124,0.10)');
        grad.addColorStop(1, 'rgba(232,184,124,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 80; i++) {
          const sx = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
          const sy = ((Math.sin(i * 78.233) * 12345.6789) % 1 + 1) % 1;
          const twinkle = 0.5 + 0.5 * Math.sin(t * 1.5 + i);
          ctx.fillStyle = `rgba(245,243,238,${0.45 * twinkle})`;
          const size = 0.7 + (i % 5) * 0.3;
          ctx.fillRect(sx * w, sy * h, size, size);
        }
        positions.forEach((q) => {
          const ang = t * q.speed + q.phase;
          const x = q.cx * w + Math.cos(ang) * q.r * w;
          const y = q.cy * h + Math.sin(ang) * q.r * h;
          const img = imgs.get(q.p.id);
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 20;
          if (img.complete && img.naturalWidth) {
            ctx.globalAlpha = 0.92;
            ctx.drawImage(img, x - q.size / 2, y - q.size / 2, q.size, q.size);
          } else {
            ctx.fillStyle = `hsl(${D.CLUSTERS[q.p.ci]?.hue ?? 30},25%,18%)`;
            ctx.fillRect(x - q.size / 2, y - q.size / 2, q.size, q.size);
          }
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        });
        ctx.strokeStyle = 'rgba(232,184,124,0.18)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 4; i++) {
          const a = positions[(i * 3) % positions.length];
          const b = positions[(i * 3 + 2) % positions.length];
          const ang1 = t * a.speed + a.phase;
          const ang2 = t * b.speed + b.phase;
          const ax = a.cx * w + Math.cos(ang1) * a.r * w;
          const ay = a.cy * h + Math.sin(ang1) * a.r * h;
          const bx = b.cx * w + Math.cos(ang2) * b.r * w;
          const by = b.cy * h + Math.sin(ang2) * b.r * h;
          ctx.beginPath();
          ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        }
        stageRaf = requestAnimationFrame(draw);
      }
      draw();
      // Save resize handler for cleanup
      setupStage.removeListener = () => window.removeEventListener('resize', resize);
    })();

    let flyRaf = 0;
    function runFlyAnimation(targetX, targetY) {
      const VB_W = 1200, VB_H = 800;
      const wxToVx = (wx) => (wx + 1500) / 3000 * VB_W;
      const wyToVy = (wy) => (wy + 1100) / 2200 * VB_H;
      const tx = wxToVx(targetX), ty = wyToVy(targetY);

      const stars = page.querySelector('#fly-stars');
      let sStr = '';
      for (let i = 0; i < 90; i++) {
        const sx = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
        const sy = ((Math.sin(i * 78.233) * 12345.6789) % 1 + 1) % 1;
        const o = 0.25 + (i % 4) * 0.18;
        const r = 0.6 + (i % 4) * 0.3;
        sStr += `<circle cx="${(sx * VB_W).toFixed(1)}" cy="${(sy * VB_H).toFixed(1)}" r="${r}" fill="#f5f3ee" opacity="${o.toFixed(2)}"/>`;
      }
      stars.innerHTML = sStr;

      const cl = page.querySelector('#fly-clusters');
      let cStr = '';
      D.CLUSTERS.forEach(c => {
        const x = wxToVx(c.x), y = wyToVy(c.y);
        const r = c.size === 'large' ? 110 : c.size === 'medium' ? 80 : 60;
        cStr += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="url(#cluster-g)"/>`;
        cStr += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(2, r * 0.04)}" fill="#e8b87c" opacity="0.85"/>`;
        cStr += `<text x="${x.toFixed(1)}" y="${(y + r + 12).toFixed(1)}" text-anchor="middle" font-family="monospace" font-size="9" fill="#a7a39a" letter-spacing="2">${c.label.toUpperCase()}</text>`;
      });
      cl.innerHTML = cStr;

      const youDot = page.querySelector('#you-dot');
      const youCore = page.querySelector('#you-core');
      const trail = page.querySelector('#you-trail');
      const startX = -40, startY = VB_H * 0.85;
      const ctrlX = VB_W * 0.3, ctrlY = VB_H * 0.2;
      function bezier(t) {
        const u = 1 - t;
        const x = u * u * startX + 2 * u * t * ctrlX + t * t * tx;
        const y = u * u * startY + 2 * u * t * ctrlY + t * t * ty;
        return { x, y };
      }
      let dPath = '';
      const t0 = performance.now();
      const DUR = 1800;
      function frame() {
        const elapsed = performance.now() - t0;
        const t = Math.min(1, elapsed / DUR);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const pt = bezier(e);
        youDot.setAttribute('cx', pt.x);
        youDot.setAttribute('cy', pt.y);
        youCore.setAttribute('cx', pt.x);
        youCore.setAttribute('cy', pt.y);
        const r = 12 + (1 - Math.abs(e - 0.5) * 2) * 22;
        youDot.setAttribute('r', r);
        if (dPath === '') dPath = `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
        else dPath += ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
        trail.setAttribute('d', dPath);
        if (t < 1) flyRaf = requestAnimationFrame(frame);
        else {
          youCore.animate(
            [{ r: 4, opacity: 1 }, { r: 12, opacity: 0.7 }, { r: 4, opacity: 1 }],
            { duration: 1400, iterations: Infinity },
          );
        }
      }
      flyRaf = requestAnimationFrame(frame);
    }

    return () => {
      stageStopped = true;
      cancelAnimationFrame(stageRaf);
      cancelAnimationFrame(flyRaf);
      setupStage.removeListener?.();
      goStep2El.removeEventListener('click', onGoStep2);
      goStep3El.removeEventListener('click', onGoStep3);
      backTo1.removeEventListener('click', onBackTo1);
      cellListeners.forEach(({ cell, handler }) => cell.removeEventListener('click', handler));
      grid.innerHTML = '';
    };
  }, []);

  return (
    <div ref={pageRef} id="page">
      <style>{SIGNUP_STYLE}</style>
      <div className="auth-wrap">
        <div className="auth-stage">
          <Link to="/" className="stage-brand">Kairos<span className="dot"></span></Link>
          <canvas id="stageCanvas"></canvas>

          <svg className="fly" id="flySvg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={{ display: 'none' }}>
            <defs>
              <radialGradient id="cluster-g" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e8b87c" stopOpacity="0.18"/>
                <stop offset="100%" stopColor="#e8b87c" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="you-g" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e8b87c" stopOpacity="1"/>
                <stop offset="80%" stopColor="#e8b87c" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="#e8b87c" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <g id="fly-stars"></g>
            <g id="fly-clusters"></g>
            <path id="you-trail" stroke="#e8b87c" strokeWidth="1.2" fill="none" opacity="0.55"/>
            <circle id="you-dot" r="22" fill="url(#you-g)" cx="100" cy="400"/>
            <circle id="you-core" r="4" fill="#fff" cx="100" cy="400"/>
          </svg>

          <div className="auth-stage-label">
            <span>This is the constellation.</span>
            <b>Every photo finds its place.</b>
          </div>
        </div>

        <div className="auth-form" id="authForm">
          <div data-step="1" className="step">
            <div className="pre">Sign up · 01 of 03</div>
            <div className="steps"><span className="on"></span><span></span><span></span></div>
            <h1>Let&rsquo;s find your<br/><em>orbit.</em></h1>
            <div className="sub">No avatars, no follower counts. Just you and the embedding space.</div>

            <div className="field">
              <label>handle</label>
              <input id="f-handle" type="text" placeholder="three to fourteen letters · lowercase" autoFocus maxLength={14} />
              <div className="hint">This is how authors are shown beneath each photo.</div>
            </div>
            <div className="field">
              <label>email</label>
              <input id="f-email" type="email" placeholder="you@somewhere" />
            </div>

            <div className="row-actions">
              <button className="btn-primary" id="go-step2">Calibrate →</button>
              <span className="alt-link">Already here? <Link to="/login">Send me a beacon</Link></span>
            </div>
          </div>

          <div data-step="2" className="step" style={{ display: 'none' }}>
            <div className="pre">Sign up · 02 of 03 · Calibration</div>
            <div className="steps"><span className="done"></span><span className="on"></span><span></span></div>
            <h1>Pick the photos that<br/><em>feel like you.</em></h1>
            <div className="sub">Choose at least five. Your selections compute your starting position in the constellation. There&rsquo;s no wrong answer — only your gaze.</div>

            <div className="calib-counter">
              <b id="picked-count">0</b><span>of 5–9 picked</span>
              <span className="req" id="min-req">five minimum</span>
            </div>

            <div className="calib-grid" id="calibGrid"></div>

            <div className="calib-readout">
              <div className="row"><span>computed embedding · μ</span><b id="ro-embed">— · —</b></div>
              <div className="row"><span>dominant cluster</span><b id="ro-cluster">awaiting picks</b></div>
              <div className="row"><span>predicted neighbors</span><b id="ro-neigh">—</b></div>
              <div className="row"><span>aesthetic span</span><b id="ro-span">—</b></div>
            </div>

            <div className="row-actions">
              <button className="btn-primary" id="go-step3" disabled>Drop me into the constellation →</button>
              <span className="alt-link"><a id="back-to-1" href="#">← back</a></span>
            </div>
          </div>
        </div>
      </div>

      <div className="complete-overlay" id="completeOverlay" style={{ display: 'none' }}>
        <div className="pre">Calibration complete</div>
        <h1>Welcome, <em><span id="welcomeHandle">stranger</span></em>.</h1>
        <div className="sub">You&rsquo;ve landed near <span id="welcomeCluster">a cluster</span>. Your first orbit is yours to wander.</div>
        <div className="actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/kairos')}
          >Enter Kairos →</button>
          <Link className="btn-ghost" to="/about">Read the manifesto</Link>
        </div>
      </div>
    </div>
  );
}
