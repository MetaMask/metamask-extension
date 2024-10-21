import { strict as assert } from 'assert';
import { defaultGanacheOptions, withFixtures } from '../helpers';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { Driver } from '../webdriver/driver';
import { Ganache } from '../seeder/ganache';

describe('eth_coinbase', function () {
  it('executes a eth_coinbase json rpc call', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, ganacheServer);

        // eth_coinbase
        await driver.openNewPage(`http://127.0.0.1:8080`);

        const coinbaseRequest: string = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_coinbase',
        });

        const coinbase: string = await driver.executeScript(
          `return window.ethereum.request(${coinbaseRequest})`,
        );

        assert.deepStrictEqual(
          coinbase,
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        );
      },
    );
  });
});
