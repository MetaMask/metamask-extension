import { Suite } from 'mocha';
import { withFixtures, logInWithBalanceValidation } from '../../helpers';
import { Ganache } from '../../seeder/ganache';
import { Driver } from '../../webdriver/driver';
import { BridgePage, getBridgeFixtures } from './bridge-test-utils';

describe('Click bridge button @no-mmi', function (this: Suite) {
  it('loads placeholder swap route from wallet overview when flag is turned on', async function () {
    await withFixtures(
      getBridgeFixtures(this.test?.fullTitle(), { 'extension-support': true }),
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
      }) => {
        const bridgePage = new BridgePage(driver);
        await logInWithBalanceValidation(driver, ganacheServer);
        await bridgePage.navigateToBridgePage();
        await bridgePage.verifySwapPage(1);
      },
    );
  });
});
