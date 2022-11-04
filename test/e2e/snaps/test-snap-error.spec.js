const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
const { PAGES } = require('../webdriver/driver');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Error', function () {
  it('can pop up a snap error and see the error', async function () {
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
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToSnapDapp()
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();

        // enter pw into extension
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // navigate to test snaps page and connect
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);
        await driver.fill('#snapId2', 'npm:@metamask/test-snap-error');

        const snapButton = await driver.findElement('#connectError');
        await driver.scrollToElement(snapButton);
        await driver.delay(500);

        await driver.clickElement('#connectError');

        // approve install of snap
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Approve & install',
          tag: 'button',
        });

        // click send inputs on test snap page
        await driver.waitUntilXWindowHandles(1, 5000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);
        await driver.delay(1000);
        await driver.clickElement('#sendError');

        await driver.navigate(PAGES.HOME);

        const error = await driver.findElement(
          '.home-notification__content-container',
        );
        const text = await error.getText();
        assert.equal(
          text.includes(
            "Snap Error: 'random error inside'. Error Code: '-32603'",
          ),
          true,
        );
      },
    );
  });
});
