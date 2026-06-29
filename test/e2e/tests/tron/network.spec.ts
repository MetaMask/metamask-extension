import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import HomeNetworkFilter from '../../page-objects/pages/home-network-filter';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import { TRON_CHAIN_ID, mockTronFeatureFlags } from './mocks/common-tron';

const TRON_NILE_NAME = 'Tron Nile';
const TRON_SHASTA_NAME = 'Tron Shasta';

const NETWORK_MANAGEMENT_FLAGS = {
  manifestFlags: {
    remoteFeatureFlags: {
      extensionUxNetworkManagement: {
        enabled: true,
        minimumVersion: '13.36.0',
      },
      tronTestnetsEnabled: true,
    },
  },
};

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
        ...NETWORK_MANAGEMENT_FLAGS,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homeNetworkFilter = new HomeNetworkFilter(driver);
        await homeNetworkFilter.open();
        await homeNetworkFilter.checkNetworkIsListed('Tron');
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
        ...NETWORK_MANAGEMENT_FLAGS,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const tokensTab = new TokensTab(driver);
        const homeNetworkFilter = new HomeNetworkFilter(driver);

        await homeNetworkFilter.open();
        await homeNetworkFilter.selectNetworkByChainId(TRON_CHAIN_ID);
        await tokensTab.checkNetworkFilterText('Tron');
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
            extensionUxNetworkManagement: {
              enabled: true,
              minimumVersion: '13.36.0',
            },
            neNetworkDiscoverButton: {
              [TRON_CHAIN_ID]: true,
            },
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetwork = new SelectNetwork(driver);

        await headerNavbar.openGlobalNetworksMenu();
        await selectNetwork.checkPageIsLoaded();
        await selectNetwork.fillNetworkSearchInput('Tron');
        await selectNetwork.openNetworkListOptions(TRON_CHAIN_ID);
        await selectNetwork.checkDiscoverButtonIsVisible();
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
        ...NETWORK_MANAGEMENT_FLAGS,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homeNetworkFilter = new HomeNetworkFilter(driver);
        await homeNetworkFilter.open();
        await homeNetworkFilter.checkNetworkIsListed(TRON_NILE_NAME);
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
        ...NETWORK_MANAGEMENT_FLAGS,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homeNetworkFilter = new HomeNetworkFilter(driver);
        await homeNetworkFilter.open();
        await homeNetworkFilter.checkNetworkIsListed(TRON_SHASTA_NAME);
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
        ...NETWORK_MANAGEMENT_FLAGS,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const home = new HomePage(driver);
        await home.goToTokensTab();
        const homeNetworkFilter = new HomeNetworkFilter(driver);
        await homeNetworkFilter.open();
        await homeNetworkFilter.checkNetworkIsListed('Tron');
        await homeNetworkFilter.close();
      },
    );
  });
});
