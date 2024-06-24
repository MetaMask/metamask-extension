import { Suite } from 'mocha';
import { withFixtures, logInWithBalanceValidation } from '../../helpers';
import { Ganache } from '../../seeder/ganache';
import { Driver } from '../../webdriver/driver';
import { BridgePage, getBridgeFixtures } from './bridge-test-utils';

describe('Click bridge button from wallet overview @no-mmi', function (this: Suite) {
  it('loads portfolio tab when flag is turned off', async function () {
    await withFixtures(
      getBridgeFixtures(this.test?.fullTitle()),
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
      }) => {
        const bridgePage = new BridgePage(driver);
        await logInWithBalanceValidation(driver, ganacheServer);
        await bridgePage.load();
        await bridgePage.verifyPortfolioTab(
          'https://portfolio.metamask.io/bridge?metametricsId=null',
        );
      },
    );
  });

  it('loads placeholder swap route when flag is turned on', async function () {
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
        await bridgePage.load();
        await bridgePage.verifySwapPage();
      },
    );
  });
});
