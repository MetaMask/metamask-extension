# Release Test Plan Generator

Release branches use the format **release/X.Y.Z** (e.g. `release/13.18.0`), and the release PR is opened against **stable**. When a release branch is created, you can generate an **exploratory regression test plan** in Markdown. The document lists what gets **incorporated into that release** (compared to stable): PRs from the CHANGELOG, grouped by focus area (Swaps, Perps, Assets, etc.), plus a template for test setup and exploratory charters. This makes it easy for anyone—QA or an agent—to see what the release includes and how to verify it.

## Quick start

```bash
# Use latest release branch on origin (default)
yarn generate:release-test-plan

# Or specify the release branch
yarn generate:release-test-plan --release-branch=release/13.18.0
```

Output is written to `docs/exploratory-testing-plan-<version>.md` by default.

## Options

| Option | Description |
|--------|-------------|
| `--release-branch=release/X.Y.Z` | Optional. Release branch name. **Default: latest release branch on origin.** |
| `--baseline=<branch>` | Optional. Comparison baseline (default: **stable**). The release PR targets stable, so the plan shows what is incorporated into the release. Used for git merge-commit fallback when CHANGELOG is not used. |
| `--output=<path>` | Optional. Output file path. Default: `docs/exploratory-testing-plan-<version>.md` |
| `--no-changelog` | Optional. Skip CHANGELOG; use only git merge commits to list PRs (useful if CHANGELOG is not yet updated). |
| `--print-prompt` | Optional. After writing the draft, print the AI agent prompt and draft path so an agent can expand the draft into a full test plan. |

## Examples

```bash
# Latest release branch (from origin), baseline = stable
yarn generate:release-test-plan

# Specific release branch
yarn generate:release-test-plan --release-branch=release/13.18.0

# Custom output path
yarn generate:release-test-plan --release-branch=release/13.18.0 --output=docs/exploratory-testing-plan-13.18.0.md

# Release branch just created; CHANGELOG not updated yet — use git merge commits only (stable..release/13.19.0)
yarn generate:release-test-plan --release-branch=release/13.19.0 --no-changelog
```

## What the document contains

1. **Inputs reviewed** – Release branch, baseline (stable = release PR target), and data sources (CHANGELOG / git).
2. **PR inventory by focus area** – PRs grouped into:
   - Swaps / Bridge  
   - Perps  
   - Predictions  
   - Mobile Core UX  
   - Assets  
   - Other / General  

   Grouping is done by keyword matching on the CHANGELOG entry text. You can edit the generated file to move PRs or add charters.

3. **Test setup and data** – Build target, accounts, networks, feature flags, deep links.
4. **Exploratory charters** – Placeholder charters per area; you or an **AI agent** can replace them with concrete steps (see below).
5. **Exit criteria** – No P0/P1 defects, verification in at least one view, regressions documented.

## Using an AI agent to generate the full test plan

The script only produces a **draft** (PR inventory + placeholder charters). To get a **full exploratory test plan** with concrete verification steps, use an AI agent and the dedicated prompt:

1. **Generate the draft**
   ```bash
   yarn generate:release-test-plan
   ```
   This writes `docs/exploratory-testing-plan-<version>.md`.

2. **Get the prompt for the AI**
   - Open **[docs/prompts/release-test-plan-agent.md](./prompts/release-test-plan-agent.md)** in this repo. It contains the exact prompt and instructions.
   - Or run with `--print-prompt` to print the prompt and the draft path:
     ```bash
     yarn generate:release-test-plan --print-prompt
     ```

3. **Run the agent**
   - In Cursor (or ChatGPT, Claude, etc.), send the **"Prompt for the AI"** from that file.
   - Attach or paste the **draft document** (the generated MD) as input.
   - The agent should return the same document with the "Exploratory charters" section replaced by concrete, actionable charters and steps (and optionally an updated "Test setup and data").

4. **Save the result**
   - Save the agent’s output as the final test plan (e.g. overwrite the draft or save to the same path).

Reference `docs/exploratory-testing-plan-13.18.0.md` for the expected style and depth of charters.

## When to run it

- **Via an agent:** When a release branch or release PR is created, you can ask an AI agent (e.g. in Cursor) to generate the test plan: the agent runs `yarn generate:release-test-plan` (optionally with `--release-branch=release/X.Y.Z`), can expand the charters using the prompt in `docs/prompts/release-test-plan-agent.md`, and can commit and push the file. No GitHub workflow is required.
- **Manually:** Run `yarn generate:release-test-plan` yourself, then optionally use the agent prompt to expand the charters and commit.
- **After updating the release CHANGELOG** – Re-run the script and commit to refresh the PR list and groupings.

## Extending focus areas

Focus areas and their keywords are defined in `development/generate-release-test-plan.ts` in the `FOCUS_AREAS` array. To add or change areas (e.g. new product areas or different keywords), edit that array and re-run the script.
