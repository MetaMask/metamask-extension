# Tron assets shared Chrome + delete check-balance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run all non-Flask Tron assets assertions in one Chrome session on
the existing shared Java-Tron node, move homepage header balance coverage
out of `check-balance.spec.ts`, then delete that file.

**Architecture:** Mirror `test/e2e/tests/tron/send.spec.ts`: `TronNode` in
suite `before`/`after`, `startHeldTronFixtures` for one driver, Account 1 =
empty, Account 2 = portfolio. Header native/fiat assertions use those same
accounts. Do not start extra HD copies of the portfolio; isolation for the
portfolio cases is UI reset, not a new address.

**Tech Stack:** Mocha, Selenium `Driver`, `startHeldTronFixtures`, existing
`HomePage` / `TokensTab` / `TronAssetDetailsPage` page objects.

## Global Constraints

- Keep the suite-owned Java-Tron node (already in `assets.spec.ts`).
- Use `startHeldTronFixtures` (already used by `send.spec.ts`). Do not use
  `withTronFixtures` per `it`.
- Copy the `firstFailure` skip pattern from `send.spec.ts` exactly.
- Expected header numbers come from `TRON_PORTFOLIO_ACCOUNT` / empty
  fixtures, not from `mockTronApis` (`106.072 TRX` / `$39.65`).
- Delete `test/e2e/tests/tron/check-balance.spec.ts` in this plan. Do not
  leave a skipped stub.
- New code is TypeScript.

## File map

- Modify: `test/e2e/tests/tron/assets.spec.ts`
- Delete: `test/e2e/tests/tron/check-balance.spec.ts`
- Reuse, do not modify unless a helper is missing:
  - `test/e2e/tests/tron/fixtures/with-tron-fixtures.ts` (`startHeldTronFixtures`)
  - `test/e2e/page-objects/flows/add-account.flow.ts`
  - `test/e2e/page-objects/flows/account-list.flow.ts` (`switchToAccount`)
  - `test/e2e/page-objects/flows/settings.flow.ts` (`enableNativeTokenAsMainBalance`)
  - `test/e2e/page-objects/flows/network.flow.ts` (`switchToNetworkFromNetworkSelect`, `selectAllNetworksFromNetworkSelect`)

## Header amounts (replacing check-balance)

`check-balance.spec.ts` used HTTP mocks with `TRX_BALANCE = 106072392` SUN.
Assets uses `TRON_PORTFOLIO_TRX_BALANCE_IN_SUN = 6_072_392` and
`TRX_TO_USD_RATE = 0.29469`.

| Case | Account | `showNativeTokenAsMainBalance` | Header assertion |
|---|---|---|---|
| Empty native | Account 1 | `true` (fixture default) | `0 TRX` |
| Portfolio native | Account 2 | `true` | `6.072 TRX` |
| Portfolio fiat | Account 2 | `false` (toggle once) | `$10.18` |

Fiat derivation (same prices as `TRON_PORTFOLIO_ACCOUNT`):

- TRX: `6.072392 * 0.29469` ≈ `1.789`
- HTX: `3156454.956… * 0.00000168` ≈ `5.303`
- USDT: `2.804595 * 0.999176` ≈ `2.802`
- USDD: `0.289757 * 0.999959` ≈ `0.290`
- GAS_FREE / SEED: priced at `1e-9` → `0`

Total ≈ `$10.18`. This is `$39.65 - 100 TRX * 0.29469`. If the live header
rounds differently, lock the string from the first failure message and put
that exact string in the test — do not keep `$39.65`.

Use `HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS` (`30000`) for header waits.

`enableNativeTokenAsMainBalance` in `settings.flow.ts` **toggles** the pref.
Start the fixture with native **on** (omit
`withShowNativeTokenAsMainBalanceDisabled`). After the two native header
tests, call it once so the remaining list/details tests match today’s
native-off assets suite, and so the fiat header test can run.

---

### Task 1: Convert assets to a held Chrome session

**Files:**
- Modify: `test/e2e/tests/tron/assets.spec.ts`

**Interfaces:**
- Consumes: `startHeldTronFixtures`, `buildTronNodeOptions`, existing
  `EMPTY_ACCOUNT_FIXTURE` / `PORTFOLIO_ACCOUNT_FIXTURE`
- Produces: one `driver` for every `it` in the file

- [ ] **Step 1: Replace per-test `withTronFixtures` with the send.spec hold pattern**

Keep the existing shared `TronNode` `before`/`after`. Remove
`withTronFixtures` from every `it`. Remove `tronAssetsTestConfig` if it only
existed to pass per-test options.

Use this suite skeleton (same skip/release behavior as `send.spec.ts`):

```typescript
import { Suite } from 'mocha';
import { EXPECTED_TRON_ADDRESSES_BY_INDEX } from '../../constants';
import { HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { addMultipleAccounts } from '../../page-objects/flows/add-account.flow';
import { switchToAccount } from '../../page-objects/flows/account-list.flow';
import { login } from '../../page-objects/flows/login.flow';
import { waitUntilAccountTreeSyncIdle } from '../../page-objects/flows/tron-account-derivation.flow';
import {
  selectAllNetworksFromNetworkSelect,
  switchToNetworkFromNetworkSelect,
} from '../../page-objects/flows/network.flow';
import { enableNativeTokenAsMainBalance } from '../../page-objects/flows/settings.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import TronAssetDetailsPage from '../../page-objects/pages/asset/tron-asset-details';
import { TronNode } from '../../seeder/tron/node';
import {
  EMPTY_TRON_ACCOUNT,
  TRON_PORTFOLIO_ACCOUNT,
  TRON_PORTFOLIO_LOW_VALUE_ASSET_NAMES,
  TRON_PORTFOLIO_MAIN_LIST_ASSET_NAMES,
} from './fixtures/environments';
import {
  buildTronNodeOptions,
  startHeldTronFixtures,
  type HeldTronFixturesSession,
  type TronFixtureAccount,
} from './fixtures/with-tron-fixtures';

const TRON_ASSET_LIST_TIMEOUT_MS = 30_000;

const TRON_ASSETS_REMOTE_FEATURE_FLAGS = {
  remoteFeatureFlags: {
    batchSell: { enabled: true },
    earnMusdCtaEnabled: false,
  },
} as const;

const TRON_ASSETS_MANIFEST_FLAGS = {
  remoteFeatureFlags: {
    batchSell: { enabled: true },
    earnMusdCtaEnabled: false,
  },
} as const;

const EMPTY_ACCOUNT_FIXTURE: TronFixtureAccount[] = [
  {
    ...EMPTY_TRON_ACCOUNT,
    address: EXPECTED_TRON_ADDRESSES_BY_INDEX[0],
  },
];

const PORTFOLIO_ACCOUNT_FIXTURE: TronFixtureAccount[] = [
  {
    ...TRON_PORTFOLIO_ACCOUNT,
    address: EXPECTED_TRON_ADDRESSES_BY_INDEX[1],
  },
];

const PORTFOLIO_ACCOUNT_INDEX = 1;

function buildTronAssetsFixture(): FixtureBuilderV2 {
  // Native-as-main stays ON so Account 1/2 header tests can assert `0 TRX`
  // and `6.072 TRX`. Toggle it off after those tests.
  return new FixtureBuilderV2().withRemoteFeatureFlagController(
    TRON_ASSETS_REMOTE_FEATURE_FLAGS,
  );
}

async function prepareTronAssetsHomepage(driver: Driver): Promise<void> {
  await login(driver, { validateBalance: false });
  const homePage = new HomePage(driver);
  await addMultipleAccounts({
    accountToSelect: 'Account 1',
    driver,
    numberOfAccounts: PORTFOLIO_ACCOUNT_INDEX,
  });
  await homePage.checkPageIsLoaded();
  await homePage.waitForNonEvmAccountsLoaded();
  await waitUntilAccountTreeSyncIdle(driver);
  await switchToNetworkFromNetworkSelect(driver, 'Tron');
  await driver.refresh();
  await homePage.checkPageIsLoaded();
}

async function returnToTronHome(driver: Driver): Promise<void> {
  await driver.navigate();
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
}

async function waitForTronAssetList(
  tokensTab: TokensTab,
  tokenName = 'Tron',
): Promise<void> {
  await tokensTab.checkTokenExistsInList(tokenName, undefined, {
    timeout: TRON_ASSET_LIST_TIMEOUT_MS,
  });
}

describe('Tron - Assets', function (this: Suite) {
  this.timeout(300_000);

  const sharedTronNode = new TronNode();
  let driver: Driver;
  let firstFailure: unknown;
  let session: HeldTronFixturesSession | undefined;

  before(async function () {
    await sharedTronNode.start(
      buildTronNodeOptions([
        ...EMPTY_ACCOUNT_FIXTURE,
        ...PORTFOLIO_ACCOUNT_FIXTURE,
      ]),
    );
    session = await startHeldTronFixtures({
      accounts: [...EMPTY_ACCOUNT_FIXTURE, ...PORTFOLIO_ACCOUNT_FIXTURE],
      borrowedTronNode: sharedTronNode,
      fixtures: buildTronAssetsFixture().build(),
      manifestFlags: TRON_ASSETS_MANIFEST_FLAGS,
      title: this.test?.parent?.fullTitle() ?? 'Tron - Assets',
    });
    driver = session.context.driver;
    try {
      await prepareTronAssetsHomepage(driver);
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
    try {
      if (!session) {
        return;
      }
      await session.release(firstFailure);
    } catch (error) {
      if (!firstFailure) {
        throw error;
      }
    } finally {
      await sharedTronNode.quit();
    }
  });
});
```

Move each existing `it` body under this describe. Drop the
`await withTronFixtures({...}, async ({ driver }) => { ... })` wrapper. Use
the suite `driver`. At the start of each test (except the first, which is
already on Account 1 / Tron home):

```typescript
await returnToTronHome(driver);
```

Portfolio tests then:

```typescript
await switchToAccount(driver, 'Account 2');
await waitUntilAccountTreeSyncIdle(driver);
```

Empty-account tests stay on Account 1. After `returnToTronHome`, if the
previous test left Account 2 selected, switch back:

```typescript
await switchToAccount(driver, 'Account 1');
await waitUntilAccountTreeSyncIdle(driver);
```

Keep assertion bodies from the current file unchanged for:

- empty token list (`0` / `0 TRX`)
- portfolio list rows
- low-value collapse/expand
- all-networks filter
- current-network filter
- TRX details
- TRC20 details

**Order inside the suite (required):**

1. Empty Account 1: homepage header `0 TRX` **and** the existing token-list
   empty assertions (one `it` or two sequential `it`s; two is fine).
2. Switch to Account 2: homepage header `6.072 TRX`.
3. `await enableNativeTokenAsMainBalance(driver)` then header `$10.18`.
4. Existing portfolio list test.
5. Low-value collapse/expand.
6. Current-network filter (Tron-only).
7. All-networks filter. **End this test by switching back to Tron**
   (`switchToNetworkFromNetworkSelect(driver, 'Tron')`). Network filter is
   persisted controller state; `driver.navigate()` will not undo it.
8. TRX asset details.
9. `returnToTronHome` then TRC20 asset details.

Header `it` examples:

```typescript
it('Just created Tron account shows 0 TRX when native token is enabled', async function () {
  const homePage = new HomePage(driver);
  await homePage.checkExpectedBalanceIsDisplayed({
    expectedBalance: '0 TRX',
    timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
  });
});

it('Portfolio account shows native TRX as the main balance', async function () {
  await returnToTronHome(driver);
  await switchToAccount(driver, 'Account 2');
  await waitUntilAccountTreeSyncIdle(driver);
  const homePage = new HomePage(driver);
  await homePage.checkExpectedBalanceIsDisplayed({
    expectedBalance: '6.072 TRX',
    timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
  });
});

it('Portfolio account shows fiat as the main balance when native token is disabled', async function () {
  await enableNativeTokenAsMainBalance(driver);
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.checkExpectedBalanceIsDisplayed({
    expectedBalance: '$10.18',
    timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
  });
});
```

Do not call `enableNativeTokenAsMainBalance` more than once. Later tests
rely on native-off.

- [ ] **Step 2: Lint**

```bash
yarn lint:changed:fix
```

Expected: `assets.spec.ts` is formatted and ESLint-clean.

- [ ] **Step 3: Commit the conversion (keep check-balance until headers pass)**

```bash
git add test/e2e/tests/tron/assets.spec.ts
git commit -m "test(e2e): share one Chrome session across Tron assets cases"
```

---

### Task 2: Delete `check-balance.spec.ts`

**Files:**
- Delete: `test/e2e/tests/tron/check-balance.spec.ts`

**Interfaces:**
- Consumes: header coverage now in `assets.spec.ts`
- Produces: no remaining references to this file

Coverage map after deletion:

| Old check-balance test | New home |
|---|---|
| `0 TRX` header, native on, empty account | Assets Account 1 header |
| `$39.65` header, native off | Assets Account 2 `$10.18` header |
| `106.072 TRX` header, native on | Assets Account 2 `6.072 TRX` header |

The old file’s token-list overlap (empty `0 TRX` row, non-zero TRX) was
already in assets.

- [ ] **Step 1: Grep for leftovers, then delete**

```bash
rg "tests/tron/check-balance" -g '!docs/superpowers/**'
```

Expected: no CI / import hits. Then delete the spec file.

- [ ] **Step 2: Commit**

```bash
git add test/e2e/tests/tron/check-balance.spec.ts
git commit -m "test(e2e): drop Tron check-balance spec covered by assets"
```

---

### Task 3: Run the assets suite

- [ ] **Step 1: Run**

Requires a test build (`yarn build:test` or `yarn start:test` if `dist/` is
missing):

```bash
yarn test:e2e:single test/e2e/tests/tron/assets.spec.ts --browser=chrome
```

Expected: all tests pass. If the fiat header is not `$10.18`, update that
one string from the actual header text and re-run. If a later test sees
Ethereum still in the list, the all-networks test did not switch back to
Tron.

- [ ] **Step 2: Commit any assertion-string fix**

```bash
git add test/e2e/tests/tron/assets.spec.ts
git commit -m "test(e2e): lock Tron assets header fiat assertion"
```

Only create this commit if the string changed.
