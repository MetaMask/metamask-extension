const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap manageState', function () {
  it('can pop up manageState snap and do update get and clear', async function () {
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

        // navigate to test snaps page, then fill in the snapId
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);
        await driver.delay(1000);

        // find and scroll to the connect button and click it
        const snapButton1 = await driver.findElement('#connectManageState');
        await driver.scrollToElement(snapButton1);
        await driver.delay(1000);
        await driver.clickElement('#connectManageState');
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
        await driver.delay(2000);

        // approve install of snap
        windowHandles = await driver.waitUntilXWindowHandles(2, 1000, 10000);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Approve & install',
          tag: 'button',
        });

        // delay for npm installation
        await driver.delay(2000);

        // fill and click send inputs on test snap page
        windowHandles = await driver.waitUntilXWindowHandles(1, 1000, 10000);
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);
        await driver.delay(1000);
        await driver.fill('#dataManageState', '23');
        const snapButton2 = await driver.findElement(
          '#retrieveManageStateResult',
        );
        await driver.scrollToElement(snapButton2);
        await driver.delay(1000);
        await driver.clickElement('#sendManageState');

        // check the results of the public key test
        await driver.delay(1000);
        const manageStateResult = await driver.findElement(
          '#sendManageStateResult',
        );
        assert.equal(await manageStateResult.getText(), 'true');

        // check the results
        await driver.delay(1000);
        const retrieveManageStateResult = await driver.findElement(
          '#retrieveManageStateResult',
        );
        assert.equal(
          await retrieveManageStateResult.getText(),
          '{ "testState": [ "23" ] }',
        );

        // click clear results
        await driver.clickElement('#clearManageState');

        // check if true
        await driver.delay(1000);
        const clearManageStateResult = await driver.findElement(
          '#clearManageStateResult',
        );
        assert.equal(await clearManageStateResult.getText(), 'true');

        // check result array is empty
        await driver.delay(1000);
        const retrieveManageStateResult2 = await driver.findElement(
          '#retrieveManageStateResult',
        );
        assert.equal(
          await retrieveManageStateResult2.getText(),
          '{ "testState": [] }',
        );
      },
    );
  });
});
