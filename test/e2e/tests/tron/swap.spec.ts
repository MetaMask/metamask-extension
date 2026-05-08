import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import NetworkManager from '../../page-objects/pages/network-manager';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import {
  mockTronSwapApis,
  mockTronSwapApisNoQuotes,
  mockTronApis,
  mockBridgeGetTronTokens,
  mockBridgeGetTronQuoteFor,
  createStatefulTronAccountMock,
  TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE,
  type TronQuoteFixture,
  type TronAccountSnapshot,
} from './mocks/common-tron';
import { checkBalanceWithinTolerance } from './helpers/balance-assertions';

// All Tron swap tests run against mocked Tron Infura mainnet endpoints —
// there is no local Tron node. createStatefulTronAccountMock() returns a
// before-state on the first request and an after-state on subsequent
// requests so we can assert balance deltas without ever broadcasting.
// Quotes are mocked via mockBridgeGetTronQuoteFor.
// TODO: Rebuild these tests against mainnet-style Tron fixtures/mocks. The
// current mocked flow is not stable enough to validate swap behavior.
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('Swap on Tron', function () {
  it('Quote displayed between TRX and TRC20', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronSwapApis,
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

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '6.07' });

        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });

        // Review quote - mock returns ~0.295 USDT for 1 TRX
        await swapPage.reviewQuote({
          swapToAmount: '0.295',
          swapFrom: 'TRX',
          swapTo: 'USDT',
          swapFromAmount: '1',
        });
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
        await login(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '6.07' });

        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });

        // Verify no quotes available message
        await swapPage.checkNoQuotesAvailable();
      },
    );
  });

  // ---------------------------------------------------------------------------
  // Helper: build all mocks needed for a full swap test
  // ---------------------------------------------------------------------------
  async function buildSwapMocks(
    mockServer: Mockttp,
    fixture: {
      quote: TronQuoteFixture;
      before: TronAccountSnapshot;
      after: TronAccountSnapshot;
    },
  ) {
    return [
      ...(await mockTronApis(mockServer)),
      ...(await createStatefulTronAccountMock(mockServer, {
        before: fixture.before,
        after: fixture.after,
      })),
      await mockBridgeGetTronTokens(mockServer),
      await mockBridgeGetTronQuoteFor(mockServer, fixture.quote),
    ];
  }

  async function navigateToTronHome(driver: Driver) {
    const networkManager = new NetworkManager(driver);
    await networkManager.openNetworkManager();
    await networkManager.selectTab('Popular');
    await networkManager.selectNetworkByNameWithWait('Tron');
  }

  // ---------------------------------------------------------------------------
  // Task 4 — TRX → USDT (partial + total)
  // ---------------------------------------------------------------------------

  it('Swaps partial TRX → USDT, balance deltas confirmed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          buildSwapMocks(mockServer, {
            quote: {
              src: 'TRX',
              dest: 'USDT',
              srcAmount: '1000000',
              destAmount: '294852',
              feeSun: 8_750,
            },
            before: { trxSun: 6_072_392, trc20: { USDT: '0' } },
            after: {
              trxSun: 6_072_392 - 1_000_000 - 8_750,
              trc20: { USDT: '294852' },
            },
          }),
        ignoredConsoleErrors: [
          `Failed to send transaction: ${TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE}`,
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await navigateToTronHome(driver);

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '6.07' });

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
        await swapPage.completeSwapAndWaitForActivity();

        const activity = new ActivityListPage(driver);
        await activity.checkPendingTxNumberDisplayedInActivity(1);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);

        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
        await checkBalanceWithinTolerance({
          driver,
          symbol: 'Tron',
          expected: 5.063,
          tolerance: 0.05,
        });
        await checkBalanceWithinTolerance({
          driver,
          symbol: 'Tether',
          expected: 0.295,
          tolerance: 0.005,
        });
      },
    );
  });

  it('Swaps total TRX → USDT, leaves only fee buffer', async function () {
    const TOTAL_TRX_SUN = 6_072_392;
    const FEE_BUFFER_SUN = 1_000_000;
    const SWAPPABLE_SUN = TOTAL_TRX_SUN - FEE_BUFFER_SUN;
    const DEST_USDT_RAW = String(
      Math.floor((SWAPPABLE_SUN * 294_852) / 1_000_000),
    );

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          buildSwapMocks(mockServer, {
            quote: {
              src: 'TRX',
              dest: 'USDT',
              srcAmount: String(SWAPPABLE_SUN),
              destAmount: DEST_USDT_RAW,
              feeSun: 8_750,
            },
            before: { trxSun: TOTAL_TRX_SUN, trc20: { USDT: '0' } },
            after: {
              trxSun: TOTAL_TRX_SUN - SWAPPABLE_SUN - 8_750,
              trc20: { USDT: DEST_USDT_RAW },
            },
          }),
        ignoredConsoleErrors: [
          `Failed to send transaction: ${TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE}`,
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await navigateToTronHome(driver);

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '6.07' });

        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 0,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });
        await swapPage.clickMaxButton();
        await swapPage.completeSwapAndWaitForActivity();

        const activity = new ActivityListPage(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);

        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
        await checkBalanceWithinTolerance({
          driver,
          symbol: 'Tron',
          expected: 1.0,
          tolerance: 0.05,
        });
        await checkBalanceWithinTolerance({
          driver,
          symbol: 'Tether',
          expected: Number(DEST_USDT_RAW) / 1_000_000,
          tolerance: 0.05,
        });
      },
    );
  });

  // ---------------------------------------------------------------------------
  // Task 5 — USDT → TRX (partial + total)
  // ---------------------------------------------------------------------------

  it('Swaps partial USDT → TRX, balance deltas confirmed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          buildSwapMocks(mockServer, {
            quote: {
              src: 'USDT',
              dest: 'TRX',
              srcAmount: '1000000',
              destAmount: '3390000',
              feeSun: 8_750,
            },
            before: { trxSun: 6_072_392, trc20: { USDT: '2804595' } },
            after: {
              trxSun: 6_072_392 + 3_390_000 - 8_750 - 500_000,
              trc20: { USDT: String(2_804_595 - 1_000_000) },
            },
          }),
        ignoredConsoleErrors: [
          `Failed to send transaction: ${TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE}`,
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await navigateToTronHome(driver);

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '6.07' });

        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'TRX',
          swapFrom: 'USDT',
          network: 'Tron',
        });
        await swapPage.reviewQuote({
          swapToAmount: '3.39',
          swapFrom: 'USDT',
          swapTo: 'TRX',
          swapFromAmount: '1',
        });
        await swapPage.completeSwapAndWaitForActivity();

        const activity = new ActivityListPage(driver);
        await activity.checkPendingTxNumberDisplayedInActivity(1);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);

        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
        await checkBalanceWithinTolerance({
          driver,
          symbol: 'Tether',
          expected: 1.804595,
          tolerance: 0.005,
        });
        await checkBalanceWithinTolerance({
          driver,
          symbol: 'Tron',
          expected: 9.46,
          tolerance: 0.05,
        });
      },
    );
  });

  it('Swaps total USDT → TRX, source reduced to 0', async function () {
    const TOTAL_USDT_RAW = '2804595';
    const QUOTED_TRX_SUN = 9_510_000;

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          buildSwapMocks(mockServer, {
            quote: {
              src: 'USDT',
              dest: 'TRX',
              srcAmount: TOTAL_USDT_RAW,
              destAmount: String(QUOTED_TRX_SUN),
              feeSun: 8_750,
            },
            before: { trxSun: 6_072_392, trc20: { USDT: TOTAL_USDT_RAW } },
            after: {
              trxSun: 6_072_392 + QUOTED_TRX_SUN - 8_750 - 500_000,
              trc20: { USDT: '0' },
            },
          }),
        ignoredConsoleErrors: [
          `Failed to send transaction: ${TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE}`,
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await navigateToTronHome(driver);

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '6.07' });

        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 0,
          swapTo: 'TRX',
          swapFrom: 'USDT',
          network: 'Tron',
        });
        await swapPage.clickMaxButton();
        await swapPage.completeSwapAndWaitForActivity();

        const activity = new ActivityListPage(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);

        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
        await checkBalanceWithinTolerance({
          driver,
          symbol: 'Tether',
          expected: 0,
          tolerance: 0.0001,
        });
        await checkBalanceWithinTolerance({
          driver,
          symbol: 'Tron',
          expected: 6.072392 + QUOTED_TRX_SUN / 1_000_000,
          tolerance: 0.05,
        });
      },
    );
  });

  // ---------------------------------------------------------------------------
  // Task 6 — USDT → USDD (partial + total)
  // ---------------------------------------------------------------------------

  it('Swaps partial USDT → USDD, source -amount, dest +amount, TRX -fee', async function () {
    const QUOTED_USDD = '998000000000000000'; // 0.998 USDD (18 decimals)
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          buildSwapMocks(mockServer, {
            quote: {
              src: 'USDT',
              dest: 'USDD',
              srcAmount: '1000000',
              destAmount: QUOTED_USDD,
              feeSun: 8_750,
            },
            before: {
              trxSun: 6_072_392,
              trc20: { USDT: '2804595', USDD: '289757448699320931' },
            },
            after: {
              trxSun: 6_072_392 - 8_750 - 500_000,
              trc20: {
                USDT: String(2_804_595 - 1_000_000),
                USDD: String(
                  BigInt('289757448699320931') + BigInt(QUOTED_USDD),
                ),
              },
            },
          }),
        ignoredConsoleErrors: [
          `Failed to send transaction: ${TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE}`,
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await navigateToTronHome(driver);

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '6.07' });

        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDD',
          swapFrom: 'USDT',
          network: 'Tron',
        });
        await swapPage.reviewQuote({
          swapToAmount: '0.998',
          swapFrom: 'USDT',
          swapTo: 'USDD',
          swapFromAmount: '1',
        });
        await swapPage.completeSwapAndWaitForActivity();

        const activity = new ActivityListPage(driver);
        await activity.checkPendingTxNumberDisplayedInActivity(1);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);

        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
        await checkBalanceWithinTolerance({
          driver,
          symbol: 'Tether',
          expected: 1.804595,
          tolerance: 0.005,
        });
        await checkBalanceWithinTolerance({
          driver,
          symbol: 'USDD',
          expected: 1.287,
          tolerance: 0.001,
        });
        await checkBalanceWithinTolerance({
          driver,
          symbol: 'Tron',
          expected: 6.072 - 0.5,
          tolerance: 0.05,
        });
      },
    );
  });

  it('Swaps total USDT → USDD, source = 0', async function () {
    const TOTAL_USDT_RAW = '2804595';
    const QUOTED_USDD = String(
      (BigInt('2804595') * BigInt('998000000000000000')) / BigInt('1000000'),
    );

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          buildSwapMocks(mockServer, {
            quote: {
              src: 'USDT',
              dest: 'USDD',
              srcAmount: TOTAL_USDT_RAW,
              destAmount: QUOTED_USDD,
              feeSun: 8_750,
            },
            before: {
              trxSun: 6_072_392,
              trc20: { USDT: TOTAL_USDT_RAW, USDD: '289757448699320931' },
            },
            after: {
              trxSun: 6_072_392 - 8_750 - 500_000,
              trc20: {
                USDT: '0',
                USDD: String(
                  BigInt('289757448699320931') + BigInt(QUOTED_USDD),
                ),
              },
            },
          }),
        ignoredConsoleErrors: [
          `Failed to send transaction: ${TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE}`,
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await navigateToTronHome(driver);

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '6.07' });

        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 0,
          swapTo: 'USDD',
          swapFrom: 'USDT',
          network: 'Tron',
        });
        await swapPage.clickMaxButton();
        await swapPage.completeSwapAndWaitForActivity();

        const activity = new ActivityListPage(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);

        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
        await checkBalanceWithinTolerance({
          driver,
          symbol: 'Tether',
          expected: 0,
          tolerance: 0.0001,
        });
        await checkBalanceWithinTolerance({
          driver,
          symbol: 'USDD',
          expected: (Number('289757448699320931') + Number(QUOTED_USDD)) / 1e18,
          tolerance: 0.001,
        });
        await checkBalanceWithinTolerance({
          driver,
          symbol: 'Tron',
          expected: 6.072 - 0.5,
          tolerance: 0.05,
        });
      },
    );
  });
});
