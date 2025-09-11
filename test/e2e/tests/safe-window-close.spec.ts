import { strict as assert } from 'assert';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { Driver, PAGES } from '../webdriver/driver';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import TestDapp from '../page-objects/pages/test-dapp';

describe('Notification window closing', function () {
  it('closes the window when running in a popup', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test?.title,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        // wallet_requestPermissions
        const requestPermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_requestPermissions',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          params: [{ eth_accounts: {} }],
        });
        await driver.executeScript(
          `window.ethereum.request(${requestPermissionsRequest})`,
        );

        // confirm connect account
        await testDapp.confirmConnectAccountModal();
      },
    );
  });

  it('does not close the window when running in a tab', async function () {
    await withFixtures(
      {
        // Use your regular extension fixtures
        fixtures: new FixtureBuilder().withMetaMetricsController().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        // Ensure the window does not close
        // 1. Get the current window handle
        const currentHandle = await driver.driver.getWindowHandle();

        // Navigate to notification page in a tab.
        await driver.navigate(PAGES.NOTIFICATION);

        // 2. Verify the window still exists by checking handles
        const windowHandles = await driver.getAllWindowHandles();
        assert.ok(
          windowHandles.includes(currentHandle),
          'Window closed unexpectedly',
        );
      },
    );
  });
});
