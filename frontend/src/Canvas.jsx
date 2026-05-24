// canvas.jsx — Kairos constellation canvas, now with 3D perspective + multi-dim semantic axes.
//
// Concept: every photo lives at a stable z-depth and has positions in 5 different
// semantic dimensions ('subject', 'palette', 'mood', 'time', 'composition').
// Switching dimensions morphs the whole constellation. Pan creates real parallax
// because the renderer projects through perspective. Shift+scroll dives forward
// through depth ('flythrough'), revealing layered slabs of the embedding space.

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { KAIROS_DATA } from './data/data.js';

const FOCAL = 1.0;
const Z_WORLD_SCALE = 0.45;   // how strongly photo-z contributes to perspective
const PARALLAX = 0.18;        // background star parallax depth

function easeInOut(t) { return t * t * (3 - 2 * t); }

function KairosCanvas({
  vizMode = 'galactic',
  density = 'medium',
  navChrome = 'minimap',
  dim = 'subject',
  onOpenCluster,
  onOpenPhoto,
  onDimChange,
  flyTo,
  injectedPhoto,
}) {
  const D = KAIROS_DATA;
  const canvasRef = useRef(null);
  const stateRef = useRef({
    zoom: 0.55,
    cx: 0, cy: 0, cz: 0,            // camera position (cz = depth)
    targetZoom: 0.55,
    targetCx: 0, targetCy: 0, targetCz: 0,
    mouse: { x: 0, y: 0, in: false },
    hovered: null,
    hoveredCluster: null,
    images: new Map(),
    t0: performance.now(),
    inject: null,
    // dim morph
    dim: dim,
    prevDim: dim,
    morphStart: 0,
    morphDur: 1400,
  });
  const [tick, setTick] = useState(0);
  const [hoverInfo, setHoverInfo] = useState(null);

  const visiblePhotos = useMemo(() => {
    if (density === 'packed') return D.PHOTOS;
    if (density === 'sparse') return D.PHOTOS.filter((_, i) => i % 3 === 0);
    return D.PHOTOS.filter((_, i) => i % 2 !== 0 ? true : i % 4 === 0);
  }, [density]);

  // Cluster centers per dimension (mean of photos)
  const clusterCenters = useMemo(() => {
    const out = {};
    D.DIMENSIONS.forEach(d => {
      out[d.id] = {};
      D.CLUSTERS.forEach(c => {
        const ps = D.PHOTOS.filter(p => p.cluster === c.id);
        const sx = ps.reduce((a, p) => a + p.dims[d.id].x, 0) / ps.length;
        const sy = ps.reduce((a, p) => a + p.dims[d.id].y, 0) / ps.length;
        out[d.id][c.id] = { x: sx, y: sy };
      });
    });
    return out;
  }, []);

  // Neighbors per photo (closest by vibe, for resonance lines)
  const neighbors = useMemo(() => {
    const map = new Map();
    D.CLUSTERS.forEach(c => {
      const ps = D.PHOTOS.filter(p => p.cluster === c.id);
      ps.forEach(p => {
        const sorted = ps
          .filter(q => q.id !== p.id)
          .map(q => ({ q, d: Math.abs(q.vibe - p.vibe) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 5)
          .map(x => x.q);
        map.set(p.id, sorted);
      });
    });
    return map;
  }, []);

  // Trigger morph when prop changes
  useEffect(() => {
    const s = stateRef.current;
    if (s.dim !== dim) {
      s.prevDim = s.dim;
      s.dim = dim;
      s.morphStart = performance.now();
    }
  }, [dim]);

  // FlyTo external
  useEffect(() => {
    if (!flyTo) return;
    const s = stateRef.current;
    s.targetCx = flyTo.x; s.targetCy = flyTo.y;
    s.targetZoom = flyTo.zoom ?? 0.9;
  }, [flyTo]);

  // Inject
  useEffect(() => {
    if (!injectedPhoto) return;
    const s = stateRef.current;
    s.inject = {
      photo: injectedPhoto,
      t0: performance.now(),
      fromX: injectedPhoto.x + (Math.random() - 0.5) * 600,
      fromY: injectedPhoto.y - 800,
    };
    const c = D.CLUSTERS.find(c => c.id === injectedPhoto.cluster);
    if (c) {
      s.targetCx = c.x; s.targetCy = c.y; s.targetZoom = 0.9;
    }
  }, [injectedPhoto]);

  // Image loader
  const ensureImage = useCallback((url) => {
    const s = stateRef.current;
    if (s.images.has(url)) return s.images.get(url);
    const entry = { img: new Image(), loaded: false };
    entry.img.crossOrigin = 'anonymous';
    entry.img.onload = () => { entry.loaded = true; };
    entry.img.onerror = () => {
      const fb = new Image();
      fb.onload = () => { entry.img = fb; entry.loaded = true; };
      fb.src = 'https://picsum.photos/seed/' + encodeURIComponent(url) + '/240/240';
    };
    entry.img.src = url;
    s.images.set(url, entry);
    return entry;
  }, []);

  // Photo position interpolation for current morph
  function photoWorldPos(p) {
    const s = stateRef.current;
    const elapsed = performance.now() - s.morphStart;
    const tNorm = Math.min(1, elapsed / s.morphDur);
    // per-photo stagger based on cluster index + vibe
    const delay = (p.ci % D.CLUSTERS.length) / D.CLUSTERS.length * 0.35;
    const t = Math.max(0, Math.min(1, (tNorm - delay) / Math.max(0.001, 1 - delay)));
    const eased = easeInOut(t);
    const a = p.dims[s.prevDim] || p.dims.subject;
    const b = p.dims[s.dim] || p.dims.subject;
    return {
      x: a.x + (b.x - a.x) * eased,
      y: a.y + (b.y - a.y) * eased,
    };
  }

  // Cluster center for current dim morph
  function clusterCenter(cId) {
    const s = stateRef.current;
    const elapsed = performance.now() - s.morphStart;
    const tNorm = Math.min(1, elapsed / s.morphDur);
    const eased = easeInOut(tNorm);
    const a = clusterCenters[s.prevDim][cId];
    const b = clusterCenters[s.dim][cId];
    return {
      x: a.x + (b.x - a.x) * eased,
      y: a.y + (b.y - a.y) * eased,
    };
  }

  // Perspective projection
  function project(wx, wy, wz, W, H) {
    const s = stateRef.current;
    const depthFromCam = (wz - s.cz);
    const persp = FOCAL / (FOCAL + depthFromCam * Z_WORLD_SCALE);
    const finalScale = s.zoom * persp;
    return {
      x: (wx - s.cx) * finalScale + W / 2,
      y: (wy - s.cy) * finalScale + H / 2,
      scale: finalScale,
      persp,
    };
  }

  function unproject(sx, sy, W, H, wz = 0) {
    const s = stateRef.current;
    const persp = FOCAL / (FOCAL + (wz - s.cz) * Z_WORLD_SCALE);
    const finalScale = s.zoom * persp;
    return {
      x: (sx - W / 2) / finalScale + s.cx,
      y: (sy - H / 2) / finalScale + s.cy,
    };
  }

  function photoBaseSize(p) {
    return 38 * p.weight;
  }

  // Main render loop
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
      // ease cameras
      const ease = 0.13;
      s.zoom += (s.targetZoom - s.zoom) * ease;
      s.cx += (s.targetCx - s.cx) * ease;
      s.cy += (s.targetCy - s.cy) * ease;
      s.cz += (s.targetCz - s.cz) * ease;
      const t = (performance.now() - s.t0) / 1000;

      // Background fade based on camera depth
      ctx.fillStyle = '#070708';
      ctx.fillRect(0, 0, w, h);

      // Parallax star layers (galactic mode only)
      if (vizMode === 'galactic') {
        const starsLayers = [
          { count: 90, depth: -0.8, size: 0.5, alpha: 0.30 },
          { count: 50, depth: -0.4, size: 0.9, alpha: 0.50 },
          { count: 25, depth: 0.0,  size: 1.3, alpha: 0.75 },
          { count: 12, depth: 0.6,  size: 1.7, alpha: 0.9 },
        ];
        starsLayers.forEach(({ count, depth, size, alpha }) => {
          const layerScale = FOCAL / (FOCAL + (depth - s.cz) * Z_WORLD_SCALE);
          for (let i = 0; i < count; i++) {
            const seed = i * 37 + Math.floor((depth + 1) * 100);
            const sx = ((Math.sin(seed * 12.9898) * 43758.5453) % 1 + 1) % 1;
            const sy = ((Math.sin(seed * 78.233)  * 12345.6789) % 1 + 1) % 1;
            // pan via parallax: each layer's pan = camera pan * layerScale * zoom
            const px = sx * 3600 - 1800;
            const py = sy * 3600 - 1800;
            const screenX = (px - s.cx) * s.zoom * layerScale + w / 2;
            const screenY = (py - s.cy) * s.zoom * layerScale + h / 2;
            const xx = ((screenX % w) + w) % w;
            const yy = ((screenY % h) + h) % h;
            const twinkle = 0.6 + 0.4 * Math.sin(t * 1.5 + i);
            ctx.fillStyle = `rgba(245,243,238,${alpha * twinkle})`;
            ctx.fillRect(xx, yy, size, size);
          }
        });
      }

      // Cluster auras/isolines per current dim
      D.CLUSTERS.forEach(c => {
        const cc = clusterCenter(c.id);
        // place cluster aura at average z = 0
        const p = project(cc.x, cc.y, 0, w, h);
        const isHovered = s.hoveredCluster === c.id;
        const baseR = (c.size === 'large' ? 280 : c.size === 'medium' ? 220 : 170)
          * p.scale;
        if (vizMode === 'galactic') {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, baseR);
          grad.addColorStop(0, `hsla(${c.hue},60%,55%,${isHovered ? 0.18 : 0.09})`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(p.x, p.y, baseR, 0, Math.PI * 2); ctx.fill();
        } else if (vizMode === 'topographic') {
          ctx.strokeStyle = `rgba(245,243,238,${isHovered ? 0.16 : 0.07})`;
          ctx.lineWidth = 0.6;
          for (let r = baseR * 0.4; r < baseR * 1.8; r += 22 * Math.max(0.6, p.scale)) {
            ctx.beginPath();
            const segs = 64;
            for (let i = 0; i <= segs; i++) {
              const a = (i / segs) * Math.PI * 2;
              const wob = Math.sin(a * 3 + c.hue * 0.1 + r * 0.01) * (r * 0.05);
              const rx = p.x + Math.cos(a) * (r + wob);
              const ry = p.y + Math.sin(a) * (r + wob);
              if (i === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
            }
            ctx.stroke();
          }
        } else if (vizMode === 'scatter') {
          if (s.zoom < 0.7) {
            ctx.strokeStyle = 'rgba(245,243,238,0.18)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x - 6, p.y); ctx.lineTo(p.x + 6, p.y);
            ctx.moveTo(p.x, p.y - 6); ctx.lineTo(p.x, p.y + 6);
            ctx.stroke();
          }
        }
      });

      // Resonance lines when hovering
      if (s.hovered) {
        const hp = D.PHOTOS.find(p => p.id === s.hovered);
        if (hp) {
          const hpos = photoWorldPos(hp);
          const a = project(hpos.x, hpos.y, hp.z, w, h);
          const nb = neighbors.get(hp.id) || [];
          nb.forEach((q, i) => {
            const qpos = photoWorldPos(q);
            const b = project(qpos.x, qpos.y, q.z, w, h);
            const alpha = 0.55 - i * 0.08;
            ctx.strokeStyle = `rgba(232,184,124,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.stroke();
          });
        }
      }

      // Sort photos by perspective scale (smaller first = farther) for correct draw order
      const draws = [];
      visiblePhotos.forEach(p => {
        const wp = photoWorldPos(p);
        const sp = project(wp.x, wp.y, p.z, w, h);
        const baseSz = photoBaseSize(p);
        const sz = baseSz * sp.scale;
        if (sp.x < -sz || sp.x > w + sz || sp.y < -sz || sp.y > h + sz) return;
        if (sp.persp < 0.05) return; // very far / behind
        draws.push({ p, sp, sz });
      });
      draws.sort((a, b) => a.sz - b.sz);

      // Light cone (subtle radial vignette around mouse)
      if (s.mouse.in && s.zoom > 0.5) {
        const grad = ctx.createRadialGradient(s.mouse.x, s.mouse.y, 100,
          s.mouse.x, s.mouse.y, Math.max(w, h) * 0.6);
        grad.addColorStop(0, 'rgba(7,7,8,0)');
        grad.addColorStop(1, 'rgba(7,7,8,0.45)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Draw photos
      draws.forEach(({ p, sp, sz }) => {
        const isHovered = s.hovered === p.id;
        const inHoveredCluster = s.hoveredCluster && p.cluster === s.hoveredCluster;
        const dm = s.mouse.in ? Math.hypot(sp.x - s.mouse.x, sp.y - s.mouse.y) : 9999;
        const near = dm < 140;

        // Depth fog — distant (small scale) photos fade
        let depthAlpha = Math.min(1, Math.max(0.18, (sp.persp - 0.2) / 1.0 + 0.5));
        if (sp.persp > 1.4) depthAlpha = Math.max(0.5, 1 - (sp.persp - 1.4) * 0.6);
        let opacity = depthAlpha;
        if (s.hovered && !isHovered) opacity *= 0.45;
        if (s.hoveredCluster && !inHoveredCluster) opacity *= 0.3;

        if (sp.persp < 0.35 && vizMode === 'scatter') {
          ctx.fillStyle = `hsla(${D.CLUSTERS[p.ci].hue},55%,65%,${opacity})`;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, Math.max(1.2, sz * 0.06), 0, Math.PI * 2);
          ctx.fill();
          return;
        }

        const entry = ensureImage(p.thumb);
        if (isHovered) { ctx.shadowColor = 'rgba(232,184,124,0.7)'; ctx.shadowBlur = 24; }
        else if (near && sp.persp > 0.8) { ctx.shadowColor = 'rgba(245,243,238,0.18)'; ctx.shadowBlur = 14; }
        else ctx.shadowBlur = 0;
        ctx.globalAlpha = opacity;

        if (entry.loaded) {
          const fx = Math.sin(t * 0.4 + p.vibe * 6.28) * 1.2;
          const fy = Math.cos(t * 0.5 + p.vibe * 6.28) * 1.2;
          ctx.drawImage(entry.img, sp.x - sz / 2 + fx, sp.y - sz / 2 + fy, sz, sz);
          if (isHovered) {
            ctx.strokeStyle = 'rgba(232,184,124,0.9)';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(sp.x - sz / 2 + fx, sp.y - sz / 2 + fy, sz, sz);
          }
          // distance fog overlay — bluish dim for far photos
          if (sp.persp < 0.55) {
            const fogAlpha = (0.55 - sp.persp) / 0.55 * 0.6;
            ctx.fillStyle = `rgba(7,7,12,${fogAlpha})`;
            ctx.fillRect(sp.x - sz / 2 + fx, sp.y - sz / 2 + fy, sz, sz);
          }
        } else {
          ctx.fillStyle = `hsla(${D.CLUSTERS[p.ci].hue},25%,18%,1)`;
          ctx.fillRect(sp.x - sz / 2, sp.y - sz / 2, sz, sz);
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });

      // Inject anim
      if (s.inject) {
        const e = (performance.now() - s.inject.t0) / 1400;
        if (e >= 1) s.inject = null;
        else {
          const k = e * e * (3 - 2 * e);
          const p = s.inject.photo;
          const wx = s.inject.fromX + (p.x - s.inject.fromX) * k;
          const wy = s.inject.fromY + (p.y - s.inject.fromY) * k;
          const sp = project(wx, wy, 0, w, h);
          const sz = photoBaseSize(p) * sp.scale * (1 + (1 - k) * 0.6);
          ctx.shadowColor = 'rgba(232,184,124,0.9)';
          ctx.shadowBlur = 30;
          const entry = ensureImage(p.thumb);
          if (entry.loaded) ctx.drawImage(entry.img, sp.x - sz / 2, sp.y - sz / 2, sz, sz);
          ctx.shadowBlur = 0;
          ctx.strokeStyle = `rgba(232,184,124,${0.6 * (1 - k)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sz * (1 + e * 2), 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(render);
    };
    render();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [vizMode, density, visiblePhotos, neighbors, ensureImage, clusterCenters]);

  // Overlay tick
  useEffect(() => {
    const id = setInterval(() => setTick(x => (x + 1) % 1000), 60);
    return () => clearInterval(id);
  }, []);

  // Pointer
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let dragging = false, dragMoved = false, lastX = 0, lastY = 0;

    const hit = (mx, my) => {
      const s = stateRef.current;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      // iterate in render order (smaller/farther first), reverse for top-most hit
      const draws = [];
      visiblePhotos.forEach(p => {
        const wp = photoWorldPos(p);
        const sp = project(wp.x, wp.y, p.z, w, h);
        const sz = photoBaseSize(p) * sp.scale;
        if (sp.persp < 0.1) return;
        draws.push({ p, sp, sz });
      });
      draws.sort((a, b) => a.sz - b.sz);
      for (let i = draws.length - 1; i >= 0; i--) {
        const { p, sp, sz } = draws[i];
        if (mx >= sp.x - sz / 2 && mx <= sp.x + sz / 2 &&
            my >= sp.y - sz / 2 && my <= sp.y + sz / 2) return p;
      }
      return null;
    };

    const onDown = (e) => {
      dragging = true; dragMoved = false;
      lastX = e.clientX; lastY = e.clientY;
      canvas.style.cursor = 'grabbing';
    };
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const s = stateRef.current;
      s.mouse.x = mx; s.mouse.y = my; s.mouse.in = true;
      if (dragging) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;
        // pan in world: divide by zoom and central perspective
        const persp = FOCAL / (FOCAL + (0 - s.cz) * Z_WORLD_SCALE);
        const factor = 1 / (s.zoom * persp);
        s.targetCx -= dx * factor; s.targetCy -= dy * factor;
        s.cx -= dx * factor; s.cy -= dy * factor;
        lastX = e.clientX; lastY = e.clientY;
      } else {
        const hp = hit(mx, my);
        if (hp?.id !== s.hovered) {
          s.hovered = hp?.id || null;
          if (hp) {
            const w = canvas.clientWidth, h = canvas.clientHeight;
            const wp = photoWorldPos(hp);
            const sp = project(wp.x, wp.y, hp.z, w, h);
            setHoverInfo({ p: hp, x: sp.x, y: sp.y });
          } else setHoverInfo(null);
        } else if (hp) {
          const w = canvas.clientWidth, h = canvas.clientHeight;
          const wp = photoWorldPos(hp);
          const sp = project(wp.x, wp.y, hp.z, w, h);
          setHoverInfo({ p: hp, x: sp.x, y: sp.y });
        }
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
      dragging = false;
      canvas.style.cursor = 'grab';
    };
    const onLeave = () => {
      const s = stateRef.current;
      s.mouse.in = false; s.hovered = null;
      setHoverInfo(null); dragging = false;
    };
    const onWheel = (e) => {
      e.preventDefault();
      const s = stateRef.current;
      if (e.shiftKey || e.altKey) {
        // Flythrough — dive through z layers
        s.targetCz = Math.max(-1.5, Math.min(1.5, s.targetCz - e.deltaY * 0.0025));
      } else {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const w = canvas.clientWidth, h = canvas.clientHeight;
        const before = unproject(mx, my, w, h);
        const factor = Math.exp(-e.deltaY * 0.0015);
        s.targetZoom = Math.max(0.18, Math.min(3.2, s.targetZoom * factor));
        s.zoom = Math.max(0.18, Math.min(3.2, s.zoom * factor));
        const after = unproject(mx, my, w, h);
        s.targetCx -= (after.x - before.x);
        s.targetCy -= (after.y - before.y);
        s.cx -= (after.x - before.x); s.cy -= (after.y - before.y);
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
  }, [visiblePhotos, onOpenPhoto, clusterCenters]);

  // Cluster label overlays
  const labelData = useMemo(() => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return [];
    const w = canvas.clientWidth, h = canvas.clientHeight;
    return D.CLUSTERS.map(c => {
      const cc = clusterCenter(c.id);
      const p = project(cc.x, cc.y, 0, w, h);
      const count = D.PHOTOS.filter(p => p.cluster === c.id).length;
      let labelOpacity = 1;
      if (s.zoom > 1.4) labelOpacity = Math.max(0, 1 - (s.zoom - 1.4) / 0.8);
      // dim by perspective scale: very small clusters fade
      labelOpacity *= Math.min(1, Math.max(0.15, p.persp * 1.4));
      // Safe-zone: fade out labels that fall into top-chrome / edge areas
      const TOP_SAFE = 140, BOTTOM_SAFE = 90, SIDE_SAFE = 70;
      if (p.y < TOP_SAFE) labelOpacity *= Math.max(0, (p.y - 40) / 100);
      if (p.y > h - BOTTOM_SAFE) labelOpacity *= Math.max(0, (h - p.y - 30) / 60);
      if (p.x < SIDE_SAFE) labelOpacity *= Math.max(0, (p.x - 20) / 50);
      if (p.x > w - SIDE_SAFE) labelOpacity *= Math.max(0, (w - p.x - 20) / 50);
      return { c, sp: p, count, labelOpacity, persp: p.persp };
    });
  }, [tick]);

  // Minimap (scatter plot of photos in current dim)
  const renderMinimap = () => {
    const W = 200, H = 140;
    // compute bounds for current dim
    const s = stateRef.current;
    const allX = D.PHOTOS.map(p => photoWorldPos(p).x);
    const allY = D.PHOTOS.map(p => photoWorldPos(p).y);
    const minX = Math.min(...allX) - 100, maxX = Math.max(...allX) + 100;
    const minY = Math.min(...allY) - 100, maxY = Math.max(...allY) + 100;
    const sx = (x) => ((x - minX) / (maxX - minX)) * W;
    const sy = (y) => ((y - minY) / (maxY - minY)) * H;
    const canvas = canvasRef.current;
    const cw = canvas?.clientWidth || 1200, ch = canvas?.clientHeight || 800;
    const tl = unproject(0, 0, cw, ch);
    const br = unproject(cw, ch, cw, ch);
    return (
      <div className="minimap" style={{ width: W, height: H }} onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const fx = (e.clientX - rect.left) / W;
        const fy = (e.clientY - rect.top) / H;
        const wx = minX + fx * (maxX - minX);
        const wy = minY + fy * (maxY - minY);
        const ss = stateRef.current;
        ss.targetCx = wx; ss.targetCy = wy;
      }}>
        <div className="minimap-title">Scatter · {dim}</div>
        <svg width={W} height={H} style={{ display: 'block' }}>
          {D.PHOTOS.map(p => {
            const wp = photoWorldPos(p);
            return (
              <circle key={p.id} cx={sx(wp.x)} cy={sy(wp.y)} r={0.9}
                fill={`hsl(${D.CLUSTERS[p.ci].hue},55%,68%)`} opacity="0.55" />
            );
          })}
          {D.CLUSTERS.map(c => {
            const cc = clusterCenter(c.id);
            return (
              <text key={c.id} x={sx(cc.x)} y={sy(cc.y) - 8}
                fontSize="6" textAnchor="middle" fill="#a7a39a" opacity="0.55"
                style={{ fontFamily: 'var(--mono)' }}>
                {c.label}
              </text>
            );
          })}
          <rect x={sx(tl.x)} y={sy(tl.y)}
            width={Math.max(2, sx(br.x) - sx(tl.x))}
            height={Math.max(2, sy(br.y) - sy(tl.y))}
            fill="rgba(232,184,124,0.05)" stroke="#e8b87c" strokeWidth="0.6"
            opacity="0.9" />
        </svg>
      </div>
    );
  };

  const renderBreadcrumbs = () => (
    <div className="breadcrumbs">
      <span className="crumb active">Constellation</span>
      <span className="sl">/</span>
      <span className="crumb">axis · {dim}</span>
      <span className="sl">·</span>
      <span className="crumb">{D.PHOTOS.length} photos</span>
    </div>
  );

  // Depth ladder — vertical strip on left showing camera z position
  const renderDepthLadder = () => {
    const s = stateRef.current;
    // Normalize cz to 0..1 over [-1.5, 1.5]
    const z = (s.cz + 1.5) / 3;
    const layers = [-1, -0.5, 0, 0.5, 1];
    return (
      <div className="depth-ladder">
        <div className="dl-label">Depth · z</div>
        <div className="dl-track"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const f = (e.clientY - rect.top) / rect.height;
            stateRef.current.targetCz = Math.max(-1.5, Math.min(1.5, -1.5 + f * 3));
          }}>
          {layers.map((zv, i) => {
            const top = ((zv + 1.5) / 3) * 100;
            return (
              <div key={i} className="dl-tick" style={{ top: top + '%' }}>
                <span className="dl-num">{zv.toFixed(1)}</span>
              </div>
            );
          })}
          <div className="dl-cursor" style={{ top: (z * 100) + '%' }}>
            <span>cam</span>
          </div>
        </div>
        <div className="dl-hint">shift + scroll<br/>to fly</div>
      </div>
    );
  };

  const renderHud = () => {
    const s = stateRef.current;
    return (
      <div className="hud">
        <div>Axis <b>{dim}</b></div>
        <div>Zoom <b>{s.zoom.toFixed(2)}×</b></div>
        <div>Cam·z <b>{s.cz.toFixed(2)}</b></div>
        <div>Photos <b>{visiblePhotos.length}</b></div>
      </div>
    );
  };

  // Dimension axis switcher — sits at top below mode switcher
  const renderDimPicker = () => (
    <div className="dim-picker">
      <div className="dim-picker-label">Semantic axis</div>
      <div className="dim-picker-row">
        {D.DIMENSIONS.map(d => (
          <button key={d.id}
            className={'dim-btn ' + (d.id === dim ? 'on' : '')}
            onClick={() => onDimChange && onDimChange(d.id)}
            title={d.hint}>
            <span className="dim-dot"
              style={{ background: d.id === dim ? '#e8b87c' : '#5e5b54' }} />
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0,
        width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {labelData.map(({ c, sp, count, labelOpacity, persp }) => (
          <div key={c.id} className="cluster-label"
            style={{
              left: sp.x, top: sp.y,
              opacity: labelOpacity,
              transform: `translate(-50%,-50%) scale(${Math.max(0.5, Math.min(1.4, persp))})`,
              pointerEvents: labelOpacity > 0.3 ? 'auto' : 'none',
            }}
            onMouseEnter={() => { stateRef.current.hoveredCluster = c.id; }}
            onMouseLeave={() => { stateRef.current.hoveredCluster = null; }}
            onClick={() => onOpenCluster && onOpenCluster(c)}
          >
            <span className="lab">{c.label}</span>
            <span className="sub">{c.sublabel}</span>
            <span className="count">{count} photos</span>
          </div>
        ))}
      </div>
      {hoverInfo && (
        <div className="photo-card fade-in"
          style={{ left: hoverInfo.x, top: hoverInfo.y }}>
          <div className="by">@{hoverInfo.p.author}</div>
          <div className="tags">
            {hoverInfo.p.tags.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
          <div className="meta">
            {new Date(hoverInfo.p.date).toLocaleDateString('en-US',
              { month: 'short', year: 'numeric' })} · z {hoverInfo.p.z.toFixed(2)} · {hoverInfo.p.likes} ▲
          </div>
        </div>
      )}
      {renderDimPicker()}
      {navChrome === 'minimap' && renderMinimap()}
      {navChrome === 'breadcrumbs' && renderBreadcrumbs()}
      {renderDepthLadder()}
      {renderHud()}
      <div className="zoom-ctrl">
        <span>{stateRef.current.zoom?.toFixed(2)}×</span>
        <button onClick={() => {
          const s = stateRef.current;
          s.targetZoom = Math.max(0.18, s.targetZoom * 0.7);
        }}>−</button>
        <button onClick={() => {
          const s = stateRef.current;
          s.targetZoom = Math.min(3.2, s.targetZoom * 1.4);
        }}>+</button>
        <button onClick={() => {
          const s = stateRef.current;
          s.targetCx = 0; s.targetCy = 0; s.targetCz = 0; s.targetZoom = 0.55;
        }} title="Reset">⊕</button>
      </div>
    </div>
  );
}

export { KairosCanvas };
export default KairosCanvas;
