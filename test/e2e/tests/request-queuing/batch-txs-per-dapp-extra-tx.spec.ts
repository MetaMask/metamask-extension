import { Suite } from 'mocha';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
import FixtureBuilder from '../../fixture-builder';
import {
  DAPP_ONE_URL,
  DAPP_URL,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/redesign/connect-account-confirmation';

describe('Request Queuing for Multiple Dapps and Txs on different networks', function (this: Suite) {
  it('should put txs from different dapps on different networks adds extra tx after in same queue.', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
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
        const firstTestDapp = new TestDapp(driver);
        await firstTestDapp.openTestDappPage();
        await firstTestDapp.checkPageIsLoaded();

        // Connect to dapp 1
        await firstTestDapp.clickConnectAccountButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const firstConnectConfirmation = new ConnectAccountConfirmation(driver);
        await firstConnectConfirmation.checkPageIsLoaded();
        await firstConnectConfirmation.confirmConnect();

        await driver.switchToWindowWithUrl(DAPP_URL);

        // Open Dapp Two
        const secondTestDapp = new TestDapp(driver);
        await secondTestDapp.openTestDappPage({ url: DAPP_ONE_URL });
        await secondTestDapp.checkPageIsLoaded();

        // Connect to dapp 2
        await secondTestDapp.clickConnectAccountButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const secondConnectConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await secondConnectConfirmation.checkPageIsLoaded();
        await secondConnectConfirmation.confirmConnect();

        await driver.switchToWindowWithUrl(DAPP_ONE_URL);

        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x53a' }],
        });

        // Ensure Dapp One is on Localhost 8546
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Dapp 1 send 2 tx
        await driver.switchToWindowWithUrl(DAPP_URL);
        await firstTestDapp.checkNetworkIsConnected('0x539');
        await firstTestDapp.clickSimpleSendButton();
        await firstTestDapp.clickSimpleSendButton();

        await driver.waitUntilXWindowHandles(4);

        // Dapp 2 send 2 tx
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await secondTestDapp.checkNetworkIsConnected('0x53a');
        await secondTestDapp.clickSimpleSendButton();
        await secondTestDapp.clickSimpleSendButton();

        // Dapp 1 send 1 tx
        await driver.switchToWindowWithUrl(DAPP_URL);
        await firstTestDapp.checkNetworkIsConnected('0x539');
        await firstTestDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();

        // Verify we're on the first confirmation of 5
        await transactionConfirmation.checkPageNumbers(1, 5);

        // Verify we're on Localhost 8545 network
        await transactionConfirmation.checkNetworkIsDisplayed('Localhost 8545');

        // Navigate to next confirmation
        await transactionConfirmation.clickNextPage();
        await transactionConfirmation.clickNextPage();

        // Verify we're now on Localhost 8546 network
        await transactionConfirmation.checkNetworkIsDisplayed('Localhost 8546');

        // Reject All Transactions
        if (isManifestV3) {
          await transactionConfirmation.clickRejectAllButtonWithoutWaiting();
        } else {
          await transactionConfirmation.clickRejectAll();
        }

        await driver.waitUntilXWindowHandles(3);
      },
    );
  });
});
