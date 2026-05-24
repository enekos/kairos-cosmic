// Login page — formerly login.html. Beacon animation + OTP flow.
import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KAIROS_DATA } from '../data/data.js';

const LOGIN_STYLE = `
  .beacon-trace { position: absolute; inset: 0; pointer-events: none; }
  @keyframes pingRing {
    0%   { r: 0;  opacity: 0.9 }
    100% { r: 220; opacity: 0 }
  }
  .ping circle { animation: pingRing 2.8s ease-out infinite; transform-origin: center; }
  .ping circle:nth-child(2) { animation-delay: 0.9s; }
  .ping circle:nth-child(3) { animation-delay: 1.8s; }

  .sent-pre { font-size: 11px; letter-spacing: .22em; text-transform: uppercase;
    color: var(--warm); margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
  .sent-pre::before { content: ''; width: 6px; height: 6px; border-radius: 50%;
    background: var(--warm); box-shadow: 0 0 12px var(--warm);
    animation: pulse 1.6s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: .5; transform: scale(.85) } }

  .code-hint { font-size: 11px; color: var(--ink-3); letter-spacing: .04em;
    line-height: 1.6; margin-top: 12px; }
  .code-hint b { color: var(--ink); font-weight: 400; font-family: var(--mono);
    background: rgba(232,184,124,.10); padding: 1px 6px; border-radius: 2px;
    border: 1px solid rgba(232,184,124,.25); }

  .arrival { position: fixed; inset: 0; background: var(--bg); z-index: 200;
    display: none; align-items: center; justify-content: center; flex-direction: column;
    text-align: center; padding: 40px; }
  .arrival.show { display: flex; animation: fadeIn .4s ease both; }
  .arrival .pre { font-size: 11px; letter-spacing: .22em; text-transform: uppercase;
    color: var(--ink-3); margin-bottom: 22px; }
  .arrival h1 { font-family: var(--serif); font-weight: 400;
    font-size: clamp(56px, 7vw, 108px); line-height: .95; margin: 0 0 18px;
    letter-spacing: -.012em; }
  .arrival h1 em { font-style: italic; color: var(--warm); }
  .arrival .sub { font-family: var(--serif); font-style: italic;
    font-size: 22px; color: var(--ink-2); margin-bottom: 40px; }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
`;

export default function Login() {
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

    const states = page.querySelectorAll('.state');
    function showState(id) {
      states.forEach(s => { s.style.display = s.dataset.state === id ? 'block' : 'none'; });
    }

    const VB_W = 1200, VB_H = 800;
    const wxToVx = (wx) => (wx + 1500) / 3000 * VB_W;
    const wyToVy = (wy) => (wy + 1100) / 2200 * VB_H;

    const stars = page.querySelector('#bcn-stars');
    let sStr = '';
    for (let i = 0; i < 90; i++) {
      const sx = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
      const sy = ((Math.sin(i * 78.233) * 12345.6789) % 1 + 1) % 1;
      const o = 0.25 + (i % 4) * 0.18;
      const r = 0.6 + (i % 4) * 0.25;
      sStr += `<circle cx="${(sx * VB_W).toFixed(1)}" cy="${(sy * VB_H).toFixed(1)}" r="${r}" opacity="${o.toFixed(2)}"/>`;
    }
    stars.innerHTML = sStr;

    const cl = page.querySelector('#bcn-clusters');
    let cStr = '';
    D.CLUSTERS.forEach(c => {
      const x = wxToVx(c.x), y = wyToVy(c.y);
      const r = c.size === 'large' ? 90 : c.size === 'medium' ? 65 : 50;
      cStr += `<radialGradient id="cl-${c.id}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="hsl(${c.hue},45%,55%)" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="hsl(${c.hue},45%,55%)" stop-opacity="0"/>
      </radialGradient>`;
      cStr += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="url(#cl-${c.id})"/>`;
      cStr += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="#a7a39a" opacity="0.7"/>`;
    });
    cl.innerHTML = cStr;

    function positionFromEmail(email) {
      let h = 0;
      for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0;
      const ci = h % D.CLUSTERS.length;
      const c = D.CLUSTERS[ci];
      const ang = (h >> 8) / 0xffffff * Math.PI * 2;
      const rad = 60 + (h >> 16) / 0xffff * 80;
      return {
        vx: wxToVx(c.x + Math.cos(ang) * rad),
        vy: wyToVy(c.y + Math.sin(ang) * rad),
        cluster: c,
      };
    }

    const src = page.querySelector('#bcn-source');
    src.setAttribute('transform', `translate(${VB_W / 2},${VB_H / 2})`);

    let beamRaf = 0;
    const sendBtn = page.querySelector('#send-beacon');
    const onSend = () => {
      const email = page.querySelector('#f-email').value.trim();
      if (!email.includes('@')) { alert('Looks like an invalid email'); return; }
      const pos = positionFromEmail(email);
      sessionStorage.setItem('kairos-email', email);
      sessionStorage.setItem('kairos-cluster', pos.cluster.id);

      const srcEl = page.querySelector('#bcn-source');
      const ping = page.querySelector('#bcn-ping');
      const beam = page.querySelector('#bcn-beam');
      const env = page.querySelector('#bcn-env');

      srcEl.style.transition = 'transform 1.2s cubic-bezier(.5,0,.2,1)';
      srcEl.setAttribute('transform', `translate(${pos.vx},${pos.vy})`);

      setTimeout(() => {
        ping.style.display = 'block';
        const ex = VB_W - 70, ey = VB_H * 0.5;
        beam.setAttribute('x1', pos.vx);
        beam.setAttribute('y1', pos.vy);
        beam.setAttribute('x2', pos.vx);
        beam.setAttribute('y2', pos.vy);
        beam.setAttribute('opacity', '0.7');
        const t0 = performance.now();
        const DUR = 900;
        function beamFrame() {
          const t = Math.min(1, (performance.now() - t0) / DUR);
          const k = t * t * (3 - 2 * t);
          beam.setAttribute('x2', pos.vx + (ex - pos.vx) * k);
          beam.setAttribute('y2', pos.vy + (ey - pos.vy) * k);
          if (t < 1) beamRaf = requestAnimationFrame(beamFrame);
          else {
            env.setAttribute('transform', `translate(${ex},${ey})`);
            env.animate(
              [{ opacity: 0, transform: `translate(${ex}px, ${ey}px) scale(.7)` },
               { opacity: 1, transform: `translate(${ex}px, ${ey}px) scale(1)` }],
              { duration: 600, fill: 'forwards' },
            );
            env.setAttribute('opacity', '1');
          }
        }
        beamRaf = requestAnimationFrame(beamFrame);
      }, 800);

      const code = ('' + (Math.abs([...email].reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % 1000000)).padStart(6, '0');
      page.querySelector('#demo-code').textContent = code.slice(0, 3) + ' ' + code.slice(3);
      page.querySelector('#echo-email').textContent = email;

      setTimeout(() => {
        showState('code');
        setTimeout(() => page.querySelector('#otp input').focus(), 100);
      }, 1500);
    };
    sendBtn.addEventListener('click', onSend);

    const otpInputs = page.querySelectorAll('#otp input');
    const otpHandlers = [];
    otpInputs.forEach((inp, i) => {
      const onInput = () => {
        inp.value = inp.value.replace(/[^0-9]/g, '');
        if (inp.value && i < otpInputs.length - 1) otpInputs[i + 1].focus();
        updateVerifyBtn();
      };
      const onKey = (e) => {
        if (e.key === 'Backspace' && !inp.value && i > 0) otpInputs[i - 1].focus();
      };
      const onPaste = (e) => {
        e.preventDefault();
        const txt = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 6);
        [...txt].forEach((d, j) => { if (otpInputs[i + j]) otpInputs[i + j].value = d; });
        updateVerifyBtn();
        if (txt.length === 6) otpInputs[5].focus();
      };
      inp.addEventListener('input', onInput);
      inp.addEventListener('keydown', onKey);
      inp.addEventListener('paste', onPaste);
      otpHandlers.push({ inp, onInput, onKey, onPaste });
    });
    function updateVerifyBtn() {
      const all = [...otpInputs].every(i => i.value.length === 1);
      page.querySelector('#verify-code').disabled = !all;
    }

    const verifyBtn = page.querySelector('#verify-code');
    const onVerify = () => {
      const arrival = page.querySelector('#arrival');
      arrival.classList.add('show');
      setTimeout(() => { navigate('/kairos'); }, 2000);
    };
    verifyBtn.addEventListener('click', onVerify);

    const backLink = page.querySelector('#back-to-email');
    const onBack = (e) => {
      e.preventDefault();
      showState('email');
      page.querySelector('#bcn-ping').style.display = 'none';
      page.querySelector('#bcn-beam').setAttribute('opacity', '0');
      page.querySelector('#bcn-env').setAttribute('opacity', '0');
      page.querySelector('#bcn-source').setAttribute('transform', `translate(${VB_W / 2},${VB_H / 2})`);
    };
    backLink.addEventListener('click', onBack);

    return () => {
      cancelAnimationFrame(beamRaf);
      sendBtn.removeEventListener('click', onSend);
      verifyBtn.removeEventListener('click', onVerify);
      backLink.removeEventListener('click', onBack);
      otpHandlers.forEach(({ inp, onInput, onKey, onPaste }) => {
        inp.removeEventListener('input', onInput);
        inp.removeEventListener('keydown', onKey);
        inp.removeEventListener('paste', onPaste);
      });
    };
  }, [navigate]);

  return (
    <div ref={pageRef} id="page">
      <style>{LOGIN_STYLE}</style>

      <div className="auth-wrap">
        <div className="auth-stage beacon-stage">
          <Link to="/" className="stage-brand">Kairos<span className="dot"></span></Link>
          <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="beacon-trace">
            <g id="bcn-stars" fill="#f5f3ee"></g>
            <g id="bcn-clusters"></g>
            <g id="bcn-source">
              <g className="ping" id="bcn-ping" style={{ display: 'none' }}>
                <circle r="0" cx="0" cy="0" fill="none" stroke="#e8b87c" strokeWidth="1.2" opacity="0"/>
                <circle r="0" cx="0" cy="0" fill="none" stroke="#e8b87c" strokeWidth="1.2" opacity="0"/>
                <circle r="0" cx="0" cy="0" fill="none" stroke="#e8b87c" strokeWidth="1.2" opacity="0"/>
              </g>
              <circle id="bcn-glow" r="22" cx="0" cy="0" fill="#e8b87c" opacity="0.18"/>
              <circle id="bcn-dot" r="3" cx="0" cy="0" fill="#f5f3ee"/>
            </g>
            <line id="bcn-beam" x1="0" y1="0" x2="0" y2="0"
              stroke="#e8b87c" strokeWidth="0.8" strokeDasharray="3 5" opacity="0"/>
            <g id="bcn-env" transform="translate(0,0)" opacity="0">
              <rect x="-22" y="-15" width="44" height="30" rx="2" fill="none" stroke="#e8b87c" strokeWidth="1"/>
              <path d="M -22 -15 L 0 5 L 22 -15" fill="none" stroke="#e8b87c" strokeWidth="1"/>
            </g>
          </svg>

          <div className="auth-stage-label">
            <span>The constellation remembers.</span>
            <b>Sign in by beacon — no passwords.</b>
          </div>
        </div>

        <div className="auth-form">
          <div data-state="email" className="state">
            <div className="pre">Log in</div>
            <h1>Welcome<br/><em>back.</em></h1>
            <div className="sub">Type your email. We&rsquo;ll send a six-digit beacon to your inbox. No password necessary.</div>

            <div className="field">
              <label>email</label>
              <input id="f-email" type="email" placeholder="you@somewhere" autoFocus />
            </div>

            <div className="row-actions">
              <button className="btn-primary" id="send-beacon">Send beacon →</button>
              <span className="alt-link">New to Kairos? <Link to="/signup">Calibrate your gaze</Link></span>
            </div>
          </div>

          <div data-state="code" className="state" style={{ display: 'none' }}>
            <div className="sent-pre">Beacon sent</div>
            <h1>Check your<br/><em>inbox.</em></h1>
            <div className="sub">A six-digit code is making its way to <b id="echo-email" style={{ color:'var(--ink)', fontStyle:'normal', fontFamily:'var(--mono)', fontSize:14 }}></b>. It expires in 10 minutes.</div>

            <div className="field">
              <label>six-digit beacon</label>
              <div className="beacon-otp" id="otp">
                <input maxLength={1} data-idx="0" />
                <input maxLength={1} data-idx="1" />
                <input maxLength={1} data-idx="2" />
                <input maxLength={1} data-idx="3" />
                <input maxLength={1} data-idx="4" />
                <input maxLength={1} data-idx="5" />
              </div>
              <div className="code-hint">
                Demo: any 6 digits will work. Hint: <b id="demo-code">042 815</b>
              </div>
            </div>

            <div className="row-actions">
              <button className="btn-primary" id="verify-code" disabled>Drop me in →</button>
              <span className="alt-link"><a id="back-to-email" href="#">← resend / different email</a></span>
            </div>
          </div>
        </div>
      </div>

      <div className="arrival" id="arrival">
        <div className="pre">Welcome home</div>
        <h1>Re-entering the<br/><em>constellation.</em></h1>
        <div className="sub">Your last position is restored.</div>
        <button type="button" className="btn-primary" onClick={() => navigate('/kairos')}>Continue →</button>
      </div>
    </div>
  );
}
