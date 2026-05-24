// About page — formerly about.html.
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageNav, PageFooter } from './_chrome.jsx';

export default function About() {
  useEffect(() => {
    document.body.classList.add('page');
    return () => document.body.classList.remove('page');
  }, []);

  return (
    <>
      <PageNav />
      <div className="pg-wrap">
        <section className="man-hero">
          <div className="pre">What we believe · v.0</div>
          <h1>Kairos is <em>not</em><br/>a feed.</h1>
          <div className="lede">
            It&rsquo;s a photo network for people who would rather wander a museum than scroll a wall.
            We replaced the timeline with the embedding space — every picture finds its own
            neighbours, every cluster is a small subreddit shaped by what photos actually <em>look like</em>,
            and you, the viewer, fly through it.
          </div>
        </section>

        <section className="man-section">
          <div className="m-label">01 · The premise</div>
          <div className="m-body">
            <h2>The feed was a <em>compromise</em>.</h2>
            <p>
              Every social network you&rsquo;ve used started with a simple, well-meaning constraint:{' '}
              <strong>show one post at a time, in some order.</strong> Reverse chronological, then friends-of-friends,
              then a model trained on your dwell time. The river of content became the only
              landscape we knew how to make.
            </p>
            <p>
              But the rest of human image-culture — museums, photobooks, archives, libraries —
              has always been <strong>spatial</strong>. Things sit next to similar things. You scan a wall,
              you double back, you compare. You discover by proximity, not by recency.
            </p>
            <p>
              Kairos is the spatial version of a social photo network. The river is gone.
              What&rsquo;s left is a sky.
            </p>
          </div>
        </section>

        <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 6vw' }}>
          <div className="man-pull">
            &ldquo;A feed tells you what is new. A constellation tells you what is <em>close</em>.&rdquo;
          </div>
        </section>

        <section className="man-section">
          <div className="m-label">02 · How it sees</div>
          <div className="m-body">
            <h2>Every photo is <em>read.</em></h2>
            <p>The moment you upload a picture, a vision model extracts two things from it:</p>
            <p>
              First, a small set of <strong>tags</strong> — the things actually depicted, the way they
              appear, the mood. Tags are how we form &ldquo;subreddits&rdquo; on Kairos: every tag is a
              community, every photo enters several at once. There is no manual labelling, no
              spam-prone hashtag culture. The image speaks for itself.
            </p>
            <p>
              Second, an <strong>embedding</strong> — a multi-dimensional vector that encodes what the
              image looks and feels like. Photos with close embeddings are close in our canvas.
              That&rsquo;s the entire layout principle. The picture decides where it goes.
            </p>

            <div className="m-diagram">
              <svg viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="60" width="100" height="100" rx="2" fill="#1a1a1a" stroke="#444"/>
                <text x="70" y="180" textAnchor="middle" fontFamily="monospace" fontSize="10" fill="#888" letterSpacing="2">PHOTO</text>
                <line x1="130" y1="110" x2="195" y2="110" stroke="#e8b87c" strokeWidth="0.7" strokeDasharray="3 3"/>
                <text x="162" y="100" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#a7a39a" letterSpacing="1.5">AI</text>
                <g transform="translate(210, 70)">
                  <text x="0" y="0" fontFamily="monospace" fontSize="9" fill="#5e5b54" letterSpacing="2">TAGS</text>
                  <rect x="0" y="10" width="62" height="20" rx="10" fill="none" stroke="#666"/>
                  <text x="31" y="24" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#ddd">brutalism</text>
                  <rect x="68" y="10" width="48" height="20" rx="10" fill="none" stroke="#666"/>
                  <text x="92" y="24" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#ddd">facade</text>
                  <rect x="0" y="36" width="50" height="20" rx="10" fill="none" stroke="#666"/>
                  <text x="25" y="50" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#ddd">grey</text>
                  <rect x="56" y="36" width="62" height="20" rx="10" fill="none" stroke="#666"/>
                  <text x="87" y="50" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#ddd">overcast</text>
                </g>
                <g transform="translate(210, 140)">
                  <text x="0" y="0" fontFamily="monospace" fontSize="9" fill="#5e5b54" letterSpacing="2">EMBEDDING</text>
                  <text x="0" y="22" fontFamily="monospace" fontSize="11" fill="#e8b87c" letterSpacing="3">
                    [ 0.12, −0.83, 0.44, 0.07, …, −0.21 ]
                  </text>
                  <text x="0" y="40" fontFamily="monospace" fontSize="9" fill="#666" letterSpacing="1.5">512 dimensions</text>
                </g>
                <line x1="510" y1="110" x2="555" y2="110" stroke="#e8b87c" strokeWidth="0.7" strokeDasharray="3 3"/>
                <circle cx="572" cy="100" r="3" fill="#e8b87c"/>
                <circle cx="582" cy="120" r="2" fill="#a7a39a"/>
                <circle cx="566" cy="124" r="1.5" fill="#a7a39a"/>
                <text x="572" y="160" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#5e5b54" letterSpacing="2">CLUSTER</text>
              </svg>
              <div className="cap">Photo → tags + embedding → nearest neighbours in latent space.</div>
            </div>
          </div>
        </section>

        <section className="man-section">
          <div className="m-label">03 · How you move</div>
          <div className="m-body">
            <h2>You don&rsquo;t scroll.<br/>You <em>navigate.</em></h2>
            <p>
              The Kairos canvas is infinite, dark, and clustered. You pan with a drag, zoom with a
              wheel, and watch photos cluster around their nearest semantic neighbours. Hover a
              photo and faint amber lines emerge — lines pointing to its closest visual relatives,
              across the entire network.
            </p>
            <p>
              Photos sit at different <strong>depths</strong>. Closer ones are sharper, farther ones fade into a
              faint blue-black haze. Pan, and you get parallax — not a CSS trick, real perspective.
              Shift-scroll and you dive forward through depth layers, slicing through the space like
              the camera does through a 3D model.
            </p>
            <p>
              Above the canvas is a row of <strong>five semantic axes</strong> — Subject, Palette, Mood, Time,
              Composition. Click one and the entire constellation reforms. The same photos arrange
              themselves on a new dimension of similarity. Pictures that sit together in Subject
              scatter when you switch to Palette, then reconverge in Mood. Five different layouts
              of the same world.
            </p>

            <div className="m-diagram">
              <svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(60, 20)">
                  <text x="60" y="0" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#a7a39a" letterSpacing="2">SUBJECT</text>
                  <circle cx="40" cy="60" r="22" fill="#e8b87c" opacity="0.10"/>
                  <circle cx="40" cy="60" r="2.5" fill="#e8b87c"/>
                  <circle cx="32" cy="50" r="1.5" fill="#ddd" opacity=".8"/>
                  <circle cx="48" cy="58" r="1.5" fill="#ddd" opacity=".8"/>
                  <circle cx="38" cy="68" r="1.5" fill="#ddd" opacity=".8"/>
                  <circle cx="90" cy="80" r="18" fill="#3b82f6" opacity="0.10"/>
                  <circle cx="90" cy="80" r="2.5" fill="#3b82f6"/>
                  <circle cx="84" cy="74" r="1.5" fill="#ddd" opacity=".8"/>
                  <circle cx="95" cy="86" r="1.5" fill="#ddd" opacity=".8"/>
                  <circle cx="100" cy="40" r="16" fill="#10b981" opacity="0.10"/>
                  <circle cx="100" cy="40" r="2.5" fill="#10b981"/>
                  <circle cx="105" cy="35" r="1.5" fill="#ddd" opacity=".8"/>
                </g>
                <text x="180" y="105" textAnchor="middle" fontFamily="serif" fontSize="20" fill="#e8b87c">→</text>
                <g transform="translate(220, 20)">
                  <text x="60" y="0" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#a7a39a" letterSpacing="2">PALETTE</text>
                  <circle cx="60" cy="60" r="40" fill="none" stroke="#444" strokeWidth="0.5" strokeDasharray="2 3"/>
                  <circle cx="60" cy="20" r="2.5" fill="#e8b87c"/>
                  <circle cx="100" cy="60" r="2.5" fill="#10b981"/>
                  <circle cx="60" cy="100" r="2.5" fill="#3b82f6"/>
                  <circle cx="20" cy="60" r="2.5" fill="#a855f7"/>
                  <circle cx="68" cy="14" r="1.5" fill="#ddd" opacity=".7"/>
                  <circle cx="105" cy="68" r="1.5" fill="#ddd" opacity=".7"/>
                  <circle cx="58" cy="108" r="1.5" fill="#ddd" opacity=".7"/>
                </g>
                <text x="340" y="105" textAnchor="middle" fontFamily="serif" fontSize="20" fill="#e8b87c">→</text>
                <g transform="translate(380, 20)">
                  <text x="60" y="0" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#a7a39a" letterSpacing="2">MOOD</text>
                  <line x1="10" y1="60" x2="110" y2="60" stroke="#333"/>
                  <line x1="60" y1="10" x2="60" y2="110" stroke="#333"/>
                  <circle cx="80" cy="30" r="2" fill="#e8b87c"/>
                  <circle cx="30" cy="80" r="2" fill="#3b82f6"/>
                  <circle cx="90" cy="70" r="2" fill="#10b981"/>
                  <circle cx="40" cy="40" r="2" fill="#a855f7"/>
                  <circle cx="75" cy="85" r="1.5" fill="#ddd" opacity=".7"/>
                  <circle cx="25" cy="35" r="1.5" fill="#ddd" opacity=".7"/>
                </g>
                <g transform="translate(490, 20)">
                  <text x="0" y="40" fontFamily="monospace" fontSize="9" fill="#5e5b54" letterSpacing="2">SAME PHOTOS</text>
                  <text x="0" y="55" fontFamily="monospace" fontSize="9" fill="#5e5b54" letterSpacing="2">DIFFERENT</text>
                  <text x="0" y="70" fontFamily="monospace" fontSize="9" fill="#5e5b54" letterSpacing="2">PROJECTIONS</text>
                </g>
              </svg>
              <div className="cap">Switch dimension, watch the constellation reform.</div>
            </div>
          </div>
        </section>

        <section className="man-section">
          <div className="m-label">04 · The social layer</div>
          <div className="m-body">
            <h2>Photos first. People <em>found</em>.</h2>
            <p>
              Kairos is social, but the social part is hidden inside the work. You don&rsquo;t see
              usernames until you hover. You don&rsquo;t see follower counts at all. There is no
              leaderboard, no algorithmic boost, no &ldquo;for you&rdquo; page. The only signal a photo gives
              you is itself.
            </p>
            <p>
              Authors emerge as you wander. Open the constellation around <em>Tides</em> and you&rsquo;ll
              notice the same handle appearing again and again — an oceanographer, an island
              teenager, a retired sailor. You can follow them. But the unit of attention here is
              always the picture, not the personality.
            </p>
          </div>
        </section>

        <section className="man-section">
          <div className="m-label">05 · Quietly designed</div>
          <div className="m-body">
            <h2>Built to disappear.</h2>
            <p>
              We don&rsquo;t train on your photos. We don&rsquo;t auto-share to anywhere. We don&rsquo;t serve ads.
              Your embeddings stay yours; you can export them, delete them, withdraw them at any
              time. There is no infinite-scroll trap. The canvas doesn&rsquo;t play any sounds, doesn&rsquo;t
              ping for engagement, doesn&rsquo;t pretend that something is happening when it isn&rsquo;t.
            </p>
            <p>
              Most days, you&rsquo;ll come, drop a picture, watch it find its constellation, scroll
              through one or two clusters that caught your eye, and leave. We think that&rsquo;s
              enough.
            </p>
          </div>
        </section>

        <section className="man-section">
          <div className="m-label">06 · Who&rsquo;s behind it</div>
          <div className="m-body">
            <h2>A small studio,<br/>working <em>slowly.</em></h2>
            <p>
              Kairos is being built by a tiny team of designers and engineers who got tired of
              feeds. We work out of nowhere in particular. We don&rsquo;t take ads. We don&rsquo;t take a
              cut. The eventual business model is a small annual subscription — the price of a
              gallery membership.
            </p>
            <p>We are not in a hurry. The constellation can wait.</p>
          </div>
        </section>

        <section style={{
          textAlign:'center', padding:'120px 6vw 140px', borderTop:'1px solid var(--line)',
          maxWidth:1180, margin:'0 auto',
        }}>
          <div className="pre" style={{ fontSize:11, letterSpacing:'.24em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:24 }}>Closed beta · v.0</div>
          <h2 style={{
            fontFamily:'var(--serif)', fontWeight:400, fontSize:'clamp(48px,5vw,84px)',
            lineHeight:1, letterSpacing:'-.01em', margin:'0 0 36px',
          }}>
            The constellation is open.<br/>
            <em style={{ color:'var(--warm)', fontStyle:'italic' }}>Care to wander?</em>
          </h2>
          <div style={{ display:'inline-flex', gap:14 }}>
            <Link className="btn-primary" to="/signup">Calibrate your gaze</Link>
            <Link className="btn-ghost" to="/kairos">Look around first</Link>
          </div>
        </section>

        <PageFooter />
      </div>
    </>
  );
}
