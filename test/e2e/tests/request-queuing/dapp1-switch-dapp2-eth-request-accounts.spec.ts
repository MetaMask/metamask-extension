import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, DAPP_ONE_URL, WINDOW_TITLES } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/redesign/connect-account-confirmation';

describe('Request Queuing Dapp 1 Send Tx -> Dapp 2 Request Accounts Tx', function (this: Suite) {
  it('should queue `eth_requestAccounts` requests when the requesting dapp does not already have connected accounts', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port,
              chainId,
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        // Open Dapp One
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        // Dapp Send Button
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.check_pageIsLoaded();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Leave the confirmation pending
        const secondTestDapp = new TestDapp(driver);
        await secondTestDapp.openTestDappPage({ url: DAPP_ONE_URL });
        await secondTestDapp.check_pageIsLoaded();

        // Verify the account is not connected initially
        await secondTestDapp.check_connectedAccounts(
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          false,
        );

        await secondTestDapp.clickConnectAccountButton();

        // Verify account is still not connected before confirmation
        await secondTestDapp.check_connectedAccounts(
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          false,
        );

        // Reject the pending confirmation from the first dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await transactionConfirmation.clickFooterCancelButton();

        // Wait for switch confirmation to close then request accounts confirmation to show for the second dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.check_pageIsLoaded();
        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithUrl(DAPP_ONE_URL);

        await secondTestDapp.check_connectedAccounts(
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        );
      },
    );
  });

  it('should not queue the `eth_requestAccounts` requests when the requesting dapp already has connected accounts', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .withPermissionControllerConnectedToTwoTestDapps()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port,
              chainId,
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        // Open Dapp One
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        // Dapp Send Button
        await testDapp.clickSimpleSendButton();

        // Leave the confirmation pending
        const secondTestDapp = new TestDapp(driver);
        await secondTestDapp.openTestDappPage({ url: DAPP_ONE_URL });
        await secondTestDapp.check_pageIsLoaded();

        const ethRequestAccounts = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_requestAccounts',
        });

        const accounts = await driver.executeScript(
          `return window.ethereum.request(${ethRequestAccounts})`,
        );

        assert.deepStrictEqual(accounts, [
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        ]);
      },
    );
  });
});
