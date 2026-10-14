'use client';

import { use } from 'react';
import { getMainMenuItems } from '@/lib/main-menu';

let clientMenu;

function loadMainMenu() {
  if (typeof window === 'undefined') {
    return getMainMenuItems();
  }
  clientMenu ??= fetch('/api/menu/main').then(async (response) => {
    if (!response.ok) {
      return [];
    }
    return response.json();
  });
  return clientMenu;
}

function MenuItems({ items, nested = false }) {
  return (
    <ul
      className={
        nested
          ? 'flex flex-col gap-2'
          : 'flex flex-wrap items-center justify-center gap-x-6 gap-y-2'
      }
    >
      {items.map((item) => (
        <li key={`${item.href}:${item.title}`} className="group relative">
          <a
            href={item.href}
            className={
              nested
                ? 'block text-sm font-medium text-[#02355A] hover:text-[#3680CE]'
                : 'text-sm font-medium text-white hover:text-white/80'
            }
          >
            {item.title}
          </a>
          {item.children?.length > 0 &&
            (nested ? (
              <MenuItems items={item.children} nested />
            ) : (
              <ul className="invisible absolute top-full left-0 z-10 mt-3 min-w-44 rounded-2xl bg-white p-3 shadow-lg group-hover:visible">
                <MenuItems items={item.children} nested />
              </ul>
            ))}
        </li>
      ))}
    </ul>
  );
}

function DrupalMainMenu() {
  const items = use(loadMainMenu());
  if (!items?.length) {
    return null;
  }

  return (
    <nav aria-label="Main">
      <MenuItems items={items} />
    </nav>
  );
}

const PepsicoHeader = ({
  logo,
  taglinePrimary = 'GASTRONOMIE &',
  taglineSecondary = 'AWAY FROM HOME',
  ctaText = 'Jetzt wechseln',
  ctaUrl = '/',
}) => {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center gap-6 rounded-3xl bg-[#02355A] px-6 py-3 text-white">
      <div className="flex shrink-0 items-center gap-4">
        <div className="flex min-h-10 min-w-28 items-center">{logo}</div>
        {(taglinePrimary || taglineSecondary) && (
          <p className="text-[11px] leading-tight font-semibold tracking-wide uppercase">
            {taglinePrimary}
            {taglinePrimary && taglineSecondary ? <br /> : null}
            {taglineSecondary}
          </p>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <DrupalMainMenu />
      </div>
      {ctaText ? (
        <a
          href={ctaUrl || '/'}
          className="shrink-0 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#02355A] hover:bg-white/90"
        >
          {ctaText}
        </a>
      ) : null}
    </header>
  );
};

export default PepsicoHeader;
