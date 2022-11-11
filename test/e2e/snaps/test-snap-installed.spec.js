const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Installed', function () {
  it('can tell if a snap is installed', async function () {
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
        fixtures: 'imported-account',
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
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
        await driver.delay(500);
        const confirmButton = await driver.findElement('#connectConfirmSnap');
        await driver.scrollToElement(confirmButton);
        await driver.clickElement('#connectConfirmSnap');

        // switch to metamask extension and click connect
        await driver.waitUntilXWindowHandles(3, 3000, 10000);
        let windowHandles = await driver.getAllWindowHandles();
        const extensionPage = windowHandles[0];
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement(
          {
            text: 'Connect',
            tag: 'button',
          },
          10000,
        );

        await driver.delay(2000);

        // approve install of snap
        await driver.waitUntilXWindowHandles(3, 3000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Approve & install',
          tag: 'button',
        });

        // click send inputs on test snap page
        await driver.waitUntilXWindowHandles(2, 3000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        const errorButton = await driver.findElement('#connectErrorSnap');
        await driver.scrollToElement(errorButton);
        await driver.delay(1000);
        await driver.clickElement('#connectErrorSnap');

        // switch to metamask extension and click connect
        await driver.waitUntilXWindowHandles(3, 3000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement(
          {
            text: 'Connect',
            tag: 'button',
          },
          10000,
        );

        await driver.delay(2000);

        // approve install of snap
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Approve & install',
          tag: 'button',
        });

        await driver.waitUntilXWindowHandles(2, 5000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        const result = await driver.findElement('#installedSnapsResult');
        await driver.scrollToElement(result);
        await driver.delay(1000);
        assert.equal(
          await result.getText(),
          // use this for live tests
          'npm:@metamask/test-snap-confirm, npm:@metamask/test-snap-error',
          // 'local:http://localhost:8001, local:http://localhost:8002',
        );
      },
    );
  });
});
