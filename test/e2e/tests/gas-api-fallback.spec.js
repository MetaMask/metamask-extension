const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Gas API fallback', function () {
  async function mockGasApiDown(mockServer) {
    await mockServer
      .forGet(
        'https://gas-api.metaswap.codefi.network/networks/1/suggestedGasFees',
      )
      .thenCallback(() => {
        return {
          statusCode: 500,
          json: {},
        };
      });
  }

  const ganacheOptions = {
    hardfork: 'london',
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('error message is displayed but gas recommendation is not displayed', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        testSpecificMock: mockGasApiDown,
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.fill(
          'input[placeholder="Search, public address (0x), or ENS"]',
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );

        const inputAmount = await driver.findElement('.unit-input__input');
        await inputAmount.fill('1');

        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.clickElement({ text: 'Edit', tag: 'button' });

        const error = await driver.isElementPresent('.error-message__text');
        const gasRecommendation = await driver.isElementPresent(
          '[data-testid="gas-recommendation"]',
        );

        assert.equal(error, true, 'Error message is not displayed');
        assert.equal(
          gasRecommendation,
          false,
          'Gas recommendation is displayed',
        );
      },
    );
  });
});
