const { strict: assert } = require('assert');
const {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('eth_gasPrice', function () {
  it('executes gas price json rpc call', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // eth_gasPrice
        await driver.openNewPage(`http://127.0.0.1:8080`);

        const gasPriceRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
        });

        const gasPrice = await driver.executeScript(
          `return window.ethereum.request(${gasPriceRequest})`,
        );

        assert.strictEqual(gasPrice, '0x77359400'); // 2000000000
      },
    );
  });
});
