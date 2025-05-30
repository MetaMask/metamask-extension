import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import { Driver } from '../../webdriver/driver';

// Helper function to verify network display
const verifyNetworkDisplay = async (driver: Driver) => {
  await driver.waitForSelector({
    css: 'p',
    text: 'Mega Testnet',
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

describe('MegaETH Network Connection Tests', function (this: Suite) {
  it('should connect dapp to MegaETH network and verify MegaETH network and tokens', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMegaETH()
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
          text: 'Mega Testnet',
        });

        // Verify ETH is displayed
        await driver.waitForSelector({
          css: 'span',
          text: 'ETH',
        });
        await driver.waitForSelector({
          css: '[data-testid="multichain-token-list-item-token-name"]',
          text: 'ETH',
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
          verifyNetworkDisplay,
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await performDappActionAndVerify(
          driver,
          () => testDapp.findAndClickCreateToken(),
          verifyNetworkDisplay,
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await performDappActionAndVerify(
          driver,
          () => testDapp.clickERC721DeployButton(),
          verifyNetworkDisplay,
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await performDappActionAndVerify(
          driver,
          () => testDapp.clickPersonalSign(),
          verifyNetworkDisplay,
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await performDappActionAndVerify(
          driver,
          () => testDapp.clickSignTypedData(),
          verifyNetworkDisplay,
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await performDappActionAndVerify(
          driver,
          () => testDapp.clickSignTypedDatav4(),
          verifyNetworkDisplay,
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
      },
    );
  });
});