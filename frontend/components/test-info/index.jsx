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
    id: 'A-page (video)',
    title: 'Video variants test page',
    tested: 'Hero and product teasers with desktop/mobile video sources instead of images (video test page).',
    conclusion: 'Baseline content import — see docs/alpina/video-variants.md.',
  },
  {
    match: '/alpina',
    id: 'B-page (real)',
    title: 'Real page — home',
    tested: 'Shown for orientation: the full Alpina page variant (shell, header, hero, teaser, slider, inspo grid, store logo, footer). Used as reference while testing A1–A6.',
    conclusion: 'Not a test itself. A5 made its data fetches conditional; A6 caches its content-API response (TTL 300s, revalidate via /api/revalidate?path=/alpina).',
  },
  {
    match: '/a4-async',
    id: 'A4',
    title: 'Async server component',
    tested: 'An async component (no \'use client\') that fetches products itself via JSON:API, placed on a Canvas page.',
    conclusion: 'Works on the public site (fetched server-side, zero JS). Breaks the editor preview: there it runs in the browser, React rejects async client components, and CANVAS_SITE_URL is missing (was looping /undefined/jsonapi 404s — now guarded). Cannot import server-only libs.',
  },
  {
    match: '/test-route',
    id: 'A1',
    title: 'Plain Next.js route vs catch-all',
    tested: 'A specific Next.js route next to the Canvas catch-all. A conflicting Canvas page (ID 18) exists at the same path in Drupal.',
    conclusion: 'Next.js route wins, silently. The Canvas page is unreachable from the frontend and its editor preview shows this page instead. Keep Canvas and Next paths disjoint.',
  },
  {
    match: '/shell-demo',
    id: 'A3',
    title: 'Alpina chrome on a Next.js page',
    tested: 'The real alpina_header and alpina_footer components rendered on a Next.js-only page, with props extracted from the content API (lib/alpina-chrome.ts, source page /).',
    conclusion: 'Works: components run outside CanvasComponentTree because the root CanvasRuntime provides their contexts. Cost: one extra no-store API call per request; props depend on the source page keeping the variant.',
  },
  {
    match: '/legal-next',
    id: 'B2-Next',
    title: 'Legal page — Next.js-owned layout',
    tested: 'A separate layout via a route group: app/(legal)/ with its own layout.tsx and a static page. Drupal has no page for this path.',
    conclusion: 'Works and ships zero Drupal dependencies. Trade-offs: not editor-editable, header props would need the A3 workaround if it used the real chrome, and a Canvas page created at /legal-next would be silently shadowed (A1).',
  },
  {
    match: '/legal',
    id: 'B2-Canvas',
    title: 'Legal page — second page variant',
    tested: 'A second Drupal page variant (legal) with the alpina_legal_shell layout: slim logo bar instead of product navigation, content and footer slots. Selected on the Canvas page itself.',
    conclusion: 'Works: PageVariantResolver picks the variant selected on the page. Editors edit the text (alpina_rich_text) and footer in the Canvas editor; header is fixed in the shell. See /legal-next for the Next.js-owned alternative.',
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
