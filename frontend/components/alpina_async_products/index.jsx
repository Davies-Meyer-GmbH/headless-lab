/**
 * A4: an async server component that fetches its own data.
 *
 * No 'use client'. Variant B: inline fetch, no `server-only` import —
 * isolates whether `async` alone survives the Canvas component loader.
 * (Variant A imported `lib/product-list.ts`, which is marked `server-only`,
 * and failed to build: the Canvas loader compiles components outside the
 * App Router server layer.)
 */
const AlpinaAsyncProducts = async ({ heading = 'A4 async server component' }) => {
  // Editor preview: this component runs in the browser there, where
  // CANVAS_SITE_URL is not injected. Skip the fetch instead of looping
  // requests to /undefined/jsonapi. (The React "async Client Component"
  // error still shows — that cannot be avoided; see A4 in the test plan.)
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
    <section className="store-logo" data-a4="async-server-component">
      <div className="container container--small">
        <h2 className="h2">{heading}</h2>
        {products.length === 0 ? (
          <p className="body">No products found.</p>
        ) : (
          <ol>
            {products.slice(0, 5).map((product) => (
              <li key={product.id}>{product.label}</li>
            ))}
          </ol>
        )}
        <p className="body">
          <small>
            {products.length > 0
              ? `Fetched server-side by the component itself (${products.length} products available).`
              : 'No data here — on the public site this text lists products fetched server-side. The editor preview runs components in the browser, where a server component cannot fetch (A4).'}
          </small>
        </p>
      </div>
    </section>
  );
};

export default AlpinaAsyncProducts;
