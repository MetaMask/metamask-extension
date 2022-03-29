const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Token Details', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should show token details for an imported token', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement({ text: 'import tokens', tag: 'a' });
        await driver.clickElement({ text: 'Custom Token', tag: 'button' });

        const tokenAddress = '0x2EFA2Cb29C2341d8E5Ba7D3262C9e9d6f1Bf3711';
        const tokenSymbol = 'AAVE';

        await driver.fill('#custom-address', tokenAddress);
        await driver.waitForSelector('#custom-symbol-helper-text');
        await driver.fill('#custom-symbol', tokenSymbol);
        await driver.clickElement({ text: 'Add Custom Token', tag: 'button' });
        await driver.clickElement({ text: 'Import Tokens', tag: 'button' });
        await driver.clickElement('[title="Asset options"]');
        await driver.clickElement({ text: 'Token details', tag: 'span' });

        const tokenAddressFound = {
          text: tokenAddress,
        };

        const exists = await driver.isElementPresent(tokenAddressFound);

        assert.ok(exists, 'Token details are not correct.');
      },
    );
  });
});
