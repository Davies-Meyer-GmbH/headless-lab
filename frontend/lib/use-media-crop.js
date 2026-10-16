'use client';
import { useEffect } from 'react';

/** React lifecycle adaptation of the reference src/js/modules/media-crop.mjs. */
export function useMediaCrop(rootRef, mobileSrc, desktopSrc, enabled) {
  useEffect(() => {
    const root = rootRef.current;
    const video = root?.querySelector('video');
    if (!enabled || !video) return;
    const desktopQuery = window.matchMedia('(min-width: 768px)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inView = false;
    const setPlayback = () => {
      if (motionQuery.matches || !inView) {
        video.pause();
        return;
      }
      video.preload = 'auto';
      video.play().catch(() => {});
    };
    const sync = () => {
      if (motionQuery.matches) {
        video.pause();
        return;
      }
      const src = desktopQuery.matches ? (desktopSrc || mobileSrc) : (mobileSrc || desktopSrc);
      if (src && video.dataset.activeSrc !== src) {
        video.dataset.activeSrc = src;
        video.src = src;
        video.load();
      }
      setPlayback();
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        inView = entry.intersectionRatio >= 0.25;
        setPlayback();
      }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    observer.observe(root);
    desktopQuery.addEventListener('change', sync);
    motionQuery.addEventListener('change', sync);
    sync();
    return () => {
      observer.disconnect();
      desktopQuery.removeEventListener('change', sync);
      motionQuery.removeEventListener('change', sync);
      video.pause();
    };
  }, [rootRef, mobileSrc, desktopSrc, enabled]);
}
