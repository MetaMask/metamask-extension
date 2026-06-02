import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import NetworkManager from '../../page-objects/pages/network-manager';
import { TRON_CHAIN_ID, mockTronFeatureFlags } from './mocks/common-tron';

const TRON_NILE_NAME = 'Tron Nile Testnet';
const TRON_SHASTA_NAME = 'Tron Shasta Testnet';

async function mockTronFlagsOnly(mockServer: Mockttp) {
  return [await mockTronFeatureFlags(mockServer)];
}

describe('Tron network presence', function (this: Suite) {
  this.timeout(120_000);

  async function checkTronInTabFilter(
    driver: Driver,
    navigateToTab: (home: HomePage) => Promise<void>,
  ): Promise<void> {
    const home = new HomePage(driver);
    await navigateToTab(home);
    const networkManager = new NetworkManager(driver);
    await networkManager.openNetworkManager();
    await networkManager.selectTab('Popular');
    await networkManager.checkNetworkIsListed('Tron');
    await networkManager.closeNetworkManager();
  }

  const TAB_CASES: {
    name: string;
    navigate: (home: HomePage) => Promise<void>;
  }[] = [
    { name: 'Tokens', navigate: (home) => home.goToTokensTab() },
    { name: 'DeFi', navigate: (home) => home.goToDeFiTab() },
    { name: 'NFTs', navigate: (home) => home.goToNftTab() },
    { name: 'Activity', navigate: (home) => home.goToActivityList() },
  ];

  it('shows Tron on the Manage Networks popup', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          // Anvil is needed because the extension still polls EVM networks in
          // Tron-only flows.
          'anvil',
        ],
        testSpecificMock: mockTronFlagsOnly,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.checkNetworkIsListed('Tron');
      },
    );
  });

  it("shows 'Discover' on Tron's context menu", async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronFlagsOnly,
        localNodeOptions: [
          // Anvil is needed because the extension still polls EVM networks in
          // Tron-only flows.
          'anvil',
        ],
        manifestFlags: {
          remoteFeatureFlags: {
            neNetworkDiscoverButton: {
              [TRON_CHAIN_ID]: true,
            },
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.checkContextMenuHasOption(
          TRON_CHAIN_ID,
          'Discover',
        );
      },
    );
  });

  // Tron testnets (Nile, Shasta) are not fully supported end-to-end in
  // MetaMask: the new Network Manager modal does not expose the legacy
  // "Show test networks" toggle (`network-menu-show-test-networks`), so the
  // `toggleShowTestNetworks()` helper has nothing to click. Until testnet
  // support is wired through the Network Manager surface, these tests stay
  // skipped — do not unskip without first verifying the toggle exists.
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('shows Tron Nile when test networks are enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          // Anvil is needed because the extension still polls EVM networks in
          // Tron-only flows.
          'anvil',
        ],
        testSpecificMock: mockTronFlagsOnly,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.toggleShowTestNetworks();
        await networkManager.checkNetworkIsListed(TRON_NILE_NAME);
      },
    );
  });

  // See note above: Tron testnets are not fully supported and the new Network
  // Manager modal doesn't ship the test-network toggle.
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('shows Tron Shasta when test networks are enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          // Anvil is needed because the extension still polls EVM networks in
          // Tron-only flows.
          'anvil',
        ],
        testSpecificMock: mockTronFlagsOnly,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.toggleShowTestNetworks();
        await networkManager.checkNetworkIsListed(TRON_SHASTA_NAME);
      },
    );
  });

  for (const { name, navigate } of TAB_CASES) {
    it(`shows Tron in the ${name} tab network selector`, async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          localNodeOptions: [
            // Anvil is needed because the extension still polls EVM networks in
            // Tron-only flows.
            'anvil',
          ],
          testSpecificMock: mockTronFlagsOnly,
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);
          await checkTronInTabFilter(driver, navigate);
        },
      );
    });
  }
});
