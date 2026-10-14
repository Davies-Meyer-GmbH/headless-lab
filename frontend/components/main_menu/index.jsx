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

function MenuList({ items, nested = false }) {
  return (
    <ul
      className={
        nested
          ? 'mt-2 flex flex-col gap-2 pl-4'
          : 'flex flex-wrap items-center gap-x-6 gap-y-2'
      }
    >
      {items.map((item) => (
        <li key={`${item.href}:${item.title}`}>
          <a
            href={item.href}
            className="text-sm font-medium text-gray-900 hover:text-primary-600"
          >
            {item.title}
          </a>
          {item.children?.length > 0 && (
            <MenuList items={item.children} nested />
          )}
        </li>
      ))}
    </ul>
  );
}

const MainMenu = () => {
  const items = use(loadMainMenu());
  if (!items?.length) {
    return null;
  }

  return (
    <nav aria-label="Main">
      <MenuList items={items} />
    </nav>
  );
};

export default MainMenu;
