<!--
Please submit this PR as a draft initially.
Do not mark it as "Ready for review" until the template has been completely filled out, and PR status checks have passed at least once.
-->

## **Description**

### Context

Firefox AMO `prepare_release.sh` rebuilds are the path that shows SWC mangling nondeterminism (`runtime.[contenthash].js` short-name swaps). Mark's [CI sharding approach in #46392](https://github.com/MetaMask/metamask-extension/pull/46392) (suggested by Howard) makes large N feasible. This temporary experiment PR (based on `main`) applies that idea to `prepare_release.sh` and A/B tests `@swc/core` 1.13.3 vs the bump in [#46363](https://github.com/MetaMask/metamask-extension/pull/46363).

### What this runs

Temporary workflow `test-amo-prepare-release-swc-ab.yml` (400 jobs):

| Cell | Variant | Source | Expected `@swc/core` |
| --- | --- | --- | --- |
| 100× | main | stock tagged `v13.47.1` | 1.13.3 |
| 100× | flask | stock tagged `v13.47.1` | 1.13.3 |
| 100× | main | stock + inject from `bump/swc-core-amo-determinism` | 1.16.2 |
| 100× | flask | stock + inject from `bump/swc-core-amo-determinism` | 1.16.2 |

`prepare_release.sh` always rebuilds the tagged GitHub source archive, so the bump cell injects webpack loader fixes + `yarn add @swc/core@1.16.2` into that archive (mangle stays ON). That matches the Ubuntu Docker harness used for [#46363](https://github.com/MetaMask/metamask-extension/pull/46363).

### Success criteria

- **stock**: more than one unique local `runtime.*` hash (reproduces the known flake)
- **bump**: one unique local runtime hash / SHA among successful local builds for both main and flask

A `summarize` job aggregates all `result-*.json` artifacts into `summary.json`.

## **Changelog**

CHANGELOG entry: null

## **Related issues**

Fixes: INFRA-3920 (evidence only, do not merge as the product fix)

## **Manual testing steps**

1. Open this draft PR (or run `workflow_dispatch` on `Test AMO prepare_release SWC A/B`).
2. Wait for the matrix + summarize job.
3. Download artifact `amo-prepare-release-swc-ab-summary` and inspect unique runtime hashes per cell.
4. Confirm bump cells are deterministic and stock cells show multiple hashes.

## **Pre-merge author checklist**

- [x] I've followed [MetaMask Contributor Docs](https://github.com/MetaMask/contributor-docs) and [MetaMask Extension Coding Standards](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/CODING_GUIDELINES.md).
- [x] I've completed the PR template to the best of my ability
- [x] I’ve included tests if applicable
- [x] I’ve documented my code using [JSDoc](https://jsdoc.app/) format if applicable
- [ ] I’ve applied the right labels on the PR (see [labeling guidelines](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/LABELING_GUIDELINES.md)). Not required for external contributors.

## **Pre-merge reviewer checklist**

- [ ] I've manually tested the PR (e.g. pull and build branch, run the app, test code being changed).
- [ ] I confirm that this PR addresses all acceptance criteria described in the ticket it closes and includes the necessary testing evidence such as recordings and or screenshots.
