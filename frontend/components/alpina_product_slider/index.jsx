'use client';
import { useEffect, useId, useRef } from 'react';
import Swiper from 'swiper';
import { A11y, Keyboard, Navigation, Pagination } from 'swiper/modules';
import { bindVisibleSlideFocusability, getSwiperA11yConfig, motionSpeed, prefersReducedMotion } from '../../lib/alpina/swiper-helpers.mjs';
import { useAlpinaProducts } from '../../lib/alpina-products';
import AlpinaProductCard from '../alpina_product_card';

const AlpinaProductSlider = ({ heading, text, numberOfProducts }) => {
  const products = useAlpinaProducts();
  const count = typeof numberOfProducts === 'number' && Number.isFinite(numberOfProducts) && numberOfProducts > 0 ? numberOfProducts : products.length;
  const slides = products.slice(0, count);
  const rootRef = useRef(null);
  const headingId = useId();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const el = root.querySelector('.js-product-slider');
    if (!el) return undefined;
    const swiper = new Swiper(el, {
      modules: [A11y, Keyboard, Navigation, Pagination],
      slidesPerView: 1,
      spaceBetween: 20,
      speed: motionSpeed(prefersReducedMotion()),
      watchSlidesProgress: true,
      a11y: getSwiperA11yConfig(el),
      centerInsufficientSlides: true,
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      navigation: {
        nextEl: root.querySelector('.swiper-button-next'),
        prevEl: root.querySelector('.swiper-button-prev'),
      },
      pagination: {
        el: root.querySelector('.swiper-pagination'),
        clickable: true,
        bulletElement: 'button',
      },
      breakpoints: {
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 4 },
      },
    });
    bindVisibleSlideFocusability(swiper);
    return () => swiper.destroy(true, true);
  }, []);

  if (slides.length === 0) return null;

  return (
    <section ref={rootRef} className="product-slider" aria-labelledby={headingId}>
      <div className="container">
        <div className="product-slider__header">
          <h2 id={headingId} className="h2">{heading}</h2>
          {text ? <p className="body-extra-lg">{text}</p> : null}
        </div>
        <div className="product-slider__slider-row">
          <div className="product-slider__slider-main">
            <button type="button" className="swiper-button-prev" aria-label="Previous slide">
              <img className="slider-nav__icon" src="/alpina/img/_icn/arrow-02-left.svg" alt="" width="13" height="22" decoding="async" aria-hidden="true" />
            </button>
            <div
              className="product-slider__slider swiper js-product-slider"
              aria-labelledby={headingId}
              data-a11y-prev-slide-message="Previous slide"
              data-a11y-next-slide-message="Next slide"
              data-a11y-first-slide-message="This is the first slide"
              data-a11y-last-slide-message="This is the last slide"
              data-a11y-pagination-bullet-message="Go to slide {{index}}"
              data-a11y-slide-label-message="Slide {{index}} of {{slidesLength}}"
              data-a11y-container-role-description-message="carousel"
              data-a11y-container-role="region"
            >
              <div className="swiper-wrapper">
                {slides.map((product) => (
                  <AlpinaProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
            <button type="button" className="swiper-button-next" aria-label="Next slide">
              <img className="slider-nav__icon" src="/alpina/img/_icn/arrow-02-right.svg" alt="" width="13" height="22" decoding="async" aria-hidden="true" />
            </button>
          </div>
          <div className="swiper-pagination" />
        </div>
      </div>
    </section>
  );
};

export default AlpinaProductSlider;
