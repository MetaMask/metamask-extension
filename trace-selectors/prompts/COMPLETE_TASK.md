# Complete task: update completed list, regenerate trace report, and commit

Use this prompt **after** a cloud agent (or you) has finished migration/selector work. It syncs the branch, records completed files, regenerates the trace report, and commits everything.

---

## Objective

1. Sync the branch with latest `main`.
2. Append **all modified/migrated file paths** to `trace-selectors/completed.txt`.
3. Regenerate the selector usage trace report (so it shows only **remaining** work).
4. **Stage and commit** all changes (including `completed.txt` and the updated report).

---

## Step 1: Update branch to latest main

From the repository root:

```bash
git fetch origin main
git merge origin/main
# Resolve any merge conflicts if they occur.
```

(Or use your workflow’s equivalent, e.g. `git pull origin main`.)

---

## Step 2: Update `trace-selectors/completed.txt`

- **Input:** The set of files that were **modified or created** as part of the completed work (e.g. files you migrated, or that now use the new selectors).
- **Action:** Append each of those file paths to `trace-selectors/completed.txt`, **one path per line**.
- **Format:**
  - Paths must be **relative to the repository root**.
  - Use forward slashes (e.g. `ui/components/foo/bar.tsx`).
  - Do **not** add paths that are already listed in `completed.txt`.
  - Do **not** add test/story/spec files (e.g. `*.test.*`, `*.spec.*`, `*.stories.*`) unless the task explicitly asks to track them.
  - Lines starting with `#` and blank lines are ignored by the script; you may keep existing comments.

**Example:** If you modified `ui/pages/confirmations/components/confirmation/confirmation.tsx` and `ui/hooks/useAssetDetails.ts`, append exactly:

```
ui/pages/confirmations/components/confirmation/confirmation.tsx
ui/hooks/useAssetDetails.ts
```

---

## Step 3: Ensure the trace config uses the completion file

The trace script excludes completed paths only when the config has a `completionFile` field.

- **Default config** `trace-selectors/config.assets-controllers.json` already includes `"completionFile": "trace-selectors/completed.txt"`.
- If you use a **different** config, add the same top-level key so the report reflects remaining work.

---

## Step 4: Run the trace-usage script

From the **repository root**:

```bash
node trace-selectors/scripts/trace-usage.js --config trace-selectors/config.assets-controllers.json
```

- **Requirement:** `ripgrep` (`rg`) must be on `PATH`.
- **Output:** The report is written to the path in the config’s `output` (e.g. `trace-selectors/output/selector-usage-trace-assets-controllers.md`). Layers and terminal counts will exclude any path listed in `completed.txt`.

Optional: cap depth for large graphs:

```bash
TRACE_MAX_LAYERS=4 node trace-selectors/scripts/trace-usage.js --config trace-selectors/config.assets-controllers.json
```

---

## Step 5: Stage and commit (required)

You **must** stage and commit all changes from this flow:

1. **Stage** at least:
   - `trace-selectors/completed.txt`
   - The trace output file (e.g. `trace-selectors/output/selector-usage-trace-assets-controllers.md`)
   - Any config change (e.g. `trace-selectors/config.assets-controllers.json`) if you added `completionFile`.
2. **Commit** with a clear message, for example:

   ```
   chore(trace-selectors): update completed list and regenerate assets-controllers trace
   ```

   Or:

   ```
   Update completed.txt and selector usage trace after migration work
   ```

Do **not** leave the branch with unstaged or uncommitted changes after running this flow.

---

## Checklist (for the agent)

- [ ] Branch is up to date with `origin/main`.
- [ ] Every modified/migrated file path (relevant to the trace) is appended to `trace-selectors/completed.txt` (one per line, no duplicates, relative paths).
- [ ] Config has `"completionFile": "trace-selectors/completed.txt"` if you want the report to exclude completed files.
- [ ] Trace script was run: `node trace-selectors/scripts/trace-usage.js --config trace-selectors/config.assets-controllers.json`
- [ ] All relevant changes are staged and committed.

---

## Reference

- Completion file format: `trace-selectors/completion-file.example.txt`
- Config and completion file: `trace-selectors/CONFIG.md`
- Trace prompt (how to run manually or with other roots): `trace-selectors/prompts/PROMPT.md`
