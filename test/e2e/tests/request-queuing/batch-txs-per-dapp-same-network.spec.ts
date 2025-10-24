import FixtureBuilder from '../../fixture-builder';
import {
  withFixtures,
  DAPP_URL,
  DAPP_ONE_URL,
  WINDOW_TITLES,
  largeDelayMs,
} from '../../helpers';
import TestDapp from '../../page-objects/pages/test-dapp';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Request Queuing for Multiple Dapps and Txs on same networks', function () {
  it('should put confirmation txs for different dapps on same networks in same queue', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerTripleNode()
          .build(),
        dappOptions: { numberOfDapps: 3 },
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
          {
            type: 'anvil',
            options: {
              port: 7777,
              chainId: 1000,
            },
          },
        ],
        title: this.test?.fullTitle(),
      },

      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Open Dapp One
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // Connect to dapp 1
        await testDapp.connectAccount({});
        await driver.switchToWindowWithUrl(DAPP_URL);
        await testDapp.checkPageIsLoaded();

        let switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x3e8' }],
        });

        // Ensure Dapp One is on Localhost 7777
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Should auto switch without prompt since already approved via connect

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Wait for the first dapp's connect confirmation to disappear
        await driver.waitUntilXWindowHandles(2);

        // TODO: Request Queuing bug when opening both dapps at the same time will have them stuck on the same network, with will be incorrect for one of them.
        // Open Dapp Two
        const testDappTwo = new TestDapp(driver);
        await testDappTwo.openTestDappPage({ url: DAPP_ONE_URL });
        await testDappTwo.checkPageIsLoaded();

        // Connect to dapp 2
        await testDappTwo.connectAccount({});
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);

        switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x53a' }],
        });

        // Ensure Dapp Two is on Localhost 8545
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Should auto switch without prompt since already approved via connect

        // Dapp one send two tx
        await driver.switchToWindowWithUrl(DAPP_URL);
        await testDapp.checkPageIsLoaded();
        await testDapp.clickSimpleSendButton();
        await testDapp.clickSimpleSendButton();
        await driver.delay(largeDelayMs);

        // Dapp two send two tx
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await testDappTwo.checkPageIsLoaded();
        await testDappTwo.clickSimpleSendButton();
        await testDappTwo.clickSimpleSendButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.checkPageNumbers(1, 4);

        // Check correct network on confirm tx.
        await transactionConfirmation.checkNetworkIsDisplayed('Localhost 7777');

        await transactionConfirmation.clickNextPage();
        await transactionConfirmation.checkPageNumbers(2, 4);
        await transactionConfirmation.clickNextPage();
        await transactionConfirmation.checkPageNumbers(3, 4);

        // Check correct network on confirm tx.
        await transactionConfirmation.checkNetworkIsDisplayed('Localhost 8546');

        // Reject All Transactions
        await transactionConfirmation.clickRejectAll();
      },
    );
  });
});
