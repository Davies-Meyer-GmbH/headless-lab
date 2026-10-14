import { cache } from 'react';

/**
 * One item from Drupal's Main navigation linkset.
 * @typedef {{ href: string, title: string, children: MainMenuItem[] }} MainMenuItem
 */

/**
 * Turns Drupal's flat linkset hierarchy into a tree.
 *
 * @param {unknown} payload
 * @returns {MainMenuItem[]}
 */
export function nestLinkset(payload) {
  const linkset = payload && typeof payload === 'object' ? payload.linkset : null;
  const items = Array.isArray(linkset) ? linkset[0]?.item : null;
  if (!Array.isArray(items)) {
    return [];
  }

  const sorted = [...items].sort((a, b) =>
    compareHierarchy(a.hierarchy ?? [], b.hierarchy ?? []),
  );
  const nodes = new Map();
  const roots = [];

  for (const item of sorted) {
    if (!item?.href || !Array.isArray(item.hierarchy)) {
      continue;
    }
    const node = {
      href: item.href,
      title: typeof item.title === 'string' ? item.title : item.href,
      children: [],
    };
    nodes.set(item.hierarchy.join('.'), node);
    if (item.hierarchy.length <= 1) {
      roots.push(node);
      continue;
    }
    const parent = nodes.get(item.hierarchy.slice(0, -1).join('.'));
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * @param {string[]} left
 * @param {string[]} right
 */
function compareHierarchy(left, right) {
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] === undefined ? -1 : Number(left[index]);
    const rightValue = right[index] === undefined ? -1 : Number(right[index]);
    if (leftValue !== rightValue) {
      return leftValue - rightValue;
    }
  }
  return 0;
}

/**
 * Loads the Main navigation menu from Drupal's linkset endpoint.
 *
 * @returns {Promise<MainMenuItem[]>}
 */
export const getMainMenuItems = cache(async () => {
  const base = process.env.CANVAS_SITE_URL?.replace(/\/$/, '');
  if (!base) {
    return [];
  }

  try {
    const response = await fetch(
      `${base}/system/menu/main/linkset?_format=json`,
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      },
    );
    if (!response.ok) {
      return [];
    }
    return nestLinkset(await response.json());
  } catch {
    return [];
  }
});
