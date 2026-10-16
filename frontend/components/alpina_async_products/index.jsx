/**
 * A4: a section that fetches its own data on the server.
 *
 * Split into two files so the editor preview can cope:
 * - This entry file is SYNC. In the browser (editor preview) it renders a
 *   short notice and never creates a promise — no suspension warnings, no
 *   "async Client Component" error.
 * - `async-inner.jsx` is the async server component that does the fetch.
 *   It is only rendered on the server.
 *
 * Known remaining limit: the fetch cannot import `server-only`-marked libs
 * (the Canvas component loader rejects them), so it is inlined here.
 */
import AsyncInner from './async-inner';

const AlpinaAsyncProducts = ({ heading = 'A4 async server component' }) => {
  // In the browser — the editor preview — render the notice synchronously.
  if (typeof window !== 'undefined') {
    return (
      <section className="store-logo" data-a4="async-server-component-preview">
        <div className="container container--small">
          <h2 className="h2">{heading}</h2>
          <p className="body">
            This section fetches its own data on the server, so it cannot
            render in the editing preview. Open the public page to see the
            product list.
          </p>
        </div>
      </section>
    );
  }
  return <AsyncInner heading={heading} />;
};

export default AlpinaAsyncProducts;
