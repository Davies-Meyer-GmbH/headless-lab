import { getAlpinaChrome } from '../../../lib/alpina-chrome';
import { getMenu } from '../../../lib/main-menu';
import {
  AlpinaFooterMenuProvider,
  AlpinaNavigationProvider,
} from '../../../lib/alpina-navigation';
import AlpinaHeader from '../../../components/alpina_header';
import AlpinaFooter from '../../../components/alpina_footer';

/**
 * A3: Alpina header and footer on a Next.js-only page.
 */
export const dynamic = 'force-dynamic';

export default async function ShellDemoPage() {
  const [{ headerProps, footerProps }, mainMenu, footerMenu] = await Promise.all([
    getAlpinaChrome(),
    getMenu('main'),
    getMenu('footer'),
  ]);

  return (
    <AlpinaNavigationProvider items={mainMenu}>
      <AlpinaFooterMenuProvider items={footerMenu}>
        <AlpinaHeader {...(headerProps as unknown as React.ComponentProps<typeof AlpinaHeader>)} />
        <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
          <h1>A3: Alpina chrome on a Next.js page</h1>
          <p>
            Header and footer are the real Canvas components, rendered here
            with props extracted from the content API (source: the page
            variant of <code>/</code>).
          </p>
        </main>
        <AlpinaFooter {...(footerProps as unknown as React.ComponentProps<typeof AlpinaFooter>)} />
      </AlpinaFooterMenuProvider>
    </AlpinaNavigationProvider>
  );
}
