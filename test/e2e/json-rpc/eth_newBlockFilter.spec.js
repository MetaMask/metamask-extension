const { strict: assert } = require('assert');
const {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('eth_newBlockFilter', function () {
  const ganacheOptions = {
    blockTime: 0.1,
    ...defaultGanacheOptions,
  };
  it('executes a new block filter call', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

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
