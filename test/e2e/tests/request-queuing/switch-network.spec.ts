import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { switchToNetworkFlow } from '../../page-objects/flows/network.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';

describe('Request Queuing - Extension and Dapp on different networks.', function () {
  it('should not switch to the dapps network automatically when mm network differs', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .withPermissionControllerConnectedToTestDapp()
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
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        // Open dapp
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Switch to second network
        await switchToNetworkFlow(driver, 'Localhost 8546');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Queue confirm tx should first auto switch network
        await testDapp.clickSimpleSendButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Confirm transaction
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.check_pageIsLoaded();
        await transactionConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

        // Switch back to the extension
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Check correct network switched and on the correct network
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.headerNavbar.check_currentSelectedNetwork(
          'Localhost 8546',
        );
      },
    );
  });
});
