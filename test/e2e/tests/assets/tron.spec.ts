import { Suite } from 'mocha';
import {
  EXPECTED_TRON_ADDRESSES_BY_INDEX,
  HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
} from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { selectAllNetworksFromNetworkSelect } from '../../page-objects/flows/network.flow';
import {
  prepareTronAssetsHomepage,
  returnToTronHome,
  switchToFundedTronAccount,
  switchToPortfolioTronAccount,
} from '../../page-objects/flows/tron-assets.flow';
import { selectTronNetwork } from '../../page-objects/flows/tron-network.flow';
import AssetDetailsPage from '../../page-objects/pages/asset/asset-details';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import {
  EMPTY_TRON_ACCOUNT,
  TRON_CHECK_BALANCE_ACCOUNT,
  TRON_PORTFOLIO_ACCOUNT,
  TRON_PORTFOLIO_LOW_VALUE_ASSET_NAMES,
  TRON_PORTFOLIO_MAIN_LIST_ASSET_NAMES,
} from '../tron/fixtures/environments';
import { configureTronFixtureSession } from '../tron/fixtures/tron-fixture-session';
import { type TronFixtureAccount } from '../tron/fixtures/with-tron-fixtures';

const TRON_ASSET_LIST_TIMEOUT_MS = 30_000;

const TRON_ASSETS_REMOTE_FEATURE_FLAGS = {
  remoteFeatureFlags: {
    batchSell: { enabled: true },
    earnMusdCtaEnabled: false,
  },
} as const;

// Consumed by configureTronFixtureSession's manifestFlags (build-time
// override) instead of the fixture controller (runtime state) that
// TRON_ASSETS_REMOTE_FEATURE_FLAGS feeds above. Reuse the same object so the
// two flag surfaces cannot drift apart.
const TRON_ASSETS_MANIFEST_FLAGS = TRON_ASSETS_REMOTE_FEATURE_FLAGS;

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

describe('Tron - Assets', function (this: Suite) {
  this.timeout(300_000);

  // Session 1: native-as-main ON. The session never resets or navigates
  // between tests, so the ordering is load-bearing: the balance-header test
  // runs first (it needs the freshly prepared empty Account 1 selected), the
  // all-networks filter test switches the filter back to Tron for the next
  // test, and the low-value expansion test runs last because it leaves the
  // low-value section expanded.
  configureTronFixtureSession(
    'native TRX as main balance',
    {
      accounts: TRON_ASSETS_ACCOUNTS,
      fixtures: buildTronAssetsFixture().build(),
      manifestFlags: TRON_ASSETS_MANIFEST_FLAGS,
    },
    ({ getDriver }) => {
      before('Prepare the Tron assets homepage', async function () {
        await prepareTronAssetsHomepage(getDriver());
      });

      // Same fixture (native-as-main ON). One browser: empty header + list,
      // then funded and portfolio headers. Combined so cases cannot depend on
      // leftover account selection from a previous `it`.
      it('displays native TRX as the main balance for each asset account', async function () {
        const driver = getDriver();
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

      it('lists TRX, TRC10, TRC20 with name, symbol, amount, fiat for portfolio account', async function () {
        const driver = getDriver();
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
      });

      it('shows only Tron assets under the current network filter', async function () {
        const driver = getDriver();
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

      it('shows TRX asset details: header, chart, action buttons, daily resource, sections', async function () {
        const driver = getDriver();
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
        // Leave the asset-details route so the next test starts from the
        // token list (no navigation between shared-session tests).
        await returnToTronHome(driver);
      });

      it('shows TRC20 asset details: header, chart, action buttons, sections — no daily resource', async function () {
        const driver = getDriver();
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
        // Leave the asset-details route so the next test starts from the
        // token list (no navigation between shared-session tests).
        await returnToTronHome(driver);
      });

      it('shows other chains alongside Tron under the all networks filter', async function () {
        const driver = getDriver();
        await switchToPortfolioTronAccount(driver);

        const tokensTab = new TokensTab(driver);
        await waitForVisibleTronToken(tokensTab);
        await selectAllNetworksFromNetworkSelect(driver);
        await tokensTab.checkTokenExistsInList('Tron');
        await tokensTab.checkTokenExistsInList('Tether');
        await tokensTab.checkTokenExistsInList('Ethereum');
        await selectTronNetwork(driver);
      });

      // Runs last: leaves the low-value assets section expanded.
      it('hides tokens under $1 in the low-value assets section until expanded', async function () {
        const driver = getDriver();
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
    },
  );

  // Session 2: own fixture with native-as-main OFF. Does not share Chrome
  // with the TRX-header session above.
  configureTronFixtureSession(
    'fiat as main balance',
    {
      accounts: TRON_ASSETS_ACCOUNTS,
      fixtures: buildTronAssetsFiatHeaderFixture().build(),
      manifestFlags: TRON_ASSETS_MANIFEST_FLAGS,
    },
    ({ getDriver }) => {
      // Not a sibling of the first session's hook: configureTronFixtureSession
      // nests each session in its own describe, which eslint cannot see.
      // eslint-disable-next-line mocha/no-sibling-hooks
      before('Prepare the Tron assets homepage', async function () {
        await prepareTronAssetsHomepage(getDriver());
      });

      it('shows fiat as the main balance for the portfolio account when native token is disabled', async function () {
        const driver = getDriver();
        await switchToPortfolioTronAccount(driver);
        const homePage = new HomePage(driver);
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: '$10.18',
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
      });

      it('funded account shows $39.65 as the main balance when native token is disabled', async function () {
        const driver = getDriver();
        await switchToFundedTronAccount(driver);
        const homePage = new HomePage(driver);
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: '$39.65',
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
      });
    },
  );
});
