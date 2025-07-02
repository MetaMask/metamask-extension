import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import NetworkManager from '../../page-objects/pages/network-manager';
import AssetListPage from '../../page-objects/pages/home/asset-list';

describe('Network Manager', function (this: Suite) {
  it('should reflect the enabled networks state in the network manager', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkNetworkIsSelected('eip155:1');
        await networkManager.checkNetworkIsDeselected('eip155:59144');
      },
    );
  });

  it('should reflect the enabled networks state in the network manager, when multiple networks are enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true, '0xe708': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkNetworkIsSelected('eip155:1');
        await networkManager.checkNetworkIsSelected('eip155:59144');
      },
    );
  });

  it('should select and deselect multiple default networks', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkNetworkIsSelected('eip155:1');
        await networkManager.checkNetworkIsDeselected('eip155:59144');
        await networkManager.selectNetwork('eip155:59144');
        await driver.delay(12000);
        await networkManager.checkNetworkIsSelected('eip155:59144');
        await networkManager.checkNetworkIsSelected('eip155:1');
        await networkManager.deselectNetwork('eip155:1');
        await driver.delay(12000);
        await networkManager.checkNetworkIsSelected('eip155:59144');
        await networkManager.checkNetworkIsDeselected('eip155:1');
      },
    );
  });

  it('should default to custom tab when custom network is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkTabIsSelected('Custom');
      },
    );
  });

  it('should default to default tab when default network is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkTabIsSelected('Default');
      },
    );
  });

  it('should filter tokens by enabled networks', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true, '0xe708': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        const networkManager = new NetworkManager(driver);

        await assetListPage.check_tokenItemNumber(2);

        await networkManager.openNetworkManager();
        await networkManager.checkTabIsSelected('Default');
        await networkManager.deselectNetwork('eip155:59144');

        await assetListPage.check_tokenItemNumber(1);

        await networkManager.selectNetwork('eip155:8453');

        await assetListPage.check_tokenItemNumber(2);

        await networkManager.selectNetwork('eip155:59144');

        await assetListPage.check_tokenItemNumber(3);
      },
    );
  });
});
