import { Suite } from 'mocha';
import { withFixtures, logInWithBalanceValidation } from '../../helpers';
import { Ganache } from '../../seeder/ganache';
import GanacheContractAddressRegistry from '../../seeder/ganache-contract-address-registry';
import { Driver } from '../../webdriver/driver';
import { BridgePage, getBridgeFixtures } from './bridge-test-utils';

describe('Click bridge button from asset page @no-mmi', function (this: Suite) {
  it('loads portfolio tab from account overview when flag is turned off', async function () {
    await withFixtures(
      // withErc20 param is false, as we test it manually below
      getBridgeFixtures(this.test?.fullTitle(), undefined, false),
      async ({
        driver,
        ganacheServer,
        contractRegistry,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
        contractRegistry: GanacheContractAddressRegistry;
      }) => {
        const bridgePage = new BridgePage(driver);
        await logInWithBalanceValidation(driver, ganacheServer);

        // ETH
        await bridgePage.loadAssetPage(contractRegistry);
        await bridgePage.load('coin-overview');
        await bridgePage.verifyPortfolioTab(
          'https://portfolio.metamask.io/bridge?metametricsId=null',
          4,
        );
      },
    );
  });

  it('loads portfolio tab from TST overview when flag is turned off', async function () {
    await withFixtures(
      // withErc20 param is false, as we test it manually below
      getBridgeFixtures(this.test?.fullTitle(), undefined, false),
      async ({
        driver,
        ganacheServer,
        contractRegistry,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
        contractRegistry: GanacheContractAddressRegistry;
      }) => {
        const bridgePage = new BridgePage(driver);
        await logInWithBalanceValidation(driver, ganacheServer);

        // TST
        await bridgePage.loadAssetPage(contractRegistry, 'TST');
        await bridgePage.load('token-overview');
        await bridgePage.verifyPortfolioTab(
          'https://portfolio.metamask.io/bridge?metametricsId=null',
          4,
        );
      },
    );
  });

  it('loads placeholder swap route from account overview when flag is turned on', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        { 'extension-support': true },
        false,
      ),
      async ({
        driver,
        ganacheServer,
        contractRegistry,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
        contractRegistry: GanacheContractAddressRegistry;
      }) => {
        const bridgePage = new BridgePage(driver);
        await logInWithBalanceValidation(driver, ganacheServer);

        // ETH
        await bridgePage.loadAssetPage(contractRegistry);
        await bridgePage.load('coin-overview');
        await bridgePage.verifySwapPage();
      },
    );
  });

  it('loads placeholder swap route from TST overview when flag is turned on', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        { 'extension-support': true },
        false,
      ),
      async ({
        driver,
        ganacheServer,
        contractRegistry,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
        contractRegistry: GanacheContractAddressRegistry;
      }) => {
        const bridgePage = new BridgePage(driver);
        await logInWithBalanceValidation(driver, ganacheServer);

        // TST
        await bridgePage.loadAssetPage(contractRegistry, 'TST');
        await bridgePage.load('token-overview');
        await bridgePage.verifySwapPage();
      },
    );
  });
});
