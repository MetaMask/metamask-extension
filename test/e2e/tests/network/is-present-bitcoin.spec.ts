import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import NetworksPage from '../../page-objects/pages/networks/networks-page';
import SelectNetworkModal from '../../page-objects/pages/networks/select-network-modal';
import { Driver } from '../../webdriver/driver';

const BITCOIN_NETWORK_NAME = 'Bitcoin';

// Anvil is still needed because the extension polls EVM networks even in
// Bitcoin-only flows.
const BITCOIN_LOCAL_NODE_OPTIONS = ['anvil'];

describe('Bitcoin - Network', function (this: Suite) {
  this.timeout(180_000);

  it('shows Bitcoin across the default wallet mainnet flow', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: BITCOIN_LOCAL_NODE_OPTIONS,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const homePage = new HomePage(driver);
        const networkFilter = new NetworkFilter(driver);
        const networksPage = new NetworksPage(driver);
        const selectNetworkModal = new SelectNetworkModal(driver);

        await switchToNetworkFromNetworkSelect(driver, BITCOIN_NETWORK_NAME);
        await networkFilter.checkLabelIs(BITCOIN_NETWORK_NAME);

        await homePage.goToTokensTab();
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.checkNetworkIsListed(BITCOIN_NETWORK_NAME);
        await selectNetworkModal.close();

        await headerNavbar.openGlobalNetworksMenu();
        await networksPage.checkPageIsLoaded();
        await networksPage.fillNetworkSearchInput(BITCOIN_NETWORK_NAME);
        await networksPage.checkNetworkOptionIsDisplayed(BITCOIN_NETWORK_NAME);
        await homePage.navigateToHome();
      },
    );
  });
});
