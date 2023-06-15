const { withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap RPC', function () {
  it('can use the cross-snap RPC endowment and produce a public key', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: 25000000000000000000,
        },
      ],
    };
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        failOnConsoleError: false,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();

        // enter pw into extension
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // navigate to test snaps page
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);
        await driver.delay(1000);

        // find and scroll to the bip32 test and connect
        const snapButton1 = await driver.findElement('#connectBip32');
        await driver.scrollToElement(snapButton1);
        await driver.delay(1000);
        await driver.clickElement('#connectBip32');
        await driver.delay(1000);

        // switch to metamask extension and click connect
        let windowHandles = await driver.waitUntilXWindowHandles(
          2,
          1000,
          10000,
        );
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'Install' });

        await driver.clickElement('[data-testid="snap-install-scroll"]');

        await driver.clickElement({
          text: 'Install',
          tag: 'button',
        });

        // wait for permissions popover, click checkboxes and confirm
        await driver.delay(500);
        await driver.clickElement('#key-access-bip32-m-44h-0h-secp256k1-0');
        await driver.clickElement('#key-access-bip32-m-44h-0h-ed25519-1');
        await driver.clickElement(
          '#public-key-access-bip32-m-44h-0h-secp256k1-0',
        );
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'OK' });

        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // switch back to test-snaps window
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        const snapButton2 = await driver.findElement('#connectRpcSnap');
        await driver.scrollToElement(snapButton2);
        await driver.delay(1000);
        await driver.clickElement('#connectRpcSnap');
        await driver.delay(1000);

        windowHandles = await driver.waitUntilXWindowHandles(2, 1000, 10000);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'Install' });

        await driver.clickElement({
          text: 'Install',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'OK' });

        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectRpcSnap',
          text: 'Reconnect to RPC Snap',
        });

        // click send inputs on test snap page
        const snapButton3 = await driver.findElement('#sendRpc');
        await driver.scrollToElement(snapButton3);
        await driver.delay(1000);
        await driver.clickElement('#sendRpc');

        // check result with waitForSelector
        await driver.waitForSelector({
          css: '#rpcResult',
          text: '"0x033e98d696ae15caef75fa8dd204a7c5c08d1272b2218ba3c20feeb4c691eec366"',
        });
      },
    );
  });
});
