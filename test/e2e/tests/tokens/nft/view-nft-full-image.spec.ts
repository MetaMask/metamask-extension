import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import Homepage from '../../../page-objects/pages/home/homepage';
import NFTListPage from '../../../page-objects/pages/home/nft-list';
import PrivacySettings from '../../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import NFTDetailsPage from '../../../page-objects/pages/nft-details-page';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { setupAutoDetectMocking } from './mocks';

describe('NFT full', function () {
  it('displays NFT full image when NFT is on a network different from the current network', async function () {
    const driverOptions = { mock: true };
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnLinea()
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.LINEA_MAINNET]: true,
              [CHAIN_IDS.MAINNET]: true,
            },
          })
          .build(),
        driverOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: setupAutoDetectMocking,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        // navigate to security & privacy settings and toggle on NFT autodetection
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();
        await privacySettings.toggleAutodetectNft();
        await settingsPage.closeSettingsPage();

        // check that nft is displayed
        const homepage = new Homepage(driver);
        await homepage.checkPageIsLoaded();
        await homepage.goToNftTab();
        const nftListPage = new NFTListPage(driver);

        await nftListPage.checkNftNameIsDisplayed(
          'ENS: Ethereum Name Service',
        );
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
