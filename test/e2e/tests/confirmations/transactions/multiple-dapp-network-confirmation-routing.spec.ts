import { By } from 'selenium-webdriver';

import FixtureBuilder from '../../../fixture-builder';
import {
  DAPP_ONE_URL,
  DAPP_URL,
  largeDelayMs,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../../../helpers';

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
          await openDapp(driver, undefined, DAPP_URL);

          // Connect to dapp 1
          await driver.findClickableElement({ text: 'Connect', tag: 'button' });
          await driver.clickElement('#connectButton');

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          await driver.clickElement({
            text: 'Connect',
            tag: 'button',
          });

          await driver.switchToWindowWithUrl(DAPP_URL);

          const switchEthereumChainRequest = JSON.stringify({
            jsonrpc: '2.0',
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x53a' }],
          });

          // Ensure Dapp One is on Localhost 8546
          await driver.executeScript(
            `window.ethereum.request(${switchEthereumChainRequest})`,
          );

          // Should auto switch without prompt since already approved via connect

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          // Wait for the first dapp's connect confirmation to disappear
          await driver.waitUntilXWindowHandles(2);

          // Open Dapp Two
          await openDapp(driver, undefined, DAPP_ONE_URL);

          // Connect to dapp 2
          await driver.findClickableElement({ text: 'Connect', tag: 'button' });
          await driver.clickElement('#connectButton');

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          await driver.clickElement({
            text: 'Connect',
            tag: 'button',
          });

          // Dapp 1 send 2 tx
          await driver.switchToWindowWithUrl(DAPP_URL);
          await driver.findElement({
            css: '[id="chainId"]',
            text: '0x53a',
          });
          await driver.clickElement('#sendButton');
          await driver.clickElement('#sendButton');

          await driver.waitUntilXWindowHandles(4);

          // Dapp 2 send 2 tx
          await driver.switchToWindowWithUrl(DAPP_ONE_URL);
          await driver.findElement({
            css: '[id="chainId"]',
            text: '0x53a',
          });
          await driver.clickElement('#sendButton');
          await driver.clickElement('#sendButton');
          // We cannot wait for the dialog, since it is already opened from before
          await driver.delay(largeDelayMs);

          // Dapp 1 send 1 tx
          await driver.switchToWindowWithUrl(DAPP_URL);
          await driver.findElement({
            css: '[id="chainId"]',
            text: '0x53a',
          });
          await driver.clickElement('#sendButton');
          // We cannot switch directly, as the dialog is sometimes closed and re-opened
          await driver.delay(largeDelayMs);
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

          await driver.findElement({
            css: 'p',
            text: 'Localhost 8546',
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
