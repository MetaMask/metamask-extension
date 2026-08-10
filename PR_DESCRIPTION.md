## **Description**

When `swap-erc20-with-loaded-state.spec.ts` was re-enabled in PR #40229, the login flow was changed to validate against a hardcoded UI balance string (`$225,730.11`) instead of validating against the actual local anvil node's balance. This meant the test wasn't actually verifying that the anvil pre-loaded state (`with100Usdc100Usdt50Dai.json`) was being consumed — the hardcoded balance assertion passes based on mocked API responses alone.

This fix changes the login call to use `localNode: localNodes[0]`, which validates the displayed balance against the real balance on the local anvil node. This ensures the pre-loaded state is actually exercised and the test would fail if the loaded state were removed or misconfigured.

## **Changelog**

CHANGELOG entry: null

## **Related issues**

Fixes: MMQA-1968

<!--
## **Manual testing steps**

N/A — run the E2E test directly:

```bash
yarn build:test
yarn test:e2e:single test/e2e/tests/swaps/swap-erc20-with-loaded-state.spec.ts --browser=chrome
```
-->

<!--
## **Screenshots/Recordings**

### **Before**

### **After**
-->

## **Pre-merge author checklist**

- [x] I've followed [MetaMask Contributor Docs](https://github.com/MetaMask/contributor-docs) and [MetaMask Extension Coding Standards](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/CODING_GUIDELINES.md).
- [x] I've completed the PR template to the best of my ability
- [x] I've included tests if applicable
- [ ] I've documented my code using [JSDoc](https://jsdoc.app/) format if applicable
- [ ] I've applied the right labels on the PR (see [labeling guidelines](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/LABELING_GUIDELINES.md)). Not required for external contributors.

## **Pre-merge reviewer checklist**

- [ ] I've manually tested the PR (e.g. pull and build branch, run the app, test code being changed).
- [ ] I confirm that this PR addresses all acceptance criteria described in the ticket it closes and includes the necessary testing evidence such as recordings and or screenshots.
