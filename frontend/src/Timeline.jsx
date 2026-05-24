// timeline.jsx — Kairos historic/temporal view
// Horizontal river-of-time: each cluster is a band flowing left→right.
// Band thickness encodes upload density at that moment. Photos sit on
// their band at their timestamp.

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { KAIROS_DATA } from './data/data.js';

function KairosTimeline({ onOpenCluster, onOpenPhoto, density = 'medium' }) {
  const D = KAIROS_DATA;
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  const visiblePhotos = useMemo(() => {
    if (density === 'packed') return D.PHOTOS;
    if (density === 'sparse') return D.PHOTOS.filter((_, i) => i % 3 === 0);
    return D.PHOTOS.filter((_, i) => i % 2 === 0);
  }, [density]);

  const T0 = new Date('2024-01-01').getTime();
  const T1 = new Date('2026-06-01').getTime();
  const SPAN = T1 - T0;

  const stateRef = useRef({
    scroll: 0,       // x offset
    zoom: 1,         // time horizontal scale (1 = fit)
    images: new Map(),
    mouse: { x: 0, y: 0, in: false },
    hovered: null,
    t0: performance.now(),
  });
  const [hoverInfo, setHoverInfo] = useState(null);
  const [tick, setTick] = useState(0);

  const ensureImage = useCallback((url) => {
    const s = stateRef.current;
    if (s.images.has(url)) return s.images.get(url);
    const entry = { img: new Image(), loaded: false };
    entry.img.crossOrigin = 'anonymous';
    entry.img.onload = () => { entry.loaded = true; };
    entry.img.onerror = () => {
      const fb = new Image();
      fb.onload = () => { entry.img = fb; entry.loaded = true; };
      fb.src = 'https://picsum.photos/seed/' + encodeURIComponent(url) + '/180/180';
    };
    entry.img.src = url;
    s.images.set(url, entry);
    return entry;
  }, []);

  // Compute density curves per cluster (sample points across time)
  const bands = useMemo(() => {
    const N = 80;
    return D.CLUSTERS.map((c, ci) => {
      const samples = new Array(N).fill(0);
      const ps = D.PHOTOS.filter(p => p.cluster === c.id);
      ps.forEach(p => {
        const f = (p.ts - T0) / SPAN;
        const idx = Math.max(0, Math.min(N - 1, Math.floor(f * N)));
        samples[idx] += 1;
      });
      // smooth with simple kernel
      const smooth = samples.map((_, i) => {
        let v = 0, w = 0;
        for (let k = -3; k <= 3; k++) {
          const j = i + k;
          if (j < 0 || j >= N) continue;
          const ww = Math.exp(-k * k / 3);
          v += samples[j] * ww; w += ww;
        }
        return v / w;
      });
      const max = Math.max(...smooth, 1);
      return { c, ci, samples: smooth, max, total: ps.length };
    });
  }, []);

  const xForTime = (ts, w) => {
    const s = stateRef.current;
    const usable = w - 120; // margins L60 R60
    return 60 + ((ts - T0) / SPAN) * usable * s.zoom + s.scroll;
  };
  const timeForX = (x, w) => {
    const s = stateRef.current;
    const usable = w - 120;
    return T0 + ((x - 60 - s.scroll) / (usable * s.zoom)) * SPAN;
  };

  // band y centers
  const bandLayout = (h) => {
    const top = 90, bottom = 140;
    const usableH = h - top - bottom;
    const step = usableH / bands.length;
    return bands.map((b, i) => ({
      ...b,
      yc: top + step * i + step / 2,
      thickness: step * 0.78,
    }));
  };

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const s = stateRef.current;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const t = (performance.now() - s.t0) / 1000;
      ctx.fillStyle = '#070708';
      ctx.fillRect(0, 0, w, h);

      const layout = bandLayout(h);

      // Vertical month gridlines
      const monthMs = 30 * 24 * 3600 * 1000;
      for (let ts = T0; ts <= T1; ts += monthMs) {
        const x = xForTime(ts, w);
        if (x < 0 || x > w) continue;
        const d = new Date(ts);
        const isJan = d.getMonth() === 0;
        ctx.strokeStyle = isJan ? 'rgba(245,243,238,0.10)' : 'rgba(245,243,238,0.03)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 60); ctx.lineTo(x, h - 100);
        ctx.stroke();
      }

      // Bands (stream-graph style)
      layout.forEach(({ c, samples, max, yc, thickness }) => {
        const N = samples.length;
        const path = new Path2D();
        // top
        for (let i = 0; i <= N; i++) {
          const ts = T0 + (i / N) * SPAN;
          const x = xForTime(ts, w);
          const ii = Math.min(N - 1, i);
          const v = samples[ii] / max;
          const dy = (v * thickness * 0.5) + 4;
          if (i === 0) path.moveTo(x, yc - dy);
          else path.lineTo(x, yc - dy);
        }
        // bottom (reverse)
        for (let i = N; i >= 0; i--) {
          const ts = T0 + (i / N) * SPAN;
          const x = xForTime(ts, w);
          const ii = Math.min(N - 1, i);
          const v = samples[ii] / max;
          const dy = (v * thickness * 0.5) + 4;
          path.lineTo(x, yc + dy);
        }
        path.closePath();
        ctx.fillStyle = `hsla(${c.hue},45%,55%,0.10)`;
        ctx.fill(path);
        ctx.strokeStyle = `hsla(${c.hue},55%,65%,0.35)`;
        ctx.lineWidth = 0.6;
        ctx.stroke(path);

        // baseline thread
        ctx.strokeStyle = 'rgba(245,243,238,0.04)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(60, yc); ctx.lineTo(w - 60, yc);
        ctx.stroke();
      });

      // Photos along bands
      visiblePhotos.forEach(p => {
        const band = layout[p.ci];
        if (!band) return;
        const x = xForTime(p.ts, w);
        if (x < -40 || x > w + 40) return;
        // y jitter inside band
        const f = (p.ts - T0) / SPAN;
        const ii = Math.max(0, Math.min(band.samples.length - 1,
          Math.floor(f * band.samples.length)));
        const v = band.samples[ii] / band.max;
        const localR = (Math.sin(p.vibe * 12.9 + 4.3) * 0.5 + 0.5);
        const jitter = (localR - 0.5) * (v * band.thickness * 0.7);
        const y = band.yc + jitter + Math.sin(t * 0.5 + p.vibe * 6.28) * 0.6;
        // Photo size
        const sz = 22 * p.weight * (0.6 + v * 0.6) * stateRef.current.zoom * 0.8 + 6;
        const isHovered = stateRef.current.hovered === p.id;
        const entry = ensureImage(p.thumb);
        ctx.globalAlpha = stateRef.current.hovered && !isHovered ? 0.45 : 1;
        if (isHovered) { ctx.shadowColor = 'rgba(232,184,124,0.7)'; ctx.shadowBlur = 18; }
        if (entry.loaded) {
          ctx.drawImage(entry.img, x - sz / 2, y - sz / 2, sz, sz);
        } else {
          ctx.fillStyle = `hsla(${band.c.hue},25%,18%,1)`;
          ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
        }
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      });

      raf = requestAnimationFrame(render);
    };
    render();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [visiblePhotos, bands, ensureImage]);

  // Pointer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dragging = false, dragMoved = false, lastX = 0;

    const hit = (mx, my) => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const layout = bandLayout(h);
      for (let i = visiblePhotos.length - 1; i >= 0; i--) {
        const p = visiblePhotos[i];
        const band = layout[p.ci]; if (!band) continue;
        const x = xForTime(p.ts, w);
        if (Math.abs(x - mx) > 30) continue;
        const f = (p.ts - T0) / SPAN;
        const ii = Math.max(0, Math.min(band.samples.length - 1,
          Math.floor(f * band.samples.length)));
        const v = band.samples[ii] / band.max;
        const localR = (Math.sin(p.vibe * 12.9 + 4.3) * 0.5 + 0.5);
        const jitter = (localR - 0.5) * (v * band.thickness * 0.7);
        const y = band.yc + jitter;
        const sz = 22 * p.weight * (0.6 + v * 0.6) * stateRef.current.zoom * 0.8 + 6;
        if (mx >= x - sz / 2 && mx <= x + sz / 2 &&
            my >= y - sz / 2 && my <= y + sz / 2) return p;
      }
      return null;
    };

    const onDown = (e) => {
      dragging = true; dragMoved = false; lastX = e.clientX;
      canvas.style.cursor = 'grabbing';
    };
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const s = stateRef.current;
      s.mouse.x = mx; s.mouse.y = my; s.mouse.in = true;
      if (dragging) {
        const dx = e.clientX - lastX;
        if (Math.abs(dx) > 2) dragMoved = true;
        s.scroll += dx;
        lastX = e.clientX;
      } else {
        const hp = hit(mx, my);
        if (hp?.id !== s.hovered) {
          s.hovered = hp?.id || null;
          if (hp) setHoverInfo({ p: hp, x: mx, y: my });
          else setHoverInfo(null);
        } else if (hp) setHoverInfo({ p: hp, x: mx, y: my });
        canvas.style.cursor = hp ? 'default' : 'grab';
      }
    };
    const onUp = (e) => {
      if (dragging && !dragMoved) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const hp = hit(mx, my);
        if (hp && onOpenPhoto) onOpenPhoto(hp);
      }
      dragging = false; canvas.style.cursor = 'grab';
    };
    const onLeave = () => {
      stateRef.current.mouse.in = false;
      stateRef.current.hovered = null;
      setHoverInfo(null);
      dragging = false;
    };
    const onWheel = (e) => {
      e.preventDefault();
      const s = stateRef.current;
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        s.scroll -= (e.deltaX || e.deltaY);
      } else {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const w = canvas.clientWidth;
        const tBefore = timeForX(mx, w);
        const factor = Math.exp(-e.deltaY * 0.0015);
        s.zoom = Math.max(0.6, Math.min(8, s.zoom * factor));
        const tAfter = timeForX(mx, w);
        s.scroll += (xForTime(tBefore, w) - xForTime(tAfter, w));
      }
    };
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.style.cursor = 'grab';
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [visiblePhotos, bands, onOpenPhoto]);

  // re-render overlays
  useEffect(() => {
    const id = setInterval(() => setTick(x => (x + 1) % 1000), 100);
    return () => clearInterval(id);
  }, []);

  // Compute axis ticks
  const w = canvasRef.current?.clientWidth || 1200;
  const h = canvasRef.current?.clientHeight || 800;
  const ticks = [];
  const monthMs = 30 * 24 * 3600 * 1000;
  for (let ts = T0; ts <= T1; ts += monthMs) {
    const x = xForTime(ts, w);
    if (x < 50 || x > w - 50) continue;
    const d = new Date(ts);
    const major = d.getMonth() === 0 || d.getMonth() === 6;
    ticks.push({
      x, label: major ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : d.toLocaleDateString('en-US', { month: 'short' }),
      major,
    });
  }

  const layout = bandLayout(h);

  // Visible window for scrubber
  const tlVis = timeForX(60, w);
  const trVis = timeForX(w - 60, w);
  const winL = Math.max(0, (tlVis - T0) / SPAN);
  const winR = Math.min(1, (trVis - T0) / SPAN);

  return (
    <div ref={wrapRef} className="timeline-wrap">
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block'
      }} />
      {/* Band labels */}
      {layout.map(b => (
        <div key={b.c.id} style={{
          position: 'absolute', left: 16, top: b.yc - 9,
          fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink-2)',
          letterSpacing: 0, lineHeight: 1, cursor: 'default'
        }}
        onClick={() => onOpenCluster && onOpenCluster(b.c)}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-2)'; }}
        >
          {b.c.label}
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '.16em',
            textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 3
          }}>{b.total} photos</div>
        </div>
      ))}
      {/* Time ticks */}
      <div className="timeline-ticks" style={{ pointerEvents: 'none' }}>
        {ticks.map((t, i) => (
          <div key={i} className={'timeline-tick ' + (t.major ? 'major' : '')}
            style={{ left: t.x }}>
            <div className="stem" />
            {t.label}
          </div>
        ))}
      </div>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 16, left: 16, right: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase',
        color: 'var(--ink-3)'
      }}>
        <div>Timeline · {new Date(tlVis).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} → {new Date(trVis).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
        <div>{visiblePhotos.length} photos · {D.CLUSTERS.length} clusters</div>
      </div>
      {/* Scrubber */}
      <div className="timeline-scrubber">
        <span>{new Date(T0).getFullYear()}</span>
        <div className="track">
          <div className="window" style={{
            left: winL * 100 + '%', width: (winR - winL) * 100 + '%'
          }} />
          <div className="handle" style={{ left: ((winL + winR) / 2) * 100 + '%' }} />
        </div>
        <span>{new Date(T1).getFullYear()}</span>
      </div>
      {/* Hover */}
      {hoverInfo && (
        <div className="photo-card fade-in"
          style={{ left: hoverInfo.x, top: hoverInfo.y, pointerEvents: 'none' }}>
          <div className="by">@{hoverInfo.p.author}</div>
          <div className="tags">
            {hoverInfo.p.tags.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
          <div className="meta">
            {new Date(hoverInfo.p.date).toLocaleDateString('en-US',
              { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      )}
    </div>
  );
}

export { KairosTimeline };
export default KairosTimeline;
