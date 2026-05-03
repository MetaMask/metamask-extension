import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import { TronNode } from '../../seeder/tron/node';
import { createTronPortfolioNodeOptions } from '../../seeder/tron/profiles';
import { landOnTronSendScreen } from '../../page-objects/flows/tron-send.flow';
import {
  TRON_ACCOUNT_ADDRESS,
  TRON_RECIPIENT_ADDRESS,
  mockTronFeatureFlags,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockTronSpotPrices,
  mockTrxNativeSpotPrices,
  mockTronAssets,
} from './mocks/common-tron';
import { proxyTronBlockchainCalls } from './mocks/local-tron-node-mocks';

async function buildSendMocks(
  mockServer: Mockttp,
  { localNodes }: { localNodes: unknown[] },
) {
  const tronNode = localNodes.find(
    (node): node is TronNode => node instanceof TronNode,
  );
  if (!tronNode) {
    throw new Error('Tron local node was not started');
  }

  return [
    await mockTronFeatureFlags(mockServer),
    await mockExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockTronSpotPrices(mockServer, tronNode),
    await mockTrxNativeSpotPrices(mockServer),
    await mockTronAssets(mockServer, tronNode),
    ...(await proxyTronBlockchainCalls(
      mockServer,
      tronNode,
      TRON_ACCOUNT_ADDRESS,
    )),
  ];
}

describe('Tron Send', function (this: Suite) {
  this.timeout(180_000);

  // ── Validation tests ────────────────────────────────────────────────────────

  it('shows invalid address error when a bad address is entered', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({ driver, symbol: 'TRX' });
        await sendPage.fillRecipient('not-a-valid-address');
        await sendPage.checkInvalidAddressError();
      },
    );
  });

  it('blocks Continue when amount is empty', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({ driver, symbol: 'TRX' });
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        // Leave amount empty — Continue must remain disabled until a value is entered
        await sendPage.checkContinueButtonIsDisabled();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- TODO(tron-e2e): the snap's onAmountInput never returns InsufficientBalanceToCoverFee for native TRX in this fixture: amounts > balance are caught earlier by validateTokenBalance ("Insufficient funds"), and amounts ≤ balance (including the full 6.072392 TRX) leave the form valid because the local Tron node's free bandwidth covers the basic transfer (no TRX fee actually required). To surface "Insufficient balance to cover fees" we'd need to either deplete the account's free bandwidth in the seeder, or trigger a TRC20 path where energy must be paid in TRX.
  it.skip('shows insufficient fee error when sending more TRX than balance minus fee', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({ driver, symbol: 'TRX' });
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        // TRX balance is ~6.072 TRX; sending more triggers insufficient fee
        await sendPage.fillAmount('999');
        await sendPage.checkInsufficientFeeError();
      },
    );
  });

  // ── TRX partial send ────────────────────────────────────────────────────────

  it('sends part of TRX balance and shows it pending then confirmed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({ driver, symbol: 'TRX' });
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapTransactionConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await snapConfirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkPendingTxNumberDisplayedInActivity(1);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.checkTxAmountInActivity('-1 TRX', 1);
        await activityList.checkNoFailedTransactions();
      },
    );
  });

  // ── TRX total send (Max) ────────────────────────────────────────────────────

  // eslint-disable-next-line mocha/no-skipped-tests -- TODO(tron-e2e): the unified send flow hides the "Max" ButtonLink for non-EVM native sends (`!isNonEvmNativeSendType` guards it in ui/pages/confirmations/components/send/amount/amount.tsx). Native TRX has no Max button to click — this test as written cannot pass. Either drop it or convert it to a manual fill-amount equal-to-balance scenario once the snap exposes a "send-all minus fee" API.
  it.skip('sends total TRX balance via Max button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({ driver, symbol: 'TRX' });
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        await sendPage.clickMaxButton();

        const amountValue = await sendPage.getAmountInputValue();
        // Max for TRX reserves fee from the total balance
        console.log(`Max TRX amount set to: ${amountValue}`);
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapTransactionConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await snapConfirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkNoFailedTransactions();
      },
    );
  });

  // ── USDT partial send ───────────────────────────────────────────────────────

  // eslint-disable-next-line mocha/no-skipped-tests -- TODO(tron-e2e): the snap's pre-broadcast simulation against the local Tron node returns "Transaction error. Exception thrown in contract code." for the dynamically deployed USDT TRC20 contract (see test/e2e/seeder/tron/node.ts deployTrc20Token / buildPermissiveTrc20Bytecode). Continue stays disabled and SnapTransactionConfirmation never opens. Likely the permissive bytecode does not implement TRC20 transfer semantics expected by the snap simulation. Fix by either (a) deploying a real TRC20 transfer-capable contract in the seeder, or (b) intercepting /wallet/triggerconstantcontract for the USDT address with a successful canned response.
  it.skip('sends part of USDT balance and shows it pending then confirmed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({
          driver,
          symbol: 'USDT',
        });
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapTransactionConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await snapConfirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkPendingTxNumberDisplayedInActivity(1);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.checkTxAmountInActivity('-1 USDT', 1);
        await activityList.checkNoFailedTransactions();
      },
    );
  });

  // ── USDT total send (Max) ───────────────────────────────────────────────────

  // eslint-disable-next-line mocha/no-skipped-tests -- TODO(tron-e2e): same root cause as the USDT partial-send test — the snap's simulation against the dynamically deployed permissive TRC20 contract returns "Transaction error. Exception thrown in contract code." so Continue never enables and SnapTransactionConfirmation never opens. Unblocks together with the USDT partial-send test.
  it.skip('sends total USDT balance via Max button — full USDT balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({
          driver,
          symbol: 'USDT',
        });
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        await sendPage.clickMaxButton();

        const amountValue = await sendPage.getAmountInputValue();
        // USDT has 6 decimals; seeded balance is 2804595 raw = 2.804595 USDT
        // For TRC20 there is no fee buffer taken from USDT itself (fee is paid in TRX)
        console.log(`Max USDT amount set to: ${amountValue}`);
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapTransactionConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await snapConfirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkNoFailedTransactions();
      },
    );
  });
});
