import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import NetworkManager from '../../page-objects/pages/network-manager';
import TronAssetDetailsPage from '../../page-objects/pages/asset/tron-asset-details';
import { TronNode } from '../../seeder/tron/node';
import {
  createEmptyTronNodeOptions,
  createTronPortfolioNodeOptions,
  createTronStakedAccountOptions,
} from '../../seeder/tron/profiles';
import {
  TRON_ACCOUNT_ADDRESS,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockTronAssets,
  mockTronFeatureFlags,
  mockTronSpotPrices,
  mockTrxNativeSpotPrices,
} from './mocks/common-tron';
import { proxyTronBlockchainCalls } from './mocks/local-tron-node-mocks';

async function mockLocalTronApis(
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

async function landOnTronHome(driver: Driver): Promise<void> {
  await login(driver, { validateBalance: false });
  const networkManager = new NetworkManager(driver);
  await networkManager.openNetworkManager();
  await networkManager.selectTab('Popular');
  await networkManager.selectNetworkByNameWithWait('Tron');
}

describe('Tron assets', function (this: Suite) {
  this.timeout(180_000);

  it('TRX is the only asset and shows 0 for an empty account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createEmptyTronNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: mockLocalTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const assetList = new AssetListPage(driver);
        await assetList.checkOnlyAssetsArePresent(['Tron']);
        await assetList.checkTokenAmountIsDisplayed('0');
      },
    );
  });

  it('Lists TRX, TRC10, TRC20 with name, symbol, amount, fiat for portfolio account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: mockLocalTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const assetList = new AssetListPage(driver);
        await assetList.checkTokenExistsInList('Tron', '6.072');
        await assetList.checkTokenExistsInList('GasFreeTransferSolution');
        await assetList.checkTokenExistsInList('Tether');
        await assetList.checkTokenExistsInList('HTX DAO');
        await assetList.checkTokenExistsInList('USDD');
        await assetList.checkTokenExistsInList('SEED');
        await assetList.checkConversionRateDisplayed();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- TODO(tron-e2e): Tron asset list does not expose the EVM "popular networks" NetworkFilter popover — NetworkFilterComponent disables sort-by-popover-toggle when chainId is not in FEATURED_NETWORK_CHAIN_IDS, so [data-testid="network-filter-current__button"] is never rendered. Needs product/UX decision before enabling.
  it.skip('Current network filter shows only Tron assets', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: mockLocalTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronHome(driver);
        const assetList = new AssetListPage(driver);
        await assetList.selectOnlyTronInNetworkFilter();
        await assetList.checkOnlyAssetsArePresent([
          'Tron',
          'GasFreeTransferSolution',
          'Tether',
          'HTX DAO',
          'USDD',
          'SEED',
        ]);
        await assetList.checkAssetIsAbsent('Ethereum');
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- TODO(tron-e2e): Tron asset list does not expose the EVM NetworkFilter popover — [data-testid="network-filter-all__button"] is never rendered (sort-by-popover-toggle is disabled for non-FEATURED chain ids). Needs product/UX decision before enabling.
  it.skip('All networks filter shows other chains alongside Tron', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: mockLocalTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronHome(driver);
        const assetList = new AssetListPage(driver);
        await assetList.openNetworksFilter();
        await driver.clickElement('[data-testid="network-filter-all__button"]');
        await assetList.checkTokenExistsInList('Tron');
        await assetList.checkTokenExistsInList('Tether');
        await assetList.checkTokenExistsInList('Ethereum');
      },
    );
  });

  it('TRX asset details: header, chart, action buttons, daily resource, sections', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: mockLocalTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronHome(driver);
        const assetList = new AssetListPage(driver);
        await assetList.clickOnAsset('Tron');
        const details = new TronAssetDetailsPage(driver);
        await details.checkPageIsLoaded();
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
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: mockLocalTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronHome(driver);
        const assetList = new AssetListPage(driver);
        await assetList.clickOnAsset('Tether');
        const details = new TronAssetDetailsPage(driver);
        await details.checkPageIsLoaded();
        await details.checkPriceChart();
        await details.checkActionButtons({
          swap: true,
          send: true,
          receive: true,
        });
        await details.checkAllStandardSections();
        await driver.assertElementNotPresent({
          text: 'Daily resource',
          tag: 'h4',
        });
      },
    );
  });

  it('Staked TRX entry is shown alongside TRX for an account that staked', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          {
            type: 'tron',
            options: createTronStakedAccountOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: mockLocalTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronHome(driver);
        const assetList = new AssetListPage(driver);
        await assetList.checkTokenExistsInList('Tron');
        await assetList.checkTokenExistsInList('Staked TRX');
        await assetList.clickOnAsset('Staked TRX');
        const details = new TronAssetDetailsPage(driver);
        await details.checkPageIsLoaded();
        await details.checkActionButtons({
          swap: false,
          send: false,
          receive: false,
        });
      },
    );
  });

  it('Staked TRX entry is absent for an account that has not staked', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: mockLocalTronApis,
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
