'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { AlpinaProduct } from './product-list';

const ProductsContext = createContext<AlpinaProduct[] | null>(null);

/** Supplies sliders with the server-rendered, admin-ordered product list. */
export function AlpinaProductsProvider({ products, children }: {
  products: AlpinaProduct[];
  children: ReactNode;
}) {
  return <ProductsContext.Provider value={products}>{children}</ProductsContext.Provider>;
}

export function useAlpinaProducts() {
  return useContext(ProductsContext) ?? [];
}
