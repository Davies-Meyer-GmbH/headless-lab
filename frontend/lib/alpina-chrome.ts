import 'server-only';

/**
 * A3: fetch the Alpina header/footer props for pages Drupal doesn't manage.
 *
 * The header and footer live as components inside the `alpina` page variant,
 * so their props (logo, labels, social links) are only exposed through the
 * content API's component tree. This walks the tree of a known Canvas page
 * and extracts them. Workaround, not a first-class API: it depends on
 * CHROME_SOURCE_PATH rendering the variant, and costs one API call per
 * request (no-store, same as everything else here).
 */

const BASE = process.env.CANVAS_SITE_URL?.replace(/\/$/, '');
const SOURCE_PATH = process.env.ALPINA_CHROME_SOURCE_PATH ?? '/';

type TreeNode = {
  element?: string;
  props?: Record<string, unknown>;
  slots?: Record<string, unknown>;
};

function findByElement(node: unknown, element: string): TreeNode | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findByElement(child, element);
      if (found) return found;
    }
    return undefined;
  }
  if (!node || typeof node !== 'object') return undefined;
  const tree = node as TreeNode;
  if (tree.element === element) return tree;
  for (const slot of Object.values(tree.slots ?? {})) {
    const found = findByElement(slot, element);
    if (found) return found;
  }
  return undefined;
}

export async function getAlpinaChrome(): Promise<{ headerProps: Record<string, unknown>; footerProps: Record<string, unknown> }> {
  if (!BASE) throw new Error('CANVAS_SITE_URL is missing.');
  const response = await fetch(`${BASE}/canvas/content-api?requestUri=${encodeURIComponent(SOURCE_PATH)}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Content API returned ${response.status} for chrome props.`);
  const payload = (await response.json()) as { content?: TreeNode };
  const tree = payload.content;
  if (!tree) throw new Error('Content API returned no content tree.');
  const headerProps = findByElement(tree, 'js-alpina-header')?.props ?? {};
  const footerProps = findByElement(tree, 'js-alpina-footer')?.props ?? {};
  // canvasUuid is Canvas bookkeeping, not a component prop.
  delete headerProps.canvasUuid;
  delete footerProps.canvasUuid;
  return { headerProps, footerProps };
}
