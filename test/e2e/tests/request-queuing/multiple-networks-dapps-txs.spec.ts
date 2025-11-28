import { Suite } from 'mocha';
import { switchToNetworkFromSendFlow } from '../../page-objects/flows/network.flow';
import FixtureBuilder from '../../fixtures/fixture-builder';
import {
  withFixtures,
  DAPP_URL,
  DAPP_ONE_URL,
  WINDOW_TITLES,
} from '../../helpers';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HomePage from '../../page-objects/pages/home/homepage';
import TestDapp from '../../page-objects/pages/test-dapp';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Request Queuing for Multiple Dapps and Txs on different networks.', function (this: Suite) {
  it('should be possible to send requests from different dapps on different networks', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 2 },
        fixtures: new FixtureBuilder()
          .withEnabledNetworks({
            eip155: {
              '0x53a': true,
            },
          })
          .withNetworkControllerDoubleNode()
          .withSelectedNetworkControllerPerDomain()
          .build(),
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
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Open Dapp One
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ url: DAPP_URL });
        await testDapp.checkPageIsLoaded();

        // Connect to dapp 1
        await testDapp.connectAccount({});

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Network Selector
        await switchToNetworkFromSendFlow(driver, 'Localhost 8546');

        // TODO: Request Queuing bug when opening both dapps at the same time will have them stuck on the same network, with will be incorrect for one of them.
        // Open Dapp Two
        const testDappTwo = new TestDapp(driver);
        await testDappTwo.openTestDappPage({ url: DAPP_ONE_URL });
        await testDappTwo.checkPageIsLoaded();

        // Connect to dapp 2
        await testDappTwo.connectAccount({});

        // Dapp one send tx
        await driver.switchToWindowWithUrl(DAPP_URL);
        await testDapp.checkPageIsLoaded();
        await testDapp.clickSimpleSendButton();

        await driver.waitUntilXWindowHandles(4);

        // Dapp two send tx
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await testDappTwo.checkPageIsLoaded();
        await testDappTwo.clickSimpleSendButton();

        // First switch network
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Wait for confirm tx after switch network confirmation.
        await driver.waitUntilXWindowHandles(4);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Reject Transaction
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.clickFooterCancelButton();

        // TODO: No second confirmation from dapp two will show, have to go back to the extension to see the switch chain & dapp two's tx.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homepage = new HomePage(driver);
        await homepage.checkPageIsLoaded();
        await homepage.goToActivityList();

        // Check for unconfirmed transaction in tx list
        const activityList = new ActivityListPage(driver);
        await activityList.checkPendingTxNumberDisplayedInActivity(1);

        // Click Unconfirmed Tx
        await activityList.clickOnActivity(1);

        // Confirm Tx
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

        // Check for Confirmed Transaction
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
      },
    );
  });
});
