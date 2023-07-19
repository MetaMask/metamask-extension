const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL } = require('./enums');

describe('Test Snap Account', function () {
  it('can create a new snap account', async function () {
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

        // navigate to test snaps page and connect
        await driver.openNewPage(TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL);
        await driver.delay(1000);
        const connectButton = await driver.findElement('#connectButton');
        await driver.scrollToElement(connectButton);
        await driver.delay(1000);
        await driver.clickElement('#connectButton');
        await driver.delay(500);

        // switch to metamask extension and click connect
        const windowHandles = await driver.waitUntilXWindowHandles(
          3,
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

        try {
          await driver.clickElement('[data-testid="snap-install-scroll"]');
        } catch (_) {
          console.log('Missing scroll');
        }

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

        await driver.switchToWindowWithTitle(
          'SSK - Snap Simple Keyring',
          windowHandles,
        );

        // check the dapp connection status
        await driver.waitForSelector({
          css: '#snapConnected',
          text: 'Connected',
        });

        // create new account on dapp
        await driver.clickElement({
          text: 'Create Account',
          tag: 'div',
        });

        // create name for account
        await driver.fill("[placeholder='Name']", 'snap account');

        await driver.clickElement({
          text: 'Execute',
          tag: 'button',
        });

        await driver.delay(1000);

        // switch to metamask extension
        await driver.switchToWindowWithTitle('MetaMask', windowHandles);

        // click on accounts
        await driver.clickElement('[data-testid="account-menu-icon"]');

        const label = await driver.findElement('.mm-tag');
        assert.strictEqual(await label.getText(), 'Snaps');
      },
    );
  });
});
