# Alpina migration

Session history and Dejan's corrections: `2026-10-14-session-notes.md`.

Source: `alpina-be-frontend`, independent reference repository. Never edit or install dependencies there. Root Git excludes it locally through `.git/info/exclude`.

Target: Drupal Canvas + Next.js, with Alpina as the sole site content. Imported demo content and components have been removed at the user's request.

## Slice 1: homepage header and hero

State: needs_validation.

Frontend: http://localhost:3000/alpina

Canvas editor: https://headless-lab.local/canvas/editor/canvas_page/16

Page template editor: https://headless-lab.local/canvas/editor/page_variant/alpina

Verified: build, TypeScript, new component lint, component/page/variant validation, idempotent import, real browser image loading and menu behavior at 1440×900 and 375×812, authenticated Canvas live preview, hero property widgets, and header property widgets in the page template. Source and recreated hero/heading geometry match at both tested viewports. Browser automation needed a local certificate exception. Human review remains before the next slice.

Next.js imports `styles/alpina/main.scss` directly. Development CSS source maps include the original SCSS partials.

Importer: `vendor/bin/drush --uri=https://headless-lab.local php:script scripts/import-alpina-home.php`. It adds definitions, media, a variant, and the page; re-runs preserve editorial input. Config exports include the Alpina components/variant, frontend registration, and default homepage settings. Content is recreated by the importer.

Project lint and TypeScript checks now pass after removing the starter/PepsiCo component library.

- Source: `index.html`, image hero variant.
- Canvas page shell provides Header and Content slots. SCSS now follows the static source globally, without the earlier `.alpina-site` selector prefix.
- Header navigation now uses Drupal Main menu, including titles, destinations, ordering, nesting, and enabled state. Logo and navigation UI labels are editable in Canvas. Multilingual functionality is deferred: only English is configured, and FR/NL remain visual-only placeholders using the original navigation styles. See `cms-editing.md` for controls and current content limitations.
- Hero fields: Eyebrow, Heading, Text, Desktop image, Mobile image. Images use Drupal media widgets. Plain text stays escaped; no raw HTML field is needed for this slice.
- Assets and SCSS are copied into `frontend/`, with the same Univers font-face declarations as the reference source.
- Alpina homepage is `/alpina`, also served at `/`; the Alpina page variant is the site default. Only page ID 16 remains.

## Slice 2: full-width product teaser

State: needs_validation.

Two source teaser items are connected to reusable Product nodes through native Canvas entity-reference controls. Twenty Product nodes have been created. Product fields, image widgets, media backgrounds, source SCSS, and editing verification are documented in `products-and-teasers.md`.

Verified native Product summary editing, Canvas product selection, public unpublished-content access, idempotent import, image loading, and source geometry at desktop/mobile widths. Human review remains before the next slice.

## Image/video options

State: needs_validation. Hero and product teaser support native Video Media selectors. A separate test page, ID 17 at /alpina-video-test, applies the static video variants to the hero and both teaser items. The original homepage remains in image mode. See `video-variants.md` for editing controls and playback verification.

## Inspiration grid

State: needs_validation. Product-backed inspo-grid is added after the slider. All twenty Products have inspiration images; grid ordering is independently managed with drag and drop. Canvas controls heading, text, product count, and an ordering shortcut. Existing unpublished edits are preserved. See `inspo-grid.md`.

## Store logos and footer

State: needs_validation. Importer: `vendor/bin/drush --uri=https://headless-lab.local php:script scripts/import-alpina-store-logo-footer.php`. Re-runs skip existing items.

- Store-logo section (`alpina_store_logo`) is placed on page 16 after the inspo grid. Heading, text, two logo images, and button label/link are editable in Canvas. The logos are media items "Alpina store logo Hubo" and "Alpina store logo Colos". Core image media rejects SVG, so Hubo uses a PNG export of the source SVG (`frontend/public/alpina/img/_icn/logos-hubo-cms.png`). The button link is empty and renders `#`, as in the source.
- Footer (`alpina_footer`) is global: it sits in the new Footer slot of the Alpina page shell, in the Alpina page variant. Links come from Drupal's Footer menu (Kontakt, Legal, TNB, Privacy, currently `<nolink>` placeholders rendered as `#`). Social links are editable props, with platform home URLs as placeholders; an empty link hides its icon.
- The open mobile menu makes both `main` and the footer inert, as the source navigation script does.

Verified at 1440×900 and 375×812: section sizes and image sizes match the static page exactly, images load, and the importer is idempotent.

## Remaining homepage sections (not planned)

Legal footnotes.

## Other source pages

About, Alpinaweiss, Bad & Küche, products, contact, store locator, legal. Image/video variants require a later content decision. Contact submission and retailer search require backend behavior beyond the static markup.

## Demo cleanup

Removed the three demo Canvas pages, four demo nodes, seven media items and unused files, nine menu links, the PepsiCo page variant, and 24 demo React/Canvas component definitions. Removed menu/review API routes and their unused helpers. Draft components and SDK runtime/routes remain for Canvas editing.

Database and file backup: `/home/dejan/.local/state/headless-lab/backups/pre-demo-cleanup-20261014-01`.

## SCSS alignment

`main.scss` follows the static source import order for tokens, normalize, fonts, globals, typography, container, hero, navigation, and print. All copied SCSS partials match the source byte-for-byte. Vendor and unmigrated component imports are deferred until those components exist. Source font-face URLs are preserved.

DevTools should map hero rules to `styles/alpina/layout/_hero-header.scss`, and shared mixin declarations to `utils/_mixins.scss`. Enable CSS source maps in browser DevTools settings if they are disabled.

Development uses `next dev --webpack` and a CSS-only `SourceMapDevToolPlugin` in `next.config.ts`. The installed Turbopack compiler emitted a map containing the correct sources but mapped the hero selector to `_tokens.scss`; the Webpack CSS map is verified to resolve `.hero-header__img` to `layout/_hero-header.scss:6`, with embedded SCSS content. Production builds also use Webpack, without publishing development CSS maps.

Dejan confirmed that CSS source maps now work in his browser. This confirms the source-map correction; it does not imply validation of the remaining homepage migration.
