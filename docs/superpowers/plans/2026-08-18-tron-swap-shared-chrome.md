# Tron swap shared Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Share one Chrome session across the five Tron swap tests that use
`mockTronSwapApis`. Leave the two tests that register different Bridge mocks
as their own `withFixtures` sessions.

**Architecture:** One held `withFixtures` session (`startHeldFixtures`) with
`mockTronSwapApis`. Login and switch to Tron once. Each happy-path `it`
returns to home with `driver.navigate()` then opens Swap again. Do not start
a Java-Tron node. Do not isolate per HD address — these tests do not spend
on chain.

**Tech Stack:** Mocha, `startHeldFixtures`, existing `SwapPage` /
`HomePage`, `mockTronSwapApis` and the two variant mock helpers.

## Global Constraints

- Prerequisite: `startHeldFixtures` exists
  (`docs/superpowers/plans/2026-08-18-tron-held-fixtures.md`).
- Do not migrate this file onto `withTronFixtures` / a local Tron node.
  Quotes still come from Bridge HTTP mocks.
- Do not share Chrome between `mockTronSwapApis`,
  `mockTronSwapApisNoQuotes`, and `mockTronSwapApisWithoutFeeEstimation`.
  Those mocks are registered at fixture start; one held session cannot
  swap them.
- Copy the `firstFailure` skip pattern from `send.spec.ts`.
- New code is TypeScript.

## Session map

| Session | Mock | Tests |
|---|---|---|
| Held Chrome A | `mockTronSwapApis` | Quote TRX→USDT, reverse USDT→TRX, amount exceeds balance, dest token change, default token on open |
| `withFixtures` B | `mockTronSwapApisWithoutFeeEstimation` | Swap disabled when fees cannot be estimated |
| `withFixtures` C | `mockTronSwapApisNoQuotes` | No quotes available |

That is 3 Chromes vs 7 today.

## File map

- Modify: `test/e2e/tests/tron/swap.spec.ts`
- Reuse: `test/e2e/fixtures/held-fixtures.ts`

---

### Task 1: Hold the quote-happy path in one Chrome

**Files:**
- Modify: `test/e2e/tests/tron/swap.spec.ts`

**Interfaces:**
- Consumes: `startHeldFixtures`, `mockTronSwapApis`
- Produces: nested `describe('quotes available')` with five `it`s on one driver

- [ ] **Step 1: Rewrite the spec**

Replace `test/e2e/tests/tron/swap.spec.ts` with:

```typescript
import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { startHeldFixtures } from '../../fixtures/held-fixtures';
import type { HeldFixturesSession } from '../../fixtures/held-fixtures';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import {
  mockTronSwapApis,
  mockTronSwapApisNoQuotes,
  mockTronSwapApisWithoutFeeEstimation,
  TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE,
} from './mocks/common-tron';

async function landOnTronHome(driver: Driver): Promise<void> {
  await login(driver);
  await switchToNetworkFromNetworkSelect(driver, 'Tron');
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.checkExpectedBalanceIsDisplayed('106.07');
}

async function returnToTronHome(driver: Driver): Promise<void> {
  await driver.navigate();
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.checkExpectedBalanceIsDisplayed('106.07');
}

describe('Swap on Tron', function (this: Suite) {
  this.timeout(180_000);

  describe('quotes available', function (this: Suite) {
    let driver: Driver;
    let firstFailure: unknown;
    let session: HeldFixturesSession | undefined;

    before(async function () {
      session = await startHeldFixtures({
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.parent?.fullTitle() ?? 'Swap on Tron quotes',
        testSpecificMock: mockTronSwapApis,
        ignoredConsoleErrors: [
          `Failed to send transaction: ${TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE}`,
        ],
      });
      driver = session.context.driver;
      try {
        await landOnTronHome(driver);
      } catch (error) {
        firstFailure = error;
        throw error;
      }
    });

    beforeEach(function () {
      if (firstFailure) {
        this.skip();
      }
    });

    afterEach(function () {
      if (this.currentTest?.state === 'failed' && !firstFailure) {
        firstFailure = this.currentTest.err;
      }
    });

    after(async function () {
      if (!session) {
        return;
      }
      await session.release(firstFailure);
    });

    it('Quote displayed between TRX and TRC20', async function () {
      const homePage = new HomePage(driver);
      const swapPage = new SwapPage(driver);
      await homePage.clickOnSwapButton();
      await swapPage.createSwap({
        amount: 1,
        swapTo: 'USDT',
        swapFrom: 'TRX',
        network: 'Tron',
      });
      await swapPage.reviewQuote({
        swapToAmount: '0.295',
        swapFrom: 'TRX',
        swapTo: 'USDT',
        swapFromAmount: '1',
      });
    });

    it('Quote displayed for USDT to TRX swap (reverse direction)', async function () {
      await returnToTronHome(driver);
      const homePage = new HomePage(driver);
      const swapPage = new SwapPage(driver);
      await homePage.clickOnSwapButton();
      await swapPage.createSwap({
        amount: 1,
        swapTo: 'TRX',
        swapFrom: 'USDT',
        network: 'Tron',
      });
      await swapPage.waitForQuote();
      await swapPage.checkQuoteIsDisplayed();
      await swapPage.checkSourceToken('USDT');
      await swapPage.checkDestinationToken('TRX');
      assert.notEqual(await swapPage.getFromAmountValue(), '');
      assert.notEqual(await swapPage.getToAmountValue(), '');
    });

    it('Amount exceeding balance shows insufficient funds', async function () {
      await returnToTronHome(driver);
      const homePage = new HomePage(driver);
      const swapPage = new SwapPage(driver);
      await homePage.clickOnSwapButton();
      await swapPage.createSwap({
        amount: 999999,
        swapTo: 'USDT',
        swapFrom: 'TRX',
        network: 'Tron',
      });
      await swapPage.checkInsufficientFundsButtonIsDisplayed();
    });

    it('Quote updates when selecting different destination token', async function () {
      await returnToTronHome(driver);
      const homePage = new HomePage(driver);
      const swapPage = new SwapPage(driver);
      await homePage.clickOnSwapButton();
      await swapPage.createSwap({
        amount: 10,
        swapTo: 'USDT',
        swapFrom: 'TRX',
        network: 'Tron',
      });
      await swapPage.waitForQuote();
      await swapPage.checkQuoteIsDisplayed();
      await swapPage.selectDestinationToken('USDC');
      await swapPage.waitForQuote();
      await swapPage.checkQuoteIsDisplayed();
      await swapPage.checkDestinationToken('USDC');
      await swapPage.checkSourceToken('TRX');
    });

    it('Swap form shows default token on open', async function () {
      await returnToTronHome(driver);
      const homePage = new HomePage(driver);
      const swapPage = new SwapPage(driver);
      await homePage.clickOnSwapButton();
      await swapPage.checkSourceToken('TRX');
    });
  });

  it('Swap disabled when Tron network fees cannot be estimated', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronSwapApisWithoutFeeEstimation,
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronHome(driver);
        const homePage = new HomePage(driver);
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });
        await swapPage.checkQuoteIsDisplayedWithoutNetworkFee();
        await swapPage.checkInsufficientFundsButtonIsDisplayed();
      },
    );
  });

  it('No quotes available for the pair', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronSwapApisNoQuotes,
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronHome(driver);
        const homePage = new HomePage(driver);
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });
        await swapPage.checkNoQuotesAvailable();
      },
    );
  });
});
```

`driver.navigate()` is the reset, same as `switchToTronAccountForSend`
leaving `#/send`. Do not depend on a Swap Close button — the prepare page
does not always show one.

Keep `ignoredConsoleErrors` on the held session because the first quote
test is the one that previously declared the expiration message.

- [ ] **Step 2: Lint**

```bash
yarn lint:changed:fix
```

- [ ] **Step 3: Commit**

```bash
git add test/e2e/tests/tron/swap.spec.ts
git commit -m "test(e2e): share one Chrome session across Tron swap quote cases"
```

---

### Task 2: Run the swap suite

- [ ] **Step 1: Run**

```bash
yarn test:e2e:single test/e2e/tests/tron/swap.spec.ts --browser=chrome
```

Expected: 7 passing. If a later happy-path test still sees USDT as source,
`returnToTronHome` did not run or `driver.navigate()` was a no-op because
the URL hash did not change — in that case go to home via
`${driver.extensionUrl}/home.html` using `driver.openNewURL` first, matching
the Send deep-link workaround in `tron-send.flow.ts`.

- [ ] **Step 2: Commit any navigation fix**

```bash
git add test/e2e/tests/tron/swap.spec.ts
git commit -m "test(e2e): reset Tron swap page between shared-session cases"
```

Only if the run required a code change.
