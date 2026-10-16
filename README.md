# Headless Lab: Alpina

Drupal 11 and Canvas manage the site. Next.js renders the public pages.

Drupal admin:
https://headless-lab.local

Frontend:
http://localhost:3000

Alpina homepage:
http://localhost:3000/alpina

Canvas page editor:
https://headless-lab.local/canvas/editor/canvas_page/16

Header/template editor:
https://headless-lab.local/canvas/editor/page_variant/alpina

## Current state

Alpina is the only Canvas page and the default homepage. The editable header and responsive image hero are implemented. Further homepage sections are pending migration.

The imported starter/PepsiCo pages, content, media, menu links, and React/Canvas component library have been removed. Canvas draft-session components and SDK runtime/API routes remain for editor previews.

`alpina-be-frontend/` is an independent reference repository. Do not edit it or install dependencies there. Root Git ignores it locally through `.git/info/exclude`.

## Local requirements

PHP 8.3, Composer, MySQL/MariaDB, and a supported Node version from `frontend/package.json`. Apache's document root and Directory path must be `/home/dejan/projects/drupal/headless-lab/web`.

Local database connection, hash salt, trusted hosts, file URLs, and OAuth key paths live in the ignored `web/sites/default/settings.local.php`. Uploaded files and OAuth keys are also ignored. The local database is `headless_lab`.

Install PHP dependencies:

```bash
cd /home/dejan/projects/drupal/headless-lab
composer install
vendor/bin/drush --uri=https://headless-lab.local cr
```

Frontend `.env` contains `CANVAS_SITE_URL=http://headless-lab.local`. Published pages and Canvas previews do not require the old demo CLI credentials.

```bash
cd /home/dejan/projects/drupal/headless-lab/frontend
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Next.js imports `styles/alpina/main.scss` directly and compiles SCSS with source maps during development. There is no intermediate generated `alpina.css`. Run `npm run check` for lint and TypeScript, and `npm run build` for a production build.

## Drupal configuration and content

`config/sync/` contains Drupal configuration. Content is not stored in configuration. The slice importer recreates the Alpina components, media, page variant, and homepage while preserving existing Alpina editorial input:

```bash
cd /home/dejan/projects/drupal/headless-lab
vendor/bin/drush --uri=https://headless-lab.local php:script scripts/import-alpina-home.php
vendor/bin/drush --uri=https://headless-lab.local cr
```

The importer reads the reference repo's hero images. The separate `scripts/clear-demo-content.php` records the cleanup of this imported database, using the known demo entity IDs. It is not a general content-deletion utility.

Migration state and editor fields are documented in `docs/alpina/migration.md`.
