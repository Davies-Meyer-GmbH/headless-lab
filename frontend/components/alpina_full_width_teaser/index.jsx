'use client';
import { useId } from 'react';

const AlpinaFullWidthTeaser = ({ heading, products }) => {
  const headingId = useId();
  return (
    <section className="full-width-teaser" aria-labelledby={headingId}>
      <div className="container"><h2 id={headingId} className="h2">{heading}</h2></div>
      {products}
    </section>
  );
};
export default AlpinaFullWidthTeaser;
