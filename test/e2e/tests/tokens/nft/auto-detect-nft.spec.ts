import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import Homepage from '../../../page-objects/pages/home/homepage';
import NFTListPage from '../../../page-objects/pages/home/nft-list';
import PrivacySettings from '../../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import { setupAutoDetectMocking } from './mocks';

describe('NFT detection', function () {
  /**
   * TODO Revisit this test once we enable nft auto detection by default. Use .withPreferencesControllerNftDetectionEnabled().
   */
  it('displays NFT media', async function () {
    const driverOptions = { mock: true };
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
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
        await homepage.checkExpectedBalanceIsDisplayed();
        await homepage.goToNftTab();
        const nftListPage = new NFTListPage(driver);
        await nftListPage.checkNftNameIsDisplayed('ENS: Ethereum Name Service');
        await nftListPage.checkNftImageIsDisplayed();
      },
    );
  });
});
