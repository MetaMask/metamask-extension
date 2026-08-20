import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import SelectNetworkModal from '../../page-objects/pages/networks/select-network-modal';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import NetworksPage from '../../page-objects/pages/networks/networks-page';
import { TRON_CHAIN_ID, mockTronFeatureFlags } from './mocks/common-tron';

const TRON_NILE_NAME = 'Tron Nile';
const TRON_SHASTA_NAME = 'Tron Shasta';

function buildTronNetworkFixture() {
  // Nile/Shasta appear in the home network filter testnets section when
  // showTestNetworks is enabled and tronTestnetsEnabled is on.
  return new FixtureBuilderV2()
    .withPreferencesController({
      preferences: { showTestNetworks: true },
    })
    .build();
}

describe('Tron - Network', function (this: Suite) {
  this.timeout(120_000);

  it('shows Tron in the home network filter', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          // Anvil is needed because the extension still polls EVM networks in
          // Tron-only flows.
          'anvil',
        ],
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockTronFeatureFlags(mockServer),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const selectNetworkModal = new SelectNetworkModal(driver);
        const networkFilter = new NetworkFilter(driver);
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.checkNetworkIsListed('Tron');
      },
    );
  });

  it('selects Tron from the home network filter', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          // Anvil is needed because the extension still polls EVM networks in
          // Tron-only flows.
          'anvil',
        ],
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockTronFeatureFlags(mockServer),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const tokensTab = new TokensTab(driver);
        const selectNetworkModal = new SelectNetworkModal(driver);
        const networkFilter = new NetworkFilter(driver);

        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.selectNetworkByChainId(TRON_CHAIN_ID);
        await networkFilter.checkLabelIs('Tron');
      },
    );
  });

  it('Shows Tron on Networks page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockTronFeatureFlags(mockServer),
        ],
        localNodeOptions: [
          // Anvil is needed because the extension still polls EVM networks in
          // Tron-only flows.
          'anvil',
        ],
        manifestFlags: {
          remoteFeatureFlags: {
            // Production does not enable the discover button for Tron yet.
            neNetworkDiscoverButton: {
              [TRON_CHAIN_ID]: true,
            },
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const networksPage = new NetworksPage(driver);

        await headerNavbar.openGlobalNetworksMenu();
        await networksPage.checkPageIsLoaded();
        await networksPage.fillNetworkSearchInput('Tron');
        await networksPage.openNetworkListOptions(TRON_CHAIN_ID);
        await networksPage.checkDiscoverButtonIsVisible();
      },
    );
  });

  it('shows Tron Nile when test networks are enabled', async function () {
    await withFixtures(
      {
        fixtures: buildTronNetworkFixture(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          // Anvil is needed because the extension still polls EVM networks in
          // Tron-only flows.
          'anvil',
        ],
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockTronFeatureFlags(mockServer),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const selectNetworkModal = new SelectNetworkModal(driver);
        const networkFilter = new NetworkFilter(driver);
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.checkNetworkIsListed(TRON_NILE_NAME);
      },
    );
  });

  it('shows Tron Shasta when test networks are enabled', async function () {
    await withFixtures(
      {
        fixtures: buildTronNetworkFixture(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          // Anvil is needed because the extension still polls EVM networks in
          // Tron-only flows.
          'anvil',
        ],
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockTronFeatureFlags(mockServer),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const selectNetworkModal = new SelectNetworkModal(driver);
        const networkFilter = new NetworkFilter(driver);
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.checkNetworkIsListed(TRON_SHASTA_NAME);
      },
    );
  });

  it('shows Tron in the Tokens tab network selector', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          // Anvil is needed because the extension still polls EVM networks in
          // Tron-only flows.
          'anvil',
        ],
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockTronFeatureFlags(mockServer),
        ],
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
});
