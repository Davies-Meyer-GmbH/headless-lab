import 'server-only';

export interface AlpinaProductImage {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface AlpinaProduct {
  id: string;
  label: string;
  fieldCollection: string;
  fieldUsps: string[];
  fieldProductImage: AlpinaProductImage | null;
  fieldInspirationImage: AlpinaProductImage | null;
  fieldProductLink: string;
}

interface JsonApiRelationship {
  data?: {
    id?: string;
    meta?: { alt?: unknown; width?: unknown; height?: unknown };
  } | null;
}

interface JsonApiProduct {
  id: string;
  attributes: {
    title?: unknown;
    field_collection?: unknown;
    field_usps?: unknown;
    field_product_link?: { uri?: unknown } | null;
  };
  relationships?: Record<string, JsonApiRelationship>;
}

interface JsonApiFile {
  id: string;
  attributes: { uri?: { url?: unknown } | null };
}

const toHref = (uri: unknown): string => {
  if (typeof uri !== 'string' || uri.length === 0) return '#';
  if (uri.startsWith('internal:')) return uri.slice('internal:'.length) || '#';
  return uri;
};

/** Read published Products in the order saved on the admin drag-and-drop page. */
export async function getOrderedProducts(order: 'slider' | 'inspiration' = 'slider'): Promise<AlpinaProduct[]> {
  const base = process.env.CANVAS_SITE_URL?.replace(/\/$/, '');
  if (!base) throw new Error('CANVAS_SITE_URL is missing.');
  const params = new URLSearchParams({
    'fields[node--product]': 'title,field_collection,field_usps,field_product_link,field_product_image,field_inspiration_image',
    'fields[file--file]': 'uri',
    include: 'field_product_image,field_inspiration_image',
    // The admin Product slider order page saves this weight per product.
    sort: `field_${order}_weight,title`,
    'page[limit]': '50',
  });
  const files = new Map<string, string>();
  const products: AlpinaProduct[] = [];
  let url: string | null = `${base}/jsonapi/node/product?${params}`;
  while (url) {
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.api+json' },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Drupal product list returned ${response.status}.`);
    const payload: {
      data: JsonApiProduct[];
      included?: JsonApiFile[];
      links?: { next?: { href?: string } };
    } = await response.json();
    for (const file of payload.included ?? []) {
      const fileUrl = String(file.attributes.uri?.url ?? '');
      files.set(file.id, fileUrl.startsWith('/') ? `${base}${fileUrl}` : fileUrl);
    }
    for (const item of payload.data) {
      const attributes = item.attributes;
      const imageReference = item.relationships?.field_product_image?.data;
      const src = imageReference?.id ? files.get(imageReference.id) : undefined;
      const meta = imageReference?.meta;
      const inspirationReference = item.relationships?.field_inspiration_image?.data;
      const inspirationSrc = inspirationReference?.id ? files.get(inspirationReference.id) : undefined;
      const inspirationMeta = inspirationReference?.meta;
      products.push({
        id: item.id,
        label: String(attributes.title ?? ''),
        fieldCollection: String(attributes.field_collection ?? ''),
        fieldUsps: Array.isArray(attributes.field_usps)
          ? attributes.field_usps.filter((usp): usp is string => typeof usp === 'string')
          : [],
        fieldProductImage: src
          ? {
              src,
              alt: String(meta?.alt ?? ''),
              width: typeof meta?.width === 'number' ? meta.width : null,
              height: typeof meta?.height === 'number' ? meta.height : null,
            }
          : null,
        fieldInspirationImage: inspirationSrc
          ? { src: inspirationSrc, alt: String(inspirationMeta?.alt ?? ''), width: typeof inspirationMeta?.width === 'number' ? inspirationMeta.width : null, height: typeof inspirationMeta?.height === 'number' ? inspirationMeta.height : null }
          : null,
        fieldProductLink: toHref(attributes.field_product_link?.uri),
      });
    }
    url = payload.links?.next?.href ?? null;
  }
  return products;
}
