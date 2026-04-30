import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { Mockttp } from '../../mock-e2e';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import { mockSpotPrices } from '../tokens/utils/mocks';
import SendPage from '../../page-objects/pages/send/send-page';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  DEFAULT_FIXTURE_ACCOUNT,
  DEFAULT_FIXTURE_ACCOUNT_ID,
  NETWORK_CLIENT_ID,
} from '../../constants';

const NETWORK_NAME_MAINNET = 'Ethereum';

async function mockSetup(mockServer: Mockttp) {
  return [
    await mockSpotPrices(mockServer, {
      'eip155:137/slip44:60': {
        price: 1,
        marketCap: 0,
        pricePercentChange1d: 0,
      },
    }),
    await mockServer
      .forGet('https://bridge.api.cx.metamask.io/networks/137/tokens')
      .thenCallback(() => ({
        statusCode: 200,
        json: [],
      })),
    await mockServer
      .forGet('https://bridge.api.cx.metamask.io/networks/137/topAssets')
      .thenCallback(() => ({
        statusCode: 200,
        json: [],
      })),
    await mockServer
      .forGet(
        'https://bridge.api.cx.metamask.io/networks/137/aggregatorMetadata',
      )
      .thenCallback(() => ({
        statusCode: 200,
        json: {},
      })),
  ];
}
function buildFixtures(title: string) {
  return {
    fixtures: new FixtureBuilderV2()
      .withSelectedNetwork(NETWORK_CLIENT_ID.POLYGON_MAINNET)
      .withEnabledNetworks({
        eip155: {
          [CHAIN_IDS.POLYGON]: true,
        },
      })
      .withAssetsController({
        assetsBalance: {
          [DEFAULT_FIXTURE_ACCOUNT_ID]: {
            // Pre-seed Polygon native balance so the home page shows 25 at login
            'eip155:137/slip44:60': { amount: '25' },
          },
        },
      })
      .withTokenBalancesController({
        tokenBalances: {
          [DEFAULT_FIXTURE_ACCOUNT]: {
            [CHAIN_IDS.POLYGON]: {
              // HST (TST) contract pre-seeded so it shows after import in test 2
              '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947': '0x3e8',
            },
          },
        },
      })
      .build(),
    localNodeOptions: [
      {
        type: 'anvil',
        options: {
          chainId: 1,
        },
      },
      {
        type: 'anvil',
        options: {
          port: 8546,
          chainId: 137,
        },
      },
    ],
    smartContract: SMART_CONTRACTS.HST,
    title,
    testSpecificMock: mockSetup,
  };
}

describe('Multichain Asset List', function (this: Suite) {
  it('allows clicking into the asset details page of native token on another network', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({ driver, localNodes }) => {
        await login(driver, { localNode: localNodes[0] });
        const assetListPage = new AssetListPage(driver);
        await switchToNetworkFromNetworkSelect(
          driver,
          'Popular',
          NETWORK_NAME_MAINNET,
        );
        // Only Ethereum network is selected so only 1 token visible
        await assetListPage.checkTokenItemNumber(1);
        await assetListPage.clickOnAsset('Ether');
        await assetListPage.checkBuySellButtonIsPresent();
        await assetListPage.checkMultichainTokenListButtonIsPresent();
      },
    );
  });
  it('validate the tokens appear on send given network', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({ driver, localNodes }) => {
        await login(driver, { localNode: localNodes[0] });
        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        const sendPage = new SendPage(driver);
        await assetListPage.importCustomTokenByChain(
          '0x89',
          '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
        );
        // Currently only polygon is selected, so only see polygon tokens
        // 1 native token (POL), and 1 ERC-20 (TST)
        await assetListPage.checkTokenItemNumber(2);

        await homePage.startSendFlow();
        await sendPage.selectToken('0x89', 'TST');
        await sendPage.fillRecipient(
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );
      },
    );
  });
});
