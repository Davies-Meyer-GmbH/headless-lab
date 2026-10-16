@AGENTS.md

## Subagents and cost (Claude Code)

When running as Sonnet 5.5, delegate suitable jobs to Haiku 5.5 subagents (Agent tool with `model: "haiku"`) to keep usage cost down. This counts as the user's explicit request to use subagents for these jobs.

Good jobs for Haiku:

- Searching the codebase or config for files, names, or usages.
- Reading long files, logs, or command output and reporting the relevant part.
- Running commands such as lint, type-check, drush queries, or curl checks, and reporting the results.
- Simple, mechanical edits that are fully specified in the brief.

Keep on Sonnet:

- Design decisions, multi-file changes, debugging, and anything that needs this conversation's context.
- Reviewing what Haiku returns before acting on it or reporting it to the user.

Give each Haiku subagent a self-contained brief: paths, the exact question, and the expected output format. Don't delegate a job that is quicker to do directly with one or two tool calls.
