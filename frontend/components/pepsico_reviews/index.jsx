'use client';

import { use, useEffect, useState } from 'react';
import { getReviews } from '@/lib/reviews';

let clientReviews;

function loadReviews() {
  if (typeof window === 'undefined') {
    return getReviews();
  }
  clientReviews ??= fetch('/api/reviews').then(async (response) => {
    if (!response.ok) {
      return [];
    }
    return response.json();
  });
  return clientReviews;
}

function usePerPage() {
  const [perPage, setPerPage] = useState(2);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const update = () => setPerPage(query.matches ? 2 : 1);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return perPage;
}

function ReviewCard({ review }) {
  return (
    <article className="flex h-full flex-col rounded-3xl bg-white p-8">
      {review.title ? (
        <h3 className="text-[1.35rem] leading-tight font-bold tracking-wide text-[#02355A] uppercase">
          {review.title}
        </h3>
      ) : null}
      {review.location ? (
        <p className="mt-3 text-xs font-semibold tracking-wide text-[#3680CE] uppercase">
          {review.location}
        </p>
      ) : null}
      {review.bodyHtml ? (
        <div
          className="mt-5 text-sm leading-6 text-gray-600 [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: review.bodyHtml }}
        />
      ) : null}
    </article>
  );
}

function ArrowButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-full border border-white/70 text-white disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ReviewsSlider({ items }) {
  const perPage = usePerPage();
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, pageCount - 1);
  const visible = items.slice(safePage * perPage, safePage * perPage + perPage);

  return (
    <>
      <div
        className={
          perPage === 1
            ? 'grid grid-cols-1 gap-6'
            : 'grid grid-cols-2 gap-6'
        }
      >
        {visible.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
      {pageCount > 1 ? (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-2">
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Reviews page ${index + 1}`}
                aria-current={index === safePage ? 'true' : undefined}
                onClick={() => setPage(index)}
                className={
                  index === safePage
                    ? 'size-2.5 rounded-full bg-white'
                    : 'size-2.5 rounded-full border border-white bg-transparent'
                }
              />
            ))}
          </div>
          <div className="flex gap-2">
            <ArrowButton
              label="Previous reviews"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              <span aria-hidden="true">‹</span>
            </ArrowButton>
            <ArrowButton
              label="Next reviews"
              disabled={safePage === pageCount - 1}
              onClick={() => setPage(safePage + 1)}
            >
              <span aria-hidden="true">›</span>
            </ArrowButton>
          </div>
        </div>
      ) : null}
    </>
  );
}

const PepsicoReviews = ({ heading = 'DAS SAGEN UNSERE KUNDEN' }) => {
  const items = use(loadReviews());
  if (!items?.length) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-7xl rounded-3xl bg-[#02355A] px-6 py-12 sm:px-10">
      {heading ? (
        <h2 className="mb-10 text-center text-[2rem] leading-none font-bold tracking-wide text-white uppercase">
          {heading}
        </h2>
      ) : null}
      <ReviewsSlider items={items} />
    </section>
  );
};

export default PepsicoReviews;
