const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  DAPP_ONE_URL,
  regularDelayMs,
  WINDOW_TITLES,
  defaultGanacheOptions,
} = require('../../helpers');

describe('Request Queuing Dapp 1 Send Tx -> Dapp 2 Request Accounts Tx', function () {
  it('should queue `eth_requestAccounts` requests when the requesting dapp does not already have connected accounts', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [
            {
              port,
              chainId,
              ganacheOptions2: defaultGanacheOptions,
            },
          ],
        },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Open Dapp One
        await openDapp(driver, undefined, DAPP_URL);

        // Dapp Send Button
        await driver.clickElement('#sendButton');
        await driver.delay(regularDelayMs);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.waitForSelector({
          text: 'Cancel',
          tag: 'button',
        });

        await driver.delay(regularDelayMs);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Leave the confirmation pending
        await openDapp(driver, undefined, DAPP_ONE_URL);

        const accountsOnload = await (
          await driver.findElement('#accounts')
        ).getText();
        assert.deepStrictEqual(accountsOnload, '');

        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.delay(regularDelayMs);

        const accountsBeforeConnect = await (
          await driver.findElement('#accounts')
        ).getText();
        assert.deepStrictEqual(accountsBeforeConnect, '');

        // Reject the pending confirmation from the first dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElement({
          text: 'Cancel',
          tag: 'button',
        });

        // Wait for switch confirmation to close then request accounts confirmation to show for the second dapp
        await driver.delay(regularDelayMs);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.switchToWindowWithUrl(DAPP_ONE_URL);

        await driver.waitForSelector({
          text: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          css: '#accounts',
        });
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
          .withNetworkControllerDoubleGanache()
          .withPermissionControllerConnectedToTwoTestDapps()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [
            {
              port,
              chainId,
              ganacheOptions2: defaultGanacheOptions,
            },
          ],
        },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Open Dapp One
        await openDapp(driver, undefined, DAPP_URL);

        // Dapp Send Button
        await driver.clickElement('#sendButton');

        // Leave the confirmation pending

        await openDapp(driver, undefined, DAPP_ONE_URL);

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
