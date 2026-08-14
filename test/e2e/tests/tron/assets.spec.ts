import { Suite } from 'mocha';
import { EXPECTED_TRON_ADDRESSES_BY_INDEX } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { addMultipleAccounts } from '../../page-objects/flows/add-account.flow';
import { login } from '../../page-objects/flows/login.flow';
import { waitUntilAccountTreeSyncIdle } from '../../page-objects/flows/tron-account-derivation.flow';
import {
  selectAllNetworksFromNetworkSelect,
  switchToNetworkFromNetworkSelect,
} from '../../page-objects/flows/network.flow';
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
  withTronFixtures,
  type TronFixtureAccount,
} from './fixtures/with-tron-fixtures';

/** Max wait for Tron Snap balances to appear in the token list after refresh. */
const TRON_ASSET_LIST_TIMEOUT_MS = 30_000;

/**
 * Enables the batch-sell remote flag so native coin overflow uses the More menu
 * (Receive + Batch sell) rather than the legacy sole-default button layout.
 */
const TRON_ASSETS_REMOTE_FEATURE_FLAGS = {
  remoteFeatureFlags: {
    batchSell: { enabled: true },
    earnMusdCtaEnabled: false,
  },
} as const;

/** Runtime override so batchSell survives client-config flag refresh in E2E. */
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

/** HD index of `PORTFOLIO_ACCOUNT_FIXTURE` on the suite-owned Java-Tron node. */
const PORTFOLIO_ACCOUNT_INDEX = 1;

function buildTronAssetsFixture(): FixtureBuilderV2 {
  return new FixtureBuilderV2()
    .withShowNativeTokenAsMainBalanceDisabled()
    .withRemoteFeatureFlagController(TRON_ASSETS_REMOTE_FEATURE_FLAGS);
}

function tronAssetsTestConfig(
  accounts: Parameters<typeof withTronFixtures>[0]['accounts'],
  title?: string,
) {
  return {
    accounts,
    fixtures: buildTronAssetsFixture().build(),
    manifestFlags: TRON_ASSETS_MANIFEST_FLAGS,
    title,
  };
}

async function landOnTronHome(driver: Driver, accountIndex = 0): Promise<void> {
  await login(driver, { validateBalance: false });
  const homePage = new HomePage(driver);
  // Add HD accounts while still on Ethereum so `addMultipleAccounts` can wait
  // for the default 25 ETH balance. Switching to Tron first made that ETH
  // assertion race with the Tron overview.
  if (accountIndex > 0) {
    await addMultipleAccounts({
      accountToSelect: `Account ${accountIndex + 1}`,
      driver,
      numberOfAccounts: accountIndex,
    });
    await homePage.checkPageIsLoaded();
    await homePage.waitForNonEvmAccountsLoaded();
    await waitUntilAccountTreeSyncIdle(driver);
  }
  await switchToNetworkFromNetworkSelect(driver, 'Tron');
  // Refresh re-hydrates the initial account from background state so
  // asynchronously-fetched Snap balances appear reliably in the token list.
  // Account switches already trigger that hydration.
  if (accountIndex === 0) {
    await driver.refresh();
  }
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
  this.timeout(180_000);

  const sharedTronNode = new TronNode();

  before('Start shared Tron node', async function () {
    await sharedTronNode.start(
      buildTronNodeOptions([
        ...EMPTY_ACCOUNT_FIXTURE,
        ...PORTFOLIO_ACCOUNT_FIXTURE,
      ]),
    );
  });

  after('Stop shared Tron node', async function () {
    await sharedTronNode.quit();
  });

  describe('Assets list', function () {
    it('For an empty account, TRX should be present with a balance of 0', async function () {
      await withTronFixtures(
        {
          ...tronAssetsTestConfig(
            EMPTY_ACCOUNT_FIXTURE,
            this.test?.fullTitle(),
          ),
          borrowedTronNode: sharedTronNode,
        },
        async ({ driver }: { driver: Driver }) => {
          await landOnTronHome(driver);

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
        },
      );
    });

    it('Lists TRX, TRC10, TRC20 with name, symbol, amount, fiat for portfolio account', async function () {
      await withTronFixtures(
        {
          ...tronAssetsTestConfig(
            PORTFOLIO_ACCOUNT_FIXTURE,
            this.test?.fullTitle(),
          ),
          borrowedTronNode: sharedTronNode,
        },
        async ({ driver }: { driver: Driver }) => {
          await landOnTronHome(driver, PORTFOLIO_ACCOUNT_INDEX);

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
          await tokensTab.checkTokenRowContainsAllText(
            'GasFreeTransferSolution',
            ['GasFreeTransferSolution', '33.333 GAS_FREE', '$'],
          );
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
        },
      );
    });

    it('Low-value assets section hides tokens under $1 until expanded', async function () {
      await withTronFixtures(
        {
          ...tronAssetsTestConfig(
            PORTFOLIO_ACCOUNT_FIXTURE,
            this.test?.fullTitle(),
          ),
          borrowedTronNode: sharedTronNode,
        },
        async ({ driver }: { driver: Driver }) => {
          await landOnTronHome(driver, PORTFOLIO_ACCOUNT_INDEX);
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
        },
      );
    });

    describe('Networks filter', function () {
      it('All networks filter shows other chains alongside Tron', async function () {
        await withTronFixtures(
          {
            ...tronAssetsTestConfig(
              PORTFOLIO_ACCOUNT_FIXTURE,
              this.test?.fullTitle(),
            ),
            borrowedTronNode: sharedTronNode,
          },
          async ({ driver }: { driver: Driver }) => {
            await landOnTronHome(driver, PORTFOLIO_ACCOUNT_INDEX);
            const tokensTab = new TokensTab(driver);
            await waitForTronAssetList(tokensTab);
            await selectAllNetworksFromNetworkSelect(driver);
            await tokensTab.checkTokenExistsInList('Tron');
            await tokensTab.checkTokenExistsInList('Tether');
            await tokensTab.checkTokenExistsInList('Ethereum');
          },
        );
      });

      it('Current network filter shows only Tron assets', async function () {
        await withTronFixtures(
          {
            ...tronAssetsTestConfig(
              PORTFOLIO_ACCOUNT_FIXTURE,
              this.test?.fullTitle(),
            ),
            borrowedTronNode: sharedTronNode,
          },
          async ({ driver }: { driver: Driver }) => {
            await landOnTronHome(driver, PORTFOLIO_ACCOUNT_INDEX);
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
          },
        );
      });
    });
  });

  describe('Asset details', function () {
    it('TRX asset details: header, chart, action buttons, daily resource, sections', async function () {
      await withTronFixtures(
        {
          ...tronAssetsTestConfig(
            PORTFOLIO_ACCOUNT_FIXTURE,
            this.test?.fullTitle(),
          ),
          borrowedTronNode: sharedTronNode,
        },
        async ({ driver }: { driver: Driver }) => {
          await landOnTronHome(driver, PORTFOLIO_ACCOUNT_INDEX);
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
        },
      );
    });

    it('TRC20 asset details: header, chart, action buttons, sections — no daily resource', async function () {
      await withTronFixtures(
        {
          ...tronAssetsTestConfig(
            PORTFOLIO_ACCOUNT_FIXTURE,
            this.test?.fullTitle(),
          ),
          borrowedTronNode: sharedTronNode,
        },
        async ({ driver }: { driver: Driver }) => {
          await landOnTronHome(driver, PORTFOLIO_ACCOUNT_INDEX);
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
        },
      );
    });
  });
});
