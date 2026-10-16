import 'server-only';

export interface MenuItem {
  href: string;
  title: string;
  children: MenuItem[];
}

interface LinksetItem {
  href: string;
  title: string;
  hierarchy: string[];
}

/** Read a Drupal menu, access-filtered and ordered, for the English-only site. */
export async function getMenu(menu: 'main' | 'footer', language = ''): Promise<MenuItem[]> {
  const base = process.env.CANVAS_SITE_URL?.replace(/\/$/, '');
  if (!base) throw new Error('CANVAS_SITE_URL is missing.');
  if (language && !/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(language)) {
    throw new Error('Invalid menu language.');
  }
  // English is unprefixed. Locale prefixes are deferred with multilingual support.
  const response = await fetch(`${base}/system/menu/${menu}/linkset`, {
    headers: { Accept: 'application/linkset+json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Drupal ${menu} menu returned ${response.status}.`);
  const payload = await response.json();
  const links: LinksetItem[] = payload.linkset?.[0]?.item ?? [];
  const nodes = new Map<string, MenuItem>();
  const roots: MenuItem[] = [];
  // Drupal's linkset keeps tree order, including editorial menu weights.
  for (const item of links) {
    if (typeof item.href !== 'string' || !Array.isArray(item.hierarchy)) continue;
    const url = new URL(item.href, base);
    const drupal = new URL(base);
    // Drupal renders <nolink> placeholders as an empty href.
    const href = !item.href
      ? '#'
      : url.hostname === drupal.hostname && url.port === drupal.port
        ? `${url.pathname}${url.search}${url.hash}`
        : item.href;
    const node: MenuItem = { href, title: item.title, children: [] };
    nodes.set(item.hierarchy.join('.'), node);
    const parent = nodes.get(item.hierarchy.slice(0, -1).join('.'));
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export function getMainMenu(language = ''): Promise<MenuItem[]> {
  return getMenu('main', language);
}
