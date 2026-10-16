# Products and full-width teaser

Slice state: needs_validation. Implemented on the existing Alpina homepage; other homepage sections remain deferred.

Preview:
http://localhost:3000/alpina

Canvas editor:
https://headless-lab.local/canvas/editor/canvas_page/16

Product content list:
https://headless-lab.local/admin/content?type=product

Add Product:
https://headless-lab.local/node/add/product

First featured Product:
https://headless-lab.local/node/5/edit

Second featured Product:
https://headless-lab.local/node/6/edit

## Product content

Twenty published Product nodes, IDs 5–24. The source products.html contains eleven cards; the catalogue includes those, two source homepage teaser products, and seven repeated samples with Demo suffixes. Source spelling is preserved. The source uses the same heading for both homepage teasers; the second node has a Bad & Küche suffix to distinguish it.

Editable node fields:

- Title: shared product name.
- Product code: stable importer identity, ALPINA-DEMO-01 through ALPINA-DEMO-20.
- Product collection: brand/range label for future cards and filters.
- Product summary: shared teaser description, plain text.
- Product benefits: unlimited individual values for future cards.
- Product image: standard Drupal managed image with alternative text, for cards and future pages.
- Teaser product image: separate managed image, for the large teaser presentation.
- Product destination: native Drupal link widget for a future product page or external destination.
- Published: unpublished referenced products are withheld from public teaser output.

Images are managed on the Product node through Drupal image widgets. Teaser backgrounds use Media library widgets in Canvas. The initial first two products use their source teaser packshots for both Product image and Teaser product image. No placeholder image generation was needed.

Product destinations remain source placeholders until product detail pages are implemented. This slice creates reusable content records, not the product detail-page design or listing page.

## Canvas controls

Select Layers, then Alpina Full-width Teaser to edit the section Heading. Its Products slot holds ordered Alpina Product Teaser children. Add, remove, duplicate, or reorder those children using Canvas controls.

Select an Alpina Product Teaser child to edit:

- Product: native entity-reference autocomplete limited to Product nodes. Select a saved product; do not duplicate its title or summary in Canvas.
- Link label: teaser button text.
- Desktop background and Mobile background: managed Media references.

The product's Title, Product summary, Teaser product image, and Product destination are resolved from its node at render time. The same node can be referenced by several components with different presentation. Product content changes propagate without reimporting the homepage.

## Implementation

`alpina_full_width_teaser` provides the source section wrapper and Products slot. `alpina_product_teaser` provides one source article with a native content-entity-reference prop. The external component's Drupal dataDependencies.entityFields metadata projects the selected node fields. Headless serialization converts nested field names to camelCase and the title to label; the React component reads that actual serialized shape.

The copied _full-width-teaser.scss and _button.scss are byte-identical to the independent static repository. main.scss adds them in the source import order. No redesign or additional animation was introduced.

Recreation order:

```sh
cd /home/dejan/projects/drupal/headless-lab
vendor/bin/drush --uri=https://headless-lab.local php:script scripts/import-alpina-home.php
vendor/bin/drush --uri=https://headless-lab.local php:script scripts/import-alpina-products.php
vendor/bin/drush --uri=https://headless-lab.local php:script scripts/import-alpina-teaser.php
vendor/bin/drush cache:rebuild
```

Re-runs preserve existing node content and existing teaser input. Product code identifies seed records, so changing a seed code may cause a later import to create a replacement sample. Product fields and Canvas definitions are exported in config/sync. Product and homepage content are created by the importer scripts.

## Local verification

- Twenty Product nodes validated, and reimport created zero duplicates.
- Native Product edit form showed all fields; saving a summary edit changed the published homepage teaser. Original summary restored.
- Canvas Product autocomplete changed the preview to another node and was restored. A remaining draft contained only serialization/type differences; it was removed only after comparing all editorial values to the published page.
- Public output withheld unpublished product content. Product publication restored.
- Teaser images loaded, no horizontal overflow, and article/section dimensions matched the source at 1440×900 and 375×900. Screenshots checked locally.
- Frontend lint, TypeScript, production build, and whitespace checks passed. Existing build workspace-root and dynamic preview fallback notices remain.
- Static repository remained unchanged. No Git mutations or deployment.

Before proceeding to another section, review the homepage and confirm Product editing and Canvas product selection work as expected.

Backup before this slice:
`/home/dejan/.local/state/headless-lab/backups/pre-products-20261014/database.sql.gz`
