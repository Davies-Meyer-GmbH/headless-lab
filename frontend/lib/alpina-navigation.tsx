'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { MenuItem } from './main-menu';

const NavigationContext = createContext<MenuItem[] | null>(null);
const FooterMenuContext = createContext<MenuItem[] | null>(null);

/** Supplies menu content with the initial server-rendered Canvas page. */
export function AlpinaNavigationProvider({ items, children }: {
  items: MenuItem[];
  children: ReactNode;
}) {
  return <NavigationContext.Provider value={items}>{children}</NavigationContext.Provider>;
}

export function useAlpinaNavigation() {
  return useContext(NavigationContext);
}

/** Supplies Footer menu content with the initial server-rendered Canvas page. */
export function AlpinaFooterMenuProvider({ items, children }: {
  items: MenuItem[];
  children: ReactNode;
}) {
  return <FooterMenuContext.Provider value={items}>{children}</FooterMenuContext.Provider>;
}

export function useAlpinaFooterMenu() {
  return useContext(FooterMenuContext);
}
