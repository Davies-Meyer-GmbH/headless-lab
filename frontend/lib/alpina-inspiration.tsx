'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { AlpinaProduct } from './product-list';

const InspirationContext = createContext<AlpinaProduct[] | null>(null);

/** Supplies inspiration grids with the server-rendered, admin-ordered product list. */
export function AlpinaInspirationProvider({ products, children }: {
  products: AlpinaProduct[];
  children: ReactNode;
}) {
  return <InspirationContext.Provider value={products}>{children}</InspirationContext.Provider>;
}

export function useAlpinaInspiration() {
  return useContext(InspirationContext) ?? [];
}
