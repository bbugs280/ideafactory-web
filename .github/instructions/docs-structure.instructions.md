---
description: "Use when creating, updating, or moving any Markdown (.md) documentation file. Enforces docs/ folder structure with topic subfolders."
applyTo: "**/*.md"
---
# Documentation Structure Rules

## All Markdown goes under docs/

Never create or update `.md` files at the repo root or inside source folders (e.g. `backend/`, `wix/`), except for `README.md` at the repo root.

Every other Markdown file must live under `docs/` in the appropriate subfolder:

| Content type | Path |
|---|---|
| Release notes, changelogs | `docs/releases/` |
| Project planning, roadmaps, decisions | `docs/project-management/` |
| API / endpoint reference | `docs/api/` |
| Architecture, system design | `docs/architecture/` |
| Setup and operations guides | `docs/ops/` |
| Wix / frontend integration | `docs/wix/` |

Add a new subfolder when none of the above fits — keep each subfolder focused on one topic.

## Check before creating

Before creating any new `.md` file:
1. Search `docs/` for an existing file covering the same topic.
2. If one exists, **update it** instead of creating a new file.
3. Only create a new file when the content is clearly distinct from all existing files.

## Naming

- Use lowercase kebab-case: `token-flow.md`, `deployment-guide.md`
- No spaces or uppercase in filenames
