# Alpina session notes: 14 October 2026

This records the work completed, Dejan's observations and corrections, and the remaining migration work. `migration.md` tracks the current implementation state.

## Project setup

Dejan had already imported the database as `headless_lab` and created HTTP/HTTPS Apache vhosts for `headless-lab.local`.

The handoff was available at `/mnt/c/Users/dstankovic/Downloads/headless-lab-handoff`. It contained local Drupal settings and uploaded files. Its `keys` directory contained only `.htaccess`, so a new OAuth key pair was generated locally.

Completed setup work:

- Installed PHP dependencies from `composer.lock` and frontend dependencies from `package-lock.json`.
- Copied the handoff's local settings and uploads, then adjusted the database connection, trusted hostname, public-file URLs, and OAuth key paths for this checkout.
- Granted Apache access to the local settings, keys, and writable files directory.
- Verified Drupal bootstrap, rebuilt caches, and confirmed no database updates were required.
- Configured the frontend's ignored `.env` to reach Drupal at `http://headless-lab.local`.
- Started the Next.js development server on port 3000.

The initial Apache document root pointed to the project root. HTTP returned 403 and HTTPS showed a directory listing. The required document root and Directory path are `/home/dejan/projects/drupal/headless-lab/web`. Updating Apache required Dejan's local sudo access. Later checks verified the Drupal login and page routes at the intended hostname.

No database was reinstalled. Local credentials, key contents, hash salts, and one-time login URLs are intentionally omitted from these notes.

## Source and migration decision

Dejan supplied `/home/dejan/projects/drupal/headless-lab/alpina-be-frontend` as the static site reference and confirmed that the migration should use the existing Drupal Canvas + Next.js setup, starting with the homepage.

The reference directory is its own Git repository. Dejan explicitly required it to remain unchanged and outside the root repository's Git scope.

Implemented this with `/alpina-be-frontend/` in the root repository's `.git/info/exclude`. This is a checkout-local exclusion; the shared `.gitignore` was not changed for it. Reference assets and source files are read or copied from that directory. Builds used a temporary copy when needed; dependencies were not installed in the reference checkout. Its Git state was verified unchanged.

Dejan's Git rule also applies to future work: Git-mutating commands are user-only. No add, commit, push, merge, rebase, reset, cherry-pick, or revert was performed.

## First homepage slice

Implemented the image hero from `index.html`, together with the navigation header and a page shell:

- `alpina_shell`: Header and Content slots.
- `alpina_header`: editable navigation labels and link fields, responsive menu behavior, focus handling, and Escape-to-close behavior.
- `alpina_hero`: editable Eyebrow, Heading, Text, Desktop image, and Mobile image fields. Images are Drupal media entities.

Created the Alpina page variant and the published `Alpina homepage`, page ID 16, with alias `/alpina`. Header fields are edited in the page variant; hero fields are edited on the page.

Initially the imported pages and default homepage were preserved. That was an implementation assumption, not a requirement from Dejan. Dejan later explicitly asked to remove them.

The navigation and language links in the static source are placeholders. Destination pages and language routing are not implemented yet. This slice uses the source's German text and image variant; the video variant has not been migrated.

The importer is `scripts/import-alpina-home.php`. It registers the components, imports hero media, creates the variant/page, and selects Alpina as the homepage. Re-runs preserve existing Alpina editorial input. Relevant configuration is exported to `config/sync/`; content is recreated through the importer rather than configuration import.

## Dejan's SCSS observations and requested correction

Dejan noticed that `frontend/styles/alpina/main.scss` differed substantially from the reference entry file, even though the copied container and hero partials matched. He expected the global styles and migrated component styles to remain faithful to the static frontend.

The first implementation had used a `.alpina-site` selector prefix, `meta.load-css`, handwritten global resets, and local font declarations to avoid affecting the imported demo pages. Dejan had not requested those changes.

Dejan then explicitly requested:

- The same SCSS entry structure as the static frontend for the globals and components already in use.
- Proper browser CSS source maps, so inspecting `.hero-header__img` identifies the original SCSS rather than generated `alpina.css`.

Completed correction:

- `main.scss` now uses the reference's `@use` statements and order for tokens, normalize, fonts, globals, typography, container, hero, navigation, and print.
- All copied SCSS partials match the reference byte-for-byte, including global styles and font-face declarations.
- Removed the selector prefix from the styles. The shell still has its `.alpina-site` class, but styles no longer depend on that prefix.
- The root layout imports `styles/alpina/main.scss` directly. Removed the intermediate generated `alpina.css` and the separate Sass compilation scripts.
- Vendor and unmigrated component imports remain deferred until those components are added.

The reference font-face URLs are preserved. The stylesheet is not using the earlier handwritten local-font declarations.

## Source-map investigation

Direct SCSS compilation initially produced a Turbopack CSS map containing the expected partial filenames. A rule-level check found that `.hero-header__img` incorrectly resolved to `_tokens.scss`, so merely having a map was insufficient.

Switched development and production commands to Webpack. `next.config.ts` adds a CSS-only `SourceMapDevToolPlugin` for the development client build. This emits CSS maps with embedded SCSS sources without overriding Next's JavaScript mapping configuration.

Verified the served map: `.hero-header__img` resolves to `styles/alpina/layout/_hero-header.scss`, line 6. Shared mixin declarations can correctly resolve to `utils/_mixins.scss` instead.

Dejan subsequently saw a delayed background-command notification with exit 130 and a Turbopack panic log. It was from the old server stopped during the switch. The replacement Webpack server had already been started and verified.

Browser DevTools must have CSS source maps enabled to display the SCSS locations.

Dejan subsequently confirmed that CSS source maps now work in his browser. Before that confirmation, the running Webpack server and served map were rechecked; the hero selector still resolved to `_hero-header.scss:6`. Enabling CSS source maps in DevTools and a hard refresh were suggested, but Dejan did not specify which browser action resolved the display.

## Dejan's content and component cleanup request

Dejan said the imported pages and content were not needed. Of the four Canvas pages shown in the admin list, only `Alpina homepage` should remain. He also asked where the other frontend components came from, whether they were part of the headless integration, and whether they could be deleted.

The generic starter and PepsiCo components came with the existing project. They were not required content components for Drupal Canvas Headless.

Backed up the database, current project files, and uploaded files before cleanup:

`/home/dejan/.local/state/headless-lab/backups/pre-demo-cleanup-20261014-01`

Removed:

- Canvas pages 4, 7, and 15: Random page, Home page, and Untitled page.
- Four demo article/review nodes.
- Seven demo media items and their unused managed files.
- Nine demo menu links.
- The `testni_tpl` page variant.
- All 24 generic starter/PepsiCo React components and their Canvas JS component configuration.
- The demo menu/review API routes and unused helpers in `frontend/lib/`.

Alpina is now the default homepage and page variant. Its author was set to admin. The cleanup is recorded in `scripts/clear-demo-content.php`; that script uses the known imported demo IDs and is not a general deletion utility.

A path-alias hook error interrupted the first deletion attempt. The subsequent run completed. No Drupal core code was changed. TypeScript initially saw stale generated references to deleted API routes; rebuilding regenerated the route types, after which checks passed.

Dejan separately asked about `frontend/components/draft-banner.tsx`. It is retained alongside `draft-indicator.tsx` for Canvas draft-session status and renewal. These are editor integration UI, not Alpina content components. They do not appear during normal published-page browsing. The SDK runtime, middleware, and Canvas/draft routes also remain.

## Verified state and limits

Current Drupal content inventory was checked when writing this note:

- One Canvas page: Alpina homepage, ID 16.
- No demo nodes.
- Two media items: desktop and mobile hero images.
- Three Canvas JS components: Alpina Header, Hero, and Page Shell.
- One page variant: Alpina.
- Default front-page route: `/page/16`.

Verification completed during this session:

- Production builds, full frontend lint, and TypeScript checks passed after cleanup and SCSS correction.
- The original first slice was checked at 1440×900 and 375×812 against the static reference, including image loading, menu behavior, and horizontal overflow.
- Authenticated Canvas preview and hero/header property widgets were checked in the browser.
- After cleanup and the final SCSS changes, the homepage and alias returned 200, deleted page routes returned 404, and the Canvas preview and hero fields still worked.
- The final CSS map was traced to the actual hero SCSS source.
- Copied SCSS files were compared byte-for-byte against the reference.
- Root Git diff whitespace checks passed, and the reference repository remained unchanged and ignored.

Browser automation needed a local certificate exception for Drupal HTTPS. The shared preview browser rejected the local certificate with `ERR_CERT_AUTHORITY_INVALID`; separate browser checks accepted it for testing. Site TLS settings were not weakened for those checks.

These are local verification results. There has been no deployment, commit, or push. The first migration slice remains awaiting Dejan's visual/editor review; it is not the completed homepage.

## Remaining work

Homepage sections still to migrate: product teasers, product carousel, inspiration grid, retailer logos, legal footnotes, and footer.

Other source pages remain: About, Alpinaweiss, Bad & Küche, products, contact, store locator, and legal. Contact submission and retailer search need actual backend behavior. Remaining destination pages and image/video variant selection still need implementation. Language routing and native menu integration were subsequently implemented as recorded below.

Future migration work should preserve the source markup, class names, global styles, and component partials wherever possible. Make only the adaptations required by React, Canvas editing, asset paths, and the build pipeline. Explain necessary deviations rather than silently redesigning the source structure.

## Useful URLs

Published frontend:
http://localhost:3000

Alpina alias:
http://localhost:3000/alpina

Drupal login:
https://headless-lab.local/user/login

Hero/page editor:
https://headless-lab.local/canvas/editor/canvas_page/16

Header/page variant editor:
https://headless-lab.local/canvas/editor/page_variant/alpina

## CMS navigation and multilingual follow-up

Dejan required all Alpina components to be fully editable through Drupal and identified the fixed header navigation and nonfunctional language switcher. He authorized French and Dutch, with French default.

Replaced fixed header links with Drupal Main menu data, preserving native ordering, nesting, enabled state, and access filtering. Added server-side menu loading and a preview fallback API. Header logo now uses managed Drupal Media, with editable logo destination and translatable navigation UI labels. Hero editorial fields remain native Canvas controls.

Enabled language, content translation, configuration translation, locale, and the custom alpina_cms module. Added French/Dutch routes and a switcher driven by published page translations. Preserved the original German prototype text under its existing English record because translated copy was not provided. No real French/Dutch homepage translations have been published; unavailable language choices are disabled.

Changing the default language exposed Canvas template validation against the old English configuration language. The importer now updates the variant language and component inputs before validation. Native Canvas translation routes also rendered through the public page template; the custom route subscriber marks those routes as administrative. Neither fix changes Drupal core/contributed code.

Verified native menu edits live, then restored the original menu entry. Temporary French/Dutch translations proved switching and unpublished-link suppression, then were removed. Verified native translation overview, Canvas header fields, SCSS hero source map, lint, TypeScript, and production build. The build still reports its existing multiple-lockfile workspace-root warning and Canvas preview static-render fallback notice.

There are now three managed media items including the logo. The independent static repository was not modified. No Git staging, commit, or push was performed. Editing controls and URLs are documented in cms-editing.md.

## Multilingual deferred after editor review

Dejan reported that selecting French kept the Canvas page editor on EN, while Dutch preview showed the German source and a clipped header in his screenshot. The EN/FR mismatch was reproduced: Canvas routes the site-default language back to the unqualified editor, whose existing primary page language was still EN. The published translation-switching test had not covered this editor interaction. A clean tablet-preview run did not reproduce the clipping.

Dejan asked to stop multilingual work and return to English only, leaving the header language switcher as a placeholder. Restored English as the only configured/default language, restored English configuration and header UI labels, and disabled translation authoring for Alpina pages, menus, and image media. Kept the page content, managed logo, native Main menu integration, and CMS fields. FR/NL now render as disabled spans with no navigation or active-language indication. The historical multilingual setup script is guarded; configure-alpina-english.php records the rollback.

Backup: /home/dejan/.local/state/headless-lab/backups/pre-english-only-20261014/database.sql.gz. No Git mutations were performed. Multilingual functionality must be re-evaluated against the real Canvas editor before being enabled again.

English-only rollback verified in the actual Canvas page editor and published frontend: no Canvas language selector, hero preview present, FR/NL placeholders have no links, and the native Main menu still renders. Menu fetching now uses Drupal's unprefixed endpoint, matching the English-only routing. Frontend lint, TypeScript, and whitespace checks passed; the reference repository remained clean. The development server was restarted and is running on localhost:3000.

## Visual language toggle and browser translation

Dejan requested the FR/NL visual toggle without multilingual behavior and reiterated that the static frontend is the source of truth. Header controls now use the reference anchor markup and existing active-option CSS. Clicking only updates the visual active class in desktop/mobile controls, with no URL or text changes. No custom sliding animation was retained; navigation SCSS still matches the reference byte-for-byte.

The reported hydration mismatch showed translated-ltr added to the HTML element and German source text replaced by English before React hydration, which identifies browser translation modifying the DOM. Added translate="no" and the google notranslate metadata to prevent automatic translation. No hydration-warning suppression was added. Clean browser checks found no hydration error; the user's translation-enabled browser still needs a reload and may need to undo its current translation. Verified visual selection updates on mobile with unchanged URL/content, and frontend lint/TypeScript. The reference repository remains unchanged.

## Full-width teaser and reusable Products

Dejan authorized the next full-width-teaser slice and required proper Product nodes, reusable later with other displays. He authorized twenty products, including repeated source products with identifying suffixes. The frontend-to-drupal-components workflow was explained as a local implementation/verification guide; the project remains Canvas + Next.js.

Created the Product node type with managed product/teaser images, summary, collection, benefits, destination, and importer code. Created twenty published nodes, IDs 5–24, from eleven actual source listing cards, two homepage teaser examples, and seven clearly suffixed demo repeats. The second source teaser reused the first heading, so its node name has a Bad & Küche suffix.

Added Alpina Full-width Teaser section and Alpina Product Teaser child components. Each child selects a proper Product node with native Product-only autocomplete. Product title, summary, teaser image, and destination resolve from the saved node; presentation backgrounds and CTA label stay in Canvas. Copied source teaser/button partials byte-for-byte, preserving the source import order and markup. No additional homepage section was imported.

Validation caught the real headless payload convention: nested node fields serialize to camelCase and title becomes label. The component was corrected to consume those values. Native reference props must be optional under Canvas's schema; unselected or inaccessible products render no article. The Product picker worked in the actual editor, including a change to node 7 and restoration to node 5. A real node summary edit propagated to public output and was restored. Unpublished product content was withheld publicly, then publication restored.

Verified twenty nodes and duplicate-free reimport, image loading and matching source geometry at 1440×900 and 375×900, lint, TypeScript, production build, and whitespace checks. Removed only the verification draft after confirming its editorial values matched the saved page. Product detail pages and listing presentation are still deferred, and destinations remain source placeholders. Slice awaits Dejan's admin/browser review.

Backup: /home/dejan/.local/state/headless-lab/backups/pre-products-20261014/database.sql.gz. Documentation: products-and-teasers.md. Static reference remained untouched; no Git mutations or deployment.

## Hero and teaser video variants

Dejan supplied the live static index-video.html page and requested both existing components support its video option, with one separate test page applying both. Inspected the live source and media-crop.mjs. Added native image/video selection and desktop/mobile Video Media fields to Hero and Product Teaser. A shared React hook preserves the source 768px switch, muted looping inline playback, 25-percent visibility threshold, offscreen pause, and reduced-motion pause. Existing SCSS already supports video and was left unchanged.

Imported four source MP4s as managed Video media and created published Canvas page 17, Alpina video test, alias /alpina-video-test. It reuses Product nodes 5 and 6 and applies video-a to the hero/first teaser and video-b to the second teaser. The original image homepage and front-page configuration were preserved. The idempotent video importer upgrades component versions without replacing existing editorial inputs.

Verified playable video and responsive source selection at 1440×900 and 375×900, offscreen and reduced-motion pause, no overflow, original image-mode rendering, Drupal page validation, CMS video selectors, lint, TypeScript, production build, and whitespace checks. The initial CMS browser check was inadvertently left at mobile viewport after playback testing; it was rerun at desktop size. Static source unchanged; no Git mutations or deployment. Workflow and URLs: video-variants.md.

## Product slider with admin ordering

Dejan requested the product-slider slice with a per-instance product count and an admin page where drag and drop sets the order all sliders follow. Reused the existing twenty Product nodes and the source Swiper setup (one, two, then four visible cards). The slider has Heading, Text, and Number of products Canvas props; products themselves come from a shared order, so no manual slot filling is needed.

Added a hidden Slider weight field to Product nodes and an admin Product slider order page at /admin/content/product-slider-order with core tabledrag. Saving writes weights; the form normalizes them to the displayed order. The frontend fetches published Products from JSON:API sorted by that weight on every request (no cache) and provides them through context; each instance slices its count from the top. The product card became an internal building block accepting both Canvas and JSON:API image shapes; relative JSON:API file URLs are resolved against the Drupal base so images load from the headless origin.

The import script is idempotent: field, initial weights (alphabetical, new products default last), canvas_headless.settings exposure, definition sync, version upgrades, and homepage placement after the teaser section with the source heading, text, and six products. Verified drag-and-drop reorder end to end: admin save changed the public order on reload, and a second drag restored it. Lint, TypeScript, and whitespace checks passed. Component config is exported in config/sync. Static reference untouched; no Git mutations or deployment. Workflow and URLs: product-slider.md.

## Slider fidelity pass against the static original

Dejan flagged the slider as not matching the original and pointed at the static index.html. Served the static reference locally and compared computed styles and geometry against the headless rendering at identical viewports. The real defect: the source loads the full Swiper bundle CSS through vendors/_swiper.scss, while the slider only imported swiper/css (core). Pagination bullets rendered square, the dynamic bullet cascade, the navigation lock hiding rule, and the a11y notification styles were missing. Fixed by copying the source vendors partial byte-for-byte, importing it in main.scss at the source position after tokens, and dropping the redundant core import; sass resolves the bundle from the swiper package.

After the fix the two renderings match numerically: heading box 606px on both, arrow buttons 44px with the same border and disabled dimming, round 10px brand-colored pagination dots centered under the row, 4/2/1 slides per view at 1440/768/375, no horizontal overflow. Arrow hiding below the source breakpoint proved faithful (the original hides them at 1280 too). The vision-based screenshot diff raised bullets, arrow borders, and heading size; each rechecked numerically as identical. The broken header logo in the automation preview is only the missing mkcert trust in that browser; the logo URL returns 200.

Content remains intentionally different: the source homepage slider's six products were never imported as nodes, so the slider shows the authorized catalog ordered by the new admin page. Importing the six source products would make the homepage content-identical. Lint and TypeScript passed; static reference untouched.

## Canvas shortcut to product ordering

Dejan requested a button in the Product Slider's right-hand Canvas settings sidebar. Added a site-module form alter hook limited to js.alpina_product_slider. Order products uses the Canvas button styling and opens the native product-order admin route in a new tab, preserving the current Canvas draft. It is shown only to users with the ordering permission. No component prop/schema or public frontend markup changed. Verified the rendered sidebar link, button styling, and target attributes in Canvas; PHP syntax and whitespace checks passed.

## Product-backed inspiration grid

Dejan requested inspo-grid with content from Products, then specified updating all Products and using an independent drag-and-drop order. Added field_inspiration_image to the Product form and populated all twenty existing nodes with source inspiration photos, repeating the eight photos for extra sample products. Preserved existing names, packshots, collections, and destinations. Added hidden field_inspiration_weight and a separate Product inspiration order page. Shared the tabledrag form implementation with the slider while retaining distinct weight fields.

Canvas now exposes Alpina Inspo Grid with Heading, Text, Number of products, and an Order inspiration products sidebar button. Public grid cards obtain names, collections, packshots, destinations, and inspiration images from saved Products. Source markup, image dimensions, hover/focus behavior, and byte-identical SCSS partials are retained. The server uses separate sorted Product contexts for slider and grid.

The homepage had an existing unpublished slider count change, 4 versus published 6. The importer appended the grid to both saved and pending trees and rebased the pending draft through Canvas APIs without publishing user edits. Confirmed no draft conflict.

Verified twenty product image fields, native image widget, actual inspiration drag/drop/save and changed frontend order with unchanged slider order; restored original test weights. A real Product title edit updated both displays and was restored. Verified Canvas fields/shortcut, desktop four-column/mobile two-column layouts, image loading, focus overlay, no overflow, frontend checks/build, PHP syntax, and whitespace checks. Static reference unchanged; no Git mutations or deployment. Slice awaits user validation.

Backup: /tmp/headless-lab-pre-inspo-20261014/database.sql.gz. Workflow: inspo-grid.md.

## Optional Hero prop synchronization, 15 October 2026

Dejan added subHeading11 to the Hero schema and JSX. Fixed a missing comma in the JSON-style YAML; syntax and component lint passed. Drupal then had the new registered schema but the selected page instance still referenced the previous version. Reopening the Canvas layout caused its native compatible-instance upgrade and autosaved the updated draft. Verified Sub heading 11 is visible in the sidebar. Published Hero remained on the earlier version, and the unpublished slider count of 4 was retained while published count stayed 6. No draft conflict.

Corrected earlier guidance: compatible optional props normally upgrade through the native layout load after metadata sync; users may need a second reload when the first layout request raced with synchronization. No manual migration script is normally needed. A broader migration attempt stopped validation; a proposed timestamp adjustment was rejected by automatic review and not executed. Native Canvas handled the upgrade; removed the unused migration script. See component-editing.md for the verified procedure.
