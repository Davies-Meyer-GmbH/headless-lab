# Automating static frontend to Drupal Canvas

Based on the Alpina migration in headless-lab, 14 and 15 October 2026. Details are in `docs/alpina/`.

## What we learned

A coding agent (Codex or Claude Code) with our skill `dm-static-frontend-to-drupal-canvas-headless` can build Canvas components from a static frontend and place them on pages. Seven homepage sections were migrated this way (header, hero, full-width teaser, product slider, inspiration grid, store logos, and footer), and their layout matches the static page at desktop and mobile widths.

The output wasn't reliable on its own, though. Most surprises were caught by a person, or by a check we wrote after the fact:

| Surprise | How it was caught |
|---|---|
| The agent added a selector prefix, resets, and its own font rules to the SCSS | Dejan noticed `main.scss` differed from the source |
| CSS source map existed but pointed to the wrong SCSS file | A selector-level check of the map |
| Slider looked wrong: the source loads the full Swiper CSS, the component loaded only the core CSS | Dejan compared it with the static page |
| A screenshot comparison by a vision model reported differences that weren't there | Rechecked with measured sizes and computed styles |
| JSON:API returns camelCase fields and `label` instead of `title` | Validation against real data |
| Canvas rules: reference props must be optional, `#` isn't a valid example URL, prop names must match titles, image media rejects SVG | Canvas sync and lint errors |
| After a schema change, a page kept the old component version until the editor reloaded | Manual check in Canvas |
| The homepage had an editor's unpublished change, which an import must not overwrite | Checked the draft before importing; the import script had to handle it |

Two conclusions:

1. **AI output varies between runs.** The same instructions can produce different code. A reliable process can't depend on the agent getting it right each time.
2. **Reliability comes from checks and approvals around the agent.** Every surprise above can become an automatic check or an explicit decision point.

## Options

### 1. As now: agent with the skill, a person reviews every section

The developer runs the agent section by section and checks each result in the browser.

- Works today, nothing to build.
- Reliability depends on how carefully the developer reviews. Surprises reach review.

### 2. Automatic verification for every section (recommended first step)

A script checks each section and produces a report. The agent must pass it before a person reviews the section.

- SCSS: copied partials are byte-identical to the source, and `main.scss` keeps the source's order.
- Source maps: selected selectors resolve to the right SCSS partial.
- Visual: the section's size, image sizes, and key computed styles match the static page at 1440 and 375 px, measured in a real browser, not judged by a vision model.
- Code: lint, type-check, and Canvas component sync without errors.
- Content: the import script runs twice with nothing created the second time, published content and unpublished drafts are preserved, and the static source repository is unchanged.

Most of these checks were already run by hand in the lab, so this is mainly packaging them into one command. Rough effort: one or two days.

### 3. A staged pipeline with few, small approvals

The same structure as our Figma-to-static pipeline (fixed stages, recorded evidence), with one change: approvals people actually read. Long plans sent for approval get approved without being read. That is worse than no gate, because it looks like control.

1. **Conventions, decided once per project**: a short list, about ten lines, read once at the start. For example: all visible text is an editable prop, repeated items come from existing nodes, links are props, global sections live in the page variant. The agent applies them without asking. (Superseded: Dejan replaced this with a discovery stage, because developers joining the client project won't know it well enough for conventions to help.)
2. **Discovery**: scripts inventory the static sections (with globals and variants) and Drupal (content types, nodes, menus, components, pages). One HTML report shows a card per component with a static screenshot, a pages × components grid, and a short "to be created in Drupal" list. That list is the only approval. Prototype: `discovery/` in headless-lab.
3. **Exception questions only**: when a section doesn't fit the conventions, the agent asks one question with a recommended answer and its consequence. Most sections produce no questions. Frequent questions mean the conventions are missing something.
4. **Build**: the agent builds the section with the skill.
5. **Verify**: the option 2 checks, reported as pass or fail.
6. **Visual review**: the static and the built section side by side, at desktop and mobile. A person looks and says fine or names what's wrong.

Only changes that are hard to undo need approval before building: content types, fields, and data migrations. Components, props, and CSS are cheap to rebuild and are tracked in Git, so they are reviewed afterwards, visually.

Every complaint becomes a rule in the skill or a new check, so the same problem can't come back. This is how the process gets more reliable without anyone reading more.

The dm-frontend pipeline already has stages and evidence, and its design discovery produces a section list (`docs/sections.json`), which could be the handover between the two pipelines. Its own gates may have the same problem. Rough effort: about a week, more if it becomes part of the dm-frontend tooling.

### 4. Generate the fixed parts without AI

A generator creates the parts that follow rules, from the conventions and the section list: the component folder, `component.yml`, the copied SCSS partial and its `@use` line in the source position, and the import script skeleton. The agent writes only the JSX and the data binding.

- Less variation, because the rule-based parts can't drift.
- Worth it once the conventions from option 3 are stable.

### 5. Unattended runs

Agents run without a person present (`codex exec`, `claude -p`), one section per branch, and open a pull request with the verification report. People review pull requests instead of watching the agent.

- Only sensible after options 2 and 3 work. Without them, surprises land in pull requests.
- Costs more agent usage, and the review still has to happen.

### Not recommended: Drupal AI and Canvas AI

Canvas AI's component agent saves components in Drupal, not in our Git repository. In testing, its instructions contradicted each other: it wrote an unrequested page description, with a typo, because a hard-coded instruction overrode its own rules. Drupal AI is for editors after handover, not for building. See `docs/ai/`.

## Recommendation

- **For the client project next week:** option 1, plus the conventions list from option 3 decided at the start, exception questions only, and side-by-side visual review.
- **Next:** option 2. It turns the surprises we already know into automatic checks, at the lowest cost.
- **Then:** option 3 as a proper pipeline, ideally next to dm-frontend, with the section list as the handover between the two.
- **Later:** options 4 and 5, once the pipeline has run on a real project.

A person still decides the conventions and content-model exceptions, and looks at the visual result. The automation removes the surprises that checks can catch, which in the lab was most of them.

## What makes the static frontend easier to automate

These conventions in the static frontend make each step more predictable:

- One SCSS partial per section, named after the section's BEM block, such as `_store-logo.scss` for `.store-logo`.
- The section list from design discovery kept up to date, including which sections are global.
- Placeholder content that is clearly marked, so it's obvious what editors will control and what comes from data, such as product lists.
