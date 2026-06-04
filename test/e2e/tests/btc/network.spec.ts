import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NetworkManager from '../../page-objects/pages/network-manager';

describe('Bitcoin network presence', function (this: Suite) {
  this.timeout(120_000);

  it('shows Bitcoin on the Manage Networks popup', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.checkNetworkIsListed('Bitcoin');
      },
    );
  });
});
