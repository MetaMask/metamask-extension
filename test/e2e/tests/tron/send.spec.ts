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

  // eslint-disable-next-line mocha/no-skipped-tests -- TODO(tron-e2e): unblock pending UI sync
  it.skip('shows invalid address error when a bad address is entered', async function () {
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

  // eslint-disable-next-line mocha/no-skipped-tests -- TODO(tron-e2e): unblock pending UI sync
  it.skip('shows invalid amount error when a non-numeric amount is entered', async function () {
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
        await sendPage.fillAmount('abc');
        await sendPage.checkInvalidAmountError();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- TODO(tron-e2e): unblock pending UI sync
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

  // eslint-disable-next-line mocha/no-skipped-tests -- TODO(tron-e2e): unblock pending UI sync
  it.skip('sends part of TRX balance and shows it pending then confirmed', async function () {
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

  // eslint-disable-next-line mocha/no-skipped-tests -- TODO(tron-e2e): unblock pending UI sync
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

  // eslint-disable-next-line mocha/no-skipped-tests -- TODO(tron-e2e): unblock pending UI sync
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

  // eslint-disable-next-line mocha/no-skipped-tests -- TODO(tron-e2e): unblock pending UI sync
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
