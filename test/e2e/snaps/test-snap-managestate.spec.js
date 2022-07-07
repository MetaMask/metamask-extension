const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
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

        // navigate to test snaps page, then fill in the snapId
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);
        await driver.delay(1000);
        await driver.fill('#snapId4', 'npm:@metamask/test-snap-managestate');

        // find and scroll to the rest of the card
        const snapButton = await driver.findElement('#snapId4');
        await driver.scrollToElement(snapButton);
        await driver.delay(500);

        // connect the snap
        await driver.clickElement('#connectManageState');

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

        // fill and click send inputs on test snap page
        await driver.waitUntilXWindowHandles(1, 5000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);
        await driver.fill('#dataManageState', '23');
        await driver.clickElement('#sendManageState');

        // check the results of the public key test
        await driver.delay(500);
        const manageStateResult = await driver.findElement(
          '#sendManageStateResult',
        );
        assert.equal(await manageStateResult.getText(), 'true');

        // click get results
        await driver.clickElement('#retrieveManageState');

        // check the results
        await driver.delay(500);
        const retrieveManageStateResult = await driver.findElement(
          '#retrieveManageStateResult',
        );
        assert.equal(
          await retrieveManageStateResult.getText(),
          '{"testState":["23"]}',
        );

        // click clear results
        await driver.clickElement('#clearManageState');

        // check if true
        await driver.delay(500);
        const clearManageStateResult = await driver.findElement(
          '#clearManageStateResult',
        );
        assert.equal(await clearManageStateResult.getText(), 'true');

        // click get results again
        await driver.clickElement('#retrieveManageState');

        // check result array is empty
        await driver.delay(500);
        const retrieveManageStateResult2 = await driver.findElement(
          '#retrieveManageStateResult',
        );
        assert.equal(
          await retrieveManageStateResult2.getText(),
          '{"testState":[]}',
        );
      },
    );
  });
});
