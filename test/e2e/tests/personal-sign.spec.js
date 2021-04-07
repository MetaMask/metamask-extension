const { strict: assert } = require('assert');
const { Key } = require('selenium-webdriver');
const { withFixtures } = require('../helpers');

describe('Personal sign', function () {
  it('can initiate and confirm a personal sign', async function () {
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
        dapp: true,
        fixtures: 'connected-state',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        const passwordField = await driver.findElement('#password');
        await passwordField.sendKeys('correct horse battery staple');
        await passwordField.sendKeys(Key.ENTER);

        await driver.openNewPage('http://127.0.0.1:8080/');
        await driver.clickElement('#personalSign');

        await driver.waitUntilXWindowHandles(3);

        const windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        const personalMessageRow = await driver.findElement(
          '.request-signature__row-value',
        );
        const personalMessage = await personalMessageRow.getText();
        assert.equal(personalMessage, 'Example `personal_sign` message');

        await driver.clickElement('[data-testid="request-signature__sign"]');

        await driver.waitUntilXWindowHandles(2);
      },
    );
  });
});
