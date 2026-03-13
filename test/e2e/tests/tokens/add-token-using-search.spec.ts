import { MockedEndpoint, Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { NETWORK_CLIENT_ID } from '../../constants';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Add existing token using search', function () {
  // Mock call to core to fetch BAT token price
  async function mockPriceFetch(
    mockServer: Mockttp,
  ): Promise<MockedEndpoint[]> {
    return [
      await mockServer
        .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
        .withQuery({
          assetIds:
            'eip155:56/erc20:0x0d8775f648430679a709e98d2b0cb6250d2887ef',
          vsCurrency: 'ETH',
        })
        .thenCallback(() => {
          return {
            statusCode: 200,
            json: {
              'eip155:56/erc20:0x0d8775f648430679a709e98d2b0cb6250d2887ef': {
                eth: 0.0001,
              },
            },
          };
        }),
    ];
  }

  // Mock BSC Bridge API endpoints
  async function mockBscBridgeApi(
    mockServer: Mockttp,
  ): Promise<MockedEndpoint[]> {
    return [
      await mockServer
        .forGet('https://bridge.api.cx.metamask.io/networks/56/topAssets')
        .thenCallback(() => ({
          statusCode: 200,
          json: [
            {
              address: '0x0000000000000000000000000000000000000000',
              symbol: 'BNB',
            },
            {
              address: '0x55d398326f99059fF775485246999027B3197955',
              symbol: 'USDT',
            },
            {
              address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
              symbol: 'USDC',
            },
          ],
        })),
      await mockServer
        .forGet('https://bridge.api.cx.metamask.io/networks/56/tokens')
        .thenCallback(() => ({
          statusCode: 200,
          json: [],
        })),
      await mockServer
        .forGet(
          'https://bridge.api.cx.metamask.io/networks/56/aggregatorMetadata',
        )
        .thenCallback(() => ({
          statusCode: 200,
          json: {},
        })),
    ];
  }

  async function mockBscApis(mockServer: Mockttp): Promise<MockedEndpoint[]> {
    return [
      ...(await mockPriceFetch(mockServer)),
      ...(await mockBscBridgeApi(mockServer)),
    ];
  }
  it('renders the balance for the chosen token', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.BSC_MAINNET)
          .withEnabledNetworks({ eip155: { [CHAIN_IDS.BSC]: true } })
          .withPreferencesController({ useTokenDetection: true })
          .withTokenListController({
            tokensChainsCache: {
              '0x38': {
                timestamp: Date.now(),
                data: {
                  '0x0d8775f648430679a709e98d2b0cb6250d2887ef': {
                    name: 'Basic Attention Token',
                    symbol: 'BAT',
                    decimals: 18,
                    address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                    occurrences: 1,
                    aggregators: [],
                    iconUrl: '',
                  },
                },
              },
            },
          })
          .build(),
        localNodeOptions: {
          chainId: parseInt(CHAIN_IDS.BSC, 16),
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockBscApis,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenAmountIsDisplayed('25 BNB');
        await assetListPage.importTokenBySearch('BAT');
        await assetListPage.checkTokenAmountInTokenDetailsModal(
          'Basic Attention Token',
          '0 BAT',
        );
      },
    );
  });
});
