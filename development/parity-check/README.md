# Parity-check pilot — PR #42441

AST-level parity check for [PR #42441](https://github.com/MetaMask/metamask-extension/pull/42441) (selector hoist: `ui/selectors/` → `shared/lib/selectors/`).

Answers the question davidmurdoch asked Codex three times: *"did any moved function's behavior change?"*

## Quick run (parity check only)

```bash
nvm use
git fetch origin pull/42441/head:pr-42441

node --require ./node_modules/tsx/dist/preflight.cjs \
     --import ./node_modules/tsx/dist/loader.mjs \
     development/parity-check/parity-check.ts \
     --old-ref main --new-ref pr-42441
```

Expected output (as of latest PR commit):

```
Parity check: main → pr-42441
Manifest: development/parity-check/pr-42441-moves.json (12 symbols)

  ✓ getSelectedInternalAccount
  ✓ getMaybeSelectedInternalAccount
  ✓ AccountsState
  ✓ getCurrentKeyring
  ✓ getAccountType
  ✓ getAccountTypeForKeyring
  ✓ isHardwareWallet
  ✗ getHardwareWalletType  [DRIFT]
      structural AST difference after stripping loc/range/comments
  ✓ accountSupportsSmartTx
  ✓ getPreferences
  ✓ getRemoteFeatureFlags
  ✓ RemoteFeatureFlagsState

11/12 match
```

## The one genuine drift

`getHardwareWalletType`: `keyring.type` → `keyring?.type`

Optional chaining was added. On main, the function throws if `getCurrentKeyring` returns `null`. On the PR, it returns `undefined`. This is a behavioral change — intentional (null safety), but real.

## Full recipe run (all 5 nodes)

Requires checking out PR #42441 in your working tree first. Cycles, boundary, tsc, and tests run against the working tree; parity uses explicit `--old-ref`/`--new-ref` and doesn't require a checkout.

```bash
git checkout pr-42441
nvm use
node development/parity-check/run-recipe.mjs
```

Results are written to `development/parity-check/run-artifacts/`.

## How it works

`parity-check.ts` (150 lines):

1. Reads a manifest of `(symbol, oldPath, newPath)` entries from `pr-42441-moves.json`.
2. Fetches each file at `--old-ref` and `--new-ref` via `git show`.
3. Parses both with `@typescript-eslint/parser`.
4. Locates the named exported declaration in each parsed AST.
5. Strips TypeScript-only nodes (type annotations, TS-only expression wrappers like `as Foo`, `x!`) — these change in JS→TS moves but have no runtime semantics.
6. Canonicalizes the remaining AST to JSON (stripping loc/range/comments).
7. Compares and reports match, drift, or missing.

Drift output annotates with file-level import changes so reviewers can distinguish "moved to a cleaner import set" from "started calling a different helper."

## What this is not

- Not a CI gate. Dev-machine inner-loop only.
- Not a semantic equivalence proof. Two ASTs with identical canonical form behave the same; different canonical forms *may or may not* differ in observable behavior. The tool surfaces every difference for human judgment.
- Not a substitute for reading the diff. It narrows the review surface from 193 files to 1 symbol with a 1-character change (`keyring.type` vs `keyring?.type`).

## Files

| File | Purpose |
|------|---------|
| `parity-check.ts` | AST-diff core + CLI |
| `pr-42441-moves.json` | Symbol move manifest (12 entries, hand-authored from PR description) |
| `recipe-pr-42441.json` | Recipe graph (5 nodes: cycles, boundary, parity, tsc, tests) |
| `run-recipe.mjs` | Runner shim (sequential dispatch, writes recipe-run.json + recipe-issues.md) |
