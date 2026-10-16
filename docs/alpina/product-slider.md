# Product slider

Preview:
http://localhost:3000/alpina

Canvas editor:
https://headless-lab.local/canvas/editor/canvas_page/16

Admin order page:
http://headless-lab.local/admin/content/product-slider-order

In the Canvas slider Settings sidebar, **Order products** opens this admin page in a new tab. The button appears for users with the `administer product slider order` permission. It is editor navigation, not a stored slider prop or public-page content.

## How it works

`alpina_product_slider` renders the source product-slider section with Swiper: one visible card on mobile, two on tablet, four on desktop, with arrows and clickable pagination bullets. Each slider instance has three Canvas props:

- Heading (required).
- Text: section intro paragraph.
- Number of products (required): how many products to show from the top of the shared order.

The products themselves are not chosen per instance. Every Product node carries a hidden Slider weight field (`field_slider_weight`, managed files `field.storage.node.field_slider_weight` / `field.field.node.product.field_slider_weight`). The admin Product slider order page lists all Product nodes (published and unpublished) sorted by that weight and lets an editor rearrange them with drag and drop (core tabledrag). Saving writes the new weights; the form normalizes them to the listed order.

The Next.js frontend fetches published Products from JSON:API sorted by `field_slider_weight,title` (`lib/product-list.ts`, anonymous access-filtered) on every page request, no caching, so a saved reorder appears on the next reload. `lib/alpina-products.tsx` provides that list through context and each slider instance slices its Number of products from the top. Products without images still render; a slider with no published products renders nothing.

## Implementation

`alpina_cms` provides the route `/admin/content/product-slider-order` (`alpina_cms.routing.yml`), the `administer product slider order` permission (`alpina_cms.permissions.yml`), the Content menu link (`alpina_cms.links.menu.yml`), and `ProductSliderOrderForm` with core tabledrag. The administrator role has all permissions implicitly; content editors do not see the page.

`alpina_product_card` is an internal building block imported by the slider; it has no Canvas contract anymore. It consumes both the Canvas `srcWithAlternateWidths` image shape and the plain JSON:API `src` shape, so it keeps working for teaser-style projections. `_product-card.scss`, `_product-slider.scss`, and `_slider-pagination.scss` are byte-identical to the independent static repository, and `vendors/_swiper.scss` copies the source vendors partial byte-for-byte: main.scss imports it after tokens (source order), so the full Swiper bundle CSS loads before the site overrides. The slider component does not import `swiper/css` separately; without the bundle the pagination bullets lose their round shape, the dynamic bullet cascade, and the `swiper-button-lock` hiding rule.

`scripts/import-alpina-product-slider.php` is idempotent: it creates the weight field, hides it on the Product form, gives every product without a weight an initial one (appended alphabetically; new products created in the UI default to 100), exposes `js.alpina_product_slider` in `canvas_headless.settings`, synchronizes the component definition, upgrades existing usages to the active version, adds the slider to the homepage after the teaser section (Heading/Text from the source, six products), and prints all URLs.

Recreation order:

```sh
cd /home/dejan/projects/drupal/headless-lab
vendor/bin/drush --uri=https://headless-lab.local php:script scripts/import-alpina-product-slider.php
vendor/bin/drush --uri=https://headless-lab.local cr
vendor/bin/drush --uri=https://headless-lab.local cex -y
```

Field, role, and Canvas component configuration is exported in config/sync. The homepage slider instance and product weights are content created by the script and the admin page.

## Local verification

- Slider renders after the teaser section with the source heading, text, six cards, images from Drupal file URLs, arrows, and pagination.
- Drag and drop in the admin page moved a product above the first row; saving reported the change and the public slider order changed on reload. A second drag restored the source order and the frontend matched again.
- Original static page (served from alpina-be-frontend) compared against the headless rendering at identical viewports: heading, intro text, arrow buttons (border, size, disabled dimming), round pagination bullets with centered position, and card geometry computed-style identical; 4/2/1 slides per view at 1440/768/375, no horizontal overflow. Arrow buttons are hidden below the source `$breakpoint-figma` on both — faithful source behavior.
- Product form hides the technical weight field; unpublished products stay in the admin list but are withheld from the public slider.
- Frontend lint, TypeScript, and whitespace checks passed.

## Deferred

Per-instance product exclusion and multiple named orders remain deferred; the current requirement is one shared order with per-instance length. The source homepage slider shows six products (prestige mat, prestige satin, WEISS WANDFARBE, PRIMER BINNEN - wit, PRIMER BINNEN - transparant, Muurbescherming) that were never imported as Product nodes, so the slider displays the authorized catalog instead; the admin order page arranges whichever set is chosen, and importing the six source products would make the homepage content-identical to the source.
