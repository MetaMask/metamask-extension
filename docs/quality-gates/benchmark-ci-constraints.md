# Benchmark CI constraints

This note captures the current CI controls for benchmark jobs and the follow-up needed before switching those jobs to a paid larger runner.

## Browser isolation flags

`test/e2e/webdriver/chrome.js` now adds these Chrome flags whenever the Selenium driver runs in CI or Codespaces:

- `--disable-gpu`
- `--disable-renderer-backgrounding`
- `--disable-backgrounding-occluded-windows`
- `--disable-background-timer-throttling`

These flags reduce non-determinism from GPU compositing, hidden-window backgrounding, and timer throttling. Benchmarks use the same ChromeDriver path as the rest of the Selenium E2E suite, so applying them in CI improves isolation without requiring a separate benchmark launcher.

## Runner audit and adoption gate

Audit result on 2026-04-27:

- `.github/workflows/*.yml` currently uses `ubuntu-latest` throughout.
- No existing workflow in this repository targets `ubuntu-latest-8-core`, `ubuntu-24.04-8core`, or a labeled self-hosted larger runner.

Decision:

- Keep `benchmarks` and `benchmarks-page-load` on `ubuntu-latest` for now.
- Only switch to a larger runner after a 15-run `startupPowerUserHome` trial shows at least a **2 percentage point** CV reduction versus the trimmed-baseline pipeline.
- If the trial clears that gate, prefer a repo-available GitHub larger-runner label or an equivalent isolated self-hosted pool and update `.github/workflows/run-benchmarks.yml` in the same change.

## GitHub Actions cost estimate

GitHub's published Linux runner pricing is:

| Runner                                  | Rate/min |
| --------------------------------------- | -------: |
| Standard Linux 2-core (`ubuntu-latest`) |   $0.006 |
| Linux 8-core larger runner              |   $0.022 |

Estimated delta:

- **+$0.016/minute per job**
- **+$0.48** for a 30-minute benchmark job
- **Up to about +$11.04 per full `run-benchmarks.yml` run** if all 23 benchmark jobs each consume their full 30-minute timeout on an 8-core runner instead of `ubuntu-latest`

Actual spend will be lower when jobs finish early, but larger runners are always billable and do not consume included free minutes.

## Container image and Chrome pin strategy

Current benchmark container:

- `ghcr.io/metamask/metamask-extension-e2e-image:v24.13.0`

Audit notes:

- The image tag is pinned in workflow YAML.
- Tag `v24.13.0` currently resolves to commit `6f41f422bf9fb543a88e3819c3ae96282025b9d5` in `MetaMask/metamask-extension-e2e-image`.
- That tag's `Dockerfile` is based on `cimg/node:24.11-browsers` and pins the surrounding toolchain (Node/Yarn/Xvfb), not a separate Chrome package inside this repository.
- The effective Chrome pin for Selenium benchmarks is the explicit `options.setBrowserVersion('126')` call in `test/e2e/webdriver/chrome.js`, which delegates browser resolution to Selenium Manager/Chrome for Testing.

Future bumps:

1. Bump the image tag in workflow YAML.
2. Verify the new image's source commit and base image.
3. Re-check the resolved Chrome binary version used by Selenium (`google-chrome --version` or Selenium Manager logs).
4. Update `options.setBrowserVersion(...)` and this document in the same PR if Chrome moves.

## CV tracking table

| Scenario                                              | Runner          | CV (%) |                     Delta vs current |
| ----------------------------------------------------- | --------------- | -----: | -----------------------------------: |
| `startupStandardHome` baseline (current)              | `ubuntu-latest` |    8-9 |                                    0 |
| `startupPowerUserHome` baseline (current)             | `ubuntu-latest` |  30-34 |                                    0 |
| `startupPowerUserHome` after Chrome isolation flags   | `ubuntu-latest` |    TBD |                                  TBD |
| `startupPowerUserHome` after 8-core/self-hosted trial | TBD             |    TBD | Adopt only if improvement is >= 2 pp |

Until the 15-run trial is recorded, the workflow should stay on the standard runner and use the new browser-isolation flags as the immediate low-risk noise reduction.
