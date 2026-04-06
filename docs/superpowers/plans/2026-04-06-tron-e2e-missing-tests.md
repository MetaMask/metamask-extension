# Tron E2E Missing Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the missing Tron E2E tests covering staking asset display, send edge cases, transaction activity details, and asset display.

**Architecture:** Each task produces one new spec file (or extends an existing one) plus any new mock helpers added to `common-tron.ts`. Tests follow the established `withFixtures` + page-object pattern already used in the existing Tron test suite.

**Tech Stack:** Mocha + Selenium WebDriver (via MetaMask's `Driver` abstraction), `mockttp` for HTTP mocking, TypeScript, existing page-object classes (`NonEvmHomepage`, `AssetListPage`, `ActivityListPage`, `TransactionDetailsPage`, `SnapTransactionConfirmation`, `SendPage`, `NetworkManager`).

---

## Architectural Finding: Staking Flows Are Portfolio-Only

After reading the snap source code (`clientRequest.ts`, `ConfirmationHandler.ts`), **the MetaMask extension has no staking UI**. The staking clientRequest methods (`confirmStake`, `confirmUnstake`, `claimTrxStakingRewards`) are called exclusively by MetaMask Portfolio (`https://portfolio.metamask.io`). Only `claimUnstakedTrx` shows a snap confirmation dialog, but it is also Portfolio-initiated.

**This means Tasks 2 and 3 from the original plan (staking flow UI tests) are not achievable from the MetaMask extension's E2E test suite** — no staking buttons exist in the extension to click. What IS testable from the extension:
- Staked TRX **assets** in the token list (the keyring API returns them, MetaMask displays them)
- Staking-related transaction entries in the activity list

---

## Correct Asset Names (from `snap-tron-wallet/packages/snap/src/constants/index.ts`)

| Asset | Display Name | Symbol |
|---|---|---|
| TRX staked for energy | `'Staked for Energy'` | `sTRX-ENERGY` |
| TRX staked for bandwidth | `'Staked for Bandwidth'` | `sTRX-BANDWIDTH` |
| Unstaked, lock period not over | `'In Lock Period'` | `trx-in-lock-period` |
| Unstaked, lock period over | `'Ready for Withdrawal'` | `trx-ready-for-withdrawal` |
| Accrued staking rewards | `'Staking Rewards'` | `trx-staking-rewards` |

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `test/e2e/tests/tron/mocks/common-tron.ts` | **Modify** | Add staking mock helpers: `mockGetAccountWithStaking`, `mockTronApisWithStaking` |
| `test/e2e/tests/tron/staking-assets.spec.ts` | **Create** | 3 staking asset display tests |
| `test/e2e/tests/send/send-tron.spec.ts` | **Modify** | Add 3 send edge-case tests (insufficient balance, fee breakdown, unactivated account fee) |
| `test/e2e/tests/tron/transaction-activity-list.spec.ts` | **Modify** | Add 2 tests (swap in activity, stake/unstake in activity) |
| `test/e2e/tests/tron/asset-display.spec.ts` | **Modify** | Add 2 tests (staking rewards asset, in-lock-period asset) |

---

## Task 1: Add staking mock helpers to `common-tron.ts`

**Goal:** Provide a mock Tron account with staked TRX and all related transaction mocks so subsequent tasks can compose them.

**Files:**
- Modify: `test/e2e/tests/tron/mocks/common-tron.ts`

**Acceptance Criteria:**
- [ ] `TRX_STAKED_ENERGY_SUN`, `TRX_STAKED_BANDWIDTH_SUN`, `TRX_IN_LOCK_PERIOD_SUN`, `TRX_READY_FOR_WITHDRAWAL_SUN`, `STAKING_REWARDS_SUN` constants exported
- [ ] `mockGetAccountWithStaking` returns `frozenV2` with BANDWIDTH (10 TRX) + ENERGY (20 TRX), and `unfrozenV2` with two entries: one with future expire (In Lock Period) and one with past expire (Ready for Withdrawal)
- [ ] `mockTronGetReward` mocks `POST /wallet/getreward` returning `{ reward: STAKING_REWARDS_SUN }`
- [ ] `mockFreezeBalance` mocks `POST /wallet/freezebalancev2`
- [ ] `mockUnfreezeBalance` mocks `POST /wallet/unfreezebalancev2`
- [ ] `mockWithdrawExpireUnfreeze` mocks `POST /wallet/withdrawexpireunfreeze`
- [ ] `mockWithdrawBlockRewards` mocks `POST /wallet/withdrawbalance`
- [ ] `mockTronApisWithStaking` composes all base mocks + staking endpoint mocks

**Verify:** `yarn tsc --noEmit` in the repo root → no TypeScript errors on the mock file

**Steps:**

- [ ] **Step 1: Add staking constants**

Add after the existing `TRX_BALANCE` block (around line 28):

```typescript
// Staking amounts in SUN (1 TRX = 1_000_000 SUN)
export const TRX_STAKED_ENERGY_SUN = 20_000_000;      // 20 TRX staked for energy
export const TRX_STAKED_BANDWIDTH_SUN = 10_000_000;   // 10 TRX staked for bandwidth
export const TRX_IN_LOCK_PERIOD_SUN = 5_000_000;      // 5 TRX unstaking, lock not done
export const TRX_READY_FOR_WITHDRAWAL_SUN = 3_000_000; // 3 TRX unstaked, ready to claim
export const STAKING_REWARDS_SUN = 1_234_567;          // ~1.23 TRX staking rewards
```

- [ ] **Step 2: Add `mockGetAccountWithStaking`**

Add after the existing `mockTronGetAccount` function:

```typescript
/**
 * Mocks GET /v1/accounts/{address} for an account that has staked TRX.
 * Returns:
 *   frozenV2: 10 TRX staked for BANDWIDTH + 20 TRX staked for ENERGY
 *   unfrozenV2: 5 TRX in lock period (expires in future) + 3 TRX ready for withdrawal (expired)
 */
export async function mockGetAccountWithStaking(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(tronInfuraUrl(`/v1/accounts/${TRON_ACCOUNT_ADDRESS}`))
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        data: [
          {
            address: '4100dd57a0a3ee58392689f79c0bedcf44d3b6c255',
            balance: TRX_BALANCE,
            create_time: 1763374065000,
            frozenV2: [
              {
                amount: TRX_STAKED_BANDWIDTH_SUN,
                type: 'BANDWIDTH',
              },
              {
                amount: TRX_STAKED_ENERGY_SUN,
                type: 'ENERGY',
              },
              {
                type: 'TRON_POWER',
              },
            ],
            unfrozenV2: [
              {
                // In Lock Period: expires 14 days from "now" (still locked)
                unfreeze_amount: TRX_IN_LOCK_PERIOD_SUN,
                unfreeze_expire_time: Date.now() + 14 * 24 * 60 * 60 * 1000,
              },
              {
                // Ready for Withdrawal: expired yesterday
                unfreeze_amount: TRX_READY_FOR_WITHDRAWAL_SUN,
                unfreeze_expire_time: Date.now() - 24 * 60 * 60 * 1000,
              },
            ],
            account_resource: {
              energy_window_optimized: true,
              latest_consume_time_for_energy: 1764149628000,
              energy_window_size: 28800000,
            },
            trc20: [],
            assetV2: [],
            free_asset_net_usageV2: [],
            active_permission: [],
            owner_permission: {
              keys: [{ address: TRON_ACCOUNT_ADDRESS, weight: 1 }],
              threshold: 1,
              permission_name: 'owner',
            },
            latest_opration_time: 1764149628000,
            net_window_size: 28800000,
            net_window_optimized: true,
          },
        ],
        success: true,
        meta: { at: Date.now(), page_size: 1 },
      },
    }));
}
```

- [ ] **Step 3: Add `mockTronGetReward`**

The snap calls `POST /wallet/getreward` to fetch accrued staking rewards. Add this mock:

```typescript
/**
 * Mocks POST /wallet/getreward — returns accrued staking rewards.
 * The snap uses this to populate the "Staking Rewards" virtual asset.
 */
export async function mockTronGetReward(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forPost(tronInfuraUrl('/wallet/getreward'))
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        reward: STAKING_REWARDS_SUN,
      },
    }));
}
```

- [ ] **Step 4: Add broadcast mocks for staking transactions**

```typescript
/** Mocks POST /wallet/freezebalancev2 */
export async function mockFreezeBalance(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forPost(tronInfuraUrl('/wallet/freezebalancev2'))
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        visible: false,
        txID: 'aabbcc00000000000000000000000000000000000000000000000000freeze001',
        raw_data: {
          contract: [
            {
              parameter: {
                value: {
                  frozen_balance: TRX_STAKED_ENERGY_SUN,
                  resource: 'ENERGY',
                  owner_address: '4100dd57a0a3ee58392689f79c0bedcf44d3b6c255',
                },
                type_url:
                  'type.googleapis.com/protocol.FreezeBalanceV2Contract',
              },
              type: 'FreezeBalanceV2Contract',
            },
          ],
          ref_block_bytes: '94a9',
          ref_block_hash: '5946efc2f14403b9',
          expiration: Date.now() + 60_000,
          timestamp: Date.now(),
        },
      },
    }));
}

/** Mocks POST /wallet/unfreezebalancev2 */
export async function mockUnfreezeBalance(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forPost(tronInfuraUrl('/wallet/unfreezebalancev2'))
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        visible: false,
        txID: 'aabbcc00000000000000000000000000000000000000000000unfreeze001',
        raw_data: {
          contract: [
            {
              parameter: {
                value: {
                  unfreeze_balance: TRX_STAKED_ENERGY_SUN,
                  resource: 'ENERGY',
                  owner_address: '4100dd57a0a3ee58392689f79c0bedcf44d3b6c255',
                },
                type_url:
                  'type.googleapis.com/protocol.UnfreezeBalanceV2Contract',
              },
              type: 'UnfreezeBalanceV2Contract',
            },
          ],
          ref_block_bytes: '94a9',
          ref_block_hash: '5946efc2f14403b9',
          expiration: Date.now() + 60_000,
          timestamp: Date.now(),
        },
      },
    }));
}

/** Mocks POST /wallet/withdrawexpireunfreeze */
export async function mockWithdrawExpireUnfreeze(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forPost(tronInfuraUrl('/wallet/withdrawexpireunfreeze'))
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        visible: false,
        txID: 'aabbcc00000000000000000000000000000000000000withdraw001',
        raw_data: {
          contract: [
            {
              parameter: {
                value: {
                  owner_address: '4100dd57a0a3ee58392689f79c0bedcf44d3b6c255',
                },
                type_url:
                  'type.googleapis.com/protocol.WithdrawExpireUnfreezeContract',
              },
              type: 'WithdrawExpireUnfreezeContract',
            },
          ],
          ref_block_bytes: '94a9',
          ref_block_hash: '5946efc2f14403b9',
          expiration: Date.now() + 60_000,
          timestamp: Date.now(),
        },
      },
    }));
}

/** Mocks POST /wallet/withdrawbalance (staking rewards) */
export async function mockWithdrawBlockRewards(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forPost(tronInfuraUrl('/wallet/withdrawbalance'))
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        visible: false,
        txID: 'aabbcc00000000000000000000000000000000000000rewards001',
        raw_data: {
          contract: [
            {
              parameter: {
                value: {
                  owner_address: '4100dd57a0a3ee58392689f79c0bedcf44d3b6c255',
                },
                type_url:
                  'type.googleapis.com/protocol.WithdrawBalanceContract',
              },
              type: 'WithdrawBalanceContract',
            },
          ],
          ref_block_bytes: '94a9',
          ref_block_hash: '5946efc2f14403b9',
          expiration: Date.now() + 60_000,
          timestamp: Date.now(),
        },
      },
    }));
}
```

- [ ] **Step 5: Add `mockTronApisWithStaking` composer**

```typescript
/**
 * Like mockTronApis but uses an account that has staked TRX.
 * Adds freeze/unfreeze/withdraw/reward endpoint mocks for staking asset display tests.
 * NOTE: staking flows (confirmStake, confirmUnstake) are Portfolio-initiated and
 * cannot be triggered from MetaMask extension E2E tests — these mocks are here
 * solely to support asset display assertions.
 */
export async function mockTronApisWithStaking(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    await mockTronFeatureFlags(mockServer),
    await mockTronGetBlock(mockServer),
    await mockGetAccountWithStaking(mockServer),
    await mockTronGetAccountResource(mockServer),
    await mockTronGetTrc20Transactions(mockServer),
    await mockTronGetTransactions(mockServer),
    await mockExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockTronSpotPrices(mockServer),
    await mockTrxNativeSpotPrices(mockServer),
    await mockTronAssets(mockServer),
    await mockBroadTransaction(mockServer),
    await mockFreezeBalance(mockServer),
    await mockUnfreezeBalance(mockServer),
    await mockWithdrawExpireUnfreeze(mockServer),
    await mockWithdrawBlockRewards(mockServer),
    await mockTronGetReward(mockServer),
  ];
}
```

- [ ] **Step 6: Commit**

```bash
git add test/e2e/tests/tron/mocks/common-tron.ts
git commit -m "test(tron-e2e): add staking mock helpers to common-tron"
```

---

## Task 2: Staking asset display tests

**Goal:** Verify that "Staked for Bandwidth", "Staked for Energy", "In Lock Period", and "Ready for Withdrawal" virtual assets appear correctly in the token list when the account has staked TRX.

**Context:** These assets are exposed by the snap's keyring API (`listAccountAssets`) and displayed by MetaMask in the token list. They do NOT require the staking flow UI — they are balance data.

**Files:**
- Create: `test/e2e/tests/tron/staking-assets.spec.ts`

**Acceptance Criteria:**
- [ ] "staked TRX assets are visible" test shows `'Staked for Energy'` and `'Staked for Bandwidth'` in the token list
- [ ] "in-lock-period TRX shows in token list" test shows `'In Lock Period'` token
- [ ] "ready-for-withdrawal TRX shows in token list" test shows `'Ready for Withdrawal'` token
- [ ] All three tests use `mockTronApisWithStaking`

**Verify:** `yarn test:e2e --grep "Tron staking assets"` → all three pass

**Steps:**

- [ ] **Step 1: Create `staking-assets.spec.ts`**

```typescript
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import HomePage from '../../page-objects/pages/home/homepage';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import NetworkManager from '../../page-objects/pages/network-manager';
import { mockTronApisWithStaking } from './mocks/common-tron';

describe('Tron staking assets', function (this: Suite) {
  it('staked TRX assets are visible in the token list', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApisWithStaking,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });

        const assetListPage = new AssetListPage(driver);
        // Asset names come from the snap's constants/index.ts:
        // TRX_STAKED_FOR_ENERGY_METADATA.name = 'Staked for Energy'
        // TRX_STAKED_FOR_BANDWIDTH_METADATA.name = 'Staked for Bandwidth'
        await assetListPage.checkTokenExistsInList('Staked for Energy');
        await assetListPage.checkTokenExistsInList('Staked for Bandwidth');
      },
    );
  });

  it('in-lock-period TRX shows in the token list', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApisWithStaking,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });

        const assetListPage = new AssetListPage(driver);
        // TRX_IN_LOCK_PERIOD_METADATA.name = 'In Lock Period'
        // Requires unfrozenV2 with unfreeze_expire_time in the FUTURE
        await assetListPage.checkTokenExistsInList('In Lock Period');
      },
    );
  });

  it('ready-for-withdrawal TRX shows in the token list', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApisWithStaking,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });

        const assetListPage = new AssetListPage(driver);
        // TRX_READY_FOR_WITHDRAWAL_METADATA.name = 'Ready for Withdrawal'
        // Requires unfrozenV2 with unfreeze_expire_time in the PAST
        await assetListPage.checkTokenExistsInList('Ready for Withdrawal');
      },
    );
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add test/e2e/tests/tron/staking-assets.spec.ts
git commit -m "test(tron-e2e): add staking asset display tests"
```

---

## Task 3: Send edge cases — insufficient balance and fee breakdown

**Goal:** Cover the error state for sending more TRX than available, and verify Energy + Bandwidth fee labels appear in the confirmation dialog.

**Files:**
- Modify: `test/e2e/tests/send/send-tron.spec.ts`

**Acceptance Criteria:**
- [ ] "insufficient balance shows error" test: entering `9999 TRX` shows an error without proceeding to confirmation
- [ ] "confirmation shows fee breakdown" test: after filling amount + recipient, the snap confirmation dialog shows `'Bandwidth'` and `'Energy'` labels
- [ ] Both use `mockTronApis`

**Verify:** `yarn test:e2e --grep "Send Tron"` → all tests pass

**Steps:**

- [ ] **Step 1: Add the insufficient balance test**

Append inside the existing `describe('Send Tron', ...)` block in `send-tron.spec.ts`:

```typescript
  it('shows an error when sending more TRX than available', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomepage = new NonEvmHomepage(driver);
        await nonEvmHomepage.checkExpectedTokenBalanceIsDisplayed('6.072', 'TRX');
        await nonEvmHomepage.clickOnSendButton();

        const sendPage = new SendPage(driver);
        await sendPage.selectToken('tron:728126428', 'TRX');
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        // TRX_BALANCE ~6.07 TRX; 9999 >> available balance
        await sendPage.fillAmount('9999');

        // The snap's onAmountInput returns InsufficientBalance.
        // MetaMask's SIP-31 send UI surfaces this as an "Insufficient funds" inline error.
        await sendPage.checkInsufficientFundsError();
      },
    );
  });
```

- [ ] **Step 2: Add the fee breakdown test**

```typescript
  it('confirmation dialog shows Energy and Bandwidth fee labels', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
        ignoredConsoleErrors: [
          `Failed to send transaction: ${TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE}`,
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomepage = new NonEvmHomepage(driver);
        await nonEvmHomepage.checkExpectedTokenBalanceIsDisplayed('6.072', 'TRX');
        await nonEvmHomepage.clickOnSendButton();

        const sendPage = new SendPage(driver);
        await sendPage.selectToken('tron:728126428', 'TRX');
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();

        // The snap's confirmSend shows fee breakdown via ConfirmTransactionRequest UI.
        // Both Bandwidth and Energy appear as line items rendered by the snap dialog.
        const snapConfirmation = new SnapTransactionConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await driver.waitForSelector({ tag: 'p', text: 'Bandwidth' });
        await driver.waitForSelector({ tag: 'p', text: 'Energy' });
      },
    );
  });
```

- [ ] **Step 3: Ensure `TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE` is imported**

At the top of `send-tron.spec.ts`, the import from `common-tron` should include:

```typescript
import {
  mockTronApis,
  TRON_RECIPIENT_ADDRESS,
  TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE,
} from '../tron/mocks/common-tron';
```

- [ ] **Step 4: Commit**

```bash
git add test/e2e/tests/send/send-tron.spec.ts
git commit -m "test(tron-e2e): add insufficient balance and fee breakdown send tests"
```

---

## Task 4: Send edge case — unactivated account shows activation fee

**Goal:** Verify sending TRX to a never-activated Tron address shows the 1 TRX account activation fee in the confirmation dialog.

**Files:**
- Modify: `test/e2e/tests/tron/mocks/common-tron.ts` (add `TRON_UNACTIVATED_ADDRESS`, `mockUnactivatedRecipientAccount`)
- Modify: `test/e2e/tests/send/send-tron.spec.ts`

**Acceptance Criteria:**
- [ ] `TRON_UNACTIVATED_ADDRESS` exported from `common-tron.ts`
- [ ] `mockUnactivatedRecipientAccount` mocks `GET /v1/accounts/{TRON_UNACTIVATED_ADDRESS}` returning `data: []`
- [ ] Test reaches the snap confirmation dialog and shows a `'1 TRX'` fee entry

**Verify:** `yarn test:e2e --grep "unactivated"` → passes

**Steps:**

- [ ] **Step 1: Add constant and mock to `common-tron.ts`**

```typescript
// A Tron address that has never been activated on-chain
export const TRON_UNACTIVATED_ADDRESS = 'TTd8E9jhfVeKMuLQX8YJjnHmHpNbKSjGTQ';

/**
 * Returns an empty account response for TRON_UNACTIVATED_ADDRESS.
 * An empty `data` array means the account has never been activated.
 * The snap's FeeCalculatorService detects this and adds 1 TRX activation fee.
 */
export async function mockUnactivatedRecipientAccount(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(tronInfuraUrl(`/v1/accounts/${TRON_UNACTIVATED_ADDRESS}`))
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        data: [],
        success: true,
        meta: { at: Date.now(), page_size: 0 },
      },
    }));
}
```

- [ ] **Step 2: Add the test to `send-tron.spec.ts`**

Update the import to include the new exports:

```typescript
import {
  mockTronApis,
  TRON_RECIPIENT_ADDRESS,
  TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE,
  TRON_UNACTIVATED_ADDRESS,
  mockUnactivatedRecipientAccount,
} from '../tron/mocks/common-tron';
```

Append the test inside the `describe` block:

```typescript
  it('shows 1 TRX activation fee when sending to an unactivated address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => [
          ...(await mockTronApis(mockServer)),
          // Register unactivated address mock AFTER base mocks so its specific
          // route takes precedence over any wildcard (mockttp: first match wins,
          // so more-specific routes must be registered first — here we rely on
          // mockttp matching the longer exact URL before the wildcard).
          await mockUnactivatedRecipientAccount(mockServer),
        ],
        ignoredConsoleErrors: [
          `Failed to send transaction: ${TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE}`,
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomepage = new NonEvmHomepage(driver);
        await nonEvmHomepage.checkExpectedTokenBalanceIsDisplayed('6.072', 'TRX');
        await nonEvmHomepage.clickOnSendButton();

        const sendPage = new SendPage(driver);
        await sendPage.selectToken('tron:728126428', 'TRX');
        await sendPage.fillRecipient(TRON_UNACTIVATED_ADDRESS);
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapTransactionConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();

        // The snap's FeeCalculatorService adds ACCOUNT_ACTIVATION_FEE_TRX = 1 TRX
        // when the recipient account's data array is empty (never activated).
        // It appears as a cost line item in the confirmation dialog.
        await driver.waitForSelector({ tag: 'p', text: '1 TRX' });
      },
    );
  });
```

**NOTE on mockttp ordering:** `mockTronApis` already registers `mockTronGetAccount` for the primary address. The unactivated address mock uses a different path (`/v1/accounts/TTd8E9...`) so there's no conflict. No reordering needed.

- [ ] **Step 3: Commit**

```bash
git add test/e2e/tests/tron/mocks/common-tron.ts \
        test/e2e/tests/send/send-tron.spec.ts
git commit -m "test(tron-e2e): add unactivated account activation fee test"
```

---

## Task 5: Transaction activity — swap and stake/unstake entries

**Goal:** Extend `transaction-activity-list.spec.ts` to verify that swap-type and staking transactions show the correct action labels.

**Files:**
- Modify: `test/e2e/tests/tron/mocks/common-tron.ts` (add `mockTronGetTransactionsWithStake`, `mockTronGetTransactionsWithSwap`)
- Modify: `test/e2e/tests/tron/transaction-activity-list.spec.ts`

**Acceptance Criteria:**
- [ ] `FreezeBalanceV2Contract` transaction shows action label `'Stake'` in the activity list
- [ ] `TriggerSmartContract` with `call_value > 0` + internal TRC20 transfer shows `'Swap'`
- [ ] All 6 activity list tests pass together

**Verify:** `yarn test:e2e --grep "Tron transaction activity"` → all 6 pass

**Steps:**

- [ ] **Step 1: Add `mockTronGetTransactionsWithStake` to `common-tron.ts`**

```typescript
/**
 * Overrides the transactions endpoint to return a single FreezeBalanceV2Contract tx.
 * The snap's TransactionsMapper maps this to TransactionType.StakeDeposit → label "Stake".
 *
 * Register this BEFORE spreading mockTronApis in the testSpecificMock composer,
 * because mockttp matches routes in registration order (first match wins).
 */
export async function mockTronGetTransactionsWithStake(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(tronInfuraUrl(`/v1/accounts/${TRON_ACCOUNT_ADDRESS}/transactions`))
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        data: [
          {
            ret: [{ contractRet: 'SUCCESS', fee: 0 }],
            txID: 'stakeTxId00000000000000000000000000000000000000000000000000001',
            net_usage: 265,
            energy_usage: 0,
            blockNumber: 77829999,
            block_timestamp: 1764200000000,
            energy_fee: 0,
            energy_usage_total: 0,
            raw_data: {
              contract: [
                {
                  parameter: {
                    value: {
                      frozen_balance: 5_000_000,
                      resource: 'ENERGY',
                      owner_address:
                        '4100dd57a0a3ee58392689f79c0bedcf44d3b6c255',
                    },
                    type_url:
                      'type.googleapis.com/protocol.FreezeBalanceV2Contract',
                  },
                  type: 'FreezeBalanceV2Contract',
                },
              ],
              ref_block_bytes: '94a9',
              ref_block_hash: '5946efc2f14403b9',
              expiration: 1764200060000,
              timestamp: 1764200000000,
            },
            internal_transactions: [],
          },
        ],
        success: true,
        meta: { at: Date.now(), page_size: 1 },
      },
    }));
}
```

- [ ] **Step 2: Add `mockTronGetTransactionsWithSwap` to `common-tron.ts`**

```typescript
/**
 * Overrides the transactions endpoint to return a TriggerSmartContract tx
 * with call_value > 0 and an internal TRC20 transfer — the pattern the snap's
 * TransactionsMapper uses to detect TransactionType.Swap.
 *
 * Register this BEFORE spreading mockTronApis for the same reason as above.
 */
export async function mockTronGetTransactionsWithSwap(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(tronInfuraUrl(`/v1/accounts/${TRON_ACCOUNT_ADDRESS}/transactions`))
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        data: [
          {
            ret: [{ contractRet: 'SUCCESS', fee: 150000 }],
            txID: 'swapTxId000000000000000000000000000000000000000000000000000001',
            net_usage: 345,
            energy_usage: 28185,
            blockNumber: 77830000,
            block_timestamp: 1764201000000,
            energy_fee: 2799500,
            energy_usage_total: 28185,
            raw_data: {
              contract: [
                {
                  parameter: {
                    value: {
                      data: 'a9059cbb0000000000000000000000000000000000000000',
                      owner_address:
                        '4100dd57a0a3ee58392689f79c0bedcf44d3b6c255',
                      contract_address:
                        '41ca0303e8b9a738121777116dcea419fe524f271a',
                      // call_value > 0 means TRX sent to a contract = DEX swap signal
                      call_value: 1_000_000,
                    },
                    type_url:
                      'type.googleapis.com/protocol.TriggerSmartContract',
                  },
                  type: 'TriggerSmartContract',
                },
              ],
              ref_block_bytes: '94a9',
              ref_block_hash: '5946efc2f14403b9',
              expiration: 1764201060000,
              fee_limit: 150000000,
              timestamp: 1764201000000,
            },
            internal_transactions: [
              {
                // TRC20 USDT received = output leg of the swap
                token_info: {
                  symbol: 'USDT',
                  address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                  decimals: 6,
                  name: 'Tether USD',
                },
                to: TRON_ACCOUNT_ADDRESS,
                callValueInfo: [
                  {
                    callValue: 294852,
                    tokenId: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                  },
                ],
              },
            ],
          },
        ],
        success: true,
        meta: { at: Date.now(), page_size: 1 },
      },
    }));
}
```

- [ ] **Step 3: Add tests to `transaction-activity-list.spec.ts`**

Add to the import:

```typescript
import {
  mockTronApis,
  mockTronGetTransactionsWithStake,
  mockTronGetTransactionsWithSwap,
  tronTrc20TransferDetailsFixture,
  tronNativeTransferDetailsFixture,
} from './mocks/common-tron';
```

Append inside the existing `describe` block:

```typescript
  it('stake transaction appears as Stake in activity list', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        // IMPORTANT: register the override BEFORE mockTronApis so mockttp
        // matches the stake-only transactions route first.
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockTronGetTransactionsWithStake(mockServer),
          ...(await mockTronApis(mockServer)),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });
        await nonEvmHomePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        // FreezeBalanceV2Contract → TransactionType.StakeDeposit → "Stake"
        await activityList.checkTxAction({ action: 'Stake' });
        await activityList.checkNoFailedTransactions();
      },
    );
  });

  it('swap transaction appears as Swap in activity list', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockTronGetTransactionsWithSwap(mockServer),
          ...(await mockTronApis(mockServer)),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });
        await nonEvmHomePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        // TriggerSmartContract + call_value > 0 + internal TRC20 = Swap
        await activityList.checkTxAction({ action: 'Swap' });
        await activityList.checkNoFailedTransactions();
      },
    );
  });
```

- [ ] **Step 4: Commit**

```bash
git add test/e2e/tests/tron/mocks/common-tron.ts \
        test/e2e/tests/tron/transaction-activity-list.spec.ts
git commit -m "test(tron-e2e): add swap and stake transaction activity list tests"
```

---

## Task 6: Asset display — staking rewards and in-lock-period detail pages

**Goal:** Extend `asset-display.spec.ts` to verify the "Staking Rewards" and "In Lock Period" asset detail pages show correct TRX amounts.

**Files:**
- Modify: `test/e2e/tests/tron/asset-display.spec.ts`

**Acceptance Criteria:**
- [ ] "Staking Rewards detail page shows correct balance" clicks `'Staking Rewards'` in the list and verifies the displayed amount matches `STAKING_REWARDS_SUN / SUN_PER_TRX` formatted to 4 decimal places
- [ ] "In Lock Period detail page shows correct balance" clicks `'In Lock Period'` and verifies `5 TRX`
- [ ] Both use `mockTronApisWithStaking`
- [ ] All 5 asset display tests pass

**Verify:** `yarn test:e2e --grep "Tron asset display"` → all 5 pass

**Steps:**

- [ ] **Step 1: Add imports to `asset-display.spec.ts`**

```typescript
import {
  mockTronApis,
  mockTronApisWithStaking,
  TRX_IN_LOCK_PERIOD_SUN,
  STAKING_REWARDS_SUN,
  SUN_PER_TRX,
} from './mocks/common-tron';
```

- [ ] **Step 2: Append two tests**

```typescript
  it('Staking Rewards asset detail page shows correct balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApisWithStaking,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });

        const assetListPage = new AssetListPage(driver);
        // TRX_STAKING_REWARDS_METADATA.name = 'Staking Rewards'
        await assetListPage.clickOnAsset('Staking Rewards');

        // STAKING_REWARDS_SUN = 1_234_567 SUN = 1.234567 TRX
        // AssetListPage.checkTokenAmountIsDisplayed truncates to 4 decimal places → "1.2346 TRX"
        const rewardsTrx = (STAKING_REWARDS_SUN / SUN_PER_TRX).toFixed(4);
        await assetListPage.checkTokenAmountIsDisplayed(`${rewardsTrx} TRX`);
      },
    );
  });

  it('In Lock Period asset detail page shows correct balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApisWithStaking,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });

        const assetListPage = new AssetListPage(driver);
        // TRX_IN_LOCK_PERIOD_METADATA.name = 'In Lock Period'
        await assetListPage.clickOnAsset('In Lock Period');

        // TRX_IN_LOCK_PERIOD_SUN = 5_000_000 SUN = exactly 5 TRX
        const lockTrx = (TRX_IN_LOCK_PERIOD_SUN / SUN_PER_TRX).toFixed(3);
        await assetListPage.checkTokenAmountIsDisplayed(`${lockTrx} TRX`);
      },
    );
  });
```

- [ ] **Step 3: Commit**

```bash
git add test/e2e/tests/tron/asset-display.spec.ts
git commit -m "test(tron-e2e): add staking rewards and in-lock-period asset detail tests"
```

---

## Self-Review

**Spec coverage:**

| Feature | Task | Notes |
|---|---|---|
| Staked assets in token list | Task 2 | ✅ |
| In-lock-period in token list | Task 2 | ✅ |
| Ready-for-withdrawal in token list | Task 2 | ✅ |
| Insufficient balance error | Task 3 | ✅ |
| Fee breakdown in confirmation | Task 3 | ✅ |
| Unactivated account activation fee | Task 4 | ✅ |
| Swap in activity list | Task 5 | ✅ |
| Stake in activity list | Task 5 | ✅ |
| Staking rewards asset detail | Task 6 | ✅ |
| In-lock-period asset detail | Task 6 | ✅ |
| Staking flow UI (stake/unstake/claim) | ~~Tasks 2–3~~ | ❌ **Not testable from extension** — staking is Portfolio-only (see Architectural Finding section) |

**Asset name consistency:** All token names now taken verbatim from the snap's `constants/index.ts`:
- `'Staked for Energy'` (was `'TRX Staked for Energy'` — corrected)
- `'Staked for Bandwidth'` (was `'TRX Staked for Bandwidth'` — corrected)
- `'In Lock Period'` ✅
- `'Ready for Withdrawal'` (was `'In Lock Period'` in asset-display — corrected)
- `'Staking Rewards'` ✅

**Mock ordering for Tasks 5:** Explicitly documented that override mocks MUST be registered before `mockTronApis` so they match first. ✅

**Staking rewards via `/wallet/getreward`:** `mockTronGetReward` added to `mockTronApisWithStaking` in Task 1. ✅

**No placeholders:** All steps have complete code. ✅
