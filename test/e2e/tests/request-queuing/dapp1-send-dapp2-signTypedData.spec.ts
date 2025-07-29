import FixtureBuilder from '../../fixture-builder';
import {
  withFixtures,
  DAPP_URL,
  DAPP_ONE_URL,
  WINDOW_TITLES,
} from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import SignTypedDataConfirmation from '../../page-objects/pages/confirmations/redesign/sign-typed-data-confirmation';
import ReviewPermissionsConfirmation from '../../page-objects/pages/confirmations/redesign/review-permissions-confirmation';
import { Driver } from '../../webdriver/driver';

describe('Request Queuing Dapp 1, Switch Tx -> Dapp 2 Send Tx', function () {
  it('should queue signTypedData tx after eth_sendTransaction confirmation and signTypedData confirmation should target the correct network after eth_sendTransaction is confirmed', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerTripleNode()
          .withSelectedNetworkControllerPerDomain()
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
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        // Open and connect Dapp One
        const testDappOne = new TestDapp(driver);
        await testDappOne.openTestDappPage({ url: DAPP_URL });
        await testDappOne.check_pageIsLoaded();
        await testDappOne.connectAccount({});

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Open and connect to Dapp Two
        const testDappTwo = new TestDapp(driver);
        await testDappTwo.openTestDappPage({ url: DAPP_ONE_URL });
        await testDappTwo.check_pageIsLoaded();
        await testDappTwo.connectAccount({});

        // Switch Dapp Two to Localhost 8546
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x53a' }],
        });

        // Initiate switchEthereumChain on Dapp one
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        await testDappTwo.check_networkIsConnected('0x53a');

        // Should auto switch without prompt since already approved via connect

        // Switch back to Dapp One
        await driver.switchToWindowWithUrl(DAPP_URL);

        // switch chain for Dapp One
        const switchEthereumChainRequestDappOne = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x3e8' }],
        });

        // Initiate switchEthereumChain on Dapp one
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequestDappOne})`,
        );
        await testDappOne.check_networkIsConnected('0x3e8');
        // Should auto switch without prompt since already approved via connect

        await driver.switchToWindowWithUrl(DAPP_URL);

        // eth_sendTransaction request
        await testDappOne.clickSimpleSendButton();
        await driver.waitUntilXWindowHandles(4);

        await driver.switchToWindowWithUrl(DAPP_ONE_URL);

        // signTypedData request
        await testDappTwo.clickSignTypedData();

        await driver.waitUntilXWindowHandles(4);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Check correct network on the send confirmation.
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.check_networkIsDisplayed(
          'Localhost 7777',
        );

        await transactionConfirmation.clickFooterConfirmButton();

        await driver.waitUntilXWindowHandles(4);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Check correct network on the signTypedData confirmation.
        const reviewPermissionsConfirmation = new ReviewPermissionsConfirmation(
          driver,
        );
        await reviewPermissionsConfirmation.check_networkIsDisplayed(
          'Localhost 8546',
        );

        const signTypedDataConfirmation = new SignTypedDataConfirmation(driver);
        await signTypedDataConfirmation.clickFooterCancelButton();
      },
    );
  });
});
