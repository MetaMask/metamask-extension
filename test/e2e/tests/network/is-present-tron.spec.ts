import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import NetworksPage from '../../page-objects/pages/networks/networks-page';
import SelectNetworkModal from '../../page-objects/pages/networks/select-network-modal';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import { TRON_CHAIN_ID, mockTronFeatureFlags } from '../tron/mocks/common-tron';

const TRON_NILE_NAME = 'Tron Nile';
const TRON_SHASTA_NAME = 'Tron Shasta';

function buildTronNetworkFixture() {
  // Nile/Shasta appear in the home network filter testnets section when
  // showTestNetworks is enabled.
  return new FixtureBuilderV2()
    .withPreferencesController({
      preferences: { showTestNetworks: true },
    })
    .build();
}

async function mockTronNetworkFlags(mockServer: Mockttp) {
  return [await mockTronFeatureFlags(mockServer)];
}

const TRON_DEFAULT_WALLET_MANIFEST_FLAGS = {
  remoteFeatureFlags: {
    // Production does not enable the discover button for Tron yet.
    neNetworkDiscoverButton: {
      [TRON_CHAIN_ID]: true,
    },
  },
} as const;

describe('Tron - Network', function (this: Suite) {
  this.timeout(180_000);

  describe('default wallet', function () {
    it('shows Tron in the home network filter', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          localNodeOptions: ['anvil'],
          testSpecificMock: mockTronNetworkFlags,
          manifestFlags: TRON_DEFAULT_WALLET_MANIFEST_FLAGS,
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);
          const selectNetworkModal = new SelectNetworkModal(driver);
          const networkFilter = new NetworkFilter(driver);
          await networkFilter.open();
          await selectNetworkModal.checkPageIsLoaded();
          await selectNetworkModal.checkNetworkIsListed('Tron');
          await selectNetworkModal.close();
        },
      );
    });

    it('shows Tron in the Tokens tab network selector', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          localNodeOptions: ['anvil'],
          testSpecificMock: mockTronNetworkFlags,
          manifestFlags: TRON_DEFAULT_WALLET_MANIFEST_FLAGS,
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);
          const home = new HomePage(driver);
          await home.goToTokensTab();
          const selectNetworkModal = new SelectNetworkModal(driver);
          const networkFilter = new NetworkFilter(driver);
          await networkFilter.open();
          await selectNetworkModal.checkPageIsLoaded();
          await selectNetworkModal.checkNetworkIsListed('Tron');
          await selectNetworkModal.close();
        },
      );
    });

    it('shows Tron on the Networks page', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          localNodeOptions: ['anvil'],
          testSpecificMock: mockTronNetworkFlags,
          manifestFlags: TRON_DEFAULT_WALLET_MANIFEST_FLAGS,
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);
          const headerNavbar = new HeaderNavbar(driver);
          const networksPage = new NetworksPage(driver);
          const homePage = new HomePage(driver);

          await headerNavbar.openGlobalNetworksMenu();
          await networksPage.checkPageIsLoaded();
          await networksPage.fillNetworkSearchInput('Tron');
          await networksPage.openNetworkListOptions(TRON_CHAIN_ID);
          await networksPage.checkDiscoverButtonIsVisible();
          // While the header is in search mode (and the options popover is
          // open) the back button is not rendered, so leave the route directly
          // instead of clicking it.
          await homePage.navigateToHome();
        },
      );
    });

    it('selects Tron from the home network filter', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          localNodeOptions: ['anvil'],
          testSpecificMock: mockTronNetworkFlags,
          manifestFlags: TRON_DEFAULT_WALLET_MANIFEST_FLAGS,
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);
          const selectNetworkModal = new SelectNetworkModal(driver);
          const networkFilter = new NetworkFilter(driver);

          await networkFilter.open();
          await selectNetworkModal.checkPageIsLoaded();
          await selectNetworkModal.selectNetworkByChainId(TRON_CHAIN_ID);
          await networkFilter.checkLabelIs('Tron');
        },
      );
    });
  });

  describe('test networks enabled', function () {
    // One behavior (testnets listed when the toggle is on) asserted across
    // both rows of the same modal, so a single browser boot covers it.
    it('shows Tron testnets when test networks are enabled', async function () {
      await withFixtures(
        {
          fixtures: buildTronNetworkFixture(),
          title: this.test?.fullTitle(),
          localNodeOptions: ['anvil'],
          testSpecificMock: mockTronNetworkFlags,
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);
          const selectNetworkModal = new SelectNetworkModal(driver);
          const networkFilter = new NetworkFilter(driver);
          await networkFilter.open();
          await selectNetworkModal.checkPageIsLoaded();

          console.log('Checking Tron Nile is listed in the network filter');
          await selectNetworkModal.checkNetworkIsListed(TRON_NILE_NAME);

          console.log('Checking Tron Shasta is listed in the network filter');
          await selectNetworkModal.checkNetworkIsListed(TRON_SHASTA_NAME);

          await selectNetworkModal.close();
        },
      );
    });
  });
});
