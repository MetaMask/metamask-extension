import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import { Driver } from '../../webdriver/driver';

// Network configuration type
type NetworkConfig = {
  name: string;
  tokenSymbol: string;
  fixtureMethod: (builder: FixtureBuilder) => FixtureBuilder;
  testTitle: string;
};

// Network configurations
const networkConfigs: NetworkConfig[] = [
  {
    name: 'Monad Testnet',
    tokenSymbol: 'MON',
    fixtureMethod: (builder) => builder.withNetworkControllerOnMonad(),
    testTitle: 'Monad Network Connection Tests',
  },
  {
    name: 'Mega Testnet',
    tokenSymbol: 'ETH',
    fixtureMethod: (builder) => builder.withNetworkControllerOnMegaETH(),
    testTitle: 'MegaETH Network Connection Tests',
  },
];

// Helper function to verify network display
const verifyNetworkDisplay = async (driver: Driver, networkName: string) => {
  await driver.waitForSelector({
    css: 'p',
    text: networkName,
  });
};

// Helper function to perform Dapp action and verify
const performDappActionAndVerify = async (
  driver: Driver,
  action: () => Promise<void>,
  verify: (driver: Driver) => Promise<void>,
) => {
  await action();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await verify(driver);
};

// Generate test cases for each network
networkConfigs.forEach((config) => {
  describe(config.testTitle, function (this: Suite) {
    it(`should connect dapp to ${config.name} and verify ${config.tokenSymbol} network and tokens`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: config
            .fixtureMethod(new FixtureBuilder())
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          // Verify network is selected
          await driver.waitForSelector({
            css: 'p',
            text: config.name,
          });

          // Verify token is displayed
          await driver.waitForSelector({
            css: 'span',
            text: config.tokenSymbol,
          });
          await driver.waitForSelector({
            css: '[data-testid="multichain-token-list-item-token-name"]',
            text: config.tokenSymbol,
          });

          // Open the test dapp and verify balance
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.check_pageIsLoaded();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          // Verify dapp can access the account
          await testDapp.check_getAccountsResult(
            '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          );

          // Test various Dapp functionalities
          await performDappActionAndVerify(
            driver,
            () => testDapp.clickSimpleSendButton(),
            (d) => verifyNetworkDisplay(d, config.name),
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.findAndClickCreateToken(),
            (d) => verifyNetworkDisplay(d, config.name),
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickERC721DeployButton(),
            (d) => verifyNetworkDisplay(d, config.name),
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickPersonalSign(),
            (d) => verifyNetworkDisplay(d, config.name),
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickSignTypedData(),
            (d) => verifyNetworkDisplay(d, config.name),
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickSignTypedDatav4(),
            (d) => verifyNetworkDisplay(d, config.name),
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        },
      );
    });
  });
});
