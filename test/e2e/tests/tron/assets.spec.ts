import { Suite } from 'mocha';
import {
  EXPECTED_TRON_ADDRESSES_BY_INDEX,
  HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
} from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import {
  selectAllNetworksFromNetworkSelect,
  switchToNetworkFromNetworkSelect,
} from '../../page-objects/flows/network.flow';
import { enableNativeTokenAsMainBalance } from '../../page-objects/flows/settings.flow';
import {
  prepareTronAssetsHomepage,
  returnToTronHome,
  switchToPortfolioTronAccount,
} from '../../page-objects/flows/tron-assets.flow';
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

function buildTronAssetsFixture(): FixtureBuilderV2 {
  // Native-as-main stays ON so Account 1/2 header tests can assert `0 TRX`
  // and `6.072 TRX`. Toggle it off after those tests.
  return new FixtureBuilderV2().withRemoteFeatureFlagController(
    TRON_ASSETS_REMOTE_FEATURE_FLAGS,
  );
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

  it('Just created Tron account shows 0 TRX when native token is enabled', async function () {
    const homePage = new HomePage(driver);
    await homePage.checkExpectedBalanceIsDisplayed({
      expectedBalance: '0 TRX',
      timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
    });
  });

  it('For an empty account, TRX should be present with a balance of 0', async function () {
    await returnToTronHome(driver);

    const tokensTab = new TokensTab(driver);
    await waitForTronAssetList(tokensTab);
    await tokensTab.checkOnlyAssetsArePresent(['Tron']);
    await tokensTab.checkTokenAmountIsDisplayed('0');
    await tokensTab.checkTokenRowHasVisibleLogo('Tron');
    await tokensTab.checkTokenRowContainsAllText('Tron', [
      'Tron',
      '0 TRX',
      '$',
    ]);
  });

  it('Portfolio account shows native TRX as the main balance', async function () {
    await switchToPortfolioTronAccount(driver);
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

  describe('Assets list', function () {
    it('Lists TRX, TRC10, TRC20 with name, symbol, amount, fiat for portfolio account', async function () {
      await switchToPortfolioTronAccount(driver);

      const tokensTab = new TokensTab(driver);
      await waitForTronAssetList(tokensTab, 'Tron');
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

    it('Low-value assets section hides tokens under $1 until expanded', async function () {
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

    describe('Networks filter', function () {
      it('Current network filter shows only Tron assets', async function () {
        await switchToPortfolioTronAccount(driver);

        const tokensTab = new TokensTab(driver);
        await waitForTronAssetList(tokensTab);
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

      it('All networks filter shows other chains alongside Tron', async function () {
        await switchToPortfolioTronAccount(driver);

        const tokensTab = new TokensTab(driver);
        await waitForTronAssetList(tokensTab);
        await selectAllNetworksFromNetworkSelect(driver);
        await tokensTab.checkTokenExistsInList('Tron');
        await tokensTab.checkTokenExistsInList('Tether');
        await tokensTab.checkTokenExistsInList('Ethereum');
        await switchToNetworkFromNetworkSelect(driver, 'Tron');
      });
    });
  });

  describe('Asset details', function () {
    it('TRX asset details: header, chart, action buttons, daily resource, sections', async function () {
      await switchToPortfolioTronAccount(driver);

      const tokensTab = new TokensTab(driver);
      await waitForTronAssetList(tokensTab);
      await tokensTab.clickOnAsset('Tron');
      const details = new TronAssetDetailsPage(driver);
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
      await switchToPortfolioTronAccount(driver);

      const tokensTab = new TokensTab(driver);
      await waitForTronAssetList(tokensTab);
      await tokensTab.clickOnAsset('Tether');
      const details = new TronAssetDetailsPage(driver);
      await details.checkPageIsLoaded();
      await details.checkCurrentPriceHeader();
      await details.checkPriceChart();
      await details.checkTokenActionButtons();
      await details.checkAllStandardSections();
      await details.checkDailyResourcesSectionIsAbsent();
    });
  });
});
