/**
 * B2: minimal page shell for legal pages — a second layout, distinct from
 * the home page variant. No product navigation, slim logo bar, its own
 * main landmark. The footer is a slot so the variant places the real
 * footer in Drupal; the header is deliberately NOT a slot: legal pages
 * get a fixed slim bar instead of the full navigation.
 */
import Link from 'next/link';

const AlpinaLegalShell = ({ content, footer }) => {
  return (
    <div className="alpina-site alpina-site--legal" data-b2="legal-shell">
      <header className="legal-header">
        <div className="container legal-header__bar">
          <Link href="/" aria-label="Alpina — back to the home page">
            <img src="/alpina/img/_icn/logo.svg" width="49" height="40" alt="Alpina" />
          </Link>
          <span className="legal-header__label body-sm">Rechtliches</span>
        </div>
      </header>
      <main id="alpina-main">{content}</main>
      {footer}
    </div>
  );
};

export default AlpinaLegalShell;
