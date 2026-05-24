// Kairos.jsx — the constellation canvas page

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { KAIROS_DATA } from '../data/data.js';
import KairosCanvas from '../Canvas.jsx';
import KairosTimeline from '../Timeline.jsx';
import { Lightbox, ClusterView, UploadFlow, ProfileView, Onboarding } from '../Screens.jsx';
import {
  useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakButton,
} from '../TweaksPanel.jsx';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "viz": "galactic",
  "density": "medium",
  "chrome": "minimap",
  "showOnboarding": false
}/*EDITMODE-END*/;

function Kairos() {
  const D = KAIROS_DATA;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [mode, setMode] = useState('constellation'); // 'constellation' | 'timeline'
  const [dim, setDim] = useState('subject');
  const [openCluster, setOpenCluster] = useState(null);
  const [openPhoto, setOpenPhoto] = useState(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [onboarding, setOnboarding] = useState(t.showOnboarding);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [flyTo, setFlyTo] = useState(null);
  const [injectedPhoto, setInjectedPhoto] = useState(null);

  // Helpers: cluster/photo position in current dim
  const clusterPosInDim = (c) => {
    const ps = D.PHOTOS.filter(p => p.cluster === c.id);
    return {
      x: ps.reduce((a, p) => a + p.dims[dim].x, 0) / ps.length,
      y: ps.reduce((a, p) => a + p.dims[dim].y, 0) / ps.length,
    };
  };
  const photoPosInDim = (p) => p.dims[dim];

  // Search results — tag matches
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    const tagHits = Object.keys(D.TAG_INDEX)
      .filter(t => t.toLowerCase().includes(q))
      .map(t => ({ kind: 'tag', label: t, count: D.TAG_INDEX[t].length }));
    const clusterHits = D.CLUSTERS
      .filter(c => c.label.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      .map(c => ({ kind: 'cluster', label: c.label, c }));
    const authorHits = D.AUTHORS
      .filter(a => a.toLowerCase().includes(q))
      .map(a => ({ kind: 'author', label: '@' + a }));
    return [...clusterHits, ...tagHits, ...authorHits].slice(0, 8);
  }, [search]);

  // ESC handling
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (openPhoto) setOpenPhoto(null);
        else if (openCluster) setOpenCluster(null);
        else if (openProfile) setOpenProfile(false);
        else if (openUpload) setOpenUpload(false);
        else if (searchOpen) { setSearchOpen(false); setSearch(''); }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === '/' && !searchOpen &&
          !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openPhoto, openCluster, openProfile, openUpload, searchOpen]);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Main view */}
      {mode === 'constellation' ? (
        <KairosCanvas
          vizMode={t.viz}
          density={t.density}
          navChrome={t.chrome}
          dim={dim}
          onDimChange={setDim}
          flyTo={flyTo}
          injectedPhoto={injectedPhoto}
          onOpenCluster={(c) => setOpenCluster(c)}
          onOpenPhoto={(p) => setOpenPhoto(p)}
        />
      ) : (
        <KairosTimeline
          density={t.density}
          onOpenCluster={(c) => setOpenCluster(c)}
          onOpenPhoto={(p) => setOpenPhoto(p)}
        />
      )}

      {/* Top chrome */}
      <div className="app-chrome">
        <Link to="/" className="brand">Kairos<span className="dot"/></Link>
        <div className="chrome-right">
          <button className="nav-btn" onClick={() => setSearchOpen(true)}>
            Search <span className="kbd">/</span>
          </button>
          <div className="sep" />
          <button className="nav-btn" onClick={() => setOpenUpload(true)}>
            Upload
          </button>
          <div className="sep" />
          <button className="nav-btn" onClick={() => setOpenProfile(true)}>
            @lena.k
          </button>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="mode-switch">
        <button className={mode === 'constellation' ? 'on' : ''}
          onClick={() => setMode('constellation')}>Constellation</button>
        <div className="div" />
        <button className={mode === 'timeline' ? 'on' : ''}
          onClick={() => setMode('timeline')}>Timeline</button>
      </div>

      {/* Search */}
      {searchOpen && (
        <div className="search-bar fade-in">
          <span className="ic">⌕</span>
          <input
            autoFocus
            placeholder="search tags, clusters, authors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults && searchResults[0]) {
                const r = searchResults[0];
                if (r.kind === 'cluster') {
                  const pos = clusterPosInDim(r.c);
                  setFlyTo({ x: pos.x, y: pos.y, zoom: 1.2 });
                  setSearchOpen(false); setSearch('');
                } else if (r.kind === 'tag') {
                  const ids = D.TAG_INDEX[r.label] || [];
                  const p = D.PHOTOS.find(p => p.id === ids[0]);
                  if (p) {
                    const pos = photoPosInDim(p);
                    setFlyTo({ x: pos.x, y: pos.y, zoom: 1.4 });
                    setSearchOpen(false); setSearch('');
                  }
                }
              }
            }}
          />
          <span className="hint">Esc</span>
        </div>
      )}

      {/* Search results dropdown */}
      {searchOpen && searchResults && searchResults.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 78, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(12,12,14,.92)', backdropFilter: 'blur(20px)',
          border: '1px solid var(--line-2)', borderRadius: 6, padding: 6,
          minWidth: 340, maxWidth: 480, zIndex: 60,
        }} className="fade-in">
          {searchResults.map((r, i) => (
            <div key={i}
              onClick={() => {
                if (r.kind === 'cluster') {
                  const pos = clusterPosInDim(r.c);
                  setFlyTo({ x: pos.x, y: pos.y, zoom: 1.2 });
                } else if (r.kind === 'tag') {
                  const ids = D.TAG_INDEX[r.label] || [];
                  const p = D.PHOTOS.find(p => p.id === ids[0]);
                  if (p) {
                    const pos = photoPosInDim(p);
                    setFlyTo({ x: pos.x, y: pos.y, zoom: 1.4 });
                  }
                }
                setSearchOpen(false); setSearch('');
              }}
              style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 12px', cursor: 'default', borderRadius: 3,
                fontSize: 11, letterSpacing: '.02em'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <span style={{
                  fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase',
                  color: 'var(--ink-3)', marginRight: 10
                }}>{r.kind}</span>
                <span>{r.label}</span>
              </div>
              {r.count != null && (
                <span style={{ color: 'var(--ink-3)' }}>{r.count}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cluster detail */}
      {openCluster && (
        <ClusterView
          cluster={openCluster}
          onClose={() => setOpenCluster(null)}
          onOpenPhoto={(p) => setOpenPhoto(p)}
        />
      )}

      {/* Lightbox */}
      {openPhoto && (
        <Lightbox
          photo={openPhoto}
          onClose={() => setOpenPhoto(null)}
          onOpenPhoto={(p) => setOpenPhoto(p)}
          onOpenCluster={(c) => { setOpenPhoto(null); setOpenCluster(c); }}
        />
      )}

      {/* Profile */}
      {openProfile && (
        <ProfileView
          onClose={() => setOpenProfile(false)}
          onOpenPhoto={(p) => { setOpenProfile(false); setOpenPhoto(p); }}
          onOpenCluster={(c) => { setOpenProfile(false); setOpenCluster(c); }}
        />
      )}

      {/* Upload */}
      {openUpload && (
        <UploadFlow
          onClose={() => setOpenUpload(false)}
          onPublish={(p) => {
            setOpenUpload(false);
            setMode('constellation');
            setInjectedPhoto({ ...p, id: 'new-' + Date.now() });
            // re-clear after animation completes so future uploads still trigger
            setTimeout(() => setInjectedPhoto(null), 2000);
          }}
        />
      )}

      {/* Onboarding overlay */}
      {onboarding && (
        <Onboarding onDone={() => {
          setOnboarding(false);
          setTweak('showOnboarding', false);
        }} />
      )}

      {/* Tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Visualization" />
        <TweakRadio label="Cluster style" value={t.viz}
          options={['galactic', 'topographic', 'scatter']}
          onChange={(v) => setTweak('viz', v)} />
        <TweakRadio label="Image density" value={t.density}
          options={['sparse', 'medium', 'packed']}
          onChange={(v) => setTweak('density', v)} />
        <TweakRadio label="Nav chrome" value={t.chrome}
          options={['none', 'minimap', 'breadcrumbs']}
          onChange={(v) => setTweak('chrome', v)} />
        <TweakSection label="Demo" />
        <TweakButton label="Replay onboarding"
          onClick={() => setOnboarding(true)} />
        <TweakButton label="Open upload flow"
          onClick={() => setOpenUpload(true)} />
        <TweakButton label="Open random cluster"
          onClick={() => {
            const c = D.CLUSTERS[Math.floor(Math.random() * D.CLUSTERS.length)];
            setOpenCluster(c);
          }} />
        <TweakButton label="Fly to random cluster"
          onClick={() => {
            const c = D.CLUSTERS[Math.floor(Math.random() * D.CLUSTERS.length)];
            setMode('constellation');
            const pos = clusterPosInDim(c);
            setFlyTo({ x: pos.x, y: pos.y, zoom: 1.2 });
          }} />
      </TweaksPanel>
    </div>
  );
}

export default Kairos;
