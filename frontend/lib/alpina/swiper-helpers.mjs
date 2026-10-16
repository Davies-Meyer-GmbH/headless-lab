export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function motionSpeed(reducedMotion = prefersReducedMotion()) {
  return reducedMotion ? 0 : 400;
}

const A11Y_DATA_ATTRS = {
  prevSlideMessage: 'a11yPrevSlideMessage',
  nextSlideMessage: 'a11yNextSlideMessage',
  firstSlideMessage: 'a11yFirstSlideMessage',
  lastSlideMessage: 'a11yLastSlideMessage',
  paginationBulletMessage: 'a11yPaginationBulletMessage',
  slideLabelMessage: 'a11ySlideLabelMessage',
  containerRoleDescriptionMessage: 'a11yContainerRoleDescriptionMessage',
  containerRole: 'a11yContainerRole',
};

export function getSwiperA11yConfig(el) {
  const { dataset } = el;
  const config = { enabled: true };

  for (const [param, dataKey] of Object.entries(A11Y_DATA_ATTRS)) {
    const value = dataset[dataKey];
    if (value) config[param] = value;
  }

  if (!config.containerRole) {
    config.containerRole = 'region';
  }

  return config;
}

export function updateVisibleSlideFocusability(swiper) {
  swiper.slides.forEach((slide) => {
    const isVisible = slide.classList.contains('swiper-slide-visible');
    slide.setAttribute('aria-hidden', isVisible ? 'false' : 'true');

    slide.querySelectorAll('a, button, input, select, textarea').forEach((focusable) => {
      if (isVisible) {
        focusable.removeAttribute('tabindex');
      } else {
        focusable.setAttribute('tabindex', '-1');
      }
    });
  });
}

export function bindVisibleSlideFocusability(swiper) {
  const update = () => updateVisibleSlideFocusability(swiper);

  swiper.on('init', update);
  swiper.on('slideChange', update);
  swiper.on('resize', update);
  swiper.on('breakpoint', update);
  swiper.on('slidesLengthChange', update);
}
