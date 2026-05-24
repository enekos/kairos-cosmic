// Legal page — formerly legal.html.
import React, { useEffect } from 'react';
import { PageNav, PageFooter } from './_chrome.jsx';

export default function Legal() {
  useEffect(() => {
    document.body.classList.add('page');
    return () => document.body.classList.remove('page');
  }, []);

  return (
    <>
      <PageNav />
      <div className="legal-wrap">
        <div style={{ fontSize:10, letterSpacing:'.22em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:14 }}>Last revised · 2026</div>
        <h1>Privacy &amp; Terms.</h1>
        <p style={{
          fontFamily:'var(--serif)', fontStyle:'italic', fontSize:20, color:'var(--ink-2)',
          lineHeight:1.5, marginBottom:48, maxWidth:640,
        }}>
          The short version: we look at your photos to compute their embedding and tags, we store
          them for you, and that&rsquo;s about it. We don&rsquo;t sell anything to anyone.
        </p>

        <h2>What we collect</h2>
        <p>
          When you sign up we ask for an email address and a handle. When you upload a photo we
          keep the file, its derived AI tags, its embedding vector, and the timestamp. We log
          enough request metadata to keep the service running and stop abuse. We don&rsquo;t collect
          advertising identifiers or precise location.
        </p>

        <h2>What we don&rsquo;t do</h2>
        <ul>
          <li>We don&rsquo;t train third-party AI models on your photos.</li>
          <li>We don&rsquo;t sell your data, your embeddings, or your tag history.</li>
          <li>We don&rsquo;t serve advertising. There is no for-you ranking and no engagement boosting.</li>
          <li>We don&rsquo;t send notifications you didn&rsquo;t opt into.</li>
        </ul>

        <h2>Your photos are yours</h2>
        <p>
          You retain copyright on everything you upload. You grant Kairos a non-exclusive licence
          to host, render, and place your photos within the public constellation while your
          account is active. Delete a photo and we delete it — including its embedding and
          derived tags — from our active stores within seven days. Backups roll off within
          sixty.
        </p>

        <h2>What you can do</h2>
        <ul>
          <li>Export your photos, tags, and embedding vectors in a single archive at any time.</li>
          <li>Withdraw your account in two clicks. We&rsquo;ll send you the export first.</li>
          <li>Mark individual photos as private — they stay in your own constellation only.</li>
        </ul>

        <h2>Acceptable use</h2>
        <p>
          No content that depicts minors in a sexual context, no targeted harassment, no
          impersonation, no spam, no commercial scraping, no abusing the upload pipeline to host
          arbitrary files. Beyond that, we trust you. Kairos is small, hand-moderated, and we
          will close accounts that betray the rest of the room.
        </p>

        <h2>How disagreements end</h2>
        <p>
          If something we did broke something you valued, write to us. We&rsquo;re a small team and we
          will read your email. If the disagreement cannot be resolved that way, the laws of the
          jurisdiction where you live apply.
        </p>

        <h2>Changes</h2>
        <p>
          We&rsquo;ll let you know in-app if these terms change in any meaningful way. We&rsquo;ll archive
          every previous version, with a diff, on this page.
        </p>

        <h2>Contact</h2>
        <p>
          <span style={{
            fontFamily:'var(--mono)', background:'rgba(232,184,124,.1)', padding:'2px 6px',
            border:'1px solid rgba(232,184,124,.25)', borderRadius:2,
          }}>hello@kairos.example</span>
          {' '}— humans read this.
        </p>
      </div>

      <PageFooter />
    </>
  );
}
