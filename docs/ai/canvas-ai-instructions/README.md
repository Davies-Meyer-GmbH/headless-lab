# What Canvas AI sends to the model

These are the instructions Canvas AI 1.12.0 sends to the model, exported from headless-lab on 15 October 2026. The model is GLM-5.3 Flash through Z.ai.

## Three layers

1. **The agent's system prompt.** Each agent has one, stored as configuration (`ai_agents.ai_agent.<id>`). Editable at `/admin/config/ai/tools-automation/agents`. Full text in this folder:
   - `canvas_ai_orchestrator.md`: the agent you chat with. It answers questions itself and passes work to the others.
   - `canvas_page_builder_agent.md`: places existing components on a page.
   - `canvas_template_builder_agent.md`: builds a whole page from components.
   - `canvas_component_agent.md`: writes new code components and stores them in Drupal.
   - `canvas_title_generation_agent.md` and `canvas_metadata_generation_agent.md`: write the page title and meta description.
2. **A context block added to every message.** This text comes from PHP, not configuration: `CanvasAiPageBuilderHelper::generateVerboseContextForOrchestrator()` in `web/modules/contrib/canvas/modules/canvas_ai/src/CanvasAiPageBuilderHelper.php`. Configuration can't change it.
3. **Your message.**

The AI Agents framework (`AiAgentEntityWrapper::getSystemPrompt()`) builds each agent's final system prompt as: its system prompt, then "This is the first time that this agent has been run.", then the output of its context tools. Nothing else changes the prompts. No listener is registered for the agents' prompt event (`ai_agents.pre_system_prompt`); the only module that would add one, `ai_assistant_api`, is disabled. Three listeners run before every request (`ai.pre_generate_response`): global guardrails, moderation, and guardrails. They do nothing here because none is configured.

Context tools run before the model is called, and their output goes into the system prompt:

| Agent | Context tools |
|---|---|
| Page builder, template builder | `get_current_layout` (the page), `get_component_context` (all available components, about 16,000 characters here) |
| Component agent | `get_props_type` (Canvas prop types) |
| Title and metadata agents | `get_entity_information`, `get_page_data` |

Other files in this folder:

- `tools.md`: all 20 tool definitions (name, description, parameters) as the model receives them, and which agent uses each.
- `component-context.txt`: the component list the page and template builders receive.

## The message the model received

For "what model are you?" on page 16, which then had a title but no description, the orchestrator received this as the user message. It is reconstructed from the code (`generateVerboseContextForOrchestrator()` and `formatMessageWithContext()`), not captured from the request:

```
<context>
The user is currently working on a canvas_page entity. User has not selected any particular component from the page. Page title: Alpina homepage. Page description is empty. GENERATE THE DESCRIPTION FOR THE PAGE using canvas_metadata_generation_agent. This is a **CRITICAL** step to ensure that request is successful.
</context>

<user_message>
what model are you?
</user_message>
```

Canvas AI saved that description to page 16's unpublished draft, with a typo ("Innfarben") and an escaped `&amp;`. It has since been cleared, so page 16 again has no description, and a new request there would get the same "GENERATE THE DESCRIPTION" instruction.

## Why it wrote a description

The two layers disagree:

- The orchestrator's system prompt, Rule #4, says to generate a title or description on its own **only** when it also calls the page builder or template builder, and the only allowed answer to a general question is a reply.
- The context block, sent with every message, says the description is a **CRITICAL** step for the request to succeed, whatever the request is.

The context arrives inside the user message, closer to the question, and in stronger words. GLM-5.3 Flash followed it. A stronger model might weigh the two and follow Rule #4, but the contradiction is in Canvas AI's code, not in the model.

The same happens with an empty or "Untitled page" title: the context then demands a title too.

## What the component list shows

- All our Alpina components are in it, plus some Drupal blocks (branding, breadcrumb, menus, messages) and the `navigation` SDC.
- Every description is just the name: `js.alpina_store_logo` is described as "Alpina Store Logo", and each prop as its machine name. The Component Description Settings page (`/admin/config/ai/canvas-ai-component-description-settings`) has never been saved, so Canvas AI has no guidance on when to use which component.
- `alpina_shell`, `alpina_header`, and `alpina_footer` are offered as placeable components, although they belong only in the page variant. The page builder could place a second header or footer inside page content.

## Agent settings checked

For every Canvas agent, the remaining settings are defaults: no tool is set to return directly or required, there are no usage limits or description overrides, no structured output, and no guardrails. Hostname filtering is on for every agent except the component agent, which ships with it off (the known workaround for creating code components). The orchestrator is the only orchestration agent; it and the builders allow 10 loops, the title and metadata agents 5. `canvas_ai.settings` sets a 300-second timeout and keeps the last 10 chat messages as history.

## Ways to fix it

- **Fill in the page description.** Once a description exists, the context only reports it and gives no instruction. Page 16 has none. Real pages need descriptions anyway.
- **Add a rule to the orchestrator's system prompt**, such as: "The context block describes the page state. Its instructions to generate a title or description apply only when you are also calling the page builder or template builder. Never generate them for questions." Editable in the UI, but Canvas updates may overwrite it.
- **Write component descriptions and disable the shell, header, and footer** for Canvas AI on the Component Description Settings page. This is separate from the description problem but affects every page-building request.
- **Patch `generateVerboseContextForOrchestrator()`** to report the empty description as a fact without an instruction, and report it upstream in the Canvas issue queue. Durable, but it's a core module patch.
