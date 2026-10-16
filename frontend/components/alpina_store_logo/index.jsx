import { useId } from 'react';

const AlpinaStoreLogo = ({ heading, text, firstLogo, secondLogo, buttonLabel, buttonLink }) => {
  const headingId = useId();
  const logo = (image, className, width, height) => image?.src ? (
    <img className={className} src={image.src} width={image.width || width} height={image.height || height} alt={image.alt || ''} loading="lazy" decoding="async" />
  ) : null;
  return (
    <section className="store-logo" aria-labelledby={headingId}>
      <div className="container container--small">
        <div className="store-logo__header">
          <h2 id={headingId} className="h2">{heading}</h2>
          {text ? <p className="body-extra-lg">{text}</p> : null}
        </div>
        {firstLogo?.src || secondLogo?.src ? (
          <div className="store-logo__logos">
            {logo(firstLogo, 'store-logo__hubo', 368, 144)}
            {logo(secondLogo, 'store-logo__colos', 350, 141)}
          </div>
        ) : null}
        {buttonLabel ? (
          <a className="button button--secondary" href={buttonLink || '#'}>
            <span className="button__label button-label">{buttonLabel}</span>
            <svg className="button__icon" width="22" height="11" aria-hidden="true" focusable="false"><use href="/alpina/img/_icn/arrow-01.svg#arrow-01" /></svg>
          </a>
        ) : null}
      </div>
    </section>
  );
};

export default AlpinaStoreLogo;
