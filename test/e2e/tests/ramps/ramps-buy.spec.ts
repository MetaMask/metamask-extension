import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import {
  completeRampsCheckoutInProviderTab,
  startRampsBuyFromHome,
} from '../../page-objects/flows/ramps-buy.flow';
import {
  buildRampsFixture,
  mockRampsContract,
  RAMPS_PROVIDER_NAME,
} from './ramps-fixtures';

describe('Ramps Buy', function (this: Suite) {
  this.timeout(180_000);

  it('buys ETH through the captured ramps contract', async function () {
    await withFixtures(
      {
        fixtures: buildRampsFixture(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            rampsEnabled: true,
          },
        },
        testSpecificMock: mockRampsContract,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          validateBalance: false,
          waitForNonEvmAccounts: false,
        });
        await startRampsBuyFromHome(driver, '100');
        await completeRampsCheckoutInProviderTab(driver, RAMPS_PROVIDER_NAME);
      },
    );
  });
});
