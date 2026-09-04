# AI PR risk analyzer (extension config)

Repo-specific configuration for [`MetaMask/ai-analyzer`](https://github.com/MetaMask/ai-analyzer) `pr-risk-analysis` mode.

## Layout

- `config.yaml` — repo slug, critical files/paths/keywords, model thresholds
- `modes/pr-risk-analysis/hard-rules.json` — optional hard-rule overrides (empty = use core defaults only)

Passed to the action as `config-path: .github/ai-pr-analyzer` from [`.github/workflows/ai-pr-risk-analysis.yml`](../workflows/ai-pr-risk-analysis.yml).

## Critical list philosophy

This list is a **complementary signal** for the AI risk model. It does **not** replace [CODEOWNERS](../CODEOWNERS). Broad ownership surfaces (`ui/selectors/`, `ui/ducks/`, full `ui/store/`, `yarn.lock`) stay out of critical files/paths on purpose — use per-subdir CODEOWNERS (or lockfile/dep review) instead. `package.json` is included as a soft signal that dependency/manifest changes deserve weight; all changed files are still assessed.

`models.criticalFileThreshold: 5` escalates the model when many critical files are touched. It is not a merge gate.

## Secrets

| Secret | Purpose |
|--------|---------|
| `AI_ANALYZER_TOKEN` | Checkout private `MetaMask/ai-analyzer` |
| `AI_ANALYZER_LITELLM_KEY` | LiteLLM endpoint for analysis |
| `AI_ANALYZER_LANGFUSE_PUBLIC_KEY` | Optional Langfuse tracing (pair with secret key) |
| `AI_ANALYZER_LANGFUSE_SECRET_KEY` | Optional Langfuse tracing (diffs/file bodies redacted in traces) |

## Pin bump

See the header comment in [`.github/workflows/ai-pr-risk-analysis.yml`](../workflows/ai-pr-risk-analysis.yml) for the immutable SHA bump process.
