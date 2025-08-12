import { MockedEndpoint, Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
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
        .forGet('https://price.api.cx.metamask.io/v2/chains/56/spot-prices')
        .withQuery({
          tokenAddresses: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
          vsCurrency: 'ETH',
        })
        .thenCallback(() => {
          return {
            statusCode: 200,
            json: {
              '0x0d8775f648430679a709e98d2b0cb6250d2887ef': {
                eth: 0.0001,
              },
            },
          };
        }),
    ];
  }
  it('renders the balance for the chosen token', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ inputChainId: CHAIN_IDS.BSC })
          .withPreferencesController({ useTokenDetection: true })
          .withTokenListController({
            tokenList: [
              {
                name: 'Basic Attention Token',
                symbol: 'BAT',
                address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
              },
            ],
            tokensChainsCache: {
              '0x38': {
                data: {
                  '0x0d8775f648430679a709e98d2b0cb6250d2887ef': {
                    name: 'Basic Attention Token',
                    symbol: 'BAT',
                    address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
                  },
                },
              },
            },
          })
          .withAppStateController({
            [CHAIN_IDS.OPTIMISM]: true,
          })
          .build(),
        localNodeOptions: {
          chainId: parseInt(CHAIN_IDS.BSC, 16),
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockPriceFetch,
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
