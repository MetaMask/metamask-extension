const { strict: assert } = require('assert');
const { withFixtures, regularDelayMs } = require('../helpers');

describe('Mock gas price', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: 25000000000000000000,
      },
    ],
  };

  it('Should display a gas price of 555', async function () {
    function mockGas(mockServer) {
      mockServer
        .forGet('https://gas-api.metaswap.codefi.network/networks/1/gasPrices')
        .thenCallback((request) => {
          console.log(`TEST: [${request.method}] ${request.url}`);
          return {
            headers: { 'Access-Control-Allow-Origin': '*' },
            statusCode: 200,
            json: {
              SafeGasPrice: '111',
              ProposeGasPrice: '555',
              FastGasPrice: '999',
            },
          };
        });
    }
    const driverOptions = {
      mock: true,
    };
    await withFixtures(
      {
        fixtures: 'imported-account',
        driverOptions,
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver, _, mockServer }) => {
        mockGas(mockServer);
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        await driver.clickElement('[data-testid="eth-overview-send"]');
        await driver.fill(
          '[data-testid="ens-input"]',
          '0x985c30949c92df7a0bd42e0f3e3d539ece98db24',
        );
        await driver.fill('.unit-input__input', '1');
        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        await driver.clickElement({ text: 'Edit', tag: 'button' });
        const estimate = await driver.waitForSelector({
          css: '.transaction-total-banner',
          text: '0.011655 ETH',
        });
        assert.equal(await estimate.getText(), '0.011655 ETH');
      },
    );
  });
});
