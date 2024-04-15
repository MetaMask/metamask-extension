const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('eth_requestAccounts', function () {
  it('executes a request accounts json rpc call', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // eth_requestAccounts
        await driver.openNewPage(`http://127.0.0.1:8080`);

        const requestAccountRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_requestAccounts',
        });

        const requestAccount = await driver.executeScript(
          `return window.ethereum.request(${requestAccountRequest})`,
        );

        assert.deepStrictEqual(requestAccount, [
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        ]);
      },
    );
  });
});
