import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import TronAssetDetailsPage from '../../page-objects/pages/asset/tron-asset-details';
import {
  EMPTY_TRON_ACCOUNT,
  TRON_PORTFOLIO_ACCOUNT,
} from './fixtures/environments';
import { withTronFixtures } from './fixtures/with-tron-fixtures';

async function landOnTronHome(driver: Driver): Promise<void> {
  await login(driver, { validateBalance: false });
  await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Tron');
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
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Tron');

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
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Tron');

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenExistsInList('Tron', '6.072');
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
        const tokensTab = new TokensTab(driver);
        await tokensTab.selectOnlyTronInNetworkFilter();
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
        const tokensTab = new TokensTab(driver);
        await tokensTab.selectAllNetworksInNetworkFilter();
        await tokensTab.checkTokenExistsInList('Tron');
        await tokensTab.checkTokenExistsInList('Tether');
        await tokensTab.checkTokenExistsInList('Ethereum');
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
        const tokensTab = new TokensTab(driver);
        await tokensTab.clickOnAsset('Tron');
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
        const tokensTab = new TokensTab(driver);
        await tokensTab.clickOnAsset('Tether');
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
        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenExistsInList('Tron');
        await tokensTab.checkAssetIsAbsent('Staked TRX');
      },
    );
  });
});
