import { strict as assert } from 'assert';
import { defaultGanacheOptions, withFixtures } from '../helpers';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { Driver } from '../webdriver/driver';
import { Ganache } from '../seeder/ganache';

describe('eth_gasPrice', function () {
  it('executes gas price json rpc call', async function () {
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

        // eth_gasPrice
        await driver.openNewPage(`http://127.0.0.1:8080`);

        const gasPriceRequest: string = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
        });

        const gasPrice: string = await driver.executeScript(
          `return window.ethereum.request(${gasPriceRequest})`,
        );

        assert.strictEqual(gasPrice, '0x77359400'); // 2000000000
      },
    );
  });
});
