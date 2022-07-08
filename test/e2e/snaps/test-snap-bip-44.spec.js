const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap bip-44', function () {
  it('can pop up bip-44 snap and get private key result', async function () {
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
        title: this.test.title,
        driverOptions: {
          type: 'flask',
        },
      },
      async ({ driver }) => {
        await driver.navigate();

        // enter pw into extension
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // navigate to test snaps page and connect
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);
        await driver.delay(1000);
        await driver.fill('#snapId3', 'npm:@metamask/test-snap-bip44');

        // reveal snapId3 by finding and scrolling to #snapId4
        const snapButton = await driver.findElement('#snapId4');
        await driver.scrollToElement(snapButton);
        await driver.delay(500);

        // connect the snap
        await driver.clickElement('#connectBip44');

        // switch to metamask extension and click connect
        await driver.waitUntilXWindowHandles(2, 5000, 10000);
        let windowHandles = await driver.getAllWindowHandles();
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
        await driver.waitUntilXWindowHandles(2, 5000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Approve & Install',
          tag: 'button',
        });
        // deal with permissions popover
        await driver.delay(1000);
        await driver.press('#warning-accept', driver.Key.SPACE);
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // click send inputs on test snap page
        await driver.waitUntilXWindowHandles(1, 5000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);
        await driver.clickElement('#sendBip44');

        // check the results of the public key test
        await driver.delay(2000);
        const bip44Result = await driver.findElement('#bip44Result');
        assert.equal(
          await bip44Result.getText(),
          'Public key: "0x86debb44fb3a984d93f326131d4c1db0bc39644f1a67b673b3ab45941a1cea6a385981755185ac4594b6521e4d1e8d1"',
        );
      },
    );
  });
});
