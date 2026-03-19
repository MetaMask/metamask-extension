# Autoresearch: Local Setup — E2E Setup Time Optimization

Autonomous optimization of E2E test setup time in OpenCode or Cursor. Based on [Karpathy's autoresearch](https://github.com/karpathy/autoresearch) and [Joao's MetaMask build optimization](https://github.com/MetaMask/metamask-extension/compare/cryptotavares/autoresearch-experimentation-100-iterations).

## Goal

Reduce the time from starting an E2E test until the extension is ready (browser open, extension injected, `waitForControllers` loaded). We measure this by running the first send-eth test — setup dominates the total duration.

## Prerequisites

- Node.js >=24.13 (run `nvm use` before first run)
- Yarn (`corepack enable`)
- Chrome or Firefox (for E2E tests)
- `zip` installed (for Firefox XPI optimization; optional — falls back to unpacked if missing)

## Quick Start

### 1. Build the test extension (one-time)

```bash
# For Chrome (default benchmark)
yarn build:test

# For Firefox
yarn build:test:mv2
```

### 2. Establish baseline

```bash
chmod +x development/autoresearch/*.sh
./development/autoresearch/autoresearch.sh
# Or for Firefox: ./development/autoresearch/autoresearch.sh firefox
```

This runs the first send-eth test and records `setup_time_seconds` in `results.tsv`.

### 3. Run experiments

1. Open the repo in **OpenCode** (or Cursor) — your model is already selected
2. Prompt:

   ```
   Read development/autoresearch/program.md and run the next experiment.
   ```

3. The agent will:
   - Read the objective and ideas backlog
   - Make ONE code change to one of the 5 allowed files
   - Run `./development/autoresearch/run-experiment.sh chrome "description of change"` (benchmark + auto-commit with experiment number + description)
   - Update `autoresearch.ideas.md`

4. Repeat step 2 for more iterations.

## Files

| File | Purpose |
|------|---------|
| `program.md` | Agent instructions — read this first |
| `autoresearch.md` | Objective, metrics, constraints, strategy |
| `autoresearch.ideas.md` | Ideas backlog (agent maintains) |
| `autoresearch.sh` | Benchmark runner — run after each change |
| `autoresearch.checks.sh` | Scope/correctness gate (run before benchmark) |
| `results.tsv` | Experiment log (auto-generated, gitignored) |

## Allowed Files (agent may modify)

- `test/e2e/webdriver/chrome.js`
- `test/e2e/webdriver/firefox.js`
- `test/e2e/helpers.js`
- `test/e2e/webdriver/driver.js`
- `test/e2e/webdriver/index.js`
- `development/autoresearch/autoresearch.ideas.md`

## Commit on Every Improvement

When `setup_time_seconds` improves, the agent commits with:

```
autoresearch: experiment N — Xs (-Ys) — <short description>
```

Example: `autoresearch: experiment 3 — 48s (-4s) — Firefox XPI caching`

## Troubleshooting

- **No dist/**: Run `yarn build:test` (Chrome) or `yarn build:test:mv2` (Firefox) first
- **zip not found**: Firefox optimization falls back to unpacked dir (slower). Install `zip` for full benefit
- **Test fails**: Revert with `git checkout -- .` and try a different idea
