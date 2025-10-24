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
import { switchToNetworkFromSendFlow } from '../../page-objects/flows/network.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Request Queuing for Multiple Dapps and Txs on different networks', function () {
  it('should put confirmation txs for different dapps on different networks in single queue', async function () {
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

      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Open Dapp One
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
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
        await driver.delay(largeDelayMs);
        await testDapp.checkPageIsLoaded();
        await testDapp.clickSimpleSendButton();
        await testDapp.clickSimpleSendButton();
        await driver.delay(largeDelayMs);

        // Dapp two send tx
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await driver.delay(largeDelayMs);
        await testDappTwo.checkPageIsLoaded();
        await testDappTwo.clickSimpleSendButton();
        await testDappTwo.clickSimpleSendButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.checkPageNumbers(1, 4);
        await transactionConfirmation.checkNetworkIsDisplayed('Localhost 8545');

        await transactionConfirmation.clickNextPage();
        await transactionConfirmation.checkPageNumbers(2, 4);
        await transactionConfirmation.clickNextPage();
        await transactionConfirmation.checkPageNumbers(3, 4);
        await transactionConfirmation.checkNetworkIsDisplayed('Localhost 8546');
        await transactionConfirmation.clickRejectAll();
      },
    );
  });
});
