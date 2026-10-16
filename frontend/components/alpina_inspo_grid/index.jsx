'use client';
import { useId } from 'react';
import { useAlpinaInspiration } from '../../lib/alpina-inspiration';

const AlpinaInspoGrid = ({ heading, text, numberOfProducts = 8 }) => {
  const products = useAlpinaInspiration();
  const headingId = useId();
  const count = Number.isFinite(numberOfProducts) ? Math.max(1, Math.floor(numberOfProducts)) : 8;
  const cards = products.slice(0, count);
  if (!cards.length) return null;
  return (
    <section className="inspo-grid" aria-labelledby={headingId}>
      <div className="container">
        <div className="inspo-grid__header">
          <h2 id={headingId} className="h2">{heading}</h2>
          {text ? <p className="body-extra-lg">{text}</p> : null}
        </div>
        <div className="inspo-grid__cards">
          {cards.map((product) => (
            <a key={product.id} className="inspo-card" href={product.fieldProductLink || '#'} aria-label={product.label}>
              {product.fieldInspirationImage?.src ? <picture><img className="inspo-card__sm-img" src={product.fieldInspirationImage.src} width="360" height="534" alt={product.fieldInspirationImage.alt || ''} loading="lazy" decoding="async" /></picture> : null}
              <div className="inspo-card__content">
                {product.fieldProductImage?.src ? <picture><img className="inspo-card__product-img" src={product.fieldProductImage.src} width="320" height="320" alt={product.fieldProductImage.alt || ''} loading="lazy" decoding="async" /></picture> : null}
                <div className="inspo-card__product-name">
                  {product.fieldCollection ? <p className="tag-regular">{product.fieldCollection}</p> : null}
                  <p className="h5">{product.label}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
export default AlpinaInspoGrid;
