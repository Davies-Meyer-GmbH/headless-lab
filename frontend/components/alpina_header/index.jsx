'use client';

import Link from 'next/link';
import { usePageContext, useSiteContext } from 'drupal-canvas/react';
import { useAlpinaNavigation } from '../../lib/alpina-navigation';
import { useEffect, useId, useRef, useState } from 'react';

const AlpinaHeader = ({
  logo,
  logoLink,
  logoLabel = 'Alpina',
  menuLabel = 'Main navigation',
  openMenuLabel = 'Open menu',
  closeMenuLabel = 'Close menu',
  untranslatedLabel = 'Translation not yet available',
}) => {
  const [open, setOpen] = useState(false);
  const [visualLanguage, setVisualLanguage] = useState('fr');
  const toggle = useRef(null);
  const nav = useRef(null);
  const navId = useId();
  const page = usePageContext();
  const site = useSiteContext();
  const initialMenu = useAlpinaNavigation();
  const [previewMenu, setPreviewMenu] = useState([]);
  const language = page?.mainEntity?.requestedLanguage ?? '';
  const links = initialMenu ?? previewMenu;
  // Reserved visual placeholders. Multilingual content is not enabled yet.
  const placeholderLanguages = ['fr', 'nl'];

  useEffect(() => {
    if (initialMenu !== null) return;
    const controller = new AbortController();
    fetch(`/api/menu/main?language=${encodeURIComponent(language)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Menu unavailable');
        return response.json();
      })
      .then(setPreviewMenu)
      .catch((error) => {
        if (error.name !== 'AbortError') setPreviewMenu([]);
      });
    return () => controller.abort();
  }, [initialMenu, language]);

  useEffect(() => {
    if (!open) return;
    const site = nav.current?.closest('.alpina-site');
    // Matches the source navigation script, which locks main and footer.
    const locked = [site?.querySelector('main'), site?.querySelector('.footer')].filter(Boolean);
    const previousOverflow = document.documentElement.style.overflow;
    const previousInert = locked.map((element) => element.inert);
    document.documentElement.style.overflow = 'hidden';
    locked.forEach((element) => { element.inert = true; });
    const frame = requestAnimationFrame(() => nav.current?.querySelector('a')?.focus());
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
      if (event.key !== 'Tab') return;
      const visibleControls = Array.from(nav.current?.querySelectorAll('a[href], button:not(:disabled)') || [])
        .filter((element) => element.getClientRects().length > 0);
      const focusable = [toggle.current, ...visibleControls].filter(Boolean);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.style.overflow = previousOverflow;
      locked.forEach((element, index) => { element.inert = previousInert[index]; });
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const languages = (variant) => (
    <div className={`navigation__language-toggle navigation__language-toggle--${variant}`}>
      {placeholderLanguages.map((code) => (
        <a
          key={code}
          href="#"
          className={`navigation__toggle-option ${visualLanguage === code ? 'navigation__toggle-option--active tag-bold' : 'tag-regular'}`}
          aria-current={visualLanguage === code ? 'true' : undefined}
          title={untranslatedLabel}
          onClick={(event) => {
            event.preventDefault();
            setVisualLanguage(code);
          }}
        >
          {code.toUpperCase()}
        </a>
      ))}
    </div>
  );

  const menuItems = (items) => items.map((item) => (
    <li className="navigation__menu-item" key={item.href + item.title}>
      <a href={item.href} onClick={() => setOpen(false)}>{item.title}</a>
      {item.children.length ? <ul>{menuItems(item.children)}</ul> : null}
    </li>
  ));

  return (
    <>
      <div className={`navigation-backdrop${open ? ' navigation-backdrop--visible' : ''}`} aria-hidden="true" onClick={() => setOpen(false)} />
      <header className={`navigation${open ? ' navigation--open' : ''}`} lang={language || undefined}>
        <div className="navigation__bar">
          {logo?.src ? (
            <Link className="navigation__logo" href={logoLink || site?.branding?.homeUrl || '/'} aria-label={logoLabel} tabIndex={open ? -1 : undefined}>
              <img src={logo.src} width={logo.width || 97} height={logo.height || 80} alt={logo.alt || ''} />
            </Link>
          ) : null}
          <div className="navigation__icons">
            {languages('bar')}
            <button type="button" className="navigation__toggle" ref={toggle} aria-expanded={open} aria-controls={navId} aria-label={open ? closeMenuLabel : openMenuLabel} onClick={() => setOpen(!open)}>
              <img className="navigation__toggle-icon navigation__toggle-icon--menu" src="/alpina/img/_icn/menu.svg" width="22" height="22" alt="" decoding="async" />
              <img className="navigation__toggle-icon navigation__toggle-icon--close" src="/alpina/img/_icn/close.svg" width="22" height="22" alt="" decoding="async" />
            </button>
          </div>
        </div>
        <nav id={navId} ref={nav} className="navigation__menu" aria-label={menuLabel} aria-hidden={!open} inert={!open}>
          {languages('panel')}
          <ul>
            {menuItems(links)}
          </ul>
        </nav>
      </header>
    </>
  );
};

export default AlpinaHeader;
