import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import Homepage from '../../../page-objects/pages/homepage';
import PrivacySettings from '../../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { setupAutoDetectMocking } from './mocks';

describe('NFT detection', function () {
  /**
   * TODO Revisit this test once we enable nft auto detection by default. Use .withPreferencesControllerNftDetectionEnabled().
   */
  it('displays NFT media', async function () {
    const driverOptions = { mock: true };
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
        driverOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: setupAutoDetectMocking,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // navigate to security & privacy settings and toggle on NFT autodetection
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.check_pageIsLoaded();
        await privacySettings.toggleAutodetectNft();
        await settingsPage.closeSettingsPage();

        // check that nft is displayed
        const homepage = new Homepage(driver);
        await homepage.check_pageIsLoaded();
        await homepage.check_expectedBalanceIsDisplayed();
        await homepage.goToNftTab();
        await homepage.check_nftNameIsDisplayed(
          'ENS: Ethereum Name Service (1)',
        );
        await homepage.check_nftImageIsDisplayed();
      },
    );
  });
});
