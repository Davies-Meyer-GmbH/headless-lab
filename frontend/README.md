# Alpina Canvas frontend

Next.js renders Drupal Canvas pages through the catch-all route in `app/[[...slug]]/page.tsx`.

The current component library contains `alpina_shell`, `alpina_header`, and `alpina_hero`. The old starter/PepsiCo components are removed.

`draft-indicator.tsx` and `draft-banner.tsx` manage editor draft-session feedback and renewal. They are integration UI, not Alpina content components. `CanvasRuntime`, `proxy.ts`, `instrumentation.ts`, and the Canvas/draft API routes support previews, component selection, metadata synchronization, and publishing.

Source SCSS is in `styles/alpina/` and is imported directly by the root layout. Next.js generates the development CSS and source maps. Alpina icons and reference assets are in `public/alpina/`; font-face URLs follow the source declarations in `styles/alpina/base/_fonts.scss`. Editable hero images are Drupal media.

The independent static reference repo is one directory up, in `alpina-be-frontend/`. Keep it unchanged.

```bash
cd /home/dejan/projects/drupal/headless-lab/frontend
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Set `CANVAS_SITE_URL=http://headless-lab.local` in the ignored `.env`.

Frontend:
http://localhost:3000

Alpina homepage:
http://localhost:3000/alpina

`npm run check` runs lint and TypeScript. `npm run build` builds the application. Next.js compiles the imported SCSS directly. Development CSS maps point to the original SCSS partials.

Dev and build use Webpack. Development emits CSS maps with embedded SCSS sources, so inspecting the hero points to `styles/alpina/layout/_hero-header.scss` rather than an intermediate CSS file.
