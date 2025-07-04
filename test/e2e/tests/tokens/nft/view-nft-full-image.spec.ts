import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import Homepage from '../../../page-objects/pages/home/homepage';
import NFTListPage from '../../../page-objects/pages/home/nft-list';
import PrivacySettings from '../../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import NFTDetailsPage from '../../../page-objects/pages/nft-details-page';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { setupAutoDetectMocking } from './mocks';

const isGlobalNetworkSelectorRemoved = process.env.REMOVE_GNS === 'true';

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
        const nftListPage = new NFTListPage(driver);

        if (!isGlobalNetworkSelectorRemoved) {
          await nftListPage.filterNftsByNetworks('Popular networks');
        }
        await nftListPage.check_nftNameIsDisplayed(
          'ENS: Ethereum Name Service',
        );
        await nftListPage.check_nftImageIsDisplayed();
        await nftListPage.clickNFTIconOnActivityList();

        const nftDetailsPage = new NFTDetailsPage(driver);
        await nftDetailsPage.check_pageIsLoaded();

        await nftDetailsPage.clickNFTItemButton();
        await nftDetailsPage.check_nftFullImageIsDisplayed();
      },
    );
  });
});
