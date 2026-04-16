# .github/AGENTS.md — CI & Workflow Agent Instructions

<!--
  Cross-compatibility note
  ========================
  This file provides CI-specific instructions for AI coding agents.

  Different agent frameworks discover instructions through different mechanisms:

  - **Claude Code**: Reads AGENTS.md files from every directory, inheriting
    parent AGENTS.md content automatically. Placing this file in `.github/`
    means it applies when making changes to `.github/` files.
  - **Cursor**: Reads AGENTS.md files at the repo root and in subdirectories.
    Same discovery behavior as Claude Code for this pattern.
  - **VS Code Copilot**: Loads the root AGENTS.md (attached to the system
    prompt). The root file references this one, so agents can open/read it
    using their available file-reading tools when working on CI tasks.

  The root `AGENTS.md` includes a reference to this file under
  "Comprehensive Guidelines Location" so that all agent frameworks can
  find it.
-->

> **Scope:** Only follow the sections below when editing workflow files
> under `.github/workflows/`, CI-related scripts in `.github/scripts/`,
> or CI configuration (e.g., `.github/rules/`). For other `.github/`
> changes (issue templates, CODEOWNERS, PR templates, etc.) this file
> does not apply.

---

## Proactive CI Monitoring

When making changes to CI workflows — or any code that will be validated by
CI — you should **proactively offer to monitor workflow runs** rather than
asking the user to check GitHub manually. You have all the tools needed via
the `gh` CLI.

> **Prerequisite:** Ensure the `gh` CLI is authenticated and authorized for
> the target repository (e.g., run `gh auth status`, or set
> `GH_TOKEN`/`GITHUB_TOKEN` with at least `repo` and `workflow` scopes).

### Monitoring Workflow Runs

**List recent workflow runs:**

```bash
gh run list --repo {owner}/{repo} --limit 10
```

**Watch a run in real-time (blocks until complete):**

```bash
gh run watch {run_id} --repo {owner}/{repo}
```

**View a specific run's results:**

```bash
gh run view {run_id} --repo {owner}/{repo}
```

**View failed jobs:**

```bash
gh run view {run_id} --repo {owner}/{repo} --json jobs \
  --jq '.jobs[] | select(.conclusion == "failure") | {name, conclusion}'
```

**Read failure logs:**

```bash
gh run view {run_id} --repo {owner}/{repo} --log-failed
```

**Rerun failed jobs:**

```bash
gh run rerun {run_id} --failed --repo {owner}/{repo}
```

### Inspecting Commit Statuses and Check Runs

**Commit statuses on a SHA:**

```bash
gh api "repos/{owner}/{repo}/commits/{sha}/statuses" \
  --jq '.[] | {context, state, description, created_at}'
```

**Combined status (statuses + check runs):**

```bash
gh api "repos/{owner}/{repo}/commits/{sha}/status" \
  --jq '{state: .state, statuses: [.statuses[] | {context, state}]}'
```

**Check suites for a SHA:**

```bash
gh api "repos/{owner}/{repo}/commits/{sha}/check-suites" \
  --jq '.check_suites[] | {id, app: .app.slug, status, conclusion}'
```

### Inspecting the Merge Queue

**View current merge queue entries:**

```bash
gh api graphql -f query='
  query {
    repository(owner: "{owner}", name: "{repo}") {
      mergeQueue(branch: "main") {
        entries(first: 10) {
          nodes {
            position
            state
            headCommit { oid }
            pullRequest { number title }
            enqueuedAt
          }
        }
      }
    }
  }
'
```

**Merge queue branch format:** `gh-readonly-queue/{base}/pr-{N}-{sha}`

To extract the PR number from a merge queue branch name:

```bash
if [[ "$BRANCH" =~ gh-readonly-queue/[^/]+/pr-([0-9]+)- ]]; then
  PR="${BASH_REMATCH[1]}"
fi
```

### Behavioral Guidance

1. **Offer to monitor** — After pushing code or when a PR enters the merge
   queue, proactively say "I can watch the CI run if you'd like" rather than
   waiting to be asked.
2. **On failure, diagnose immediately** — Use `gh run view --log-failed` to
   read failure logs and provide analysis without the user needing to open
   GitHub.
3. **Report concisely** — State which jobs failed, the likely cause, and
   whether a retry is appropriate.
4. **Check commit statuses** when debugging merge queue behavior — a
   "pending" required status can hold a PR in the queue.

---

## Modifying CI Workflows

### Key Concepts

- **`workflow_run` trigger**: Only executes YAML from the **default branch**.
  When testing changes to a `workflow_run`-triggered workflow, the updated
  YAML must be merged to the default branch before it takes effect. Changes
  on feature branches are ignored.

- **Merge queue (`merge_group` event)**: Runs on temporary branches. Test
  CI changes with merge queue runs, not just PR runs — behavior can differ.

- **`gh pr edit --add-label`**: Can silently fail in some contexts. Prefer
  the Issues API for reliable label management:

  ```bash
  gh api "repos/{owner}/{repo}/issues/{pr_number}/labels" \
    --method POST --field "labels[]=label-name"
  ```

### When Editing `.github/workflows/main.yml`

- Treat `main.yml` as an orchestrator/caller workflow: changes here can alter
  execution order, permissions, and required-check behavior across many jobs.
- If a reusable workflow or shared health-check job is invoked from `main.yml`,
  keep the caller's `permissions` aligned with the moved/added steps.
- If a rollup/aggregator job exists, ensure its dependency list tracks all
  jobs that should gate CI. Missing dependencies can hide failures.

### Adding New Jobs to Main Workflow

1. Add the job definition or reusable-workflow call
2. If an aggregator/rollup job exists, include the new job in its dependency
   list so failures are surfaced
3. Ensure permissions are explicit and least-privilege at the caller level
4. Test with both a PR run and a merge queue run

### Consolidating Standalone Workflows

**Anti-pattern:** Adding a new standalone `pull_request`-triggered workflow
that only runs a single short script or command. Every standalone workflow
spins up its own runner, which takes ~2–4 minutes of overhead before the
actual work starts. A check that takes 2 seconds to run ends up taking 3.5
minutes as a standalone workflow.

**When reviewing a PR** that adds a new workflow file, check whether it's
just a single short check. If so, suggest folding it into
[`repository-health-checks.yml`](.github/workflows/repository-health-checks.yml) instead.

**When authoring CI changes**, prefer adding steps to existing jobs over
creating new workflow files.

**How to consolidate:**

1. Identify the script or command the standalone workflow runs
2. Add it as a new step in [`repository-health-checks.yml`](.github/workflows/repository-health-checks.yml) (with
   `if: ${{ !cancelled() }}` so it runs even if earlier steps fail)
3. If the script needs extra permissions (e.g., `issues: write`), add
   them to the `permissions` block where `main.yml` calls the reusable
   workflow
4. Delete the standalone workflow file
5. Update CODEOWNERS if needed

**When a standalone workflow IS appropriate:**

- It needs to run on different events (e.g., `schedule`, `push`)
- It requires a different runner type or container
- It has complex matrix strategies or conditional job graphs
- It needs to report as a separate required status check
