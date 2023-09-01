const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Portfolio site', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should link to the portfolio site', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Click Portfolio site
        await driver.clickElement('[data-testid="eth-overview-portfolio"]');
        await driver.waitUntilXWindowHandles(2);
        const windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

        // Verify site
        assert.equal(
          await driver.getCurrentUrl(),
          'http://127.0.0.1:8080/?metamaskEntry=ext_portfolio_button&metametricsId=null',
        );
      },
    );
  });
});
