'use client';
import { useRef } from 'react';
import { useMediaCrop } from '../../lib/use-media-crop';

const AlpinaHero = ({ eyebrow, heading, subHeading11, text, desktopImage, mobileImage, mediaType = 'image', desktopVideo, mobileVideo }) => {
  const mediaRoot = useRef(null);
  const showVideo = mediaType === 'video' && Boolean(desktopVideo?.src || mobileVideo?.src);
  useMediaCrop(mediaRoot, mobileVideo?.src, desktopVideo?.src, showVideo);
  return (
  <section className="hero-header" id="hero" aria-labelledby="alpina-hero-heading">
    <div ref={mediaRoot} className={`hero-header__img${showVideo ? ' js-media-crop' : ''}`} data-video-src-mobile={showVideo ? mobileVideo?.src : undefined} data-video-src-desktop={showVideo ? desktopVideo?.src : undefined}>
      {showVideo ? <video muted loop playsInline preload="auto" width="375" height="600" aria-hidden="true" /> : (
      <picture>
        {desktopImage?.src ? (
          <source media="(min-width: 768px)" srcSet={desktopImage.src} width={desktopImage.width || 1920} height={desktopImage.height || 900} />
        ) : null}
        {mobileImage?.src ? (
          <img src={mobileImage.src} width={mobileImage.width || 375} height={mobileImage.height || 600} alt={mobileImage.alt || ''} loading="eager" fetchPriority="high" decoding="async" />
        ) : null}
      </picture>
      )}
    </div>
    <div className="hero-header__txt container">
      {eyebrow ? <p className="subheadline-lg">{eyebrow}</p> : null}
      <h1 id="alpina-hero-heading" className="h1">{heading}</h1>
      {subHeading11 ? (
        <p className="subheadline-lg">{subHeading11}</p>
      ) : null}
      {text ? <div className="hero-header__copy-wrapper"><p className="body-extra-lg">{text}</p></div> : null}
    </div>
  </section>
  );
};

export default AlpinaHero;
