## **Description**

Adds E2E coverage for the Tron activity list and transaction details under [WPN-435](https://consensyssoftware.atlassian.net/browse/WPN-435).

**What changed:**
- `test/e2e/tests/tron/activity.spec.ts` — activity list and transaction-details coverage driven by the transaction fixtures from #44166
- `test/e2e/page-objects/pages/home/tron-transaction-details.ts` — page object for the Tron transaction details modal
- `test/e2e/tests/tron/fixtures/with-tron-fixtures.ts` — extends fixture options for activity scenarios

**Why:** The activity cluster had no E2E coverage. This PR fills that gap using the reusable tx fixtures landed in #44166.

**Adaptation note:** Specs were rewritten on top of `TokensTab` because the original `AssetListPage` page object has since been removed from `main`.

## **Changelog**

CHANGELOG entry: null

## **Related issues**

Fixes: [WPN-435](https://consensyssoftware.atlassian.net/browse/WPN-435)

Related: #44166 (tx fixtures, merged), supersedes #43661

## **Manual testing steps**

1. Build a test build: `yarn build:test`
2. Run the Tron activity E2E cluster: `yarn test:e2e:single test/e2e/tests/tron/activity.spec.ts --browser=chrome`
3. Verify activity list scenarios pass (send, receive, approve, swap, bridge, pending/confirmed/failed statuses, network filter, transaction details)

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
