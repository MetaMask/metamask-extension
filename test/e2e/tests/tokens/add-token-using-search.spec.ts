import { MockedEndpoint, Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { NETWORK_CLIENT_ID } from '../../constants';
import {
  BSC_DISPLAY_NAME,
  CHAIN_IDS,
} from '../../../../shared/constants/network';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { login } from '../../page-objects/flows/login.flow';

const BSC_BAT_ADDRESS = '0x0d8775f648430679a709e98d2b0cb6250d2887ef';

const BSC_BAT_TOKEN_LIST_ENTRY = {
  [BSC_BAT_ADDRESS]: {
    name: 'Basic Attention Token',
    symbol: 'BAT',
    decimals: 18,
    address: BSC_BAT_ADDRESS,
    occurrences: 1,
    aggregators: [],
    iconUrl: '',
  },
};

describe('Add existing token using search', function () {
  // Mock all spot-price requests for BSC (BNB native + BAT)
  async function mockPriceFetch(
    mockServer: Mockttp,
  ): Promise<MockedEndpoint[]> {
    return [
      await mockServer
        .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
        .always()
        .thenCallback(() => ({
          statusCode: 200,
          json: {
            'eip155:56/slip44:60': {
              price: 600,
              marketCap: 90000000000,
              pricePercentChange1d: 0,
            },
            'eip155:56/erc20:0x0d8775f648430679a709e98d2b0cb6250d2887ef': {
              price: 0.18,
              marketCap: 270000000,
              pricePercentChange1d: 0,
            },
          },
        })),
      await mockServer
        .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
        .always()
        .thenCallback(() => ({
          statusCode: 200,
          json: {
            usd: {
              name: 'US Dollar',
              ticker: 'usd',
              value: 1,
              currencyType: 'fiat',
            },
            bnb: {
              name: 'BNB',
              ticker: 'bnb',
              value: 1 / 600,
              currencyType: 'crypto',
            },
          },
        })),
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

  async function mockSupportedNetworks(
    mockServer: Mockttp,
  ): Promise<MockedEndpoint[]> {
    return [
      await mockServer
        .forGet('https://tokens.api.cx.metamask.io/v2/supportedNetworks')
        .thenCallback(() => ({
          statusCode: 200,
          json: {
            fullSupport: ['eip155:56'],
          },
        })),
    ];
  }

  async function mockTokensAssets(
    mockServer: Mockttp,
  ): Promise<MockedEndpoint[]> {
    return [
      await mockServer
        .forGet('https://tokens.api.cx.metamask.io/v3/assets')
        .thenCallback(() => ({
          statusCode: 200,
          json: [
            {
              assetId: 'eip155:56/slip44:714',
              name: 'BNB',
              symbol: 'BNB',
              decimals: 18,
            },
            {
              assetId:
                'eip155:56/erc20:0x0d8775f648430679a709e98d2b0cb6250d2887ef',
              name: 'Basic Attention Token',
              symbol: 'BAT',
              decimals: 18,
            },
          ],
        })),
    ];
  }

  async function mockBscApis(mockServer: Mockttp): Promise<MockedEndpoint[]> {
    return [
      ...(await mockPriceFetch(mockServer)),
      ...(await mockBscBridgeApi(mockServer)),
      ...(await mockSupportedNetworks(mockServer)),
      ...(await mockTokensAssets(mockServer)),
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
              [CHAIN_IDS.BSC]: {
                timestamp: Date.now(),
                data: BSC_BAT_TOKEN_LIST_ENTRY,
              },
            },
          })
          // Seed both for reliable search
          .withTokenListControllerStorageServiceData([
            { chainId: CHAIN_IDS.BSC, data: BSC_BAT_TOKEN_LIST_ENTRY },
          ])
          .build(),
        localNodeOptions: {
          chainId: parseInt(CHAIN_IDS.BSC, 16),
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockBscApis,
      },
      async ({ driver }) => {
        await login(driver);

        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenAmountIsDisplayed('25 BNB');
        await assetListPage.importTokenBySearch({
          tokenName: 'BAT',
          networkName: BSC_DISPLAY_NAME,
        });
        await assetListPage.checkTokenAmountInTokenDetailsModal(
          'Basic Attention Token',
          '0 BAT',
        );
      },
    );
  });
});
