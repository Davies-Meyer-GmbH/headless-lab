# Alpina session notes: 15 October 2026

This covers turning the lab's findings into a reusable skill, the store-logo and footer slice, and the decision to stop building components here. `migration.md` tracks the implementation state.

## Reusable skill

Dejan asked whether the lab's findings should become a skill for an upcoming client project. On that project the Drupal setup and content will already exist and the static frontend will already be built. Developers will only create the Canvas components and styles.

The skill is `dm-static-frontend-to-drupal-canvas-headless`. It lives in `~/.agents/skills/`, which Codex reads directly. Claude Code sees it through a relative symlink in `~/.claude/skills/`.

How the skill was shaped:

- **Minimal.** Dejan's rule: a skill should rather miss something than restrict the agent or lead it in the wrong direction. The first draft included Drupal setup and detailed component, prop, and config recipes. They were removed. Setup will already be done, and the official `canvas-*` skills in `frontend/.agents/skills/` cover component mechanics. Where the two disagree on mechanics, the Canvas skills win.
- **Kept from the lab:** the static source is read-only; SCSS is copied with its entry structure, file names, and selectors unchanged; CSS source maps must keep pointing to the original partials.
- **Existing content first.** Agents check content types, fields, and JSON:API before designing a component's data, and bind to what exists.
- **Naming and portability.** The `dm-` prefix marks internal skills. The Agent Skills standard doesn't allow colon namespaces such as `dm-skills:...`, so the prefix does the grouping. Developers use different agents, so the skill uses only the standard `name` and `description` frontmatter and no harness-specific features. Claude Code plugins, such as `dm-frontend`, only work in Claude Code.

### Changed after the first real use

The first version told the agent to stop and ask before creating any missing content. During the store-logo and footer slice I applied that to two media items and four menu links, so the work stopped although the content only reproduced what the static page shows. Dejan agreed the rule was too strict. It now separates:

- **Ask first:** structural changes (content types, fields, vocabularies, menus). They change the data model and end up in exported config.
- **Create without asking:** content items (nodes, media, menu links, component placement). Use a re-runnable script that skips existing items, and list what was created in the summary.

## Store logos and footer

Built with the skill. Details are in `migration.md` under "Store logos and footer". Decisions worth keeping:

- The footer is global in the same way as the header: it sits in a new Footer slot of the Alpina page shell, inside the Alpina page variant.
- Footer links use Drupal's existing Footer menu, which had no links. Kontakt, Legal, TNB, and Privacy were added as `<nolink>` placeholders until those pages exist. The menu loader renders an empty href as `#`, as in the static source.
- Canvas rejects `#` as an example URL. Social links therefore use the platform home URLs as placeholders, and the store-logo button link has no example and renders `#`.
- Core image media rejects SVG, so the Hubo logo uses a PNG export of the source SVG, as the header logo does. ImageMagick rendered the SVG incorrectly, probably because of its clip-path; sharp rendered it correctly.
- The open mobile menu now locks the footer as well as `main`, matching the source navigation script. This was not tested in the browser.

Verified at 1440×900 and 375×812 against the static page: section and image sizes match exactly, and pixel differences are about 1%. The static page's button arrow is missing only because `file://` blocks the external SVG `<use>` reference.

## Provider handoff error

Switching this long thread from Claude to GPT in T3 Code failed twice with "Insufficient context allowance for the provider handoff". T3 Code has to pass the thread history to the new model, and the history didn't fit. T3 Code refused rather than truncate it, so nothing ran. For long threads, stay on one model or start a new thread with a short brief.

## Drupal AI investigation

Dejan asked which models Drupal AI can use, whether the Codex subscription can be used in it, whether `figma_canvas_ai` is a real Figma MCP, and how Drupal AI fits our workflow (Figma → static frontend → Canvas components). He asked me to install and set it up. The explanation page is `docs/ai/drupal-ai-explained.html`.

Findings:

- Drupal AI talks to providers through provider modules (OpenAI, Anthropic, Gemini, Bedrock, Azure, Ollama, LiteLLM, and others), always with API keys. API use is billed per token, separately from ChatGPT or Claude plans. No Drupal provider supports "Sign in with ChatGPT". Third-party subscription gateways exist but are unofficial, so they aren't suitable for a shared company site.
- The subscription is useful outside Drupal: Codex or Claude Code drives Drupal through drush, scripts, or the MCP Server module. The Alpina migration already works this way.
- `figma_canvas_ai` is a proof of concept with no stable release. It is instructions for GitHub Copilot, which reads Figma through Figma's own MCP server (`https://mcp.figma.com/mcp`). Codex and Claude Code can use that server directly.
- Canvas AI (the `canvas_ai` submodule of Canvas) is mainly useful for editors placing existing components on pages. Its component agent creates code components stored in Drupal, which conflicts with our components living in `frontend/`. AI Automators and AI Translate fit content work, such as FR/NL for Alpina.

Installed:

- Composer refused to add packages while core 11.4.9 had open security advisories (SA-CORE-2026-014 to 016). I updated core to 11.4.10 with `composer update 'drupal/core*' -W`, along with Symfony patch releases. `drush updb` found no pending updates.
- Added `drupal/ai` 1.5.1, `ai_agents` 1.3.5, `ai_provider_openai` 1.2.5, `ai_provider_anthropic` 1.2.2, `key` 1.22.0, and `mcp_server` 2.0.0-beta6. Enabled `key`, `ai`, `ai_agents`, both providers, `ai_api_explorer`, `canvas_ai` (which brings six Canvas agents), and `mcp_server`.
- API keys use the Key module's file provider: Key entities `openai_api_key` and `anthropic_api_key` read `keys/openai_api.key` and `keys/anthropic_api.key`. These files match the gitignored `/keys/*.key` pattern, so secrets stay out of the database, config exports, and chat. The relative path `../keys/...` was verified from drush with a temporary test value, which was then deleted.
- `drush mcp:server admin` answers the MCP handshake over STDIO but lists no tools. Tools need the Tool API ecosystem (`drupal/tool`, for example MCP Tools), which isn't installed.
- New configuration was not exported. `config/sync` already differs from active config in many files, and a full `drush cex` would also overwrite those.

The explanation page was then redesigned with the frontend-design skill. It now uses the full desktop width and centres on a route map of the five workflow stages, with bands showing which stages the coding-agent subscription covers and which Drupal AI covers per token. Dejan asked for a plain explainer for himself, not a landing page, so the large headline was replaced with a normal title and a short summary.

Still to do, for Dejan: put an API key in one of the key files, give Apache read access (`setfacl -m u:www-data:r keys/<file>`), choose the default chat model at `/admin/config/ai/settings`, and test in the API Explorer. Canvas AI with our headless components is untested until then.

## GLM via Z.ai

Dejan wants GLM-5.3 Flash from Z.ai, not Anthropic or OpenAI.

- The OpenAI provider accepts a custom host, but it only lists models whose IDs start with gpt, o1, o3, or o4 (`OpenAiProvider.php:791`), so it would hide GLM. The dedicated `ai_provider_zhipuai` module has one release from August 2025, mentions only GLM-4.5, and targets bigmodel.cn, so I didn't use it.
- Installed `ai_provider_openai_compatible` 1.2.1, which is stable and in maintenance mode, and enabled it. Its settings page is `/admin/config/ai/providers/openai-compatible`. Enabling it logs a schema warning for the module's own DeepSeek example parameters; those examples are now replaced.
- Configured endpoint `https://api.z.ai/api/paas/v4` and one model, `glm-5.3-flash`, for chat and translation, with system role, JSON output, structured response, and tool calling enabled. The endpoint and model ID come from secondary sources and still need confirming against Z.ai's own documentation.
- Key entity `zai_api_key` reads `keys/zai_api.key` (gitignored). GLM is now the default for chat, chat with tools, complex JSON, structured response, and translation. The Anthropic and OpenAI providers stay installed but have no keys and aren't used.
- Correction to my earlier answer: two Drupal providers can use subscriptions. `ai_provider_cli` runs host CLI tools such as Codex or Claude Code (development release only). `ai_anthropic_provider_oauth` uses a Claude subscription, and its own page warns this may break Anthropic's terms. The lesson and the explainer page still say subscriptions can't be used at all and need correcting.
- Dejan's Z.ai key belongs to a Coding Plan subscription. The pay-per-use address `api/paas/v4` returns error 1113 ("Insufficient balance or no resource package") as HTTP 429, which the OpenAI client reports as a rate limit. bigmodel.cn returns the same error. At his request, the endpoint is now the Coding Plan address `https://api.z.ai/api/coding/paas/v4`. Z.ai sells that plan for coding tools, so this is acceptable for lab testing only; a client site needs pay-per-use credit and the `api/paas/v4` address.
- Verified through Drupal: a chat request returned "GLM works" in 2.3 s. A direct tool-calling test returned a correct `place_component` call. The model spends most output tokens on reasoning (41 of 54).
- First Canvas AI test: Dejan asked "what model are you?" and the orchestrator also generated a meta description and wrote it to page 16's unpublished draft. The published page has no description. The draft value contains a typo ("Innfarben" for "Innenfarben") and HTML-escaped ampersands (`&amp;`). Cause: the orchestrator prompt only allows proactive title/description generation alongside page building (its Rule #4), but Canvas adds "Page description is empty. GENERATE SUITABLE DESCRIPTION FOR THE PAGE." to every request's context, and GLM-5.3 Flash followed that. The orchestrator also can't name its model; it only knows its role.
- Dejan suspected the instructions, not the model, and he was right. Canvas wraps every user message in a `<context>` block built in PHP (`CanvasAiPageBuilderHelper::generateVerboseContextForOrchestrator()`). With an empty description it says "GENERATE THE DESCRIPTION FOR THE PAGE using canvas_metadata_generation_agent. This is a **CRITICAL** step to ensure that request is successful." That contradicts the orchestrator's Rule #4, which allows proactive generation only together with page building. All six agent prompts and an explanation are in `docs/ai/canvas-ai-instructions/`. Possible fixes: fill in the description, add a rule to the orchestrator prompt, or patch the context builder and report it upstream.
- Follow-up check, after Dejan asked whether I had looked at the agent pages and tools: I had read only the prompts, descriptions, and tool lists. I then checked the full agent settings (all defaults), the framework's prompt assembly (system prompt, then the run count, then the context tool output), event subscribers (none active), all 20 tool definitions (`tools.md`), and the component list the page builder receives (`component-context.txt`). All Alpina components are in that list, but each is described only by its name, because the Component Description Settings page was never saved. The shell, header, and footer are offered as placeable components too. I did not open the admin pages in a browser; they show the same configuration.
- Previously untested until the key exists: requests to Z.ai, and Canvas AI's behaviour with a flash model. Canvas recommends GPT or Claude Sonnet-class models.

## Decision: Drupal AI not needed for now

After testing Canvas AI and the API Explorer, Dejan decided the team doesn't need Drupal AI for now. Locally, the coding agent covers both building components and placing them on pages (the "editors build pages" stage), with reviewable, re-runnable scripts. Drupal AI could become relevant once the client's editors work on the site without a coding agent, for example for FR/NL translation drafts and alt text. That is a client-project decision, not a lab task.

The AI modules stay installed and configured with GLM on the Z.ai Coding Plan address; nothing runs unless someone uses the AI button in Canvas. At Dejan's request I cleared the faulty description Canvas AI wrote from page 16's unpublished draft. The draft's seven components and other edits are unchanged, and the published page never had a description.

## Automation options for Tibor

Dejan asked what our options are for automating the static frontend to Canvas process, reliably and without surprises, because Tibor will ask. Wrote `docs/automation-options.md` from the surprises recorded in these notes: SCSS drift, a misleading source map, missing Swiper CSS, false vision-diff differences, JSON:API field naming, Canvas schema rules, component version upgrades, and draft preservation.

Conclusion: AI output varies between runs, so reliability has to come from deterministic checks and human approval points. Five options, from current practice to unattended runs, with Drupal AI and Canvas AI ruled out. Recommendation: for the client project, current practice plus a per-section mapping plan approved before building; next, one verification command per section (rough estimate one or two days); then a staged pipeline next to dm-frontend, using its section list as the handover. Effort figures are rough estimates, not measured.

## Approval fatigue

Dejan objected to the per-section mapping plan approval: he doesn't read the approval documents of his own Figma-to-static pipeline either, approves them, and later complains to the agent about things that may have been in the document. Revised option 3 in `docs/automation-options.md`: conventions decided once per project, exception-only questions with a recommended answer, approval before building only for hard-to-undo changes (content types, fields, migrations), side-by-side visual review afterwards, and every complaint turned into a skill rule or a check. The same may apply to the dm-frontend pipeline's gates.

## Discovery stage plan

Dejan rejected a once-per-project conventions list: it assumes the developer already knows the project, and developers on the client project won't. He asked for a discovery stage instead:
- a static inventory (sections by BEM block and SCSS partial, global sections, variants such as `alpinaweiss.html` and `alpinaweiss-video.html` being one page type with an image/video hero)
- a Drupal inventory (content types and fields, nodes, vocabularies, menus, media, Canvas components, variants, pages)
- a mapping between the two, with a status per component
- an HTML report with the date and developer name, a short "to be created in Drupal" list as the only approval, a card per component with a static screenshot, and a pages × components grid to work page by page

Inventories are made by scripts so they are repeatable; the mapping is AI-proposed and marked as such. Dejan approved the plan. The next agent builds a prototype on the Alpina lab; the handoff is in `/tmp/headless-lab-discovery-handoff.md`.

## Discovery report, second version

Dejan found the first report unclear: picking a page dimmed the other components instead of hiding them. He asked whether a framework such as React or Svelte is needed. Review of the other agent's prototype in `discovery/`:
- The scripts and data were sound: 11 pages grouped into 8 page types, with video pages as variants, and a live Drupal inventory.
- The presentation had problems:
  - the filter worked by static file, not page type
  - cards were sorted alphabetically, not in page order
  - shared components repeated in full on every page
  - variants were shown as raw class lists
  - counts and the build order were typed into the code

Decision: no framework, because the interaction is simple and React or Svelte would add a build step and dependencies. That would change if developers start editing and saving decisions in the report. I split data from view:
- `report.py` now only assembles JSON.
- `discovery/report-template.html` renders it with plain JavaScript and hash routes (`#/overview`, `#/page/<id>`, `#/decisions`, `#/global`, `#/inventory`).

A page view shows only that page type's sections, top to bottom. It describes variants in plain words ("index-video.html: alpina_hero uses video instead of image"). Global and reused components collapse to one line that points to the page where they are first built. The build order and project name moved into `mapping.json`.

Verified in Chromium: no JavaScript errors, Homepage shows 6 full rows and 2 one-line rows, Alpinaweiss 5 and 4, and no horizontal overflow at 390 px on any view. The screenshots are still full PNGs (15 MB in total), which could be shrunk.

## Drupal AI course

Dejan asked for a new page using the `/teach` skill. The skill expects a teaching workspace in the current directory. I put it in `docs/ai/`, next to the explainer, so the files don't spread across the Drupal project root.

- `MISSION.md`: drafted from this session's context (the client project around 22 October, and deciding where Drupal AI helps). Dejan hasn't confirmed it yet.
- `RESOURCES.md`: official docs, the Drupal Slack #ai and #ai-initiative channels, and the AI issue queue. Gaps: no source on Canvas AI with headless components, and none on realistic costs.
- `assets/course.css` and `assets/quiz.js`: shared by all lessons. The quiz gives instant feedback, and the recall box compares a written answer with a model answer.
- `lessons/0001-agent-or-drupal-ai.html`: routes AI tasks with one question, "where does the result live?" It has seven scenario questions and a recall prompt, and asks Dejan to route three real tasks from the client project.
- `reference/routing.html`: a printable cheat sheet for the same rule.
- `learning-records/0001`: records that he already knows the Canvas headless workflow, so lessons start from how Drupal AI differs from it.
- Planned next lesson: connecting a provider and choosing default models, using the API key step in headless-lab.

## Status

Dejan decided not to build further components in this test project. The remaining homepage section (legal footnotes) and the other source pages stay unbuilt. The client project will use the skill.

## Discovery prototype

Dejan asked for a handoff so another agent could continue, and I built the agreed discovery prototype on the Alpina lab.

What was built, all under `discovery/`:

- `static-inventory.py`: parses the 11 static pages (read-only, no edits to `alpina-be-frontend`). Result: 8 page types (the three video pairs group correctly), 23 sections, `navigation` and `footer` global, every section matched to its SCSS partial. Variants carry the first structural token difference, which reads plainly (hero `MEDIA:video` vs `MEDIA:picture`, text-image left/right instances). One parser bug fixed along the way: void elements (`img`, `source`) must not count for nesting depth.
- `drupal-inventory.php`: read-only drush script writing the same JSON schema the report consumes. Two bugs fixed against live Drupal: versions live on the `Component` entity (`js.<machine>`), not on `JavaScriptComponent`; `getContentEntityReferenceProps()` returns name-to-definition pairs. Live result: product type with 20 published nodes and 10 fields, article/review empty, main menu 3 links, footer 4 `<nolink>` placeholders, 9 Alpina components, variant `alpina`, pages 16 (7 components) and 17 (4). The database was down at the start of the session and came back later; nothing in the scripts depends on that.
- `mapping.json`: my status proposals per section (7 ready, 12 component-only, 4 needing a Drupal decision), checked against the `dm-static-frontend-to-drupal-canvas-headless` skill rules. The slider uses `numberOfProducts` with `field_slider_weight` ordering, not slots; only the full-width teaser uses a slot.
- `screenshots.js` + `report.py`: 27 section screenshots at 1440px (sticky header hidden except for its own shot) and `out/discovery-report.html` with the date, developer name, the five-item "to be created in Drupal" approval, one card per component, a pages × components grid with a page filter, and the script-generated Drupal inventory. Verified headless: 23 cards, no JS errors, filter dims correctly.
- `out/static.json`, `out/drupal.json`, `out/shots/`, `out/discovery-report.html`: generated evidence, not hand-written.

Open report: `discovery/out/discovery-report.html`. Rebuild: run the two inventory scripts, the screenshots (needs a static file server, Playwright Chromium is already in the screenshot host), then `report.py`. `docs/automation-options.md` option 3 now points at discovery instead of the conventions list. Not yet done: mobile screenshots.

Dejan's verdict on the report is still pending.

Dejan asked why the Drupal inventory listed the Administration menu. The inventory script exported every menu, including admin UI menus. It now skips `admin`, `account`, `tools`, and the Navigation module's menus (`content`, `navigation-user-links`), and lists them under `menus_skipped`. Site and custom menus stay, so only `main` and `footer` remain here. I also removed a header comment that referred to a non-existent `drupal-inventory-from-config.py`. The inventory was rerun with no errors, and the report was rebuilt.
