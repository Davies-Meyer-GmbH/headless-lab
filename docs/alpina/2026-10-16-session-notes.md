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
