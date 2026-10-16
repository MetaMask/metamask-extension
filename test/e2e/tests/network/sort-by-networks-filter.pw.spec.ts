import { test as pwTest } from '@playwright/test';
import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { E2E_DRIVER, NETWORK_CLIENT_ID } from '../../constants';
import { login } from '../../page-objects/flows/login.flow';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';

pwTest.describe('Sort By Networks Filter', () => {
  pwTest(
    'should display the selected network name when only Ethereum is enabled',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
            .withEnabledNetworks({
              eip155: { '0x1': true },
            })
            .build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);
          const networkFilter = new NetworkFilter(driver);

          await networkFilter.checkIsLoaded();
          await networkFilter.waitUntilLabelIs('Network: Ethereum');
        },
      );
    },
  );
});
