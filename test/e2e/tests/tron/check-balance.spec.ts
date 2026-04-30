import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { TronNode } from '../../seeder/tron/node';
import {
  createEmptyTronNodeOptions,
  createTronPortfolioNodeOptions,
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

describe('Check balance', function (this: Suite) {
  this.timeout(180_000);

  it('Just created Tron account shows 0 TRX when native token is enabled', async function () {
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
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Tron');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await homePage.checkExpectedBalanceIsDisplayed('0 TRX');
      },
    );
  });

  it('For a non 0 balance account - USD balance', async function () {
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
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Tron');

        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();

        // TRX_BALANCE = 6072392 SUN = ~6.07 TRX * $0.29469 = ~$1.79
        // Total Fiat = TRX $1.79, HTX DAO $5.30, USDT $2.80, USDD $0.29 = $10.18
        await homePage.checkExpectedBalanceIsDisplayed('$10.18');
      },
    );
  });

  it('For a non 0 balance account - TRX balance', async function () {
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
        testSpecificMock: mockLocalTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Tron');

        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();

        // TRX_BALANCE = 6072392 SUN = ~6.07 TRX
        await homePage.checkExpectedBalanceIsDisplayed('6.072 TRX');
      },
    );
  });

  it('Stores staked TRX balance from initialization options', async function () {
    const node = new TronNode();
    await node.start({
      initialBalances: { [TRON_ACCOUNT_ADDRESS]: 0 },
      stakedTrxBalances: { [TRON_ACCOUNT_ADDRESS]: '20000000' },
      trc721Balances: { [TRON_ACCOUNT_ADDRESS]: { 'collection-x': ['1'] } },
      trc1155Balances: { [TRON_ACCOUNT_ADDRESS]: { 'collection-y': { '5': '3' } } },
    });
    try {
      assert.strictEqual(
        node.getStakedTrxBalance(TRON_ACCOUNT_ADDRESS),
        '20000000',
      );
      assert.strictEqual(node.getStakedTrxBalance('TUnknownAddress'), '0');
    } finally {
      await node.quit();
    }
  });
});
