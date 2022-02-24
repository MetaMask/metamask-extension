const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Eth sign', function () {
  it('can initiate and confirm a eth sign', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    const expectedPersonalMessage =
      '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0';
    const expectedEthSignResult =
      '"0x816ab6c5d5356548cc4e004ef35a37fdfab916742a2bbeda756cd064c3d3789a6557d41d49549be1de249e1937a8d048996dfcc70d0552111605dc7cc471e8531b"';
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
        await driver.clickElement('#ethSign');

        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        const title = await driver.findElement(
          '.request-signature__header__text',
        );
        const origin = await driver.findElement('.request-signature__origin');
        assert.equal(await title.getText(), 'Signature Request');
        assert.equal(await origin.getText(), 'http://127.0.0.1:8080');

        const personalMessageRow = await driver.findElement(
          '.request-signature__row-value',
        );
        const personalMessage = await personalMessageRow.getText();
        assert.equal(personalMessage, expectedPersonalMessage);

        await driver.clickElement('[data-testid="request-signature__sign"]');

        // Switch to the Dapp
        await driver.waitUntilXWindowHandles(2);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

        // Verify
        const result = await driver.findElement('#ethSignResult');
        assert.equal(await result.getText(), expectedEthSignResult);
      },
    );
  });
});
