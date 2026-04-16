<!--
Please submit this PR as a draft initially.
Do not mark it as "Ready for review" until the template has been completely filled out, and PR status checks have passed at least once.
-->

## **Description**

This PR moves extension much closer to **Perps display parity with mobile**.

The goal is not just nicer formatting. The goal is that extension uses the same controller/mobile display behavior across the key perps surfaces listed in [TAT-2699](https://consensyssoftware.atlassian.net/browse/TAT-2699).

What is in this PR:
- upgraded extension to `@metamask/perps-controller@3.1.1`
- switched affected extension perps surfaces onto controller formatting exports
- added the required controller `diskCache` dependency in extension infrastructure
- built a composed parity harness for extension + mobile so we can compare screen values directly
- fixed several extension-side parity leaks found by the harness, including:
  - order-entry liquidation path using a local formula instead of the controller path
  - stale oracle carry-over across symbols
  - remove-margin distance rounding mismatch
  - withdraw ETA wording mismatch
  - remove-margin available amount formatting mismatch
  - order-entry fee fallback for stalled fee-rate fetches

Current best read:
- extension composed parity recipe is now passing again end-to-end
- current same-window BTC / ETH market + order captures are very close between extension and mobile
- most remaining differences are now small live-value / estimate drift, not obvious decimal-formatting regressions

## **Changelog**

CHANGELOG entry: null

## **Related issues**

Fixes: [TAT-2699](https://consensyssoftware.atlassian.net/browse/TAT-2699)
- Related to [TAT-2870](https://consensyssoftware.atlassian.net/browse/TAT-2870)
- Related to MetaMask/metamask-mobile#28871
- Related to MetaMask/metamask-mobile#28892
- Related to MetaMask/core#8473

## **Current Validation State**

### **Extension**
- composed extension parity recipe: passing `15/15`
- current targeted validation covers:
  - market detail: BTC / ETH / SOL / FARTCOIN / PUMP
  - order entry: BTC / ETH / SOL / FARTCOIN / PUMP
  - ETH position detail
  - ETH reverse
  - ETH remove margin
  - ETH close
  - withdraw

### **Current same-window BTC / ETH comparison**

**BTC**
- Extension market: `price $75,083`, `change +0.65%`, `oracle $74,711`
- Mobile market: `price $75,112`, `change +0.71%`, `oracle $74,642`
- Extension order: `margin $3.74`, `liq $50,690`, `fees $0.02`
- Mobile order: `margin $3.73`, `liq $50,718`, `fees $0.02`

**ETH**
- Extension market: `price $2,347.7`, `change +0.82%`, `oracle $2,342.4`
- Mobile market: `price $2,343.8`, `change +0.68%`, `oracle $2,339`
- Extension order: `margin $3.67`, `liq $1,597`, `fees $0.02`
- Mobile order: `margin $3.67`, `liq $1,597.6`, `fees $0.02`

Interpretation:
- BTC market/order is effectively aligned
- ETH market/order is effectively aligned
- remaining BTC / ETH deltas are now small enough to look like live-value / estimate drift rather than formatter-path divergence

### **What is still worth tracking**
- a few non-BTC/ETH rows still only have older mobile counterparts in the matrix
- close-position values are close but not numerically identical on every run
- upstream HyperLiquid / live-data interference can still contaminate tiny deltas during validation

## **Manual testing steps**

1. Open BTC and ETH perps market detail pages in extension.
2. Verify header price, change, and oracle price all render with adaptive formatting.
3. Open BTC and ETH order entry.
4. Verify price, margin, liquidation price, and fees render with adaptive formatting and no hardcoded 2-decimal behavior.
5. Verify ETH position detail, reverse, remove-margin, close-position, and withdraw flows render sane adaptive values.
6. Compare against mobile using the parity matrix below.

## **Screenshots/Recordings**

Hosted asset folder:
- `https://github.com/abretonc7s/mm-extension-farm-artifacts/tree/main/reviews/41558/comparison-table`

Note:
- the screenshot grid is still useful visual evidence, but the stronger proof for this PR is now the structured value comparison and drift report below

<table>
  <thead>
    <tr>
      <th>Variant</th>
      <th>Home</th>
      <th>Market Detail</th>
      <th>Order Entry</th>
      <th>Remove Margin</th>
      <th>Close</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Extension After</strong></td>
      <td><img src="https://raw.githubusercontent.com/abretonc7s/mm-extension-farm-artifacts/main/reviews/41558/comparison-table/06-after-home.png" width="170" alt="Extension after home" /></td>
      <td><img src="https://raw.githubusercontent.com/abretonc7s/mm-extension-farm-artifacts/main/reviews/41558/comparison-table/07-after-market-detail.png" width="170" alt="Extension after market detail" /></td>
      <td><img src="https://raw.githubusercontent.com/abretonc7s/mm-extension-farm-artifacts/main/reviews/41558/comparison-table/08-after-order-entry.png" width="170" alt="Extension after order entry" /></td>
      <td><img src="https://raw.githubusercontent.com/abretonc7s/mm-extension-farm-artifacts/main/reviews/41558/comparison-table/09-after-remove-margin.png" width="170" alt="Extension after remove margin" /></td>
      <td><img src="https://raw.githubusercontent.com/abretonc7s/mm-extension-farm-artifacts/main/reviews/41558/comparison-table/10-after-close.png" width="170" alt="Extension after close" /></td>
    </tr>
    <tr>
      <td><strong>Mobile</strong></td>
      <td><img src="https://raw.githubusercontent.com/abretonc7s/mm-extension-farm-artifacts/main/reviews/41558/comparison-table/11-mobile-home.png" width="170" alt="Mobile home" /></td>
      <td><img src="https://raw.githubusercontent.com/abretonc7s/mm-extension-farm-artifacts/main/reviews/41558/comparison-table/12-mobile-market-detail.png" width="170" alt="Mobile market detail" /></td>
      <td><img src="https://raw.githubusercontent.com/abretonc7s/mm-extension-farm-artifacts/main/reviews/41558/comparison-table/13-mobile-order-entry.png" width="170" alt="Mobile order entry" /></td>
      <td><img src="https://raw.githubusercontent.com/abretonc7s/mm-extension-farm-artifacts/main/reviews/41558/comparison-table/14-mobile-remove-margin.png" width="170" alt="Mobile remove margin" /></td>
      <td><img src="https://raw.githubusercontent.com/abretonc7s/mm-extension-farm-artifacts/main/reviews/41558/comparison-table/15-mobile-close.png" width="170" alt="Mobile close" /></td>
    </tr>
  </tbody>
</table>

## **Structured Decimal Matrix**

See the current structured artifact:
- [decimal-parity-matrix-expanded.md](/Users/deeeed/dev/metamask/metamask-extension-3/temp/.task/fix/41558-0415-1045/artifacts/decimal-parity-matrix-expanded.md)

That artifact now reflects:
- current same-window BTC / ETH extension vs mobile rows
- current extension traces for SOL / FARTCOIN / PUMP order-entry and ETH management flows

## **Drift Report**

See the current drift report:
- [drift-sources-report.md](/Users/deeeed/dev/metamask/metamask-extension-3/temp/.task/fix/41558-0415-1045/artifacts/drift-sources-report.md)

This is useful reviewer context because it separates:
- real extension parity bugs that were fixed in this branch
- harness / orchestration noise
- upstream live-data interference
- mobile capture-method pitfalls that are not true parity gaps

## **Recipe References**

Recipe sources used for this work:
- Extension composed parity recipe: `temp/agentic/recipes/teams/perps/recipes/pr-41558-decimal-parity-expanded.json`
- Mobile composed parity recipe: `scripts/perps/agentic/teams/perps/recipes/mobile-decimal-parity-expanded.json`
- Mobile recipe branch / PR: `MetaMask/metamask-mobile#28892`

## **Pre-merge author checklist**

- [x] I've followed [MetaMask Contributor Docs](https://github.com/MetaMask/contributor-docs) and [MetaMask Extension Coding Standards](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/CODING_GUIDELINES.md).
- [x] I've completed the PR template to the best of my ability
- [x] I've included tests if applicable
- [x] I've documented my code using [JSDoc](https://jsdoc.app/) format if applicable
- [x] I've applied the right labels on the PR (see [labeling guidelines](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/LABELING_GUIDELINES.md)). Not required for external contributors.

## **Pre-merge reviewer checklist**

- [ ] I've manually tested the PR (e.g. pull and build branch, run the app, test code being changed).
- [ ] I confirm that this PR addresses all acceptance criteria described in the ticket it closes and includes the necessary testing evidence such as recordings and or screenshots.

[TAT-2699]: https://consensyssoftware.atlassian.net/browse/TAT-2699?atlOrigin=eyJpIjoiNWRkNTljNzYxNjVmNDY3MDlhMDU5Y2ZhYzA5YTRkZjUiLCJwIjoiZ2l0aHViLWNvbS1KU1cifQ
[TAT-2870]: https://consensyssoftware.atlassian.net/browse/TAT-2870?atlOrigin=eyJpIjoiNWRkNTljNzYxNjVmNDY3MDlhMDU5Y2ZhYzA5YTRkZjUiLCJwIjoiZ2l0aHViLWNvbS1KU1cifQ
