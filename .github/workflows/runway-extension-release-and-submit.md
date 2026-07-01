# Runway extension release and store submit

Workflow: `runway-extension-release-and-submit.yml`  
Ticket: [INFRA-3735](https://consensyssoftware.atlassian.net/browse/INFRA-3735)

## Branch and `release_sha`

### Which branch?

| Branch | Intended use |
| --- | --- |
| **`release/X.Y.Z`** | **Production happy path.** Runway dispatches here for a real release. `version` must equal `X.Y.Z`. Runway sender is verified on release branches. |
| **`main`** | Allowed for **Phase 0 validation only** (`execute_store_phases=false`) or manual ops experiments. Not the normal Runway production cut. Phase 1 publish expects a `release/*` branch in the callee workflow. |

You do **not** run the full store pipeline from `main` in normal operations.

### Is `release_sha` required?

**No.** It is optional.

| Input | Behavior |
| --- | --- |
| Omitted | Phase 0 uses `github.sha` (the commit GitHub Actions runs the workflow on). |
| Provided | Must **exactly equal** `github.sha`. If Runway passes a SHA that does not match the dispatch commit, Phase 0 fails immediately. |

`release_sha` is an **integrity check**: Runway can record “I intended commit `abc123`” and the workflow verifies that is the commit actually being built. It is not a separate “run on this other commit” knob; dispatch ref/commit must already be correct.

Phase 0 also checks that GitHub Release `v{version}` either does not exist, exists at the same SHA (auto-skip publish), or — when `execute_store_phases=true` — **fails fast** if the release points at a different SHA (avoids wasted builds and wrong release assets).

## Runway contract (inputs)

Runway should pass:

- `version` — `X.Y.Z` (must match `release/X.Y.Z` when on a release branch)
- `release_sha` — optional; recommended for audit; must match dispatch commit if set
- `execute_store_phases` — `true` only when ready to publish + upload stores

Do **not** wire Runway production until Phases 1–3 are validated E2E on a release branch.

## Happy path (production)

When Runway is wired and store phases are enabled:

1. Runway dispatches on **`release/13.36.0`** with:
   - `version=13.36.0`
   - `release_sha=<HEAD of that branch>` (optional but recommended)
   - `execute_store_phases=true`
2. **Phase 0** — branch, version, SHA, CI green, Runway sender, release state checks pass.
3. **Phase 1** — `workflow_call` → `publish-release-from-release-head.yml` creates GitHub Release + assets (once).
4. **Phase 2** — CWS production + Flask upload in parallel (`:fetchStatus` idempotency).
5. **Phase 3** — AMO production + Flask upload in parallel (Lambda idempotency).
6. Orchestrator summary job reports all phase results.

Phases 2 and 3 start after Phase 1 succeeds or is auto-skipped (release already exists at the same SHA).

## Recovery path

If a run fails partway:

1. **Re-run failed jobs** on the same workflow run, **or**
2. **Re-dispatch** with the **same** `version` and `release_sha` on the **same** release branch commit.

Completed work auto-skips:

| Phase | Auto-skip when |
| --- | --- |
| 1 publish | GitHub Release `v{version}` already exists at `release_sha` |
| 2 CWS | Draft already exists for expected manifest version (`X.Y.Z` or `X.Y.Z-flask.0`) |
| 3 AMO | Lambda returns `idempotent=true` for existing AMO version |

Only the failed phase(s) should do real work on retry.

## Break-glass path

Manual `skip_*` inputs are **not** the normal Runway path. Use only for ops recovery when auto-skip is insufficient:

| Input | Effect |
| --- | --- |
| `skip_publish` | Skip Phase 1 (dangerous if release/assets missing for store phases) |
| `skip_cws_production` | Skip Phase 2a |
| `skip_cws_flask` | Skip Phase 2b |
| `skip_amo_production` | Skip Phase 3a |
| `skip_amo_flask` | Skip Phase 3b |

Prefer re-dispatch + auto-skip over break-glass skips.

## Safe merge default

Until Runway is wired: merge with **`execute_store_phases=false`** (default). Only Phase 0 runs; no publish or store uploads.

## Related

- CWS WIF / orchestrator OIDC: `va-mmc-extension-submission-infra/gcloud/shared/wif-cel-reference.md`
- AMO Lambda idempotency: `va-mmc-extension-submission` (`expectedAmoVersionNumber`, handler tests)
