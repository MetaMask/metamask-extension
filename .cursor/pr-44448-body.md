## **Description**

Adds 4 new non-submitting swap E2E tests for Tron to expand coverage under [WPN-309](https://consensyssoftware.atlassian.net/browse/WPN-309).

**What changed:**
- `test/e2e/tests/tron/swap.spec.ts` — 4 new test cases alongside the 3 existing swap tests (quote display, no-estimate, no-quotes)
- `privacy-snapshot.json` — adds `i.scdn.co` for swap test network calls

**New tests:**
- **USDT → TRX reverse direction** — quote loads for reverse token pair; source/dest tokens verified
- **Amount exceeds balance** — entering amount above available TRX balance shows insufficient funds and disabled submit
- **Destination token change** — switching destination token from USDT to USDC refreshes quote
- **Default source token** — opening swap form shows TRX as pre-selected source token

**Why:** These tests fill form fields and verify UI states without clicking the final submit button, since Tron swaps cannot be fully executed on a local node environment.

## **Changelog**

CHANGELOG entry: null

## **Related issues**

Fixes: [WPN-309](https://consensyssoftware.atlassian.net/browse/WPN-309)

Related: #44169 (send E2E cluster, merged)

## **Manual testing steps**

1. Build a test build: `yarn build:test`
2. Run the Tron swap E2E cluster: `yarn test:e2e:single test/e2e/tests/tron/swap.spec.ts --browser=chrome`
3. Verify all 7 swap tests pass (3 existing + 4 new)
4. On Tron network, open Swap and confirm TRX is the default source token, reverse-direction quotes load, insufficient-funds state appears for over-balance amounts, and changing the destination token refreshes the quote

<!--
## **Screenshots/Recordings**

### **Before**

### **After**
-->

## **Pre-merge author checklist**

- [x] I've followed [MetaMask Contributor Docs](https://github.com/MetaMask/contributor-docs) and [MetaMask Extension Coding Standards](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/CODING_GUIDELINES.md).
- [x] I've completed the PR template to the best of my ability
- [x] I've included tests if applicable
- [x] I've documented my code using [JSDoc](https://jsdoc.app/) format if applicable
- [ ] I've applied the right labels on the PR (see [labeling guidelines](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/LABELING_GUIDELINES.md)). Not required for external contributors.

## **Pre-merge reviewer checklist**

- [ ] I've manually tested the PR (e.g. pull and build branch, run the app, test code being changed).
- [ ] I confirm that this PR addresses all acceptance criteria described in the ticket it closes and includes the necessary testing evidence such as recordings and or screenshots.
