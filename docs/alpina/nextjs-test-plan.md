# Next.js test plan

Purpose: find out how Next.js behaves inside the Drupal 11 + Canvas setup, and whether the limits are acceptable for future projects. Part A covers Next.js itself. Part B covers the Drupal/Canvas side that affects frontend work.

Already tested by Dejan: creating Canvas components in Next.js and updating them through `component.yml`.

For each test, record the result in the session notes and set the status here: `todo`, `pass`, `fail`, or `limited` (works with a workaround).

Background: Next.js has one root layout (`frontend/app/layout.tsx`) and one catch-all route (`frontend/app/[[...slug]]/page.tsx`). The visible layout (header, footer) is the Canvas page variant `alpina`, which Drupal merges with the page content before Next.js receives it.

## Part A: Next.js in this setup

### A1. A normal Next.js route next to the catch-all

Status: pass

Result (16 Oct): `app/(app)/test-route/page.tsx` returns 200 and wins over the catch-all, confirmed by creating Canvas page 18 with the same `/test-route` alias — its content is not rendered. No Alpina header/footer on the Next.js page (correct: chrome comes from the Drupal page variant). The Drupal side keeps serving the Canvas page through the content API, so the conflict is **silent**: the Canvas page is simply unreachable from the frontend, and the editor preview (which iframes the public URL) would show the Next.js page instead. A project mixing the two must keep paths disjoint; test script kept at `scripts/test-a1-route-conflict.php`.

Steps:
1. Create `app/test-route/page.tsx` that renders static text.
2. Open http://localhost:3000/test-route.
3. Create a Canvas page in Drupal with the path `/test-route`.

Check: which one wins (Next.js gives specific routes priority over the catch-all). Does the Next.js page get the Alpina header and footer? It shouldn't, because they come from Drupal. Decide how a project would mix Next.js-only pages (search, account, checkout) with Canvas pages.

### A2. A Next.js layout around Canvas content

Status: limited

Result (16 Oct): moved the catch-all to `app/(canvas)/[[...slug]]/page.tsx` with `app/(canvas)/layout.tsx`, and added `app/(app)/` with `test-route` and its own layout. Both groups render correctly; `/alpina` still returns the full Alpina tree and the `frame-ancestors` CSP header is unchanged. Note: moving the catch-all one level deeper breaks its relative `../..` imports — they need an extra segment. **Editor preview not yet verified** (needs Drupal admin login): the A2 banner should appear in the editor iframe since it is part of the public page, but this needs eyes. Route groups work, so chrome *could* live in Next.js layouts — but the header/footer props still live in Drupal (see A3).

Steps:
1. Move the catch-all into a route group, for example `app/(canvas)/[[...slug]]/page.tsx`, and add `app/(canvas)/layout.tsx` with a visible wrapper.
2. Add a second group, `app/(app)/layout.tsx`, for Next.js-only pages.

Check: does the Canvas editor preview still work? Does the layout show in the editor preview or only on the public site? This decides whether chrome should live in Next.js layouts or in Canvas page variants.

### A3. Header and footer reused on Next.js-only pages

Status: limited

Result (16 Oct): works via a workaround. Added `lib/alpina-chrome.ts`, which fetches `/canvas/content-api?requestUri=/` (source path configurable via `ALPINA_CHROME_SOURCE_PATH`), walks the tree and extracts `js-alpina-header` / `js-alpina-footer` props. `app/(app)/shell-demo/page.tsx` renders the real `AlpinaHeader`/`AlpinaFooter` with those props plus menus from `getMenu()`: verified 200 with the Drupal-hosted logo, labels, 4 footer links and social icons. The components run fine outside `CanvasComponentTree` because the root layout's `CanvasRuntime` provides their contexts on every route. Cost: one extra content-API call per request (no-store), and the props are a snapshot of one source page's variant — if the variant is edited, the source path must still render header/footer. This is the price of mixing route types; a first-class "site chrome" API from Drupal would remove it.

Steps: on the A1 page, render `alpina_header` and `alpina_footer` directly as React components, with menus from `lib/main-menu.ts`.

Check: header props such as the logo are stored in the Drupal page variant, not in Next.js. Find out whether a Next.js page can read them (for example by fetching the variant through the content API) or must hard-code them. This is the main cost of mixing the two route types.

### A4. Server and client components

Status: todo

Steps:
1. Note which components use `'use client'`. Most do; `alpina_store_logo` doesn't.
2. Write a component without `'use client'` that is `async` and fetches data itself.
3. Place it in Canvas and view it in the editor and on the public site.

Check: does an async server component render through `CanvasComponentTree`? Does it work in the editor preview, which runs in the browser? If not, data must keep coming through `page.tsx` and context providers, as menus and products do now.

### A5. Data fetching per component

Status: todo

Steps: add a component that needs its own data (for example "latest 3 products"), using the existing approach in `lib/product-list.ts` and an `AlpinaXProvider`.

Check: how much code each data-backed component needs, and whether `page.tsx` fetches data for components that aren't on the page (it currently fetches products on every route). Try fetching only when the tree contains the component.

### A6. Caching and revalidation

Status: todo

Steps:
1. Run a production build: `npm run build && npm start`.
2. Measure response time for `/` with and without Drupal slowed down (for example, stop MySQL briefly).
3. Remove `force-dynamic` and the `no-store` fetches where possible; try `revalidate` and `revalidateTag`.
4. Add a route handler that Drupal calls on publish to revalidate a path.

Check: can pages be cached at all while draft mode is supported? How fast does a published change appear? What does a visitor see when Drupal is down?

### A7. Draft mode and preview

Status: todo

Steps:
1. Change hero text in the Canvas editor without publishing.
2. Check the editor preview, the public site in a private window, and the public site in a browser logged in to Drupal.
3. Leave the editor idle until the draft token expires, then reload the preview.
4. Use the "disable draft" link (`/api/disable-draft`).

Check: drafts never leak to anonymous visitors; preview recovers after expiry; the draft indicator shows correctly.

### A8. Loading, error, and not-found states

Status: todo

Steps:
1. Open a missing path, for example `/does-not-exist`.
2. Make Drupal return an error (stop Apache or MySQL) and load `/`.
3. Add `app/[[...slug]]/loading.tsx` and `error.tsx`, then repeat.
4. Throw an error inside one Canvas component.

Check: does one broken component break the whole page? Does `not-found.tsx` get the Alpina header and footer (it can't from Drupal)?

### A9. Metadata and SEO

Status: todo

Steps:
1. View source of `/` and check `<title>`, description, Open Graph, canonical, and `lang`.
2. Install and configure the Metatag module in Drupal and check whether `head` in the content API includes the tags.
3. Add `app/sitemap.ts` and `app/robots.ts`.

Check: the content API currently returns only `title`. Find out how much SEO data can come from Drupal and how much Next.js must build itself.

### A10. Redirects

Status: todo

Steps: create a redirect in Drupal (Redirect module) from `/old` to `/alpina`, then open http://localhost:3000/old.

Check: `page.tsx` handles 301/302 from `fetchPage`. Confirm the status code in the network panel.

### A11. Images

Status: todo

Steps:
1. Check how the hero and teaser render images: plain `<img>` with Drupal's `alternateWidths`, or `next/image`.
2. Replace one with `next/image` and configure `images.remotePatterns` for the Drupal host.
3. Compare the image requests and sizes at 375 px and 1440 px.

Check: which approach gives correct responsive sizes. Note that images come from `https://headless-lab.local` while `CANVAS_SITE_URL` uses `http`.

### A12. Interactivity and hydration

Status: todo

Steps: with the console open, use the mobile menu, product slider (Swiper), and video hero. Reload several times.

Check: hydration warnings, layout shift, and whether client JavaScript size is reasonable (`npm run build` prints route sizes).

### A13. Styling options

Status: todo

Steps: build one small component with Tailwind (already installed) and one with a CSS module, next to the global SCSS.

Check: which styles appear in the Canvas editor preview, and whether styles leak between components.

### A14. Workbench

Status: todo

Steps: run `npm run workbench` and open a component.

Check: can a component be developed with sample props without Drupal running? This affects how quickly frontend developers can work.

### A15. Production build and hosting

Status: todo

Steps:
1. `npm run build` and `npm start` with only `.env` values.
2. List what the Next.js server needs: Drupal URL, OAuth or preview keys, allowed frame origins for the editor.
3. Decide on hosting (Node server, Vercel, container).

Check: the editor embeds the Next.js preview in an iframe, so both sites need matching HTTPS and CSP settings in production.

## Part B: Drupal and Canvas items that affect frontend work

| ID | Test | What to check |
|----|------|---------------|
| B1 | Content template for Product | `/node/5` currently shows Drupal theme HTML in the content slot. Build a template and check what editors can change per product. |
| B2 | Second page variant | A landing page without navigation, selected per page. |
| B3 | Changing a component already in use | Rename, remove, and retype a prop, and remove a slot. Does page 16 still render? |
| B4 | Config deployment to a clean database | Do components, the variant, and the homepage come back with config import plus import scripts? |
| B5 | Forms | Contact form through Webform or Next.js server actions. |
| B6 | Editor experience | A content editor builds a page alone; note where they get stuck. |
| B7 | Multilingual (if needed) | Retest after Canvas updates; it failed on 14 October. |
| B8 | Package version churn | Read changelogs for `@drupal-canvas/*` (all pre-1.0) and Canvas module releases. |

## Suggested order

A1, A2, A3 first: they answer the layout question. Then A4, A5 (data), A6, A7 (caching and preview), B1, B3. The rest can follow in any order.
