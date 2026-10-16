import CanvasComponentTree from '@drupal-canvas/headless-next/CanvasComponentTree';
import {
  fetchPage,
  isPageRedirect,
  NEXT_DRAFT_MODE_COOKIE_NAME,
  toNextMetadata,
  type Page,
  type PageResult,
} from '@drupal-canvas/headless-next';
import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { getMenu } from '../../../lib/main-menu';
import { AlpinaFooterMenuProvider, AlpinaNavigationProvider } from '../../../lib/alpina-navigation';
import { getOrderedProducts } from '../../../lib/product-list';
import { AlpinaInspirationProvider } from '../../../lib/alpina-inspiration';
import { AlpinaProductsProvider } from '../../../lib/alpina-products';

export const dynamic = 'force-dynamic';

interface CatchAllPageProps {
  params: Promise<{ slug?: string[] }>;
}

const getPage = cache((path: string) => fetchPage(path));

// A6: cache the content-API response for anonymous visitors. The SDK's
// fetchPage reads cookies/headers on every call (draft detection, preview
// context), so it can never run inside unstable_cache — and its inner fetch
// is hardcoded to no-store. The data cache still works at the fetch level:
// clone the anonymous shape of that call with next.revalidate/tags, and use
// the real fetchPage only for draft sessions, which must always hit Drupal.
// Cache key is the path only: enough while the site is English-only, must
// include the negotiated language once multilingual content returns.
interface CachedPage extends Page {}

async function fetchPageAnon(path: string): Promise<CachedPage | null> {
  const base = process.env.CANVAS_SITE_URL?.replace(/\/$/, '');
  if (!base) throw new Error('CANVAS_SITE_URL is missing.');
  const response = await fetch(`${base}/canvas/content-api?requestUri=${encodeURIComponent(path)}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300, tags: ['canvas-page'] },
  });
  if (!response.ok) return null;
  const raw = (await response.json()) as CachedPage;
  return { ...raw, context: raw.context ?? { page: null, site: null } };
}

async function getPageCached(path: string) {
  const draftCookie = await cookies();
  return draftCookie.has(NEXT_DRAFT_MODE_COOKIE_NAME) ? getPage(path) : fetchPageAnon(path);
}

async function getPath(params: CatchAllPageProps['params']) {
  const { slug } = await params;
  return `/${(slug ?? []).map(encodeURIComponent).join('/')}`;
}

export async function generateMetadata({
  params,
}: CatchAllPageProps): Promise<Metadata> {
  const page = await getPageCached(await getPath(params));
  return page && !isPageRedirect(page) ? toNextMetadata(page.head) : {};
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const page = await getPageCached(await getPath(params));

  if (!page) {
    notFound();
  }

  if (isPageRedirect(page)) {
    const { statusCode, url } = page.redirect;
    if (statusCode === 301 || statusCode === 308) {
      permanentRedirect(url);
    }
    redirect(url);
  }

  const language = page.context?.page?.mainEntity?.requestedLanguage ?? '';
  // A5: fetch shared data only when the component tree needs it. The tree is
  // already in memory, so this costs a JSON.stringify, not an API call.
  const treeJson = JSON.stringify(page.content);
  const [menu, footerMenu, products, inspirationProducts] = await Promise.all([
    treeJson.includes('js-alpina-header') ? getMenu('main', language) : [],
    treeJson.includes('js-alpina-footer') ? getMenu('footer', language) : [],
    treeJson.includes('js-alpina-product-slider') ? getOrderedProducts() : [],
    treeJson.includes('js-alpina-inspo-grid') ? getOrderedProducts('inspiration') : [],
  ]);

  return (
    <AlpinaNavigationProvider items={menu}>
      <AlpinaFooterMenuProvider items={footerMenu}>
        <AlpinaProductsProvider products={products}>
          <AlpinaInspirationProvider products={inspirationProducts}>
            <CanvasComponentTree tree={page.content} context={page.context} />
          </AlpinaInspirationProvider>
        </AlpinaProductsProvider>
      </AlpinaFooterMenuProvider>
    </AlpinaNavigationProvider>
  );
}
