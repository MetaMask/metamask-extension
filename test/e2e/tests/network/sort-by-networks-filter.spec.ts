import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { NETWORK_CLIENT_ID } from '../../constants';
import { login } from '../../page-objects/flows/login.flow';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';

describe('Sort By Networks Filter', function (this: Suite) {
  it('should display the selected network name when only Ethereum is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({
            eip155: { '0x1': true },
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const networkFilter = new NetworkFilter(driver);

        await networkFilter.checkIsLoaded();
        await networkFilter.waitUntilLabelIs('Network: Ethereum');
      },
    );
  });
});
