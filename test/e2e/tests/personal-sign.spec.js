const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Personal sign', function () {
  it('can initiate and confirm a personal sign', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    const publicAddress = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-state',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.openNewPage('http://127.0.0.1:8080/');
        await driver.clickElement('#personalSign');

        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
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

        // Switch to the Dapp
        await driver.waitUntilXWindowHandles(2);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

        // Verify
        await driver.clickElement('#personalSignVerify');
        const verifySigUtil = await driver.findElement(
          '#personalSignVerifySigUtilResult',
        );
        const verifyECRecover = await driver.waitForSelector(
          {
            css: '#personalSignVerifyECRecoverResult',
            text: publicAddress,
          },
          { timeout: 10000 },
        );
        assert.equal(await verifySigUtil.getText(), publicAddress);
        assert.equal(await verifyECRecover.getText(), publicAddress);
      },
    );
  });
});
