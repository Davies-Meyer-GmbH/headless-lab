/**
 * B2 (Next.js side): the legal page with a Next.js-owned layout.
 * Content is static, taken from alpina-be-frontend/legal.html (shortened).
 * The Canvas-native twin of this page lives at /legal (page variant
 * 'legal'); the two cannot share one path — the Next.js route would
 * silently shadow the Canvas page (A1).
 */
export const metadata = {
  title: 'Datenschutzerklärung',
  description: 'Datenschutzerklärung (B2 test page with a Next.js-owned layout).',
};

export default function LegalNextPage() {
  return (
    <>
      <section className="text-header" aria-labelledby="legal-heading">
        <div className="container">
          <h1 id="legal-heading" className="h1 text-header__hl">
            Datenschutz
          </h1>
        </div>
      </section>
      <section className="legal-body" data-b2="next-page">
        <div className="container">
          <div className="legal-body__copy">
            <p className="body-md">Datenschutzerklärung</p>
            <div className="legal-body__block">
              <p className="body-md">1. Allgemeine Hinweise</p>
              <p className="body-md">
                Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir
                behandeln Ihre personenbezogenen Daten vertraulich und
                entsprechend der gesetzlichen Datenschutzvorschriften sowie
                dieser Datenschutzerklärung.
              </p>
              <p className="body-md">
                (Auszug — Volltext siehe <code>alpina-be-frontend/legal.html</code>. Diese
                Seite liegt in <code>app/(legal)/legal-next/page.tsx</code> und ist nur
                hier, nicht im Canvas-Editor, editierbar.)
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
