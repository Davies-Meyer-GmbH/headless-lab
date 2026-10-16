'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';

/**
 * Floating "what is tested here" badge. Rendered in every group layout so
 * it appears on all test pages AND on the real pages (/alpina,
 * /alpina-video-test). Click to expand. Details live in
 * docs/alpina/nextjs-test-plan.md — this is the on-page view of it.
 */
const PAGE_INFO = [
  {
    match: '/alpina-video-test',
    id: 'video test page',
    title: 'Video test page',
    tested: 'One of our real demo pages. The big hero and the product teasers play videos instead of showing images.',
    conclusion: 'Everything works — this page is here as a reference so you can compare it while looking at the test pages.',
  },
  {
    match: '/alpina',
    id: 'real page',
    title: 'The real home page',
    tested: 'Not a test — this is the real home page, shown here so the test badge works here too and you can compare.',
    conclusion: 'One thing changed under the hood: after the first visit, the page content is kept for 5 minutes, so repeat visits are much faster. A saved page in Drupal appears here within 5 minutes, or immediately once Drupal asks the site to refresh it.',
  },
  {
    match: '/a4-async',
    id: 'A4',
    title: 'A section that fetches its own data',
    tested: 'The product list below the headline fetches its own data straight from Drupal — no page-level code feeds it. On the public site this works: the list is filled in on the server before you see it.',
    conclusion: 'Works for visitors. In the editing preview the section shows a short notice instead ("cannot render in the editing preview") — the preview cannot fetch on the server, and that cannot be fixed from our side. Public site and preview never get in each other\'s way.',
  },
  {
    match: '/test-route',
    id: 'A1',
    title: 'Same address, two owners',
    tested: 'This page was built in Next.js code. Drupal also has a page with this exact address (on purpose). The question was: which one do visitors get?',
    conclusion: 'The Next.js page wins — and the Drupal page becomes invisible. No error, no warning, anywhere. Lesson: Drupal and Next.js must never be given the same address.',
  },
  {
    match: '/shell-demo',
    id: 'A3',
    title: 'Real header and footer, but no Drupal page',
    tested: 'This page lives only in Next.js, yet it shows the real Alpina header and footer. The page borrows them: it asks Drupal for the home page\'s header settings (logo etc.) and reuses them here.',
    conclusion: 'Works, but every visit pays for one extra request to Drupal. Fine for a few pages like search or account; for anything bigger, the page should live in Drupal like the rest.',
  },
  {
    match: '/legal-next',
    id: 'B2 · Next.js way',
    title: 'Datenschutz — built in code',
    tested: 'The layout (slim top bar with just the logo, no product menu) and the text both live in the Next.js code. Drupal knows nothing about this page.',
    conclusion: 'Simple and fast, but nobody can edit the text in Drupal — a developer has to. Good for pages that never change; wrong for anything editors should own.',
  },
  {
    match: '/legal',
    id: 'B2 · Drupal way',
    title: 'Datenschutz — built in Drupal',
    tested: 'Same kind of page as /legal-next, but built the Drupal way: this page uses its own layout ("Legal") with the slim top bar, and the text is a normal editable block in the Canvas editor.',
    conclusion: 'Works: the home page keeps its normal layout, this page gets its own, and editors can change the text themselves. The slim top bar (logo only, no product menu) is fixed in the layout — exactly like a real legal page would want.',
  },
];

const TestInfo = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const info =
    PAGE_INFO.find(({ match }) => pathname === match || pathname.startsWith(`${match}/`)) ??
    (pathname === '/' ? PAGE_INFO.find(({ match }) => match === '/alpina') : undefined);
  if (!info) return null;
  return (
    <div
      data-test-info
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 9999,
        maxWidth: '22rem',
        fontFamily: 'sans-serif',
        fontSize: '0.8rem',
      }}
    >
      {open ? (
        <div
          style={{
            background: '#1b1b1b',
            color: '#fff',
            borderRadius: '8px',
            padding: '0.9rem 1rem',
            boxShadow: '0 4px 16px rgba(0,0,0,.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '.4rem' }}>
            <strong>
              {info.id} — {info.title}
            </strong>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close test info"
              style={{ background: 'none', border: 0, color: '#fff', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          <p style={{ margin: '0 0 .4rem' }}>
            <strong>Tested:</strong> {info.tested}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Conclusion:</strong> {info.conclusion}
          </p>
          <p style={{ margin: '.5rem 0 0', opacity: 0.7 }}>
            Full plan: <code>docs/alpina/nextjs-test-plan.md</code>
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            background: '#1b1b1b',
            color: '#fff',
            border: 0,
            borderRadius: '999px',
            padding: '.4rem .9rem',
            cursor: 'pointer',
            fontSize: '0.75rem',
          }}
        >
          {info.id} · what is this?
        </button>
      )}
    </div>
  );
};

export default TestInfo;
