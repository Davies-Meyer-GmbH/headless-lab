import CanvasComponentTree from '@drupal-canvas/headless-next/CanvasComponentTree';
import {
  fetchPage,
  isPageRedirect,
  toNextMetadata,
} from '@drupal-canvas/headless-next';
import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
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

async function getPath(params: CatchAllPageProps['params']) {
  const { slug } = await params;
  return `/${(slug ?? []).map(encodeURIComponent).join('/')}`;
}

export async function generateMetadata({
  params,
}: CatchAllPageProps): Promise<Metadata> {
  const page = await getPage(await getPath(params));
  return page && !isPageRedirect(page) ? toNextMetadata(page.head) : {};
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const page = await getPage(await getPath(params));

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
  const [menu, footerMenu, products, inspirationProducts] = await Promise.all([
    getMenu('main', language),
    getMenu('footer', language),
    getOrderedProducts(),
    getOrderedProducts('inspiration'),
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
