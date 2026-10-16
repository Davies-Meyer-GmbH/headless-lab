# Drupal AI Resources

## Knowledge

- [Drupal AI documentation (1.5.x)](https://project.pages.drupalcode.org/ai/1.5.x/)
  Official docs for the AI module: providers, operation types, default models per operation type, the Key module. Use for: how Drupal AI is wired and configured.
- [Drupal AI project page](https://www.drupal.org/project/ai)
  Releases, submodules, and the list of provider modules. Use for: versions, compatibility, which submodules exist or moved out.
- [Provider matrix](https://project.pages.drupalcode.org/ai/providers/matris/)
  Which provider supports which operation types. Use for: choosing a provider for a feature.
- [Canvas AI assistant documentation](https://project.pages.drupalcode.org/canvas/ai-assistant)
  Setup, prompt behaviour, limitations, and token cost of Canvas AI. Use for: anything about editors building pages with AI.
- [AI Agents documentation](https://project.pages.drupalcode.org/ai/agents/)
  How agents and their tools are configured. Use for: the Canvas agents and the content type, field, and taxonomy agents.
- [AI Automators documentation](https://project.pages.drupalcode.org/ai/modules/ai_automators/)
  Filling fields automatically. Use for: alt text, summaries, and other content upkeep.
- [MCP Server module](https://www.drupal.org/project/mcp_server)
  Exposes Drupal to MCP clients over STDIO or HTTP. Use for: letting outside agents work with Drupal without a shell.
- [Figma MCP server documentation](https://developers.figma.com/docs/figma-mcp-server/local-server-installation)
  How agents read Figma designs. Use for: the Figma to static frontend stage.
- [Docker documentation on the ChatGPT provider](https://docs.docker.com/ai/docker-agent/providers/chatgpt.md)
  States that ChatGPT plans and API use are billed separately. Use for: the subscription versus API key question.

## Wisdom (Communities)

- [Drupal Slack, #ai and #ai-initiative channels](https://www.drupal.org/slack)
  The Drupal AI maintainers and contributors are active here ([initiative update](https://www.drupal.org/node/3606215)). Use for: questions the docs don't answer, such as Canvas AI with headless components.
- [AI module issue queue](https://www.drupal.org/project/issues/ai)
  Bug reports and known issues. Use for: checking whether a problem is already known before relying on a feature.

## Gaps

- No source yet confirms whether Canvas AI works with externally registered (headless) JS components. Needs a real test in headless-lab.
- No source gives realistic monthly cost figures for Canvas AI use by editors.
