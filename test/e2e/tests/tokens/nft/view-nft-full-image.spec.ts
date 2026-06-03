import { withFixtures } from '../../../helpers';
import { NETWORK_CLIENT_ID } from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import Homepage from '../../../page-objects/pages/home/homepage';
import NFTListPage from '../../../page-objects/pages/home/nft-list';
import { login } from '../../../page-objects/flows/login.flow';
import NFTDetailsPage from '../../../page-objects/pages/nft-details-page';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { setupAutoDetectMocking } from './mocks';

describe('NFT full', function () {
  it('displays NFT full image when Popular Networks is selected', async function () {
    const driverOptions = { mock: true };
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
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
        await homepage.goToNftTab();
        const nftListPage = new NFTListPage(driver);

        await nftListPage.checkNftNameIsDisplayed('ENS: Ethereum Name Service');
        await nftListPage.checkNftImageIsDisplayed();
        await nftListPage.clickNFTIconOnActivityList();

        const nftDetailsPage = new NFTDetailsPage(driver);
        await nftDetailsPage.checkPageIsLoaded();

        await nftDetailsPage.clickNFTItemButton();
        await nftDetailsPage.checkNftFullImageIsDisplayed();
      },
    );
  });
  it('displays NFT full image when a specific network is selected', async function () {
    const driverOptions = { mock: true };
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
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
        await homepage.goToNftTab();
        const nftListPage = new NFTListPage(driver);

        await nftListPage.checkNftNameIsDisplayed('ENS: Ethereum Name Service');
        await nftListPage.checkNftImageIsDisplayed();
        await nftListPage.clickNFTIconOnActivityList();

        const nftDetailsPage = new NFTDetailsPage(driver);
        await nftDetailsPage.checkPageIsLoaded();

        await nftDetailsPage.clickNFTItemButton();
        await nftDetailsPage.checkNftFullImageIsDisplayed();
      },
    );
  });
});
