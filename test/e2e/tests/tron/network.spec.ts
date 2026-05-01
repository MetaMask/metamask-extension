import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NetworkManager from '../../page-objects/pages/network-manager';
import { mockTronFeatureFlags } from './mocks/common-tron';

const TRON_CAIP_CHAIN_ID = 'tron:728126428';
const TRON_NILE_NAME = 'Tron Nile Testnet';
const TRON_SHASTA_NAME = 'Tron Shasta Testnet';

async function mockTronFlagsOnly(mockServer: Mockttp) {
  return [await mockTronFeatureFlags(mockServer)];
}

describe('Tron network presence', function (this: Suite) {
  this.timeout(120_000);

  it('shows Tron on the Manage Networks popup', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
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
        manifestFlags: {
          remoteFeatureFlags: {
            neNetworkDiscoverButton: {
              [TRON_CAIP_CHAIN_ID]: true,
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
          TRON_CAIP_CHAIN_ID,
          'Discover',
        );
      },
    );
  });

  it.skip('shows Tron Nile when test networks are enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
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

  it.skip('shows Tron Shasta when test networks are enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
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
});
