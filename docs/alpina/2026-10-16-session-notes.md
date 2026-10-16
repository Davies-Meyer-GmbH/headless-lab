# Session notes — 2026-10-16

## Report template explained

Dejan asked whether `discovery/report-template.html` is a fixed template or a one-off page. Explained: it is a reusable, hand-written template that holds all the look (CSS variables, fonts, layout) and the rendering JavaScript. `discovery/report.py` only assembles data from `static.json`, `drupal.json`, and `mapping.json`, and injects the JSON payload at the `/*__DATA__*/null` placeholder. So format, colors, and fonts are identical on every run; only the data (project name, page types, components, inventory) differs per project. Noted the caveat that the template is project-local — reusing it in another project means copying `report-template.html` and `report.py`, unless we move them to a shared location later. Dejan was satisfied; no code changes.

## How Next.js layouts connect to Drupal pages, and what to test next

Dejan is evaluating this setup (Drupal 11 + Canvas + Next.js) as a fit for future projects. Already tested: creating Next.js components and updating them through `component.yml`. Asked how layouts connect to Drupal pages and what else to test. Read-only investigation; no code changes.

Findings:

- Next.js has one root layout (`frontend/app/layout.tsx`, only `<html>`, CSS, `CanvasRuntime`) and one catch-all route (`app/[[...slug]]/page.tsx`). Next.js nested layouts are not used for site chrome.
- The visible layout is a Canvas page variant (`config/sync/canvas.page_variant.alpina.yml`): `alpina_shell` with header, content and footer slots; the content slot holds the `marker.page_content` marker. Drupal merges the variant and the page into one component tree; `/canvas/content-api?requestUri=...` returns it already merged.
- Variant selection (`web/modules/contrib/canvas/src/PageVariantResolver.php`): the Canvas page's own `page_variant` field, then the full-view-mode content template's variant, then `canvas.settings.default_page_variant` (currently `alpina`). There are no path or role conditions.
- `/node/5` (a Product) returns 200 on the frontend but has no content template, so the content slot is `drupal-markup`: Drupal theme HTML including "Submitted by admin", inside the Alpina shell. Content templates are the next thing to test.
- `head` from the content API only contains `title` (no description or Open Graph data yet).
- `context.site.branding.homeUrl` is `/page/16`, while the frontend uses `/` and `/alpina`.
- Every Drupal request uses `cache: "no-store"` and the page is `force-dynamic`, so there is no ISR or tag revalidation; each page view makes about 5 server-side Drupal calls.

## Next.js test plan

Dejan asked for a plan covering the suggested tests, and clarified that the focus should be on trying how Next.js itself works in this setup. Created `docs/alpina/nextjs-test-plan.md`: Part A has 15 Next.js tests (routes next to the catch-all, route-group layouts, server vs client components, per-component data, caching/revalidation, draft mode, error states, SEO, redirects, images, hydration, styling, workbench, production hosting). Part B keeps the Drupal/Canvas items as a short table. Each test has a status field. Observed while planning: only `alpina_store_logo` lacks `'use client'`; menus and products are fetched in `page.tsx` on every route, even where unused. No tests run yet.

## Committed all work so far

Dejan asked to commit everything before starting the test plan. Split into three commits instead of one, because the changes covered distinct areas (369 files total):

- `ee04fc1` feat(alpina): Drupal side — Canvas config, alpina_cms module, Product type, import scripts, discovery tooling (203 files)
- `6712b1a` feat(frontend): Alpina frontend components, styles, fonts, assets, context providers (164 files)
- `ccb3cae` docs: session notes, topic docs, nextjs-test-plan, README rewrite, AGENTS/CLAUDE

Also added `/discovery/out/` (15M generated screenshots/reports) and `/.compare/` (comparison screenshots) to `.gitignore` rather than committing generated output. Checked scripts for credentials before committing — none found. Nothing pushed yet.

## Test plan started: A1–A3 done

Started with A1–A3 (the layout/routing tests). All three recorded in `nextjs-test-plan.md` with results.

- **A1 (pass):** a specific Next.js route beats the catch-all. Created `test-route` and a conflicting Canvas page (ID 18, script `scripts/test-a1-route-conflict.php`). The Next.js page wins; the Canvas page is silently shadowed — still served by the content API, unreachable on the public site, and the editor preview would show the Next.js page. Paths of Canvas pages and Next.js pages must be kept disjoint.
- **A2 (limited):** moved the catch-all into `app/(canvas)/` with its own layout; added `app/(app)/` for Next.js-only pages. Both groups work; CSP `frame-ancestors` unchanged. Moving the catch-all broke its relative imports (needed an extra `../`). Editor preview not verified yet — needs Drupal admin login in a browser, so Dejan should glance at the A2 banner in the editor iframe.
- **A3 (limited):** header/footer do work on Next.js-only pages, via a workaround: `lib/alpina-chrome.ts` fetches the content API for a source page and extracts `js-alpina-header`/`js-alpina-footer` props. Verified on `/shell-demo` with the real Drupal logo and footer socials. Extra API call per request; props depend on the source path keeping the variant. Root `CanvasRuntime` provides the component contexts on every route, which is why this works at all.

Conclusion so far: Next.js layouts are viable for separating Canvas and non-Canvas areas, but site chrome stays Drupal-owned, so Next.js-only pages pay an extra fetch (or hard-code props).

Test artifacts committed: `test-route` and `shell-demo` pages, route group layouts, `alpina-chrome.ts`. Canvas page 18 (`A1 route conflict`) left in Drupal for reference.

## Test plan: A4 done (async server component)

Pushed the earlier commits to origin/main first, then ran A4.

- Created `components/alpina_async_products/` (async, no `'use client'`) and synced its metadata to Drupal with a new script, `test-a4-sync-async-component.php`, using the project's usual `ExternalComponentSync` path (Canvas CLI has no auth configured — no token/oauth.json — so `npx canvas push` is not usable here).
- **Mistake made and fixed:** the sync script rewrote `canvas_headless.settings` frontends[0].components with only the new component, clobbering the 9 existing entries. Restored with `test-a4-restore-component-list.php` and exported config (`5cdb92c`, which also picked up unrelated DB state: AI module config, hero active version, language.types).
- Variant A (importing `server-only`-marked `lib/product-list.ts`) fails the build: the Canvas component loader compiles components outside the App Router server layer, so `server-only` is rejected ("using it in the Pages Router"). This blocks reusing all existing `lib/` loaders inside components.
- Variant B (inline fetch, no `server-only`) works: page 19 (`/a4-async`, page variant alpina) renders the component server-side with 13 products from JSON:API.
- Not verified: editor preview of the async component (needs admin login). Expect failure there — the preview runs in the browser.
- A4 page/status recorded in `nextjs-test-plan.md`.

Conclusion: async server components are viable on the public site if they self-fetch without `server-only` imports. `lib/product-list.ts`'s `server-only` marker is the binding constraint.

## Test plan: A5 done (conditional data fetching)

- `page.tsx` now checks the fetched tree for component element names and fetches menus/products conditionally. Zero extra API calls (string search over the in-memory tree).
- Verified: `/alpina` full render, `/a4-async` menus-only (product JSON:API calls skipped), `/alpina-video-test` unaffected.
- Recorded in `nextjs-test-plan.md` as pass.

## Test plan: A6 done (production build, caching, revalidation)

- Production build into a separate distDir (`NEXT_DIST_DIR=.next-prod`, added to next.config.ts and .gitignore) so the running dev server's `.next` is untouched. Build type-check surfaced three real errors that dev mode hid: stale generated types from before the A2 route move (fixed by deleting `.next/types`), and loose typing in the A3 page and `alpina-chrome.ts`.
- **fetchPage cannot be cached**: hardcoded `no-store` plus per-request cookie/header reads. `unstable_cache(fetchPage)` crashes ("headers() inside unstable_cache"). Solution: anonymous requests fetch the content API directly with `next: { revalidate: 300, tags: ['canvas-page'] }`; draft sessions bypass the cache and use the real fetchPage.
- Timings: `/alpina` 0.37s cold → 0.10s warm; `/a4-async` 0.19s → 0.02s.
- **Invalidation:** revalidateTag does NOT expire fetch-cache entries on Next 16.2.12 (both profiles tried); revalidatePath DOES. `/api/revalidate?secret=…&path=…` endpoint added (401 without secret), Drupal-side event subscriber still todo. Cache key is path-only — language must be added when multilingual returns.
- E2E verified: Drupal heading change stays invisible while cached, appears after revalidatePath; heading restored to original afterwards (the marker script's arg handling with drush was fiddly; restored via drush eval).
- Ops note: `pkill -f "next start"` doesn't kill the listener because it renames itself to `next-server`; kill by PID. Two stale servers caused 30 confusing minutes of "revalidation doesn't work" while an old build answered.
- Production server left running on port 3001 (terminal output in /tmp/next-prod.log).

## B2 built both ways + test badge + A4 editor-preview confirmed

Dejan asked for both legal-page approaches, an on-page test badge everywhere, a test index, and reported an editor-preview error.

- **Error reported by Dejan's editor session confirmed the A4 caveat:** in the editor preview the async component runs in the browser — React rejects async client components and `CANVAS_SITE_URL` was missing, looping `/undefined/jsonapi/...` 404s. Guarded the component to skip fetching without the env var; the React error itself cannot be avoided. Rule recorded: no async server components on editor-previewed pages.
- **B2 Canvas way (pass):** new `alpina_legal_shell` (slim logo bar, content+footer slots, no product nav) and `alpina_rich_text` (editable formatted text) components; synced via `scripts/test-b2-legal-variant.php`, which also creates the `legal` page variant (entity type id is `page_variant`, not `canvas_page_variant`; config entities have no `validate()`) and Canvas page 20 at `/legal`. Verified: legal shell renders, real footer from the variant, no product navigation.
- **B2 Next.js way (pass):** route group `app/(legal)/` with own `layout.tsx` and static `legal-next/page.tsx`. No Drupal involvement.
- Note: the two twins live at `/legal` (Canvas) and `/legal-next` (Next) because one path can only be owned by one side (A1).
- **Test badge:** `components/test-info/index.jsx`, mounted in all three group layouts, including the real pages `/alpina` and `/alpina-video-test` as Dejan requested. Black pill bottom-right, expands to Tested/Conclusion per page.
- **Test index added** at the top of `nextjs-test-plan.md`: URL, test, status, one-line conclusion for every page.
- Stumbled once: `component.yml` for rich text had `slots` nested under `props` — dev server exits fatally on invalid metadata (worth remembering: a bad component.yml takes the whole frontend down).

## A4 follow-up: editor preview warnings fixed with a two-file split

After the plain-language badge texts, Dejan still saw "[browser] A component was suspended by an uncached promise" spam from the editor preview. Root cause: the entry component was still `async` — calling it always creates a promise, even with the env guard. Restructured:

- `alpina_async_products/index.jsx` is now a **sync** component: in the browser it renders a notice ("cannot render in the editing preview") synchronously — no promise, no warnings.
- `async-inner.jsx` holds the async fetcher and is only rendered on the server.
- First attempt re-imported the `server-only` lib in the inner file — build broke again (the loader rejects the marker anywhere in the import graph, not just the entry). Inlined the fetch.
- Verified: `/a4-async` renders the product list as before; badge text updated (preview shows the notice instead of an error).

## Findings page: the .md files rendered live on the site

Dejan asked for a page that displays the findings, ideally the real .md content rather than a copy. Decision: the .md files in `docs/` stay the single source of truth (agent workflow depends on them); `/findings` renders `docs/alpina/nextjs-test-plan.md` live.

- `app/(app)/findings/page.tsx` reads the file from the repo on every request (`force-dynamic`, `process.cwd()/../docs/...`) and renders it with `marked` (new dependency, the only one added).
- Verified live: a line appended to the .md appeared on the page immediately; file reverted after the check.
- Scoped to the repo/lab: in production the file must ship with the deployment (or be fetched from the repo at runtime); the path is fixed rather than configurable — fine for a lab.
- Badge entry added for /findings; test-index table gained a row for it. Not a Drupal page on purpose: Drupal has no markdown renderer, and the findings are repo artifacts, not editorial content.
