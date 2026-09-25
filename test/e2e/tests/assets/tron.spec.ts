import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import {
  setupTronAssetsHome,
  TRON_HOMEPAGE_TOKEN_TIMEOUT_MS,
} from '../../page-objects/flows/tron-assets.flow';
import { selectAllNetworksFromNetworkSelect } from '../../page-objects/flows/network.flow';
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
import { withTronFixtures } from '../tron/fixtures/with-tron-fixtures';
import { tronAssetsTestConfig } from './utils/tron';

describe('Tron - Assets', function (this: Suite) {
  this.timeout(180_000);

  describe('Assets list', function () {
    describe('For an empty account', function () {
      it('TRX is present with a balance of 0', async function () {
        await withTronFixtures(
          tronAssetsTestConfig([EMPTY_TRON_ACCOUNT], this.test?.fullTitle()),
          async ({ driver }: { driver: Driver }) => {
            await setupTronAssetsHome(driver);

            const tokensTab = new TokensTab(driver);
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
    });

    describe('For an account with assets', function () {
      it('Lists TRX, TRC10 and TRC20 assets - low-value assets section hides tokens under $1', async function () {
        await withTronFixtures(
          tronAssetsTestConfig(
            [TRON_PORTFOLIO_ACCOUNT],
            this.test?.fullTitle(),
          ),
          async ({ driver }: { driver: Driver }) => {
            await setupTronAssetsHome(driver, { expectedTrxAmount: '6.072' });

            const tokensTab = new TokensTab(driver);
            await tokensTab.checkTokenRowHasVisibleLogo('Tron');
            await tokensTab.checkTokenRowContainsAllText('Tron', [
              'Tron',
              '6.072 TRX',
              '$',
            ]);
            await tokensTab.checkTokenRowContainsAllText(
              'GasFreeTransferSolution',
              ['GasFreeTransferSolution', '33.333 GAS_FREE', '$'],
            );
            await tokensTab.checkTokenRowHasVisibleLogo('Tether');
            await tokensTab.checkTokenRowContainsAllText('Tether', [
              'Tether',
              '2.805 USDT',
              '$',
            ]);
            await tokensTab.checkTokenRowContainsAllText('HTX DAO', [
              'HTX DAO',
              '3.16M HTX',
              '$',
            ]);
            await tokensTab.checkTokenRowContainsAllText('USDD', [
              'USDD',
              '0.290 USDD',
              '$',
            ]);
            await tokensTab.checkTokenRowContainsAllText('SEED', [
              'SEED',
              '89.851 SEED',
              '$',
            ]);
            await tokensTab.checkConversionRateDisplayed();

            await tokensTab.collapseLowValueAssets();
            await tokensTab.checkCollapsedTokenItemNumber(
              TRON_PORTFOLIO_MAIN_LIST_ASSET_NAMES.length,
            );
            await tokensTab.checkLowValueAssetsToggleIsPresent(
              TRON_PORTFOLIO_LOW_VALUE_ASSET_NAMES.length,
            );
            for (const tokenName of TRON_PORTFOLIO_MAIN_LIST_ASSET_NAMES) {
              await tokensTab.checkTokenNameVisible(tokenName, {
                timeout: TRON_HOMEPAGE_TOKEN_TIMEOUT_MS,
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
    });

    describe('Networks filter', function () {
      it('All networks filter shows other chains alongside Tron', async function () {
        await withTronFixtures(
          tronAssetsTestConfig(
            [TRON_PORTFOLIO_ACCOUNT],
            this.test?.fullTitle(),
          ),
          async ({ driver }: { driver: Driver }) => {
            await setupTronAssetsHome(driver, { expectedTrxAmount: '6.072' });
            const tokensTab = new TokensTab(driver);
            await selectAllNetworksFromNetworkSelect(driver);
            await tokensTab.checkTokenExistsInList('Tron');
            await tokensTab.checkTokenExistsInList('Tether');
            await tokensTab.checkTokenExistsInList('Ethereum');

            // Restore the Tron filter so the next steps start from a clean
            // Tron-only home state.
            await selectTronNetwork(driver);
            await new HomePage(driver).navigateToHome();
          },
        );
      });

      it('Current network filter shows only Tron assets', async function () {
        await withTronFixtures(
          tronAssetsTestConfig(
            [TRON_PORTFOLIO_ACCOUNT],
            this.test?.fullTitle(),
          ),
          async ({ driver }: { driver: Driver }) => {
            await setupTronAssetsHome(driver, { expectedTrxAmount: '6.072' });
            const tokensTab = new TokensTab(driver);
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

  describe('Homepage balance', function () {
    it('displays zero TRX for a newly created Tron account', async function () {
      await withTronFixtures(
        {
          accounts: [EMPTY_TRON_ACCOUNT],
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await setupTronAssetsHome(driver);
          const homePage = new HomePage(driver);
          await homePage.navigateToHome('0 TRX');
        },
      );
    });

    it('displays the fiat total and native TRX balance for a funded account', async function () {
      await withTronFixtures(
        {
          accounts: [TRON_CHECK_BALANCE_ACCOUNT],
          fixtures: new FixtureBuilderV2()
            .withShowNativeTokenAsMainBalanceDisabled()
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await setupTronAssetsHome(driver, { expectedTrxAmount: '106.072' });

          // TRX_BALANCE = 106072392 SUN = ~106.07 TRX * $0.29469 = ~$31.26
          // Total Fiat = TRX $31.26, HTX DAO $5.30, USDT $2.80, USDD $0.29 = $39.65
          const homePage = new HomePage(driver);
          await homePage.navigateToHome('$39.65');

          const tokensTab = new TokensTab(driver);
          await tokensTab.checkTokenAmountIsDisplayed('106.072');
        },
      );
    });
  });

  describe('Asset details', function () {
    it('TRX asset details: header, chart, action buttons, daily resource, sections', async function () {
      await withTronFixtures(
        tronAssetsTestConfig([TRON_PORTFOLIO_ACCOUNT], this.test?.fullTitle()),
        async ({ driver }: { driver: Driver }) => {
          await setupTronAssetsHome(driver, { expectedTrxAmount: '6.072' });
          const tokensTab = new TokensTab(driver);
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

          await new HomePage(driver).navigateToHome();
        },
      );
    });

    it('TRC20 asset details: header, chart, action buttons, sections — no daily resource', async function () {
      await withTronFixtures(
        tronAssetsTestConfig([TRON_PORTFOLIO_ACCOUNT], this.test?.fullTitle()),
        async ({ driver }: { driver: Driver }) => {
          await setupTronAssetsHome(driver, { expectedTrxAmount: '6.072' });
          const tokensTab = new TokensTab(driver);
          await tokensTab.clickOnAsset('Tether');
          const details = new AssetDetailsPage(driver);
          await details.checkPageIsLoaded();
          await details.checkCurrentPriceHeader();
          await details.checkPriceChart();
          await details.checkTokenActionButtons();
          await details.checkAllStandardSections();
          await details.checkDailyResourcesSectionIsAbsent();

          await new HomePage(driver).navigateToHome();
        },
      );
    });
  });
});
