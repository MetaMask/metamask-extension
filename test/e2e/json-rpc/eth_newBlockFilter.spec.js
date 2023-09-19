const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('eth_newBlockFilter', function () {
  const ganacheOptions = {
    blockTime: 0.1,
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('executes a new block filter call', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // eth_newBlockFilter
        await driver.openNewPage(`http://127.0.0.1:8080`);

        const newBlockfilterRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_newBlockFilter',
        });

        const newBlockFilter = await driver.executeScript(
          `return window.ethereum.request(${newBlockfilterRequest})`,
        );

        assert.strictEqual(newBlockFilter, '0x01');

        // eth_getFilterChanges
        const getFilterChangesRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getFilterChanges',
          params: ['0x01'],
        });

        await driver.delay(1000);

        const filterChanges = await driver.executeScript(
          `return window.ethereum.request(${getFilterChangesRequest})`,
        );

        const blockByHashRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: ['latest', false],
        });

        const blockByHash = await driver.executeScript(
          `return window.ethereum.request(${blockByHashRequest})`,
        );

        assert.strictEqual(
          filterChanges[filterChanges.length - 1],
          blockByHash.hash,
        );

        // eth_uninstallFilter
        const uninstallFilterRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_uninstallFilter',
          params: ['0x01'],
        });

        const uninstallFilter = await driver.executeScript(
          `return window.ethereum.request(${uninstallFilterRequest})`,
        );

        assert.strictEqual(uninstallFilter, true);
      },
    );
  });
});
