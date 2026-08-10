## **Description**

The first test in both `token-detection-metrics.spec.ts` and `nft-detection-metrics.spec.ts` was asserting generic `Wallet Created` track event properties — not the detection-related identify traits that the file names suggest. This fix replaces those tests with proper assertions that verify the `token_detection_enabled` and `nft_autodetection_enabled` identify traits are sent during onboarding, matching the pattern already used by the second test in each file and by `segment-user-traits.spec.ts`.

## **Changelog**

CHANGELOG entry: null

## **Related issues**

Fixes: MMQA-1970

## **Manual testing steps**

1. Build a test build: `yarn build:test`
2. Run the token detection metrics test:
   ```
   yarn test:e2e:single test/e2e/tests/metrics/token-detection-metrics.spec.ts --browser=chrome
   ```
3. Run the NFT detection metrics test:
   ```
   yarn test:e2e:single test/e2e/tests/metrics/nft-detection-metrics.spec.ts --browser=chrome
   ```
4. Verify both tests pass — the first test in each file now asserts the relevant identify trait during onboarding.

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
- [x] I've applied the right labels on the PR (see [labeling guidelines](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/LABELING_GUIDELINES.md)). Not required for external contributors.

## **Pre-merge reviewer checklist**

- [ ] I've manually tested the PR (e.g. pull and build branch, run the app, test code being changed).
- [ ] I confirm that this PR addresses all acceptance criteria described in the ticket it closes and includes the necessary testing evidence such as recordings and or screenshots.
