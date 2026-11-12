import { Context } from 'mocha';
import { MockttpServer } from 'mockttp';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import { login } from '../../page-objects/flows/login.flow';
import { mockSpotPrices, mockTokenMetadataApis } from './utils/mocks';

describe('Token List Sorting', function () {
  const mainnetChainId = CHAIN_IDS.MAINNET;
  const customTokenAddress = '0x2EFA2Cb29C2341d8E5Ba7D3262C9e9d6f1Bf3711';
  const customTokenSymbol = 'ABC';
  const customTokenAssetId = `eip155:1/erc20:${customTokenAddress.toLowerCase()}`;

  const testFixtures = {
    fixtures: new FixtureBuilderV2()
      .withNetworkRpcUrlOnLocalhost(mainnetChainId)
      .withEnabledNetworks({ eip155: { [mainnetChainId]: true } })
      .build(),
    localNodeOptions: {
      chainId: parseInt(mainnetChainId, 16),
    },
    unifiedEvmAccountsApiBalances: {
      mainnetAdditionalBalances: [
        {
          assetId: customTokenAssetId,
          balance: '1',
        },
      ],
    },
  };

  async function mockCustomTokenImport(mockServer: MockttpServer) {
    return [
      ...(await mockTokenMetadataApis(mockServer, [
        {
          address: customTokenAddress,
          symbol: customTokenSymbol,
          name: customTokenSymbol,
          decimals: 18,
          balance: '1',
        },
      ])),
      await mockSpotPrices(mockServer, {
        'eip155:1/slip44:60': {
          price: 1700,
          marketCap: 382623505141,
          pricePercentChange1d: 0,
        },
        [customTokenAssetId]: {
          price: 0,
          marketCap: 0,
          pricePercentChange1d: 0,
        },
      }),
    ];
  }

  const layouts = [
    {
      name: 'narrow layout (sort popover)',
      isWideLayout: false,
    },
    {
      name: 'wide layout (token table headers)',
      isWideLayout: true,
    },
  ];

  for (const { name, isWideLayout } of layouts) {
    // The flag is set explicitly in both cases so each layout keeps being
    // covered whatever default the feature flag registry has.
    it(`should sort tokens alphabetically and by decreasing balance in the ${name}`, async function () {
      await withFixtures(
        {
          ...testFixtures,
          title: (this as Context).test?.fullTitle(),
          manifestFlags: {
            remoteFeatureFlags: {
              extensionUxTokenManagementFilter: true,
              extensionUxFullscreenRedesign: isWideLayout,
            },
          },
          testSpecificMock: mockCustomTokenImport,
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);

          const homePage = new HomePage(driver);
          const tokensTab = new TokensTab(driver);

          await homePage.checkPageIsLoaded();

          const sortTokens = (sortBy: 'alphabetically' | 'decliningBalance') =>
            isWideLayout
              ? tokensTab.sortTokenTable(sortBy)
              : tokensTab.sortTokenList(sortBy);

          await tokensTab.checkTokenExistsInList(customTokenSymbol);
          await sortTokens('alphabetically');
          await tokensTab.checkTokenPositionInList({
            position: 1,
            tokenName: customTokenSymbol,
          });

          await sortTokens('decliningBalance');
          await tokensTab.checkTokenPositionInList({
            position: 1,
            tokenName: 'Ethereum',
          });
        },
      );
    });
  }
});
