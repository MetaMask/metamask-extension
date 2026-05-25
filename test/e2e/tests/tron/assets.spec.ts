import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import TronAssetDetailsPage from '../../page-objects/pages/asset/tron-asset-details';
import { selectTronNetwork } from '../../page-objects/flows/tron-network.flow';
import {
  EMPTY_TRON_ACCOUNT,
  TRON_PORTFOLIO_ACCOUNT,
} from './fixtures/environments';
import { withTronFixtures } from './fixtures/with-tron-fixtures';

async function landOnTronHome(driver: Driver): Promise<void> {
  await login(driver, { validateBalance: false });
  await selectTronNetwork(driver);
  // Small delay to ensure Tron network is loaded. If flaky, will need to find a better way.
  await driver.delay(1000);
}

describe('Tron assets', function (this: Suite) {
  this.timeout(180_000);

  it('TRX is the only asset and shows 0 for an empty account', async function () {
    await withTronFixtures(
      {
        accounts: [EMPTY_TRON_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectTronNetwork(driver);

        const assetList = new AssetListPage(driver);
        await assetList.checkOnlyAssetsArePresent(['Tron']);
        await assetList.checkTokenAmountIsDisplayed('0');
        await assetList.checkTokenRowContainsAllText('Tron', [
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
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectTronNetwork(driver);

        const assetList = new AssetListPage(driver);
        await assetList.checkTokenExistsInList('Tron', '6.072');
        await assetList.checkTokenRowContainsAllText('Tron', [
          'Tron',
          '6.072 TRX',
          '$',
        ]);
        await assetList.checkTokenExistsInList('GasFreeTransferSolution');
        await assetList.checkTokenRowContainsAllText(
          'GasFreeTransferSolution',
          ['GasFreeTransferSolution', '33.333 GAS_FREE', '$'],
        );
        await assetList.checkTokenExistsInList('Tether');
        await assetList.checkTokenRowContainsAllText('Tether', [
          'Tether',
          '2.805 USDT',
          '$',
        ]);
        await assetList.checkTokenExistsInList('HTX DAO');
        await assetList.checkTokenRowContainsAllText('HTX DAO', [
          'HTX DAO',
          '3.16M HTX',
          '$',
        ]);
        await assetList.checkTokenExistsInList('USDD');
        await assetList.checkTokenRowContainsAllText('USDD', [
          'USDD',
          '0.290 USDD',
          '$',
        ]);
        await assetList.checkTokenExistsInList('SEED');
        await assetList.checkTokenRowContainsAllText('SEED', [
          'SEED',
          '89.851 SEED',
          '$',
        ]);
        await assetList.checkConversionRateDisplayed();
      },
    );
  });

  it('Current network filter shows only Tron assets', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronHome(driver);
        const assetList = new AssetListPage(driver);
        await assetList.selectOnlyTronInNetworkFilter();
        await assetList.checkOnlyAssetsArePresent([
          'HTX DAO',
          'Tether',
          'Tron',
          'USDD',
          'SEED',
          'GasFreeTransferSolution',
        ]);
        await assetList.checkAssetIsAbsent('Ethereum');
      },
    );
  });

  it('All networks filter shows other chains alongside Tron', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronHome(driver);
        const assetList = new AssetListPage(driver);
        await assetList.selectAllNetworksInNetworkFilter();
        await assetList.checkTokenExistsInList('Tron');
        await assetList.checkTokenExistsInList('Tether');
        await assetList.checkTokenExistsInList('Ethereum');
      },
    );
  });

  it('TRX asset details: header, chart, action buttons, daily resource, sections', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronHome(driver);
        const assetList = new AssetListPage(driver);
        await assetList.clickOnAsset('Tron');
        const details = new TronAssetDetailsPage(driver);
        await details.checkPageIsLoaded();
        await details.checkCurrentPriceHeader();
        await details.checkPriceChart();
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

  it('USDT asset details: header, chart, action buttons, sections — no daily resource', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronHome(driver);
        const assetList = new AssetListPage(driver);
        await assetList.clickOnAsset('Tether');
        const details = new TronAssetDetailsPage(driver);
        await details.checkPageIsLoaded();
        await details.checkCurrentPriceHeader();
        await details.checkPriceChart();
        await details.checkTokenActionButtons();
        await details.checkAllStandardSections();
        await driver.assertElementNotPresent({
          text: 'Daily resource',
          tag: 'h4',
        });
      },
    );
  });

  it('Staked TRX entry is absent for an account that has not staked', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronHome(driver);
        const assetList = new AssetListPage(driver);
        await assetList.checkTokenExistsInList('Tron');
        await assetList.checkAssetIsAbsent('Staked TRX');
      },
    );
  });
});
