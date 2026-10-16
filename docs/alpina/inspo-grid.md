# Product inspiration grid

State: needs_validation.

Preview:
http://localhost:3000/alpina

Canvas editor:
https://headless-lab.local/canvas/editor/canvas_page/16

Independent inspiration order:
http://headless-lab.local/admin/content/product-inspiration-order

Products:
http://headless-lab.local/admin/content?type=product

## Editing

Select Alpina Inspo Grid in Canvas Layers. Heading, Text, and Number of products are editable. Order inspiration products opens the inspiration ordering page in a new tab. That order applies to inspiration grids only; Product slider order remains independent.

Each existing Product now has an editable Inspiration image managed through Drupal's native image widget. All twenty Products were populated from the eight static inspiration photos, reusing photos for the additional sample products. Name, collection, packshot, and destination come from the Product's existing shared fields. Existing names and product packshots were preserved, so card content reflects the current catalogue rather than inventing absent source products. No new Product nodes were created.

The technical field_inspiration_weight is hidden on Product forms. Rearrange all Products on the inspiration admin page using drag handles and Save product order. Published Products display from the top of this order, limited by each grid's Number of products. Unpublished Products remain available to administrators in the ordering table but are withheld by anonymous JSON:API access.

## Source implementation

The grid and hover/focus card markup follow index.html. _inspo-card.scss and _inspo-grid.scss are copied byte-for-byte and added to main.scss in source order. The reference layout uses four columns at the source desktop breakpoint and two on mobile. Packshots and product labels appear on hover or keyboard focus, using the original CSS transition.

The server loads independently sorted JSON:API product lists for slider and inspiration contexts. Product content is fetched without caching, so saved edits/order changes appear on reload. ProductOrderFormBase shares the native Drupal tabledrag implementation between slider and inspiration forms; each subclass saves only its own weight field. The Canvas form hook adds the relevant ordering shortcut for each component.

## Recreate

```sh
cd /home/dejan/projects/drupal/headless-lab
vendor/bin/drush --uri=http://headless-lab.local php:script scripts/import-alpina-inspo-grid.php
vendor/bin/drush --uri=http://headless-lab.local cache:rebuild
vendor/bin/drush --uri=http://headless-lab.local config:export -y
```

The importer fills only empty inspiration images and preserves existing inspiration weights after initial setup. It registers the grid and appends it to the homepage once. Existing unpublished Canvas changes are preserved: the new grid is merged into the draft as well as the saved page, and the draft is rebased without publishing the user's edits.

## Verification

- Twenty existing Products have inspiration images and independent weights.
- Actual drag/drop and save changed the grid's frontend order; slider order stayed identical. Original inspiration weights were restored after verification.
- Editing a Product title through Drupal changed both grid and slider content, then the original title was restored.
- Native Product edit form exposes Inspiration image and hides the technical weight field.
- Canvas exposes grid fields and the correct ordering shortcut.
- At 1440×900 the grid has four columns; at 375×812 it has two, with no horizontal overflow. All eight displayed inspiration photos loaded. Keyboard focus reveals the product overlay.
- Frontend lint, TypeScript, production build, PHP syntax, and whitespace checks passed. The existing multiple-lockfile build notice remains.
- The original pending slider count was preserved at 4 while published count remained 6; no Canvas draft conflict.
- Static reference repository remained clean. No Git mutations or deployment.

Backup before importing:
`/tmp/headless-lab-pre-inspo-20261014/database.sql.gz`
