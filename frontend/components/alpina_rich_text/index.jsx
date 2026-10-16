/**
 * Simple formatted-text component for pages like Impressum/Datenschutz:
 * the whole legal text is one prop, edited in the Canvas editor.
 * Sync server component — no 'use client', no data fetching.
 */
const AlpinaRichText = ({ text = '' }) => {
  return (
    <section className="legal-body" data-b2="rich-text">
      <div className="container">
        <div className="legal-body__copy" dangerouslySetInnerHTML={{ __html: text }} />
      </div>
    </section>
  );
};

export default AlpinaRichText;
