import { cache } from 'react';

/**
 * One published Review node for the slider.
 * @typedef {{ id: string, title: string, location: string, bodyHtml: string }} ReviewItem
 */

/**
 * @param {unknown} payload
 * @returns {ReviewItem[]}
 */
export function mapReviews(payload) {
  const data = payload && typeof payload === 'object' ? payload.data : null;
  if (!Array.isArray(data)) {
    return [];
  }

  return data.flatMap((node) => {
    if (!node?.id || !node.attributes) {
      return [];
    }
    const { title, field_location: location, field_body: body } = node.attributes;
    return [
      {
        id: node.id,
        title: typeof title === 'string' ? title : '',
        location: typeof location === 'string' ? location : '',
        bodyHtml: typeof body?.processed === 'string' ? body.processed : '',
      },
    ];
  });
}

/**
 * Loads published Review nodes, oldest first.
 *
 * @returns {Promise<ReviewItem[]>}
 */
export const getReviews = cache(async () => {
  const base = process.env.CANVAS_SITE_URL?.replace(/\/$/, '');
  if (!base) {
    return [];
  }

  const url = new URL(`${base}/jsonapi/node/review`);
  url.searchParams.set('filter[status][value]', '1');
  url.searchParams.set('sort', 'created');
  url.searchParams.set(
    'fields[node--review]',
    'title,field_location,field_body',
  );

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.api+json' },
      cache: 'no-store',
    });
    if (!response.ok) {
      return [];
    }
    return mapReviews(await response.json());
  } catch {
    return [];
  }
});
