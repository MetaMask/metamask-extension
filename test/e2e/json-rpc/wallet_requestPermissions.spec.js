const { strict: assert } = require('assert');
const { defaultGanacheOptions, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('wallet_requestPermissions', function () {
  it('executes a request permissions on eth_accounts event', async function () {
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
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // wallet_requestPermissions
        await driver.openNewPage(`http://127.0.0.1:8080`);

        const requestPermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: 0 }],
        });

        const requestPermissions = await driver.executeScript(
          `return window.ethereum.request(${requestPermissionsRequest})`,
        );

        assert.strictEqual(requestPermissions, '');
      },
    );
  });
});
