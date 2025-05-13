import { MockttpServer } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import Homepage from '../../page-objects/pages/home/homepage';
import NFTDetailsPage from '../../page-objects/pages/nft-details-page';
import NftListPage from '../../page-objects/pages/home/nft-list';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

async function mockIPFSRequest(mockServer: MockttpServer) {
  return [
    await mockServer
      .forGet(
        'https://bafkreifvhjdf6ve4jfv6qytqtux5nd4nwnelioeiqx5x2ez5yrgrzk7ypi.ipfs.dweb.link/',
      )
      .thenCallback(() => ({ statusCode: 200 })),
  ];
}

describe('Settings', function () {
  const smartContract = SMART_CONTRACTS.ERC1155;
  it('Shows nft default image when IPFS toggle is off and restore image once we toggle the ipfs modal', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC1155().build(),
        smartContract,
        title: this.test?.fullTitle(),
        testSpecificMock: mockIPFSRequest,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToPrivacySettings();
        const privacySettings = new PrivacySettings(driver);
        await privacySettings.check_pageIsLoaded();
        await privacySettings.toggleIpfsGateway();
        await settingsPage.closeSettingsPage();
        const homePage = new Homepage(driver);
        await homePage.check_pageIsLoaded();

        await homePage.goToNftTab();
        const nftListPage = new NftListPage(driver);
        await nftListPage.check_pageIsLoaded();
        await nftListPage.clickNFTIconOnActivityList();
        const nftDetailsPage = new NFTDetailsPage(driver);
        await nftDetailsPage.check_pageIsLoaded();

        // check for default image
        await nftDetailsPage.check_nftDefaultImageIsDisplayed();

        // toggle on ipfs to show image
        await nftDetailsPage.showNftImage();

        // should render image now
        await nftDetailsPage.check_nftRenderedImageIsDisplayed();
      },
    );
  });
});
