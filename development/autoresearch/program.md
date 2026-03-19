# Autoresearch Program — E2E Setup Time

You are running an autonomous optimization loop to reduce E2E test setup time for the MetaMask extension.

## Your Task

Each iteration, you will:

1. **Read** `development/autoresearch/autoresearch.md` (objective, metrics, constraints)
2. **Read** `development/autoresearch/autoresearch.ideas.md` (backlog)
3. **Pick ONE** untried idea (or propose a new one)
4. **Make a SINGLE** code change to one of the 5 allowed files:
   - `test/e2e/webdriver/chrome.js`
   - `test/e2e/webdriver/firefox.js`
   - `test/e2e/helpers.js`
   - `test/e2e/webdriver/driver.js`
   - `test/e2e/webdriver/index.js`
5. **Run** the benchmark (either option):
   - **Option A**: `./development/autoresearch/run-experiment.sh` — runs benchmark, auto-commits if improved or reverts
   - **Option B**: `./development/autoresearch/autoresearch.sh` — runs benchmark only; you commit or revert manually
6. **Update** `autoresearch.ideas.md`: move the idea to "Tried — Successful" or "Tried — Failed" with a one-line summary

## Rules

- **One change per experiment** — Do not modify multiple things at once
- **Do NOT** modify `package.json`, `yarn.lock`, or frozen files
- **Do NOT** create new test files — use send-eth only
- **Always** update the ideas backlog after each experiment

## Current Best

Check `development/autoresearch/results.tsv` for the best `setup_time_seconds` so far. If the file is empty or doesn't exist, the first successful run establishes the baseline.

## How to Run (User)

1. Open this repo in OpenCode (or Cursor) — no API keys or model config needed
2. Prompt: **"Read development/autoresearch/program.md and run the next experiment"**
3. The agent will make a change, run the benchmark, and commit or revert
4. Repeat step 2 for more iterations
