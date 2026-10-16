'use client';

const toList = (value) => {
  if (Array.isArray(value)) return value.filter((item) => item !== null && item !== undefined && String(item).length > 0);
  if (typeof value === 'string' && value.length > 0) return [value];
  if (value !== null && value !== undefined) return [value];
  return [];
};

const firstText = (value) => {
  const list = toList(value);
  const first = list[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && typeof first.value === 'string') return first.value;
  return '';
};

const AlpinaProductCard = ({ product }) => {
  if (!product?.label) return null;
  const image = product.fieldProductImage || product.fieldTeaserImage;
  const imageSrc = image?.srcWithAlternateWidths || image?.src;
  const link = typeof product.fieldProductLink === 'string' ? product.fieldProductLink : product.fieldProductLink?.url;
  const collection = firstText(product.fieldCollection);
  const usps = toList(product.fieldUsps).map((usp) => (typeof usp === 'string' ? usp : usp?.value)).filter(Boolean);
  return (
    <div className="swiper-slide">
      <a className="product-card" href={link || '#'}>
        <div className="product-card__name">
          {collection ? <p className="tag-regular">{collection}</p> : <p className="tag-regular product-card__sub-brand--hidden" aria-hidden="true">{product.label}</p>}
          <h3 className="h5">{product.label}</h3>
        </div>
        {imageSrc ? (
        <div className="product-card__img-container">
          <picture>
            <img src={imageSrc} width={image.width || 680} height={image.height || 477} alt={image.alt || ''} loading="lazy" decoding="async" />
          </picture>
        </div>
        ) : null}
        {usps.length > 0 ? (
        <ul className="product-card__usp-list body-md">
          {usps.map((usp) => (
          <li key={usp} className="product-card__usp"><span className="product-card__usp-bullet" aria-hidden="true">∙</span><span>{usp}</span></li>
          ))}
        </ul>
        ) : null}
      </a>
    </div>
  );
};

export default AlpinaProductCard;
