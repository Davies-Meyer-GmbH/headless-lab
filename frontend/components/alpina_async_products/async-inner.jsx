/**
 * The async half of the A4 component. Only ever rendered on the server —
 * the sync wrapper in index.jsx never mounts this in the browser, so the
 * editor preview never creates its promise (no "uncached promise"
 * suspension, no "async Client Component" error).
 *
 * The fetch is inlined because even indirect `server-only` imports fail:
 * the Canvas component loader bundles the entry's whole import graph and
 * rejects the marker anywhere in it.
 */
const AlpinaAsyncProductsInner = async ({ heading = 'A4 async server component' }) => {
  const base = process.env.CANVAS_SITE_URL?.replace(/\/$/, '');
  let products = [];
  if (base) {
    try {
      const response = await fetch(`${base}/jsonapi/node/product?fields[node--product]=title`, {
        headers: { Accept: 'application/vnd.api+json' },
        cache: 'no-store',
      });
      if (response.ok) {
        const payload = await response.json();
        products = (payload.data ?? []).map((item, index) => ({
          id: item.id ?? String(index),
          label: item.attributes?.title ?? '(untitled)',
        }));
      }
    } catch {
      products = [];
    }
  }
  return (
    <ol>
      {products.slice(0, 5).map((product) => (
        <li key={product.id}>{product.label}</li>
      ))}
    </ol>
  );
};

export default AlpinaAsyncProductsInner;
