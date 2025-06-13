import { strict as assert } from 'assert';
import { withFixtures } from '../helpers';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { Driver } from '../webdriver/driver';

describe('eth_newBlockFilter', function () {
  const localNodeOptions: { blockTime: number } = {
    blockTime: 0.1,
  };
  it('executes a new block filter call', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        // eth_newBlockFilter
        await driver.openNewPage(`http://127.0.0.1:8080`);

        const newBlockfilterRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_newBlockFilter',
        });

        const newBlockFilter = (await driver.executeScript(
          `return window.ethereum.request(${newBlockfilterRequest})`,
        )) as string;

        assert.strictEqual(newBlockFilter, '0x01');

        // eth_getFilterChanges
        const getFilterChangesRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getFilterChanges',
          params: ['0x01'],
        });

        await driver.delay(1000);

        const blockByHashRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: ['latest', false],
        });
        const blockByHash = (await driver.executeScript(
          `return window.ethereum.request(${blockByHashRequest})`,
        )) as { hash: string };

        const filterChanges = (await driver.executeScript(
          `return window.ethereum.request(${getFilterChangesRequest})`,
        )) as string[];

        assert.strictEqual(filterChanges.includes(blockByHash.hash), true);

        // eth_uninstallFilter
        const uninstallFilterRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_uninstallFilter',
          params: ['0x01'],
        });

        const uninstallFilter = (await driver.executeScript(
          `return window.ethereum.request(${uninstallFilterRequest})`,
        )) as boolean;

        assert.strictEqual(uninstallFilter, true);
      },
    );
  });
});
