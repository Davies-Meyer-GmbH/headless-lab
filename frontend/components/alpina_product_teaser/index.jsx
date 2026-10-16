'use client';
import { useRef } from 'react';
import { useMediaCrop } from '../../lib/use-media-crop';

const AlpinaProductTeaser = ({ product, desktopBackground, mobileBackground, linkLabel, mediaType = 'image', desktopVideo, mobileVideo }) => {
  const mediaRoot = useRef(null);
  const showVideo = mediaType === 'video' && Boolean(desktopVideo?.src || mobileVideo?.src);
  useMediaCrop(mediaRoot, mobileVideo?.src, desktopVideo?.src, showVideo);
  if (!product?.label) return null;
  const image = product.fieldTeaserImage;
  return (
    <article ref={mediaRoot} className={`full-width-teaser__item${showVideo ? ' js-media-crop' : ''}`} data-video-src-mobile={showVideo ? mobileVideo?.src : undefined} data-video-src-desktop={showVideo ? desktopVideo?.src : undefined}>
      {showVideo ? <video className="full-width-teaser__bg" muted loop playsInline preload="metadata" width="375" height="700" aria-hidden="true" /> : (
      <picture className="full-width-teaser__bg">
        {desktopBackground?.src ? <source media="(min-width: 1024px)" srcSet={desktopBackground.src} width={desktopBackground.width || 1920} height={desktopBackground.height || 802} /> : null}
        {mobileBackground?.src ? <img src={mobileBackground.src} width={mobileBackground.width || 375} height={mobileBackground.height || 700} alt={mobileBackground.alt || ''} loading="lazy" decoding="async" /> : null}
      </picture>
      )}
      <div className="full-width-teaser__wrapper">
        <div className="full-width-teaser__content">
          <h3 className="h3">{product.label}</h3>
          {product.fieldSummary ? <p className="body-lg">{product.fieldSummary}</p> : null}
          <a className="button button--text" href={product.fieldProductLink || '#'}>
            <span className="button__label button-text">{linkLabel}</span>
            <svg className="button__icon" width="22" height="11" aria-hidden="true" focusable="false"><use href="/alpina/img/_icn/arrow-01.svg#arrow-01" /></svg>
          </a>
        </div>
        <div className="full-width-teaser__product-img">
          {image?.srcWithAlternateWidths ? <picture><img src={image.srcWithAlternateWidths} width={image.width || 580} height={image.height || 404} alt={image.alt || ''} loading="lazy" decoding="async" /></picture> : null}
        </div>
      </div>
    </article>
  );
};
export default AlpinaProductTeaser;
