// screens.jsx — secondary screens for Kairos
// Lightbox, ClusterView, UploadFlow, ProfileView, Onboarding

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { KAIROS_DATA } from './data/data.js';

// ─────────────────────────────────────────────────────────────
// Lightbox — single photo + similar
// ─────────────────────────────────────────────────────────────
function Lightbox({ photo, onClose, onOpenPhoto, onOpenCluster }) {
  const D = KAIROS_DATA;
  if (!photo) return null;

  const similar = useMemo(() => {
    return D.PHOTOS
      .filter(p => p.id !== photo.id && p.cluster === photo.cluster)
      .map(p => ({ p, d: Math.abs(p.vibe - photo.vibe) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 9)
      .map(x => x.p);
  }, [photo]);

  const cluster = D.CLUSTERS.find(c => c.id === photo.cluster);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="lightbox fade-in" onClick={onClose}>
      <button className="close" onClick={onClose}>Close · Esc</button>
      <div className="main" onClick={(e) => e.stopPropagation()}>
        <img src={photo.url} alt="" />
      </div>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.16em',
            textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>
            Photo · {photo.id}
          </div>
          <h3>@{photo.author}</h3>
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.16em',
            textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>
            AI tags
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {photo.tags.map(t => (
              <span key={t} style={{
                fontSize: 10, letterSpacing: '.06em', padding: '4px 10px',
                border: '1px solid var(--line-2)', borderRadius: 99,
                color: 'var(--ink)'
              }}>{t}</span>
            ))}
          </div>
        </div>
        <div className="row">
          <span>Cluster</span>
          <b onClick={() => onOpenCluster && onOpenCluster(cluster)}
            style={{ cursor: 'default', borderBottom: '1px dotted var(--ink-3)' }}>
            {cluster.label}
          </b>
        </div>
        <div className="row"><span>Date</span><b>
          {new Date(photo.date).toLocaleDateString('en-US',
            { month: 'short', day: 'numeric', year: 'numeric' })}
        </b></div>
        <div className="row"><span>Likes</span><b>{photo.likes}</b></div>
        <div className="row"><span>Embedding δ</span><b>0.{(photo.vibe * 1000 | 0).toString().padStart(3, '0')}</b></div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.16em',
            textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>
            Visually similar
          </div>
          <div className="similar">
            {similar.map(p => (
              <img key={p.id} src={p.thumb} alt=""
                onClick={() => onOpenPhoto(p)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Cluster detail ("subreddit" view) — cosmic deep dive
// ─────────────────────────────────────────────────────────────
function ClusterView({ cluster, onClose, onOpenPhoto }) {
  const D = KAIROS_DATA;
  const [activeTag, setActiveTag] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const poolRef = useRef(null);
  const [poolW, setPoolW] = useState(1200);

  useEffect(() => {
    const update = () => {
      if (poolRef.current) setPoolW(poolRef.current.clientWidth);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!cluster) return null;

  const all = D.PHOTOS.filter(p => p.cluster === cluster.id);
  const filtered = activeTag
    ? all.filter(p => p.tags.includes(activeTag))
    : all;

  // Deterministic pseudo-random for layout
  const rand = (seed) => {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    };
  };

  // Compute scatter layout — quasi-masonry with jitter, rotation, varied sizes
  const { layout, totalH, neighbors } = useMemo(() => {
    if (!filtered.length || poolW < 100) return { layout: [], totalH: 600, neighbors: new Map() };
    const r = rand(cluster.id.charCodeAt(0) * 991 + filtered.length);
    const COLS = poolW < 700 ? 4 : poolW < 1100 ? 6 : poolW < 1600 ? 8 : 10;
    const GUT = 12;
    const COL_W = (poolW - GUT * (COLS - 1)) / COLS;
    const cursors = new Array(COLS).fill(40);
    // Sort by vibe so semantically similar sit nearby in layout, hero photos first
    const sorted = [...filtered].sort((a, b) => {
      // weight first then vibe
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.vibe - b.vibe;
    });
    const out = [];
    sorted.forEach((p, i) => {
      const heroProb = p.weight > 1.5 ? 0.7 : p.weight > 1.1 ? 0.3 : 0.05;
      let span = 1;
      if (r() < heroProb) span = Math.min(3, COLS - 1, p.weight > 1.5 ? 3 : 2);
      // Find best column with min height that fits span
      let bestCol = 0, bestY = Infinity;
      for (let c = 0; c <= COLS - span; c++) {
        let y = 0;
        for (let s = 0; s < span; s++) y = Math.max(y, cursors[c + s]);
        // small bias: prefer balanced packing with chaos jitter
        const bias = r() * 6 - 3;
        if (y + bias < bestY) { bestY = y + bias; bestCol = c; }
      }
      const w = COL_W * span + GUT * (span - 1) + (r() - 0.5) * 18;
      // Vary aspect ratio for chaos
      const ar = 0.75 + r() * 0.85; // 0.75..1.6
      const h = w * ar;
      // Jitter
      const jx = (r() - 0.5) * 22;
      const jy = (r() - 0.5) * 14;
      const x = bestCol * (COL_W + GUT) + jx;
      const y = Math.max(20, bestY) + jy;
      const rot = (r() - 0.5) * 2.6; // -1.3..1.3 deg
      for (let s = 0; s < span; s++) {
        cursors[bestCol + s] = Math.max(cursors[bestCol + s], y + h + GUT + (r() - 0.5) * 8);
      }
      out.push({ p, x, y, w, h, rot });
    });
    const totalH = Math.max(...cursors) + 60;

    // Neighbors map for constellation lines (3 nearest by vibe)
    const nbMap = new Map();
    out.forEach((a, i) => {
      const scored = out
        .filter((_, j) => j !== i)
        .map(b => ({ b, d: Math.abs(a.p.vibe - b.p.vibe) }))
        .sort((x, y) => x.d - y.d)
        .slice(0, 2);
      nbMap.set(a.p.id, scored.map(s => s.b));
    });
    return { layout: out, totalH, neighbors: nbMap };
  }, [filtered, poolW, cluster.id]);

  // Build constellation line set (deduplicated)
  const lines = useMemo(() => {
    const seen = new Set();
    const result = [];
    layout.forEach(a => {
      const ax = a.x + a.w / 2, ay = a.y + a.h / 2;
      const nbs = neighbors.get(a.p.id) || [];
      nbs.forEach(b => {
        const key = [a.p.id, b.p.id].sort().join('|');
        if (seen.has(key)) return;
        seen.add(key);
        result.push({
          x1: ax, y1: ay, x2: b.x + b.w / 2, y2: b.y + b.h / 2,
          a: a.p.id, b: b.p.id,
        });
      });
    });
    return result;
  }, [layout, neighbors]);

  const hoveredNeighbors = hoveredId
    ? new Set((neighbors.get(hoveredId) || []).map(n => n.p.id))
    : null;

  // Subtle hue tint via CSS var
  const tintStyle = { '--cv-hue': cluster.hue };

  return (
    <div className="cluster-view fade-in" style={tintStyle}>
      <div className="cv-head">
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.18em',
            textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 14 }}>
            Cluster · k/{cluster.id} · embedding region
          </div>
          <h1>{cluster.label}</h1>
          <div className="lh">{cluster.sublabel}</div>
        </div>
        <div className="meta">
          <div className="row"><b>{all.length}</b>photos in cluster</div>
          <div className="row"><b>{new Set(all.map(p => p.author)).size}</b>contributors</div>
          <div className="row"><b>{cluster.tags.length}</b>core tags</div>
        </div>
      </div>
      <div className="cv-tagline">
        <span className={'t ' + (activeTag === null ? 'on' : '')}
          onClick={() => setActiveTag(null)}>All · {all.length}</span>
        {cluster.tags.map(t => {
          const n = all.filter(p => p.tags.includes(t)).length;
          return (
            <span key={t} className={'t ' + (activeTag === t ? 'on' : '')}
              onClick={() => setActiveTag(t)}>{t} · {n}</span>
          );
        })}
      </div>
      <div className="cv-pool" ref={poolRef} style={{ height: totalH }}>
        <svg className="constellation"
          viewBox={`0 0 ${poolW} ${totalH}`}
          preserveAspectRatio="none">
          {lines.map((ln, i) => {
            const isActive = hoveredId &&
              (ln.a === hoveredId || ln.b === hoveredId);
            return (
              <line key={i} x1={ln.x1} y1={ln.y1} x2={ln.x2} y2={ln.y2}
                stroke={isActive ? '#e8b87c' : `hsl(${cluster.hue},45%,55%)`}
                strokeWidth={isActive ? 0.8 : 0.35}
                opacity={isActive ? 0.7 : 0.15} />
            );
          })}
        </svg>
        {layout.map(({ p, x, y, w, h, rot }) => {
          const isHovered = hoveredId === p.id;
          const isNeighbor = hoveredNeighbors?.has(p.id);
          const isDimmed = hoveredId && !isHovered && !isNeighbor;
          return (
            <div key={p.id}
              className={'cv-photo' + (isDimmed ? ' dim' : '') + (isNeighbor ? ' glow' : '')}
              style={{
                left: x, top: y, width: w, height: h,
                '--rot': `${rot}deg`,
              }}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onOpenPhoto(p)}
            >
              <img src={p.thumb} alt="" loading="lazy" />
              <div className="cv-tag-ring">
                @{p.author} · {p.tags.slice(0, 2).join(' · ')}
              </div>
            </div>
          );
        })}
      </div>
      <div className="cv-footer">
        <b>End of cluster</b>
        embedding · k/{cluster.id} · {all.length} photos · {lines.length} edges
      </div>
      <button onClick={onClose} style={{
        position: 'fixed', top: 20, right: 24, color: 'var(--ink-2)',
        fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase',
        zIndex: 100,
        background: 'rgba(7,7,8,.5)',
        padding: '8px 14px', borderRadius: 4,
        backdropFilter: 'blur(8px)',
      }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--ink)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--ink-2)'}
      >Back to canvas · Esc</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Upload flow (with simulated AI tagging + cluster placement)
// ─────────────────────────────────────────────────────────────
function UploadFlow({ onClose, onPublish }) {
  const D = KAIROS_DATA;
  // Pick a random unused photo to simulate "your upload"
  const seed = useMemo(() => {
    const candidates = D.PHOTOS;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }, []);
  const [step, setStep] = useState(0);
  // 0: scanning, 1: tags discovered, 2: cluster assigned, 3: ready
  const [tagsShown, setTagsShown] = useState([]);
  const [progress, setProgress] = useState(0);
  const allTags = seed.tags.concat(D.CLUSTERS.find(c => c.id === seed.cluster).tags
    .filter(t => !seed.tags.includes(t)).slice(0, 2));

  useEffect(() => {
    let cancelled = false;
    let p = 0;
    const tick = () => {
      if (cancelled) return;
      p += 2 + Math.random() * 3;
      setProgress(Math.min(100, p));
      if (p < 40) {
        setStep(0);
      } else if (p < 85) {
        setStep(1);
        const want = Math.floor(((p - 40) / 45) * allTags.length);
        setTagsShown(allTags.slice(0, want));
      } else if (p < 100) {
        setStep(2);
        setTagsShown(allTags);
      } else {
        setStep(3);
        setTagsShown(allTags);
      }
      if (p < 100) setTimeout(tick, 90);
    };
    setTimeout(tick, 200);
    return () => { cancelled = true; };
  }, []);

  const cluster = D.CLUSTERS.find(c => c.id === seed.cluster);

  return (
    <div className="upload-veil fade-in">
      <button className="close" onClick={onClose}
        style={{
          position: 'absolute', top: 24, right: 32, color: 'var(--ink-2)',
          fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase'
        }}
      >Cancel · Esc</button>
      <div className="upload-card">
        <div className="upload-img">
          <img src={seed.url} alt="" />
          {step < 3 && <div className="upload-scan" />}
        </div>
        <div>
          <div className="step">
            {step === 0 && '01 · Scanning'}
            {step === 1 && '02 · Extracting tags'}
            {step === 2 && '03 · Placing in cluster'}
            {step === 3 && '04 · Ready to publish'}
          </div>
          <h2>
            {step < 2 && 'Reading the image…'}
            {step === 2 && 'Found its place.'}
            {step === 3 && 'Found its place.'}
          </h2>
          <div className="pct">{Math.floor(progress)}<span style={{
            fontSize: 18, color: 'var(--ink-3)', marginLeft: 4
          }}>%</span></div>
          <div className="progress"><span style={{ width: progress + '%' }} /></div>
          <div style={{ fontSize: 10, letterSpacing: '.16em',
            textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 22 }}>
            AI tags detected
          </div>
          <div className="tags-grow">
            {tagsShown.map(t => (
              <span key={t} className="tag-pop">{t}</span>
            ))}
            {tagsShown.length === 0 && (
              <span style={{ fontSize: 10, color: 'var(--ink-3)',
                letterSpacing: '.06em' }}>…</span>
            )}
          </div>
          {step >= 2 && (
            <div className="cluster-pick fade-in">
              <div style={{ fontSize: 10, letterSpacing: '.16em',
                textTransform: 'uppercase', color: 'var(--ink-3)' }}>
                Nearest cluster · embedding distance 0.{(seed.vibe * 1000 | 0).toString().padStart(3, '0')}
              </div>
              <b>{cluster.label} <span style={{
                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)',
                letterSpacing: '.04em', marginLeft: 6
              }}>k/{cluster.id}</span></b>
            </div>
          )}
          {step >= 3 && (
            <div className="actions fade-in">
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className="btn primary"
                onClick={() => onPublish && onPublish(seed)}>
                Publish to constellation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Profile view
// ─────────────────────────────────────────────────────────────
function ProfileView({ onClose, onOpenPhoto, onOpenCluster }) {
  const D = KAIROS_DATA;
  // Treat user as a synthetic author 'lena.k'
  const handle = 'lena.k';
  const myPhotos = D.PHOTOS.filter(p => p.author === handle);
  if (myPhotos.length === 0) {
    // fallback: take a handful
    for (let i = 0; i < 14; i++) myPhotos.push(D.PHOTOS[i * 7]);
  }
  // Cluster pin map (visualizing where this user has uploaded)
  const myByCluster = D.CLUSTERS.map(c => ({
    c, count: myPhotos.filter(p => p.cluster === c.id).length
  })).filter(x => x.count > 0);

  const minX = -1500, maxX = 1500, minY = -1100, maxY = 1100;
  const W = 100, H = 100; // pct

  return (
    <div className="profile-view fade-in">
      <button onClick={onClose} style={{
        position: 'fixed', top: 20, right: 24, color: 'var(--ink-2)',
        fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase',
        zIndex: 100
      }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--ink)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--ink-2)'}
      >Back · Esc</button>
      <div className="pv-head">
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.18em',
            textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 14 }}>
            Profile
          </div>
          <h1><span className="at">@</span>{handle}</h1>
        </div>
        <div className="pv-stats">
          <div><b>{myPhotos.length}</b>photos</div>
          <div><b>{myByCluster.length}</b>clusters</div>
          <div><b>{myPhotos.reduce((a, p) => a + p.likes, 0)}</b>signals</div>
          <div><b>2026</b>joined</div>
        </div>
      </div>
      <div style={{ fontSize: 10, letterSpacing: '.18em',
        textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 14 }}>
        Embedding footprint · where you've explored
      </div>
      <div className="profile-cluster-map">
        {/* concentric rings for depth */}
        {[100, 200, 300, 400].map(r => (
          <div key={r} className="ring" style={{
            left: '50%', top: '50%', width: r * 1.6, height: r
          }} />
        ))}
        {myByCluster.map(({ c, count }) => {
          const fx = ((c.x - minX) / (maxX - minX)) * 100;
          const fy = ((c.y - minY) / (maxY - minY)) * 100;
          const sz = 6 + count * 2.5;
          return (
            <React.Fragment key={c.id}>
              <div className="pin" style={{
                left: fx + '%', top: fy + '%',
                width: sz, height: sz
              }} onClick={() => onOpenCluster && onOpenCluster(c)} />
              <div className="pin-lbl" style={{ left: fx + '%', top: fy + '%' }}>
                {c.label} · {count}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <h2 className="pv-section">Recent <span className="num">{myPhotos.length}</span></h2>
      <div className="pv-grid">
        {myPhotos.slice(0, 18).map(p => (
          <img key={p.id} src={p.thumb} alt="" onClick={() => onOpenPhoto(p)} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Onboarding (3 steps, ultra minimal)
// ─────────────────────────────────────────────────────────────
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const slides = [
    {
      vis: (
        <svg width="200" height="120" viewBox="0 0 200 120">
          <circle cx="60" cy="50" r="3" fill="#f5f3ee" opacity="0.9"/>
          <circle cx="80" cy="40" r="2" fill="#f5f3ee" opacity="0.7"/>
          <circle cx="70" cy="65" r="2" fill="#f5f3ee" opacity="0.7"/>
          <circle cx="55" cy="70" r="2" fill="#f5f3ee" opacity="0.5"/>
          <circle cx="140" cy="50" r="3" fill="#e8b87c" opacity="0.9"/>
          <circle cx="155" cy="35" r="2" fill="#e8b87c" opacity="0.7"/>
          <circle cx="150" cy="68" r="2" fill="#e8b87c" opacity="0.7"/>
          <circle cx="130" cy="62" r="2" fill="#e8b87c" opacity="0.5"/>
          <circle cx="60" cy="50" r="22" fill="none" stroke="#f5f3ee" strokeOpacity="0.15"/>
          <circle cx="140" cy="50" r="22" fill="none" stroke="#e8b87c" strokeOpacity="0.18"/>
        </svg>
      ),
      h: 'A photo network with no feed.',
      p: 'Kairos arranges every photo by what it actually looks and feels like. Similar images sit beside each other in a single infinite space.'
    },
    {
      vis: (
        <svg width="200" height="120" viewBox="0 0 200 120">
          <rect x="40" y="40" width="40" height="40" fill="#222" stroke="#444"/>
          <line x1="80" y1="60" x2="120" y2="60" stroke="#e8b87c" strokeWidth="0.6" strokeDasharray="2 2"/>
          <rect x="120" y="20" width="14" height="14" rx="2" fill="#e8b87c" fillOpacity="0.6"/>
          <rect x="138" y="38" width="14" height="14" rx="2" fill="#e8b87c" fillOpacity="0.6"/>
          <rect x="120" y="56" width="14" height="14" rx="2" fill="#e8b87c" fillOpacity="0.6"/>
          <rect x="138" y="74" width="14" height="14" rx="2" fill="#e8b87c" fillOpacity="0.6"/>
        </svg>
      ),
      h: 'Every upload is read by AI.',
      p: 'When you post a photo we extract its tags and compute its embedding. It finds its own neighbours; it joins a cluster — your own little subreddit by image.'
    },
    {
      vis: (
        <svg width="220" height="120" viewBox="0 0 220 120">
          <path d="M0 70 Q 55 50 110 70 T 220 70" fill="none" stroke="#3b82f6" strokeOpacity="0.4" strokeWidth="2"/>
          <path d="M0 85 Q 55 65 110 85 T 220 85" fill="none" stroke="#10b981" strokeOpacity="0.4" strokeWidth="2"/>
          <path d="M0 55 Q 55 35 110 55 T 220 55" fill="none" stroke="#e8b87c" strokeOpacity="0.4" strokeWidth="2"/>
          <circle cx="50" cy="58" r="3" fill="#e8b87c"/>
          <circle cx="100" cy="73" r="3" fill="#3b82f6"/>
          <circle cx="160" cy="87" r="3" fill="#10b981"/>
          <circle cx="180" cy="55" r="3" fill="#e8b87c"/>
        </svg>
      ),
      h: 'Or trace the rivers of time.',
      p: 'Switch to Timeline to see how clusters rose and fell — the whole network as a stream graph of attention.'
    },
  ];
  const s = slides[step];
  return (
    <div className="onboard">
      <div className="logo">Kairos<span className="dot"/></div>
      <div className="tag">photo · constellation · network</div>
      <div className="ob-vis">{s.vis}</div>
      <h2>{s.h}</h2>
      <p>{s.p}</p>
      <div className="dots">
        {slides.map((_, i) => (
          <span key={i} className={i === step ? 'on' : ''} />
        ))}
      </div>
      <div className="ob-actions">
        {step > 0 && (
          <button className="ob-btn" onClick={() => setStep(step - 1)}>Back</button>
        )}
        {step < slides.length - 1 && (
          <button className="ob-btn primary"
            onClick={() => setStep(step + 1)}>Next</button>
        )}
        {step === slides.length - 1 && (
          <button className="ob-btn primary" onClick={onDone}>Enter Kairos</button>
        )}
        <button className="ob-btn" onClick={onDone}
          style={step === slides.length - 1 ? { display: 'none' } : {}}>
          Skip
        </button>
      </div>
    </div>
  );
}

export { Lightbox, ClusterView, UploadFlow, ProfileView, Onboarding };
