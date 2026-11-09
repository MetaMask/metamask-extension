import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { selectStellarNetwork } from '../../page-objects/flows/stellar-network.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import SelectNetworkModal from '../../page-objects/pages/networks/select-network-modal';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import NetworksPage from '../../page-objects/pages/networks/networks-page';
import {
  STELLAR_CHAIN_ID,
  STELLAR_NETWORK_NAME,
  buildStellarFixture,
  mockStellarApis,
  stellarFixtureOptions,
} from '../stellar/mocks/common-stellar';

describe('Stellar - Network', function (this: Suite) {
  this.timeout(180_000);

  describe('default wallet', function () {
    it('shows Stellar across the default wallet mainnet flow', async function () {
      await withFixtures(
        stellarFixtureOptions({
          fixtures: buildStellarFixture().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: mockStellarApis,
        }),
        async ({ driver }: { driver: Driver }) => {
          await login(driver, { validateBalance: false });
          const homePage = new HomePage(driver);
          const selectNetworkModal = new SelectNetworkModal(driver);
          const networkFilter = new NetworkFilter(driver);
          const headerNavbar = new HeaderNavbar(driver);
          const networksPage = new NetworksPage(driver);

          // Selecting Stellar from the home network filter switches to it.
          await selectStellarNetwork(driver);
          await networkFilter.checkLabelIs(STELLAR_NETWORK_NAME);

          // Stellar is listed in the Tokens tab network selector. Runs before
          // any page reload: heavy modal interaction after a full-page reload
          // deterministically wedges the renderer (same pattern as Tron).
          await homePage.goToTokensTab();
          await networkFilter.open();
          await selectNetworkModal.checkPageIsLoaded();
          await selectNetworkModal.checkNetworkIsListed(STELLAR_NETWORK_NAME);
          await selectNetworkModal.close();

          // Stellar is listed on the networks page and discoverable.
          await headerNavbar.openGlobalNetworksMenu();
          await networksPage.checkPageIsLoaded();
          await networksPage.fillNetworkSearchInput(STELLAR_NETWORK_NAME);
          await networksPage.openNetworkListOptions(STELLAR_CHAIN_ID);
          await networksPage.checkDiscoverButtonIsVisible();
          // End on the route leave: the back button is not rendered while the
          // header is in search mode, so navigating home is the reliable way
          // out — and no further in-page interaction is attempted after the
          // reload.
          await homePage.navigateToHome();
        },
      );
    });
  });
});
