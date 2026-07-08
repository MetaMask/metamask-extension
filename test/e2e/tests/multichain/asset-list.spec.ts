import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
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
const HST_TOKEN_ADDRESS = '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947';
const MUSD_ADDRESS = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';
const MUSD_MAINNET_ASSET_ID = `eip155:1/erc20:${MUSD_ADDRESS}`;
/** Aggregated fiat total when mainnet (24.998 ETH) + polygon (25 POL) are enabled at $1/ea. */
const AGGREGATED_BALANCE_USD = '$50';

async function mockSetup(mockServer: Mockttp) {
  return [
    await mockSpotPrices(mockServer, {
      'eip155:1/slip44:60': {
        price: 1,
        marketCap: 0,
        pricePercentChange1d: 0,
      },
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
    await mockServer
      .forGet(/^https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets/u)
      .thenCallback((request) => {
        const url = new URL(request.url);
        const assetIds = url.searchParams
          .getAll('assetIds')
          .join(',')
          .toLowerCase();
        const results = [];

        if (assetIds.includes('eip155:1/slip44:60')) {
          results.push({
            assetId: 'eip155:1/slip44:60',
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          });
        }

        if (assetIds.includes(MUSD_MAINNET_ASSET_ID.toLowerCase())) {
          results.push({
            assetId: MUSD_MAINNET_ASSET_ID,
            name: 'MUSD',
            symbol: 'MUSD',
            decimals: 6,
          });
        }

        return { statusCode: 200, json: { data: results } };
      }),
  ];
}
function buildFixturesForAssetDetails(title: string) {
  return {
    fixtures: new FixtureBuilderV2()
      .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
      .withEnabledNetworks({
        eip155: {
          [CHAIN_IDS.MAINNET]: true,
          [CHAIN_IDS.POLYGON]: true,
        },
      })
      .withAssetsController({
        assetsBalance: {
          [DEFAULT_FIXTURE_ACCOUNT_ID]: {
            'eip155:1/slip44:60': { amount: '24.998' },
            'eip155:137/slip44:60': { amount: '25' },
            [MUSD_MAINNET_ASSET_ID]: { amount: '0' },
          },
        },
        assetsInfo: {
          'eip155:1/slip44:60': {
            type: 'native',
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          'eip155:137/slip44:60': {
            type: 'native',
            decimals: 18,
            symbol: 'POL',
            name: 'Polygon',
          },
          [MUSD_MAINNET_ASSET_ID]: {
            type: 'erc20',
            decimals: 6,
            symbol: 'MUSD',
            name: 'MUSD',
          },
        },
        customAssets: {
          [DEFAULT_FIXTURE_ACCOUNT_ID]: [MUSD_MAINNET_ASSET_ID],
        },
        assetsPrice: {
          'eip155:1/slip44:60': {
            assetPriceType: 'fungible' as const,
            id: 'ethereum',
            lastUpdated: 0,
            price: 1,
            usdPrice: 1,
          },
          'eip155:137/slip44:60': {
            assetPriceType: 'fungible' as const,
            id: 'polygon',
            lastUpdated: 0,
            price: 1,
            usdPrice: 1,
          },
        },
      })
      .withShowNativeTokenAsMainBalanceDisabled()
      .withTokenBalancesController({
        tokenBalances: {
          [DEFAULT_FIXTURE_ACCOUNT]: {
            [CHAIN_IDS.MAINNET]: {
              [HST_TOKEN_ADDRESS]: '0x3e8',
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
    manifestFlags: {
      remoteFeatureFlags: {
        extensionUxTokenManagementFilter: false,
      },
    },
  };
}

function buildFixturesForSend(title: string) {
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
              [HST_TOKEN_ADDRESS]: '0x3e8',
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
    manifestFlags: {
      remoteFeatureFlags: {
        extensionUxTokenManagementFilter: true,
      },
    },
  };
}

describe('Multichain Asset List', function (this: Suite) {
  it('allows clicking into the asset details page of native token on another network', async function () {
    await withFixtures(
      buildFixturesForAssetDetails(this.test?.fullTitle() as string),
      async ({ driver }) => {
        // Mainnet + polygon enabled → aggregated fiat (~$50), not single-chain 24.998 ETH.
        await login(driver, { expectedBalance: AGGREGATED_BALANCE_USD });
        const tokensTab = new TokensTab(driver);
        await switchToNetworkFromNetworkSelect(
          driver,
          'Popular',
          NETWORK_NAME_MAINNET,
        );
        // Ethereum filter: native ETH + zero-balance mUSD (always shown on mainnet).
        await tokensTab.checkTokenItemNumber(2);
        await tokensTab.clickOnAsset('Ether');
        await tokensTab.checkBuySellButtonIsPresent();
        await tokensTab.checkMultichainTokenListButtonIsPresent();
      },
    );
  });
  it('validate the tokens appear on send given network', async function () {
    await withFixtures(
      buildFixturesForSend(this.test?.fullTitle() as string),
      async ({ driver }) => {
        await login(driver, { validateBalance: false });
        const homePage = new HomePage(driver);
        const tokensTab = new TokensTab(driver);
        const sendPage = new SendPage(driver);
        await tokensTab.importCustomTokenByChain(
          '0x89',
          '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
        );
        // Currently only polygon is selected, so only see polygon tokens
        // 1 native token (POL), and 1 ERC-20 (TST)
        await tokensTab.checkTokenItemNumber(2);

        await homePage.startSendFlow();
        await sendPage.selectToken('0x89', 'TST');
        await sendPage.fillRecipient({
          recipientAddress: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        });
      },
    );
  });
});
