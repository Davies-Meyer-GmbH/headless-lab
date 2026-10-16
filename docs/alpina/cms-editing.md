# Alpina CMS editing

All future Alpina components must expose editorial text, images, links, and repeating content through Drupal controls. Use native Drupal menus, media, and translations where applicable. The source reference repository remains untouched.

## Navigation

Edit Main menu titles, destinations, order, nesting, enabled state, and translations here:
https://headless-lab.local/admin/structure/menu/manage/main

The frontend reads Drupal's native menu linkset without caching; menu changes do not require a frontend rebuild. The initial editable Alpina link points to the existing homepage. Other destination pages still need to be created.

## Header and hero

Header template editor:
https://headless-lab.local/canvas/editor/page_variant/alpina

Select Layers, then Alpina Header. Logo uses Drupal Media; Logo link and the navigation UI labels are editable. UI labels have French, Dutch, and English configuration values. The managed logo is a PNG export of the reference SVG; the source SVG remains unchanged.

Hero/page editor:
https://headless-lab.local/canvas/editor/canvas_page/16

Hero fields include Eyebrow, Heading, Text, Desktop image, Mobile image, Media type, Desktop video, and Mobile video. Product Teaser also has Media type and Desktop/Mobile video selectors. See video-variants.md for the separate video test page. Component structure and styles remain implementation code.

## Products and full-width teaser

Reusable Product nodes supply product names, summaries, images, and destinations. Canvas selects a Product and controls the presentation backgrounds, section heading, and link label. See `products-and-teasers.md` for the content model, exact editing URLs, and validation notes.

Products:
https://headless-lab.local/admin/content?type=product

## Inspiration grid

Products supply shared names, collections, packshots, destinations, and the new Inspiration image field. Canvas controls Heading, Text, and Number of products. Order inspiration products opens an independent drag-and-drop order; it does not change the slider order.

http://headless-lab.local/admin/content/product-inspiration-order

See `inspo-grid.md` for workflow and verification.

## Languages

Current scope is English-only authoring. The existing German prototype text is preserved in its English source record. Dejan deferred multilingual functionality after the Canvas editor stayed on EN when French was selected and Dutch preview showed fallback content.

FR/NL use the static frontend markup and existing active-option styles. Clicking changes only the visual selection, synchronized between desktop and mobile; it does not change the content, language, or URL. No new animation styles were added. The Canvas language selector is hidden because only English is configured. Main menu integration and editable header/hero controls remain active.

Frontend:
http://localhost:3000/alpina

## Setup and verification

`scripts/configure-alpina-english.php` restores English-only configuration, preserves the page and native menu links, and disables translation authoring. The historical multilingual script is guarded against accidental re-enabling. `scripts/import-alpina-home.php` preserves existing editorial input.

The language and translation modules remain installed, with one configured language and translation disabled for the Alpina page, menus, and image media. The custom admin-route integration is retained for possible future multilingual work.

Rollback verification: Canvas exposes no language selector; the homepage hero still previews; FR/NL remain visual-only controls without navigation; Drupal Main menu still renders. Frontend checks and whitespace validation were run.

Backup before English-only rollback:
`/home/dejan/.local/state/headless-lab/backups/pre-english-only-20261014/database.sql.gz`
