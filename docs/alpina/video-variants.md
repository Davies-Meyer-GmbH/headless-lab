# Hero and product teaser video variants

State: needs_validation.

Static reference inspected live:
http://127.0.0.1:5500/alpina-be-frontend/index-video.html

Video test page:
http://localhost:3000/alpina-video-test

Canvas test page editor:
https://headless-lab.local/canvas/editor/canvas_page/17

Original image homepage:
http://localhost:3000/alpina

## Editing

In Canvas Layers, select Alpina Hero or an Alpina Product Teaser child. Media type selects image or video. Desktop video and Mobile video are native Drupal Media library selectors restricted to locally hosted Video media. Existing image/background fields remain available for image mode and fallback if no video is selected.

The test page uses the static video-a desktop/mobile pair for the hero and first teaser, and video-b for the second teaser. Its Product references point to the same reusable Product nodes as the image homepage. Four managed Video media records were imported; no videos were written into the reference repository.

## Source behavior

`frontend/lib/use-media-crop.js` adapts the reference `src/js/modules/media-crop.mjs` to React effect setup/cleanup. Both components switch video sources at 768px, including fallback to the available source when only one is selected. Videos are muted, looping, inline, decorative, and play only when at least 25 percent of their containing source wrapper is visible. They pause offscreen and when reduced motion is requested. Hero preload is auto; teaser preload starts at metadata. The source SCSS already supports these videos and was not changed.

Image mode preserves the existing image markup. Video mode uses the video markup from index-video.html. Playback setup runs after hydration; no window-dependent server rendering is used.

## Recreation

After importing the homepage, Products, and teaser slice:

```sh
cd /home/dejan/projects/drupal/headless-lab
vendor/bin/drush --uri=https://headless-lab.local php:script scripts/import-alpina-video-test.php
vendor/bin/drush cache:rebuild
```

The script synchronizes component definitions, upgrades compatible existing component versions without replacing editorial inputs, imports four Video media records, and creates the video test page once. Re-runs preserve the test page's editorial content and do not replace the original homepage or its front-page configuration. Component configuration is exported in config/sync; content and media are recreated by the script.

## Verification

Local browser checks at 1440×900 and 375×900 confirmed desktop/mobile source URLs, successful playback for all three videos, offscreen pause, reduced-motion pause, and no horizontal overflow. The original homepage still renders image variants. The video test page passes Drupal entity validation. Canvas exposes native Media type and Desktop/Mobile video controls for both components. Changing Hero Media type switched the live preview to images and back to video; no verification draft remains. Reimport reported all five components unchanged and preserved the existing test page. Frontend lint, TypeScript, production build, and whitespace checks passed. The existing multiple-lockfile build notice remains.

Local HTTPS browser testing used the established certificate exception. The source repository remains unchanged; no Git mutations or deployment were performed.

Backup:
`/home/dejan/.local/state/headless-lab/backups/pre-video-20261014/database.sql.gz`
