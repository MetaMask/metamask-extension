import { Suite } from 'mocha';
import { withFixtures, logInWithBalanceValidation } from '../../helpers';
import { Ganache } from '../../seeder/ganache';
import GanacheContractAddressRegistry from '../../seeder/ganache-contract-address-registry';
import { Driver } from '../../webdriver/driver';
import { BridgePage, getBridgeFixtures, mockServer } from './bridge-test-utils';

describe('Click bridge button from asset page @no-mmi', function (this: Suite) {
  it('loads portfolio tab when flag is turned off', async function () {
    await withFixtures(
      // withErc20 param is false, as we test it manually below
      getBridgeFixtures(this.test?.fullTitle(), mockServer(), false),
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
        );

        // await bridgePage.reloadHome();

        // // TST
        // await bridgePage.loadAssetPage(contractRegistry, 'TST');
        // await bridgePage.load('token-overview');
        // await bridgePage.verifyPortfolioTab(
        //   'https://portfolio.metamask.io/bridge?metametricsId=null',
        // );
      },
    );
  });
  it('loads portfolio tab when flag is turned off - TST', async function () {
    await withFixtures(
      // withErc20 param is false, as we test it manually below
      getBridgeFixtures(this.test?.fullTitle(), mockServer(), false),
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

        // // ETH
        // await bridgePage.loadAssetPage(contractRegistry);
        // await bridgePage.load('coin-overview');
        // await bridgePage.verifyPortfolioTab(
        //   'https://portfolio.metamask.io/bridge?metametricsId=null',
        // );

        // // await bridgePage.reloadHome();

        // TST
        await bridgePage.loadAssetPage(contractRegistry, 'TST');
        await bridgePage.load('token-overview');
        await bridgePage.verifyPortfolioTab(
          'https://portfolio.metamask.io/bridge?metametricsId=null',
        );
      },
    );
  });

  it('loads placeholder swap route when flag is turned on', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        mockServer({ 'extension-support': true }),
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

        // await bridgePage.reloadHome(false);

        // // TST
        // await bridgePage.loadAssetPage(contractRegistry, 'TST');
        // await bridgePage.load('token-overview');
        // await bridgePage.verifySwapPage();
      },
    );
  });
  it('loads placeholder swap route when flag is turned on - TST', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        mockServer({ 'extension-support': true }),
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
        // await bridgePage.loadAssetPage(contractRegistry);
        // await bridgePage.load('coin-overview');
        // await bridgePage.verifySwapPage();

        // await bridgePage.reloadHome(false);

        // TST
        await bridgePage.loadAssetPage(contractRegistry, 'TST');
        await bridgePage.load('token-overview');
        await bridgePage.verifySwapPage();
      },
    );
  });
});
