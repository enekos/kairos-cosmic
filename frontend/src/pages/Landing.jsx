// Landing page — formerly index.html.
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PageNav, PageFooter } from './_chrome.jsx';

const LANDING_STYLE = `
  /* index-only flourishes */
  .pre-mark { display:inline-flex;align-items:center;gap:10px;
    font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-3);
    margin-bottom:28px;position:relative;z-index:1}
  .pre-mark::before { content:'';width:6px;height:6px;border-radius:50%;
    background:var(--warm);box-shadow:0 0 10px var(--warm);
    animation:pulse 2.4s ease-in-out infinite}
  @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.45 } }

  .tag-marquee { padding: 30px 0; border-top:1px solid var(--line);
    border-bottom:1px solid var(--line); overflow:hidden;
    background: rgba(245,243,238,.015); white-space:nowrap;
    -webkit-mask-image: linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent);
    mask-image: linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent);}
  .tag-marquee-inner { display:inline-flex;gap:32px;animation:marq 60s linear infinite;
    will-change: transform; }
  .tag-marquee .t { font-family: var(--serif); font-size: 26px; color: var(--ink-2);
    letter-spacing: .005em; font-style: italic;}
  .tag-marquee .t.warm { color: var(--warm); }
  .tag-marquee .t.muted { color: var(--ink-3); }
  @keyframes marq { from { transform: translateX(0) } to { transform: translateX(-50%) } }

  .live-demo { padding: 80px 6vw 100px; position: relative; }
  .live-demo-head { display:flex; align-items:flex-end; justify-content: space-between;
    margin-bottom: 30px; gap: 40px; flex-wrap: wrap; }
  .live-demo h2 { font-family: var(--serif); font-weight: 400;
    font-size: clamp(40px, 4.4vw, 64px); line-height: .98;
    letter-spacing: -.01em; margin: 0; max-width: 760px; }
  .live-demo h2 em { font-style: italic; color: var(--warm); }
  .live-demo .lt { font-size: 11px; letter-spacing: .18em; text-transform: uppercase;
    color: var(--ink-3); max-width: 280px; line-height: 1.7; text-align: right; }
  .live-demo .frame { position: relative; height: 76vh; min-height: 540px;
    border: 1px solid var(--line); border-radius: 2px; overflow: hidden;
    background: #050507; }
  .live-demo iframe { width: 100%; height: 100%; border: 0; display: block; }
  .live-demo .frame-mask { position: absolute; left: 0; right: 0; bottom: 0; height: 90px;
    background: linear-gradient(180deg, transparent, var(--bg));
    pointer-events: none; }
  .live-demo .frame-mask a { position: absolute; left: 50%; bottom: 24px;
    transform: translateX(-50%); pointer-events: auto;
    padding: 12px 24px; background: var(--ink); color: var(--bg);
    border: 1px solid var(--ink); border-radius: 2px;
    font-size: 11px; letter-spacing: .22em; text-transform: uppercase;
    transition: all .2s; }
  .live-demo .frame-mask a:hover { background: var(--warm); border-color: var(--warm); }

  .stats-strip { display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 0; padding: 60px 6vw; border-top: 1px solid var(--line); }
  .stat { padding: 0 30px; border-right: 1px solid var(--line); }
  .stat:last-child { border-right: 0; }
  .stat .n { font-family: var(--serif); font-size: clamp(48px, 5vw, 72px);
    line-height: 1; color: var(--ink); display: block; letter-spacing: -.01em; }
  .stat .n em { font-style: italic; color: var(--warm); }
  .stat .l { font-size: 10px; letter-spacing: .2em; text-transform: uppercase;
    color: var(--ink-3); margin-top: 10px; display: block; line-height: 1.5; }
  @media (max-width:900px){ .stats-strip { grid-template-columns: repeat(2, 1fr); }
    .stat { border-right: 0; border-bottom: 1px solid var(--line); padding: 20px; }
  }
`;

export default function Landing() {
  const starsRef = useRef(null);
  const photosRef = useRef(null);
  const linesRef = useRef(null);
  const marqueeRef = useRef(null);

  useEffect(() => {
    // Body class — pages.css uses `.page` for marketing pages.
    document.body.classList.add('page');
    return () => document.body.classList.remove('page');
  }, []);

  useEffect(() => {
    // Hero constellation animation.
    const stars = starsRef.current;
    const heroPhotosG = photosRef.current;
    const heroLinesG = linesRef.current;
    if (!stars || !heroPhotosG || !heroLinesG) return undefined;

    let sStr = '';
    for (let i = 0; i < 120; i++) {
      const sx = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
      const sy = ((Math.sin(i * 78.233) * 12345.6789) % 1 + 1) % 1;
      const o = 0.20 + (i % 4) * 0.20;
      const r = 0.5 + (i % 4) * 0.30;
      sStr += `<circle cx="${(sx*600).toFixed(1)}" cy="${(sy*600).toFixed(1)}" r="${r}" fill="#f5f3ee" opacity="${o.toFixed(2)}"/>`;
    }
    stars.innerHTML = sStr;

    const clusters = [
      { cx: 180, cy: 200, color: '#e8b87c', n: 6, photos: ['photo-1487958449943-2429e8be8625','photo-1448630360428-65456885c650','photo-1496564203457-11bb12075d90','photo-1511818966892-d7d671e672a2'] },
      { cx: 420, cy: 170, color: '#3b82f6', n: 5, photos: ['photo-1505142468610-359e7d316be0','photo-1439405326854-014607f694d7','photo-1507525428034-b723cf961d3e'] },
      { cx: 340, cy: 430, color: '#10b981', n: 6, photos: ['photo-1448375240586-882707db888b','photo-1441974231531-c6227db76b6e','photo-1518495973542-4542c06a5843'] },
      { cx: 160, cy: 450, color: '#a855f7', n: 5, photos: ['photo-1494790108377-be9c29b29330','photo-1535713875002-d1d0cf377fde','photo-1438761681033-6461ffad8d80'] },
    ];

    const photoNodes = [];
    let pId = 0;
    clusters.forEach((c, ci) => {
      for (let i = 0; i < c.n; i++) {
        const angle = (i / c.n) * Math.PI * 2 + ci * 0.7;
        const r = 30 + (i % 3) * 18;
        const sz = i === 0 ? 36 : 22 + (i % 3) * 6;
        const ph = c.photos[i % c.photos.length];
        const url = `https://images.unsplash.com/${ph}?w=160&q=70&auto=format&fit=crop`;
        const id = `hp${pId++}`;
        const clipId = 'cl' + id;
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        node.innerHTML = `
          <defs>
            <clipPath id="${clipId}"><rect x="-${sz/2}" y="-${sz/2}" width="${sz}" height="${sz}" rx="1"/></clipPath>
          </defs>
          <rect x="-${sz/2}" y="-${sz/2}" width="${sz}" height="${sz}" fill="#222"/>
          <image href="${url}" x="-${sz/2}" y="-${sz/2}" width="${sz}" height="${sz}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>
          <rect x="-${sz/2}" y="-${sz/2}" width="${sz}" height="${sz}" fill="none" stroke="rgba(255,255,255,.06)"/>
        `;
        heroPhotosG.appendChild(node);
        photoNodes.push({ node, cx: c.cx, cy: c.cy, r, phase: angle, speed: 0.06 + (ci * 0.01) + (i % 4) * 0.005 });
      }
    });

    let linesStr = '';
    const lineRefs = [];
    for (let i = 0; i < photoNodes.length - 1; i++) {
      if (i % 2 === 0) {
        const lid = 'ln' + i;
        linesStr += `<line id="${lid}" x1="0" y1="0" x2="0" y2="0"/>`;
        lineRefs.push({ id: lid, a: photoNodes[i], b: photoNodes[i + 1] });
      }
    }
    heroLinesG.innerHTML = linesStr;

    let raf = 0;
    const t0 = performance.now();
    function tick() {
      const t = (performance.now() - t0) / 1000;
      photoNodes.forEach(p => {
        const a = p.phase + t * p.speed;
        const x = p.cx + Math.cos(a) * p.r;
        const y = p.cy + Math.sin(a) * p.r;
        p.node.setAttribute('transform', `translate(${x},${y})`);
        p.lastX = x; p.lastY = y;
      });
      lineRefs.forEach(l => {
        const el = heroLinesG.querySelector('#' + l.id);
        if (el && l.a.lastX !== undefined) {
          el.setAttribute('x1', l.a.lastX); el.setAttribute('y1', l.a.lastY);
          el.setAttribute('x2', l.b.lastX); el.setAttribute('y2', l.b.lastY);
        }
      });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      // Clear injected children so re-mount in dev doesn't double-up.
      stars.innerHTML = '';
      heroPhotosG.innerHTML = '';
      heroLinesG.innerHTML = '';
    };
  }, []);

  useEffect(() => {
    const marq = marqueeRef.current;
    if (!marq) return;
    const tags = [
      ['Architecture','warm'], ['Tides',''], ['Portraits','muted'], ['Forests',''], ['Urban','warm'],
      ['Table','muted'], ['Abstract',''], ['Skies','warm'], ['Fauna',''], ['After dark','muted'],
      ['brutalism',''], ['fog',''], ['neon','warm'], ['feline','muted'], ['contrail',''],
      ['street','muted'], ['waveform',''], ['breakfast','warm'], ['canopy',''], ['silhouette','muted'],
    ];
    let mStr = '';
    for (let pass = 0; pass < 2; pass++) {
      tags.forEach(([t, cls]) => { mStr += `<span class="t ${cls}">${t}</span>`; });
    }
    marq.innerHTML = mStr;
  }, []);

  return (
    <>
      <style>{LANDING_STYLE}</style>
      <PageNav />
      <div className="pg-wrap">
        <section className="land-hero">
          <div>
            <div className="pre-mark">Closed beta · v.0 · open by invitation</div>
            <h1>A photo<br/>network with<br/><em>no feed.</em></h1>
            <div className="sub">
              Every picture you upload is read by AI, placed in an infinite constellation
              of similar images, and made findable by what it looks like — not by who
              posted it.
            </div>
            <div className="actions">
              <Link className="btn-primary" to="/signup">Calibrate your gaze →</Link>
              <Link className="btn-ghost" to="/about">What is this?</Link>
            </div>
          </div>

          <div className="land-orbit">
            <div className="nebula"></div>
            <svg viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="lg-warm" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e8b87c" stopOpacity="0.32"/>
                  <stop offset="100%" stopColor="#e8b87c" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="lg-blue" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.20"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="lg-green" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.22"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="lg-purp" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.20"/>
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
                </radialGradient>
              </defs>
              <g ref={starsRef} />
              <g>
                <circle cx="180" cy="200" r="120" fill="url(#lg-warm)"/>
                <circle cx="420" cy="170" r="100" fill="url(#lg-blue)"/>
                <circle cx="340" cy="430" r="110" fill="url(#lg-green)"/>
                <circle cx="160" cy="450" r="80" fill="url(#lg-purp)"/>
              </g>
              <g ref={photosRef} />
              <g ref={linesRef} stroke="#e8b87c" strokeWidth="0.5" fill="none" opacity="0.5" />
            </svg>
          </div>
        </section>

        <div className="tag-marquee">
          <div className="tag-marquee-inner" ref={marqueeRef} />
        </div>

        <section className="land-bento">
          <div className="bento-cell tall">
            <div className="b-num">01</div>
            <h3>Drop a photo.</h3>
            <p>
              Upload anything. A vision model reads it and extracts tags — the things in the
              image, the way it looks, the mood. Tags become subreddits without anyone typing
              them.
            </p>
            <svg className="b-vis" width="280" height="220" viewBox="0 0 280 220">
              <rect x="20" y="20" width="120" height="120" rx="2" fill="#1a1a1a" stroke="#444"/>
              <line x1="150" y1="80" x2="200" y2="80" stroke="#e8b87c" strokeWidth="0.7" strokeDasharray="2 3"/>
              <text x="175" y="74" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#a7a39a" letterSpacing="1.5">AI</text>
              <rect x="200" y="40" width="56" height="18" rx="9" fill="none" stroke="#666"/>
              <text x="228" y="52" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#ddd">brutalism</text>
              <rect x="200" y="64" width="48" height="18" rx="9" fill="none" stroke="#666"/>
              <text x="224" y="76" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#ddd">facade</text>
              <rect x="200" y="88" width="40" height="18" rx="9" fill="none" stroke="#666"/>
              <text x="220" y="100" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#ddd">grey</text>
              <rect x="200" y="112" width="56" height="18" rx="9" fill="none" stroke="#666"/>
              <text x="228" y="124" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#ddd">overcast</text>
            </svg>
          </div>

          <div className="bento-cell">
            <div className="b-num">02</div>
            <h3>It finds its <em style={{ fontFamily:'var(--serif)', fontStyle:'italic', color:'var(--warm)' }}>neighbours.</em></h3>
            <p>
              Each photo gets an embedding — a 512-dimensional fingerprint of what it
              looks and feels like. Photos with similar fingerprints sit together. That&rsquo;s
              the entire layout principle.
            </p>
            <svg className="b-vis" width="220" height="160" viewBox="0 0 220 160">
              <circle cx="80" cy="80" r="40" fill="#e8b87c" opacity="0.10"/>
              <circle cx="80" cy="80" r="3" fill="#e8b87c"/>
              <circle cx="72" cy="70" r="1.5" fill="#fff" opacity=".7"/>
              <circle cx="88" cy="74" r="1.5" fill="#fff" opacity=".7"/>
              <circle cx="84" cy="92" r="1.5" fill="#fff" opacity=".7"/>
              <circle cx="68" cy="86" r="1.5" fill="#fff" opacity=".7"/>
              <circle cx="160" cy="60" r="2" fill="#fff" opacity=".4"/>
              <circle cx="180" cy="100" r="2" fill="#fff" opacity=".4"/>
              <line x1="80" y1="80" x2="160" y2="60" stroke="#e8b87c" strokeWidth="0.5" opacity="0.5"/>
              <line x1="80" y1="80" x2="180" y2="100" stroke="#e8b87c" strokeWidth="0.5" opacity="0.5"/>
            </svg>
          </div>

          <div className="bento-cell">
            <div className="b-num">03</div>
            <h3>You <em style={{ fontFamily:'var(--serif)', fontStyle:'italic', color:'var(--warm)' }}>wander.</em></h3>
            <p>
              Pan, zoom, fly through depth layers. Five semantic axes let you re-arrange the
              same constellation by Subject, Palette, Mood, Time, or Composition.
            </p>
            <svg className="b-vis" width="220" height="160" viewBox="0 0 220 160">
              <circle cx="110" cy="80" r="50" fill="none" stroke="#444" strokeDasharray="2 3"/>
              <line x1="60" y1="80" x2="160" y2="80" stroke="#333"/>
              <line x1="110" y1="30" x2="110" y2="130" stroke="#333"/>
              <text x="160" y="84" fontFamily="monospace" fontSize="7" fill="#5e5b54" letterSpacing="1.5">SUBJECT</text>
              <text x="110" y="26" textAnchor="middle" fontFamily="monospace" fontSize="7" fill="#5e5b54" letterSpacing="1.5">MOOD</text>
              <text x="60" y="140" fontFamily="monospace" fontSize="7" fill="#5e5b54" letterSpacing="1.5">TIME</text>
              <circle cx="110" cy="80" r="3" fill="#e8b87c"/>
              <circle cx="130" cy="60" r="2" fill="#fff" opacity=".7"/>
              <circle cx="90" cy="95" r="2" fill="#fff" opacity=".7"/>
              <circle cx="135" cy="100" r="2" fill="#fff" opacity=".7"/>
            </svg>
          </div>

          <div className="bento-cell wide">
            <div className="b-num">04</div>
            <h3>No feed. No likes count.<br/><em style={{ fontFamily:'var(--serif)', fontStyle:'italic', color:'var(--warm)' }}>No algorithm.</em></h3>
            <p style={{ maxWidth: 540 }}>
              Kairos doesn&rsquo;t rank, doesn&rsquo;t recommend, doesn&rsquo;t auto-play, doesn&rsquo;t
              push notifications. It shows you what is <em>near</em> what you&rsquo;re looking at — that&rsquo;s
              the whole social signal. Pictures speak first. Authors emerge only when you ask.
            </p>
          </div>
        </section>

        <div className="stats-strip">
          <div className="stat">
            <span className="n"><em>0</em></span>
            <span className="l">Feeds, walls,<br/>or for-you pages</span>
          </div>
          <div className="stat">
            <span className="n">5</span>
            <span className="l">Semantic axes<br/>you can switch between</span>
          </div>
          <div className="stat">
            <span className="n">512<span style={{ fontSize:'30%', color:'var(--ink-3)', marginLeft:6 }}>D</span></span>
            <span className="l">Embedding dimensions<br/>behind every layout</span>
          </div>
          <div className="stat">
            <span className="n">∞</span>
            <span className="l">Photos the canvas<br/>can comfortably hold</span>
          </div>
        </div>

        <section className="live-demo">
          <div className="live-demo-head">
            <h2>Look around <em>before</em><br/>you sign up.</h2>
            <div className="lt">The constellation below is live. Pan, zoom, click anything. Same canvas you&rsquo;ll get on the inside.</div>
          </div>
          <div className="frame">
            <iframe src="/kairos" title="Kairos preview" loading="lazy" />
            <div className="frame-mask">
              <Link to="/kairos">Open full canvas →</Link>
            </div>
          </div>
        </section>

        <section style={{
          textAlign:'center', padding:'120px 6vw 140px', borderTop:'1px solid var(--line)',
          maxWidth:1180, margin:'0 auto',
        }}>
          <div className="pre-mark" style={{ justifyContent:'center' }}>A small place to put your pictures</div>
          <h2 style={{
            fontFamily:'var(--serif)', fontWeight:400, fontSize:'clamp(48px,5.4vw,92px)',
            lineHeight:.98, letterSpacing:'-.01em', margin:'8px 0 36px',
          }}>
            Begin a quieter<br/><em style={{ color:'var(--warm)', fontStyle:'italic' }}>internet.</em>
          </h2>
          <div style={{ display:'inline-flex', gap:14 }}>
            <Link className="btn-primary" to="/signup">Calibrate your gaze</Link>
            <Link className="btn-ghost" to="/login">I have a beacon</Link>
          </div>
        </section>

        <PageFooter />
      </div>
    </>
  );
}
