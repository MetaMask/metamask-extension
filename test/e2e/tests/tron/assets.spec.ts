import { Context, Suite } from 'mocha';
import {
  EXPECTED_TRON_ADDRESSES_BY_INDEX,
  HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
} from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { startHeldSession } from '../../fixtures/held-fixtures';
import { Driver } from '../../webdriver/driver';
import {
  selectAllNetworksFromNetworkSelect,
  switchToNetworkFromNetworkSelect,
} from '../../page-objects/flows/network.flow';
import {
  prepareTronAssetsHomepage,
  switchToFundedTronAccount,
  switchToPortfolioTronAccount,
} from '../../page-objects/flows/tron-assets.flow';
import AssetDetailsPage from '../../page-objects/pages/asset/asset-details';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import { TronNode } from '../../seeder/tron/node';
import {
  EMPTY_TRON_ACCOUNT,
  TRON_CHECK_BALANCE_ACCOUNT,
  TRON_PORTFOLIO_ACCOUNT,
  TRON_PORTFOLIO_LOW_VALUE_ASSET_NAMES,
  TRON_PORTFOLIO_MAIN_LIST_ASSET_NAMES,
} from './fixtures/environments';
import {
  buildTronNodeOptions,
  withTronFixtures,
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

const CHECK_BALANCE_ACCOUNT_FIXTURE: TronFixtureAccount[] = [
  {
    ...TRON_CHECK_BALANCE_ACCOUNT,
    address: EXPECTED_TRON_ADDRESSES_BY_INDEX[2],
  },
];

const TRON_ASSETS_ACCOUNTS: TronFixtureAccount[] = [
  ...EMPTY_ACCOUNT_FIXTURE,
  ...PORTFOLIO_ACCOUNT_FIXTURE,
  ...CHECK_BALANCE_ACCOUNT_FIXTURE,
];

function buildTronAssetsFixture(): FixtureBuilderV2 {
  return new FixtureBuilderV2().withRemoteFeatureFlagController(
    TRON_ASSETS_REMOTE_FEATURE_FLAGS,
  );
}

function buildTronAssetsFiatHeaderFixture(): FixtureBuilderV2 {
  return buildTronAssetsFixture().withShowNativeTokenAsMainBalanceDisabled();
}

async function waitForVisibleTronToken(
  tokensTab: TokensTab,
  tokenName = 'Tron',
): Promise<void> {
  await tokensTab.checkTokenNameVisible(tokenName, {
    timeout: TRON_ASSET_LIST_TIMEOUT_MS,
  });
}

function createFailFastHeldAssetsSession(sharedTronNode: TronNode) {
  let driver: Driver;
  let firstFailure: unknown;
  let session: HeldTronFixturesSession | undefined;

  return {
    getDriver: (): Driver => driver,
    async startAndPrepare(
      testContext: Context,
      fixtures: ReturnType<FixtureBuilderV2['build']>,
      fallbackTitle: string,
    ): Promise<void> {
      session = await startHeldSession((callback) =>
        withTronFixtures(
          {
            accounts: TRON_ASSETS_ACCOUNTS,
            borrowedTronNode: sharedTronNode,
            fixtures,
            manifestFlags: TRON_ASSETS_MANIFEST_FLAGS,
            title: testContext.test?.parent?.fullTitle() ?? fallbackTitle,
          },
          callback,
        ),
      );
      driver = session.context.driver;
      try {
        await prepareTronAssetsHomepage(driver);
      } catch (error) {
        firstFailure = error;
        throw error;
      }
    },
    skipIfFailed(testContext: Context): void {
      if (firstFailure) {
        testContext.skip();
      }
    },
    captureFailure(testContext: Context): void {
      if (testContext.currentTest?.state === 'failed' && !firstFailure) {
        firstFailure = testContext.currentTest.err;
      }
    },
    async release(): Promise<void> {
      try {
        if (!session) {
          return;
        }
        await session.release(firstFailure);
      } catch (error) {
        if (!firstFailure) {
          throw error;
        }
      }
    },
  };
}

async function withIsolatedTronAssets(
  testContext: Context,
  sharedTronNode: TronNode,
  testFn: (driver: Driver) => Promise<void>,
): Promise<void> {
  await withTronFixtures(
    {
      accounts: TRON_ASSETS_ACCOUNTS,
      borrowedTronNode: sharedTronNode,
      fixtures: buildTronAssetsFixture().build(),
      manifestFlags: TRON_ASSETS_MANIFEST_FLAGS,
      title: testContext.test?.fullTitle() ?? 'Tron - Assets',
    },
    async ({ driver }) => {
      await prepareTronAssetsHomepage(driver);
      await testFn(driver);
    },
  );
}

describe('Tron - Assets', function (this: Suite) {
  this.timeout(300_000);

  const sharedTronNode = new TronNode();

  before(async function () {
    await sharedTronNode.start(buildTronNodeOptions(TRON_ASSETS_ACCOUNTS));
  });

  after(async function () {
    await sharedTronNode.quit();
  });

  // Same fixture (native-as-main ON). One browser: empty header + list, then
  // funded and portfolio headers. Combined so cases cannot depend on leftover
  // account selection from a previous `it`.
  it('displays native TRX as the main balance for each asset account', async function () {
    await withIsolatedTronAssets(this, sharedTronNode, async (driver) => {
      const homePage = new HomePage(driver);

      console.log(
        'Checking just created Tron account shows 0 TRX when native token is enabled',
      );
      await homePage.checkExpectedBalanceIsDisplayed({
        expectedBalance: '0 TRX',
        timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
      });

      console.log('Checking empty account lists TRX with balance 0');
      const tokensTab = new TokensTab(driver);
      await waitForVisibleTronToken(tokensTab);
      await tokensTab.checkOnlyAssetsArePresent(['Tron']);
      await tokensTab.checkTokenAmountIsDisplayed('0');
      await tokensTab.checkTokenRowHasVisibleLogo('Tron');
      await tokensTab.checkTokenRowContainsAllText('Tron', [
        'Tron',
        '0 TRX',
        '$',
      ]);

      console.log(
        'Checking funded account shows 106.072 TRX as the main balance',
      );
      await switchToFundedTronAccount(driver);
      await homePage.checkExpectedBalanceIsDisplayed({
        expectedBalance: '106.072 TRX',
        timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
      });

      console.log(
        'Checking portfolio account shows native TRX as the main balance',
      );
      await switchToPortfolioTronAccount(driver);
      await homePage.checkExpectedBalanceIsDisplayed({
        expectedBalance: '6.072 TRX',
        timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
      });
    });
  });

  // Own fixture: native-as-main OFF. Do not share Chrome with the TRX-header group.
  describe('fiat as main balance', function (this: Suite) {
    const held = createFailFastHeldAssetsSession(sharedTronNode);

    before(async function () {
      await held.startAndPrepare(
        this,
        buildTronAssetsFiatHeaderFixture().build(),
        'Tron - Assets fiat as main balance',
      );
    });

    beforeEach(function () {
      held.skipIfFailed(this);
    });

    afterEach(function () {
      held.captureFailure(this);
    });

    after(async function () {
      await held.release();
    });

    it('Portfolio account shows fiat as the main balance when native token is disabled', async function () {
      const driver = held.getDriver();
      await switchToPortfolioTronAccount(driver);
      const homePage = new HomePage(driver);
      await homePage.checkExpectedBalanceIsDisplayed({
        expectedBalance: '$10.18',
        timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
      });
    });

    it('funded account shows $39.65 as the main balance when native token is disabled', async function () {
      const driver = held.getDriver();
      await switchToFundedTronAccount(driver);
      const homePage = new HomePage(driver);
      await homePage.checkExpectedBalanceIsDisplayed({
        expectedBalance: '$39.65',
        timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
      });
    });
  });

  // Portfolio Tokens tab + details. Native-as-main ON. List helpers may expand
  // low-value tokens, so collapse and all-networks stay isolated below.
  describe('portfolio token list', function (this: Suite) {
    const held = createFailFastHeldAssetsSession(sharedTronNode);

    before(async function () {
      await held.startAndPrepare(
        this,
        buildTronAssetsFixture().build(),
        'Tron - Assets portfolio token list',
      );
    });

    beforeEach(function () {
      held.skipIfFailed(this);
    });

    afterEach(function () {
      held.captureFailure(this);
    });

    after(async function () {
      await held.release();
    });

    it('Lists TRX, TRC10, TRC20 with name, symbol, amount, fiat for portfolio account', async function () {
      const driver = held.getDriver();
      await switchToPortfolioTronAccount(driver);

      const tokensTab = new TokensTab(driver);
      await waitForVisibleTronToken(tokensTab, 'Tron');
      await tokensTab.checkTokenExistsInList('Tron', '6.072', {
        timeout: TRON_ASSET_LIST_TIMEOUT_MS,
      });
      await tokensTab.checkTokenRowHasVisibleLogo('Tron');
      await tokensTab.checkTokenRowContainsAllText('Tron', [
        'Tron',
        '6.072 TRX',
        '$',
      ]);
      await tokensTab.checkTokenExistsInList('GasFreeTransferSolution');
      await tokensTab.checkTokenRowContainsAllText('GasFreeTransferSolution', [
        'GasFreeTransferSolution',
        '33.333 GAS_FREE',
        '$',
      ]);
      await tokensTab.checkTokenExistsInList('Tether');
      await tokensTab.checkTokenRowHasVisibleLogo('Tether');
      await tokensTab.checkTokenRowContainsAllText('Tether', [
        'Tether',
        '2.805 USDT',
        '$',
      ]);
      await tokensTab.checkTokenExistsInList('HTX DAO');
      await tokensTab.checkTokenRowContainsAllText('HTX DAO', [
        'HTX DAO',
        '3.16M HTX',
        '$',
      ]);
      await tokensTab.checkTokenExistsInList('USDD');
      await tokensTab.checkTokenRowContainsAllText('USDD', [
        'USDD',
        '0.290 USDD',
        '$',
      ]);
      await tokensTab.checkTokenExistsInList('SEED');
      await tokensTab.checkTokenRowContainsAllText('SEED', [
        'SEED',
        '89.851 SEED',
        '$',
      ]);
      await tokensTab.checkConversionRateDisplayed();
    });

    it('Current network filter shows only Tron assets', async function () {
      const driver = held.getDriver();
      await switchToPortfolioTronAccount(driver);

      const tokensTab = new TokensTab(driver);
      await waitForVisibleTronToken(tokensTab);
      await tokensTab.checkOnlyAssetsArePresent([
        'Tron',
        'GasFreeTransferSolution',
        'Tether',
        'HTX DAO',
        'USDD',
        'SEED',
      ]);
      await tokensTab.checkAssetIsAbsent('Ethereum');
    });

    it('TRX asset details: header, chart, action buttons, daily resource, sections', async function () {
      const driver = held.getDriver();
      await switchToPortfolioTronAccount(driver);

      const tokensTab = new TokensTab(driver);
      await waitForVisibleTronToken(tokensTab);
      await tokensTab.clickOnAsset('Tron');
      const details = new AssetDetailsPage(driver);
      await details.checkPageIsLoaded();
      await details.checkCurrentPriceHeader();
      await details.checkPriceChart();
      // batchSell enabled → Receive lives in the More overflow menu (latest UI).
      await details.checkActionButtons({
        swap: true,
        send: true,
        receive: true,
      });
      await details.checkDailyResourcesSection();
      await details.checkAllStandardSections();
    });

    it('TRC20 asset details: header, chart, action buttons, sections — no daily resource', async function () {
      const driver = held.getDriver();
      await switchToPortfolioTronAccount(driver);

      const tokensTab = new TokensTab(driver);
      await waitForVisibleTronToken(tokensTab);
      await tokensTab.clickOnAsset('Tether');
      const details = new AssetDetailsPage(driver);
      await details.checkPageIsLoaded();
      await details.checkCurrentPriceHeader();
      await details.checkPriceChart();
      await details.checkTokenActionButtons();
      await details.checkAllStandardSections();
      await details.checkDailyResourcesSectionIsAbsent();
    });
  });

  it('Low-value assets section hides tokens under $1 until expanded', async function () {
    await withIsolatedTronAssets(this, sharedTronNode, async (driver) => {
      await switchToPortfolioTronAccount(driver);

      const tokensTab = new TokensTab(driver);
      await tokensTab.checkTokenNameVisible('Tron', {
        timeout: TRON_ASSET_LIST_TIMEOUT_MS,
      });

      await tokensTab.checkCollapsedTokenItemNumber(
        TRON_PORTFOLIO_MAIN_LIST_ASSET_NAMES.length,
      );
      await tokensTab.checkLowValueAssetsToggleIsPresent(
        TRON_PORTFOLIO_LOW_VALUE_ASSET_NAMES.length,
      );
      for (const tokenName of TRON_PORTFOLIO_MAIN_LIST_ASSET_NAMES) {
        await tokensTab.checkTokenNameVisible(tokenName, {
          timeout: TRON_ASSET_LIST_TIMEOUT_MS,
        });
      }
      await tokensTab.checkAssetIsAbsent('GasFreeTransferSolution');
      await tokensTab.checkAssetIsAbsent('SEED');
      await tokensTab.checkAssetIsAbsent('USDD');

      await tokensTab.expandLowValueAssets();
      for (const tokenName of TRON_PORTFOLIO_LOW_VALUE_ASSET_NAMES) {
        await tokensTab.checkTokenNameVisible(tokenName);
      }
      await tokensTab.checkOnlyAssetsArePresent([
        ...TRON_PORTFOLIO_MAIN_LIST_ASSET_NAMES,
        ...TRON_PORTFOLIO_LOW_VALUE_ASSET_NAMES,
      ]);
    });
  });

  it('All networks filter shows other chains alongside Tron', async function () {
    await withIsolatedTronAssets(this, sharedTronNode, async (driver) => {
      await switchToPortfolioTronAccount(driver);

      const tokensTab = new TokensTab(driver);
      await waitForVisibleTronToken(tokensTab);
      await selectAllNetworksFromNetworkSelect(driver);
      await tokensTab.checkTokenExistsInList('Tron');
      await tokensTab.checkTokenExistsInList('Tether');
      await tokensTab.checkTokenExistsInList('Ethereum');
      await switchToNetworkFromNetworkSelect(driver, 'Tron');
    });
  });
});
