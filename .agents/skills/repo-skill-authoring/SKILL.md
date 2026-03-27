---
name: repo-skill-authoring
description: Create and update repo-local skills that follow the MetaMask Extension standard. Use for new repo-local skills, skill entrypoints, or harness shims in this repository.
---

# Repo Skill Authoring

Canonical guidance for creating and updating repo-local skills in MetaMask Extension.

## Purpose

Use this standard when the repo needs a reusable agent workflow with stable instructions, validation, or harness shims.

Do not create a skill when one of these is enough:

- `AGENTS.md`, `test/e2e/AGENTS.md`, or another narrow repo guidance file
- Existing product or engineering docs in `docs/`
- A one-off prompt that does not need to be reused

Create a skill when the work is repeated, fragile, or benefits from a shared workflow across agents.

## When To Use This vs Native Skill Creator

Use the native or harness-provided `skill-creator` guidance for general skill design principles or when creating a skill outside this repository.

Use `repo-skill-authoring` for any MetaMask Extension repo-local skill that should live in `.agents/skills/`, `.claude/`, or other repo-owned harness folders. Cursor loads skills from `.claude/skills/` in this repository, so a separate `.cursor/skills/` shim is not needed.

If both apply, use native `skill-creator` for general design guidance, and use this skill as the source of truth for repository-specific structure, naming, and entrypoints.

## Harness Entrypoints

Use these entrypoints:

- Codex skill entrypoint: `.agents/skills/repo-skill-authoring/SKILL.md` (`$repo-skill-authoring`)
- Claude skill entrypoint: `.claude/skills/repo-skill-authoring/SKILL.md`
- Cursor skill entrypoint: `.claude/skills/repo-skill-authoring/SKILL.md`

## Repo Skill Shape

Required shape for a repo-local skill:

```text
.agents/skills/<skill-name>/SKILL.md
.agents/skills/<skill-name>/agents/openai.yaml
.claude/skills/<skill-name>/SKILL.md
```

Optional shape, when the workflow needs it:

```text
.agents/skills/<skill-name>/scripts/
.agents/skills/<skill-name>/references/
.agents/skills/<skill-name>/assets/
.claude/commands/<command-name>.md
.cursor/commands/<command-name>.md
```

Keep `.agents/skills/<name>/SKILL.md` as the single source of truth. Any harness-specific shim should point directly to it or to the shared SSOT document it references.

## Naming And Trigger Rules

- Skill folder names use lowercase letters, digits, and hyphens only.
- The folder name and `SKILL.md` frontmatter `name` must match exactly.
- The Codex `description` must say what the skill does and when to use it.
- Prefer names that describe the reusable workflow, not the implementation detail.
- Keep the skill focused on repo-local conventions that are not already handled by generic guidance.

## Agent Execution Standard

For agent implementation and review tasks, follow this workflow:

1. Define the user/problem shape.
   - Write down the jobs the skill should handle.
   - Prefer concrete trigger phrases and in-scope task examples.
2. Split the content deliberately.
   - Put the canonical workflow, conventions, and examples in `SKILL.md`.
   - Add `scripts/` only when deterministic validation or repeated logic is worth the maintenance cost.
   - Add `references/` only when detailed content should be loaded on demand instead of sitting in the skill body.
3. Add the canonical skill entrypoint.
   - Include frontmatter `name` and `description`.
   - Keep the file readable by both agents and humans.
4. Add the minimum harness entrypoints required.
   - Add `.claude/skills/<name>/SKILL.md`.
   - Cursor will use the `.claude/skills/<name>/SKILL.md` entrypoint in this repository.
   - Add command shims only if slash-command discovery materially improves ergonomics.
   - Point every shim directly back to the canonical artifact or shared SSOT document.
5. Sanity check the result.
   - Confirm the skill and any shims all point to the same workflow.
   - If a docs SSOT exists, keep the doc and skill wording aligned.

Authoring principle:

- Keep the repo skill as the canonical artifact. Avoid extra pointer layers unless they materially improve discovery or ergonomics.

Required agent response sections:

1. `Implementation Checklist`
2. `Files To Add Or Modify`
3. `Validation`
4. `Assumptions`

## Minimal Examples

### Canonical Repo Skill

```md
---
name: topic
description: Create and update the repo-local topic workflow. Use for new skill content or harness shims in this repository.
---

# Topic

## Purpose

Explain when this repo-local skill is needed and when existing repo docs are enough.

## Agent Execution Standard

1. Discover current implementation.
2. Apply repo-specific workflow.
3. Confirm any shims stay aligned.
```

### Cursor Or Claude Skill Entrypoint

```md
---
name: topic
summary: Create or update the repo-local topic workflow.
---

Follow `.agents/skills/topic/SKILL.md`.
```

### agents/openai.yaml

```yaml
interface:
  display_name: 'Topic'
  short_description: 'Create and validate the repo-local topic workflow.'
  default_prompt: 'Use $topic to create or update the canonical repo-local topic workflow.'
```
