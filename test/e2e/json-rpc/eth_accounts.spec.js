const { strict: assert } = require('assert');
const {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('eth_accounts', function () {
  it('executes a eth_accounts json rpc call', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withKeyringControllerAdditionalAccountVault()
          .withPreferencesControllerAdditionalAccountIdentities()
          .withAccountsControllerAdditionalAccountIdentities()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // eth_accounts
        await driver.openNewPage(`http://127.0.0.1:8080`);

        const accountsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_accounts',
        });

        const accounts = await driver.executeScript(
          `return window.ethereum.request(${accountsRequest})`,
        );

        assert.deepStrictEqual(accounts, [
          '0x09781764c08de8ca82e156bbf156a3ca217c7950',
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        ]);
      },
    );
  });
});
