'use client';

import { usePageContext } from 'drupal-canvas/react';

const AlpinaShell = ({ header, content, footer }) => {
  const page = usePageContext();
  const language = page?.mainEntity?.renderedLanguage;
  return (
  <div className="alpina-site" lang={language}>
    <a href="#alpina-main" className="skip-link">Skip to main content</a>
    {header}
    <main id="alpina-main">{content}</main>
    {footer}
  </div>
  );
};

export default AlpinaShell;
