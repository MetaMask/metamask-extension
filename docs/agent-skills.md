# Agent Skills

Shared engineering patterns, rules, and conventions that AI coding agents use when working on this repo. Skills live in `.agents/skills/` (per the Agent Skills standard), with adapter copies at `.claude/skills/` (Claude Code) and `.cursor/rules/` (Cursor).

Two tiers:

| Tier                   | Location                                | Purpose                                                             | Who maintains              |
| ---------------------- | --------------------------------------- | ------------------------------------------------------------------- | -------------------------- |
| **Repo skills**        | `.agents/skills/<slug>/`                | MetaMask-specific patterns (A/B testing, E2E tests, etc.)           | Core contributors, via PR  |
| **Engineering skills** | Synced from `metamask-extension-skills` | Cross-repo patterns (commit conventions, tooling preferences, etc.) | Captured live by engineers |

## Capturing a new skill

During any Claude Code or Cursor session:

```
/remember "always use GH_USER=$(gh api user --jq .login) — never clobber $USER in scripts"
```

This writes to `metamask-extension-skills`. It surfaces in this repo on the next sync.

To fix an existing skill:

```
/patch <slug> "correction or addition"
```

To scan the current session for uncaptured learnings:

```
/backfill
```

These commands require the `gh` CLI authenticated with write access to `metamask-extension-skills`.

## Syncing skills

Pull the latest cross-repo skills into this repo:

```bash
yarn skills:sync
```

This updates `.agents/skills/`, `.claude/skills/`, and `.cursor/rules/` with the latest stable skills. Commit the result and open a PR, or let the skills-sync bot handle it on its next run.

To pin to a specific release:

```bash
yarn skills:sync:pinned v2026.04.20
```

## Configuring the source repo

The upstream skills repo is configured in `.skills/CONFIG`:

```
skills_repo=https://github.com/MajorLift/metamask-extension-skills.git
skills_ref=main
```

To migrate to a different upstream (e.g. a ConsensysOrg-hosted repo), update `skills_repo` here — no other files need changing. `skills_ref` can be a branch, tag, or full SHA for supply-chain pinning.

## Auto-refresh

If you have run `yarn githooks:install`, the `post-merge` hook refreshes skills automatically when `git pull` merges new commits and the last sync is >7 days old. Set `SKILLS_SKIP_AUTOSYNC=1` to disable.

Check your current sync state:

```bash
cat .skills/VERSION
# synced_ref=main
# synced_sha=abc1234...
# synced_at=2026-04-20T15:32:11Z
```

## Adding a repo skill

Repo skills live alongside cross-repo skills in `.agents/skills/<slug>/SKILL.md`. Use the [existing skills](../.agents/skills/) as templates. The frontmatter schema:

```yaml
---
name: <slug>
description: One-line description of when to invoke this skill.
---
```

Open a PR with the new `.agents/skills/<slug>/SKILL.md` + a corresponding `.claude/skills/<slug>/SKILL.md` and `.cursor/rules/<slug>.mdc`.
