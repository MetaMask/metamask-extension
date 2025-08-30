import { By } from 'selenium-webdriver';

import FixtureBuilder from '../../../fixture-builder';
import {
  DAPP_URL,
  DAPP_ONE_URL,
} from '../../../constants';
import {
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../../../helpers';
import TestDapp from '../../../page-objects/pages/test-dapp';
import ConnectAccountConfirmation from '../../../page-objects/pages/confirmations/redesign/connect-account-confirmation';

describe('Routing confirmstions from Multiple Dapps and different networks', function () {
  it('Confirmation requests from different DAPPS and networks should be in same queue, it is possible to navigate the queue.', async function () {
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
        if (process.env.EVM_MULTICHAIN_ENABLED === 'true') {
          await unlockWallet(driver);

          // Open Dapp One
          const testDapp1 = new TestDapp(driver);
          await testDapp1.openTestDappPage({ url: DAPP_URL });
          // Connect to dapp 1
          await testDapp1.clickConnectAccountButton();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          const connectAccountConfirmation1 = new ConnectAccountConfirmation(
            driver,
          );
          await connectAccountConfirmation1.checkPageIsLoaded();
          await connectAccountConfirmation1.confirmConnect();

          // Wait for the first dapp's connect confirmation to disappear
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.waitUntilXWindowHandles(2);

          // Connect to dapp 2
          const testDapp2 = new TestDapp(driver);
          await testDapp2.openTestDappPage({ url: DAPP_ONE_URL });
          await testDapp2.clickConnectAccountButton();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const connectAccountConfirmation2 = new ConnectAccountConfirmation(
            driver,
          );
          await connectAccountConfirmation2.checkPageIsLoaded();
          await connectAccountConfirmation2.confirmConnect();

          // Switch network on DAPP 2
          await driver.switchToWindowWithUrl(DAPP_ONE_URL);
          await testDapp2.request('wallet_switchEthereumChain', [
            { chainId: '0x53a' },
          ]);

          // Dapp 1 send 2 tx
          await driver.switchToWindowWithUrl(DAPP_URL);
          await testDapp1.clickSimpleSendButton();
          await testDapp1.clickSimpleSendButton();

          // Dapp 2 send 2 tx
          await driver.switchToWindowWithUrl(DAPP_ONE_URL);
          await testDapp2.clickSimpleSendButton();
          await testDapp2.clickSimpleSendButton();

          // Dapp 1 send 1 more tx
          await driver.switchToWindowWithUrl(DAPP_URL);
          await testDapp1.clickSimpleSendButton();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          await driver.waitForSelector(
            By.xpath("//p[normalize-space(.)='1 of 5']"),
          );

          await driver.findElement({
            css: 'p',
            text: 'Localhost 8546',
          });

          await driver.clickElement(
            '[data-testid="confirm-nav__next-confirmation"]',
          );
          await driver.clickElement(
            '[data-testid="confirm-nav__next-confirmation"]',
          );

          await driver.findElement({
            css: 'p',
            text: 'Localhost 8545',
          });

          // Reject All Transactions
          await driver.clickElementAndWaitForWindowToClose({
            text: 'Reject all',
            tag: 'button',
          });
        }
      },
    );
  });
});
