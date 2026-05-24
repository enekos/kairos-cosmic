// Shared marketing-page chrome: top nav + footer.
import React from 'react';
import { NavLink, Link } from 'react-router-dom';

export function PageNav() {
  return (
    <nav className="pg-nav">
      <Link to="/" className="brand">Kairos<span className="dot"></span></Link>
      <div className="pg-nav-links">
        <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : undefined)}>About</NavLink>
        <NavLink to="/kairos">The constellation</NavLink>
        <NavLink to="/login">Log in</NavLink>
        <NavLink to="/signup" className="cta">Begin</NavLink>
      </div>
    </nav>
  );
}

export function PageFooter() {
  return (
    <footer className="pg-footer">
      <div className="ft-brand">
        Kairos
        <span style={{
          display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
          background: 'var(--warm)', marginLeft: 6, verticalAlign: 'middle',
        }} />
      </div>
      <div className="ft-cols">
        <div className="ft-col">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/kairos">The constellation</Link>
        </div>
        <div className="ft-col">
          <Link to="/signup">Sign up</Link>
          <Link to="/login">Log in</Link>
          <Link to="/legal">Privacy &amp; terms</Link>
        </div>
        <div className="ft-col ft-meta">
          <span>v.0 · closed beta</span>
          <span>made offline</span>
        </div>
      </div>
    </footer>
  );
}
