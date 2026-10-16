import type { ReactNode } from 'react';
import Link from 'next/link';
import TestInfo from '../../components/test-info';

/**
 * B2 (Next.js side): a separate layout owned entirely by Next.js, used by
 * pages in the (legal) route group. Deliberately minimal chrome — no
 * product navigation, no dependency on the Drupal page variant. If this
 * layout needed the real Alpina header, it would have to fetch its props
 * via lib/alpina-chrome.ts (A3 workaround).
 */
export default function LegalGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div data-b2-group="legal" style={{ background: '#fff', minHeight: '100vh' }}>
      <header className="legal-header">
        <div className="container legal-header__bar">
          <Link href="/" aria-label="Alpina — back to the home page">
            <img src="/alpina/img/_icn/logo.svg" width="49" height="40" alt="Alpina" />
          </Link>
          <span className="legal-header__label body-sm">Rechtliches</span>
        </div>
      </header>
      <main id="alpina-main">{children}</main>
      <footer className="footer">
        <div className="container">
          <p className="body-sm" style={{ padding: '1rem 0' }}>
            © Alpina — example footer for the Next.js-owned legal layout.
          </p>
        </div>
      </footer>
      <TestInfo />
    </div>
  );
}
