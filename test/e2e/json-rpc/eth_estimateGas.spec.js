const { strict: assert } = require('assert');
const {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('eth_estimateGas', function () {
  it('executes a estimate gas json rpc call', async function () {
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

        // eth_estimateGas
        await driver.openNewPage(`http://127.0.0.1:8080`);

        const estimateGas = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_estimateGas',
          params: [
            {
              to: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            },
          ],
        });

        const estimateGasRequest = await driver.executeScript(
          `return window.ethereum.request(${estimateGas})`,
        );

        assert.strictEqual(estimateGasRequest, '0x5208');
      },
    );
  });
});
