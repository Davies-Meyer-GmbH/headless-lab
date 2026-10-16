'use client';

import { usePageContext } from 'drupal-canvas/react';
import { Fragment, useEffect, useState } from 'react';
import { useAlpinaFooterMenu } from '../../lib/alpina-navigation';

const AlpinaFooter = ({ pinterestLink, instagramLink, facebookLink, youTubeLink }) => {
  const page = usePageContext();
  const initialMenu = useAlpinaFooterMenu();
  const [previewMenu, setPreviewMenu] = useState([]);
  const language = page?.mainEntity?.requestedLanguage ?? '';
  const links = initialMenu ?? previewMenu;
  const socials = [
    ['Pinterest', 'some-pinterest.svg', pinterestLink],
    ['Instagram', 'some-instagram.svg', instagramLink],
    ['Facebook', 'some-facebook.svg', facebookLink],
    ['YouTube', 'some-youtube.svg', youTubeLink],
  ].filter(([, , href]) => href);

  useEffect(() => {
    if (initialMenu !== null) return;
    const controller = new AbortController();
    fetch(`/api/menu/footer?language=${encodeURIComponent(language)}`, { signal: controller.signal })
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

  return (
    <footer className="footer">
      {links.length ? (
        <ul className="footer__links">
          {links.map((item, index) => (
            <Fragment key={item.href + item.title}>
              {index === 2 ? <li className="footer__divider" aria-hidden="true" /> : null}
              <li>
                <a className="footer__link body-2" href={item.href}>{item.title}</a>
              </li>
            </Fragment>
          ))}
        </ul>
      ) : null}
      {socials.length ? (
        <ul className="footer__social-icons">
          {socials.map(([label, icon, href]) => (
            <li key={label}>
              <a className="footer__social" href={href} aria-label={label}>
                <img src={`/alpina/img/_icn/${icon}`} width="27" height="27" alt="" loading="lazy" decoding="async" />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </footer>
  );
};

export default AlpinaFooter;
