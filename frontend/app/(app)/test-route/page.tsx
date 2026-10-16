/**
 * A1: a plain Next.js route next to the Canvas catch-all.
 *
 * Tests whether a specific route beats app/[[...slug]]/page.tsx and
 * whether it gets the Alpina header/footer (expected: no, since those
 * come from the Drupal page variant).
 */
export const metadata = {
  title: "A1 test route",
};

export default function TestRoutePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>A1: plain Next.js route</h1>
      <p>
        This page lives at <code>app/test-route/page.tsx</code>, outside the
        Canvas catch-all. If you can read this, a specific Next.js route wins
        over <code>[[...slug]]</code>.
      </p>
      <p>
        There should be <strong>no Alpina header or footer</strong> here —
        those are placed by the Drupal <code>alpina</code> page variant, which
        only reaches Canvas pages.
      </p>
    </main>
  );
}
