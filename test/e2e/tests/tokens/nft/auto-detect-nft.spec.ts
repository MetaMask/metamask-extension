import { NETWORK_CLIENT_ID } from '../../../constants';
import { withFixtures } from '../../../helpers';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import Homepage from '../../../page-objects/pages/home/homepage';
import NFTListPage from '../../../page-objects/pages/home/nft-list';
import { login } from '../../../page-objects/flows/login.flow';
import { setupAutoDetectMocking } from './mocks';

describe('NFT detection', function () {
  it('displays NFT media', async function () {
    const driverOptions = { mock: true };
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        driverOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: setupAutoDetectMocking,
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });

        // check that nft is displayed
        const homepage = new Homepage(driver);
        await homepage.checkPageIsLoaded();
        await homepage.checkExpectedBalanceIsDisplayed();
        await homepage.goToNftTab();
        const nftListPage = new NFTListPage(driver);
        await nftListPage.checkNftNameIsDisplayed('ENS: Ethereum Name Service');
        await nftListPage.checkNftImageIsDisplayed();
      },
    );
  });
});
