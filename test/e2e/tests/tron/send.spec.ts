import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import { TronNode } from '../../seeder/tron/node';
import {
  createTronPortfolioNodeOptions,
  createTronLowTrxOptions,
} from '../../seeder/tron/profiles';
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

  it('blocks USDT send when TRX balance cannot cover energy fee', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          {
            type: 'tron',
            options: createTronLowTrxOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({ driver, symbol: 'USDT' });
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        await sendPage.fillAmount('1');
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

  it('sends total TRX balance via manual full-amount entry', async function () {
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
        // Seeded TRX balance is 6.072392; reserve ~0.5 TRX for fee buffer.
        await sendPage.fillAmount('5.572392');
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapTransactionConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await snapConfirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkPendingTxNumberDisplayedInActivity(1);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.checkNoFailedTransactions();
      },
    );
  });

  // ── USDT partial send ───────────────────────────────────────────────────────

  it('sends part of USDT balance and shows it pending then confirmed', async function () {
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

  it('sends total USDT balance via manual full-amount entry', async function () {
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
        const sendPage = await landOnTronSendScreen({
          driver,
          symbol: 'USDT',
        });
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        // Seeded USDT balance is 2_804_595 raw = 2.804595 USDT.
        // TRC20 has no fee buffer (fee paid in TRX).
        await sendPage.fillAmount('2.804595');
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapTransactionConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await snapConfirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkPendingTxNumberDisplayedInActivity(1);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.checkNoFailedTransactions();
      },
    );
  });
});
