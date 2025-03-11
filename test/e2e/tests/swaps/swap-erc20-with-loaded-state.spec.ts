import { MockttpServer } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import TokenOverviewPage from '../../page-objects/pages/token-overview-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  TOKENS_API_MOCK_RESULT,
  TOP_ASSETS_API_MOCK_RESULT,
  AGGREGATOR_METADATA_API_MOCK_RESULT,
  GAS_PRICE_API_MOCK_RESULT,
  FEATURE_FLAGS_API_MOCK_RESULT,
  TRADES_API_MOCK_RESULT,
  NETWORKS_2_API_MOCK_RESULT,
} from '../../../data/mock-data';
import { GAS_API_BASE_URL } from '../../../../shared/constants/swaps';

async function mockSwapQuotes(mockServer: MockttpServer) {
  return [
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/1/tokens')
      .thenCallback(() => ({ statusCode: 200, json: TOKENS_API_MOCK_RESULT })),
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/1/topAssets')
      .thenCallback(() => ({
        statusCode: 200,
        json: TOP_ASSETS_API_MOCK_RESULT,
      })),
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/1/aggregatorMetadata')
      .thenCallback(() => ({
        statusCode: 200,
        json: AGGREGATOR_METADATA_API_MOCK_RESULT,
      })),
    await mockServer
      .forGet(`${GAS_API_BASE_URL}/networks/1/gasPrices`)
      .thenCallback(() => ({
        statusCode: 200,
        json: GAS_PRICE_API_MOCK_RESULT,
      })),
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/featureFlags')
      .thenCallback(() => ({
        statusCode: 200,
        json: FEATURE_FLAGS_API_MOCK_RESULT,
      })),
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/1/trades')
      .thenCallback(() => ({
        statusCode: 200,
        json: TRADES_API_MOCK_RESULT,
      })),
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/1')
      .thenCallback(() => ({
        statusCode: 200,
        json: NETWORKS_2_API_MOCK_RESULT,
      })),
    await mockServer
      .forPost('https://transaction.api.cx.metamask.io/networks/1/getFees')
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          blockNumber: 22017409,
          id: 'b6d9c5f3-4fee-4470-be1b-6c574fe61315',
          txs: [
            {
              cancelFees: [],
              return: '0x',
              status: 1,
              gasUsed: 188186,
              gasLimit: 241302,
              fees: [
                {
                  maxFeePerGas: 6393950816,
                  maxPriorityFeePerGas: 1000000004,
                  gas: 241302,
                  balanceNeeded: 1542873120043734,
                  currentBalance: 30009434625664560,
                  error: '',
                },
              ],
              feeEstimate: 821886724082654,
              baseFeePerGas: 3367416938,
              maxFeeEstimate: 1542873119802432,
            },
          ],
        },
      })),
    await mockServer
      .forGet('https://token.api.cx.metamask.io/token/')
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          symbol: 'DAI',
          type: 'erc20',
          aggregators: [
            'metamask',
            'aave',
            'bancor',
            'cmc',
            'coinGecko',
            'oneInch',
            'pmm',
            'zerion',
            'lifi',
            'socket',
            'squid',
            'openswap',
            'sonarwatch',
            'uniswapLabs',
            'coinmarketcap',
            'rango',
          ],
          occurrences: 16,
          iconUrl:
            'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/dai.svg',
          address: '0x6b175474e89094c44da98b954eedeac495271d0f',
          name: 'Dai Stablecoin',
          decimals: 18,
        },
      })),
  ];
}

describe('Swap', function () {
  it('should swap ETH to DAI', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withTokensController({
            allTokens: {
              '0x1': {
                '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
                  {
                    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                    symbol: 'DAI',
                    decimals: 18,
                    isERC721: false,
                    aggregators: [],
                  },
                ],
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapQuotes,
        localNodeOptions: [
          {
            type: 'anvil',
            options: {
              chainId: 1,
              loadState:
                './test/e2e/seeder/network-states/swap-eth-dai/withSwapContracts.json',
            },
          },
        ],
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        await homePage.check_pageIsLoaded();

        await assetListPage.clickOnAsset('DAI');

        // Swap ETH to DAI
        const tokenOverviewPage = new TokenOverviewPage(driver);
        await tokenOverviewPage.check_pageIsLoaded();
        await tokenOverviewPage.clickSwap();
      },
    );
  });
});
