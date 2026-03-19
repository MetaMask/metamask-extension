import { Context } from 'mocha';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { NETWORK_CLIENT_ID } from '../../constants';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Token List via StorageService', function () {
  const chainId = CHAIN_IDS.MAINNET;
  const tokenAddress = '0x0994206dfe8de6ec6920ff4d779b0d950605fb53';
  const tokenName = 'Musical Token';
  const tokenSymbol = 'MSCL';

  const tokenListData = {
    [tokenAddress]: {
      address: tokenAddress,
      aggregators: ['CoinGecko', 'Uniswap'],
      decimals: 18,
      iconUrl: `https://static.cx.metamask.io/api/v1/tokenIcons/1/${tokenAddress}.png`,
      name: tokenName,
      occurrences: 2,
      symbol: tokenSymbol,
    },
  };

  it('displays a token in the asset list injected via StorageService', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { [chainId]: true } })
          .withTokenListControllerStorageServiceData([
            { chainId, data: tokenListData },
          ])
          .build(),
        localNodeOptions: {
          chainId: parseInt(chainId, 16),
        },
        title: (this as Context).test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);

        await homePage.checkPageIsLoaded();
        await assetListPage.importTokenBySearch(tokenName);
        await assetListPage.checkTokenExistsInList(tokenSymbol);
      },
    );
  });
});
