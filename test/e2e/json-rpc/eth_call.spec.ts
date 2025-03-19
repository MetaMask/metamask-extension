import { strict as assert } from 'assert';
import { keccak } from 'ethereumjs-util';
import { defaultGanacheOptions, withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';
import FixtureBuilder from '../fixture-builder';
import { Ganache } from '../seeder/ganache';
import GanacheContractAddressRegistry from '../seeder/ganache-contract-address-registry';
import { SMART_CONTRACTS } from '../seeder/smart-contracts';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';

describe('eth_call', function () {
  const smartContract = SMART_CONTRACTS.NFTS;
  it('executes a new message call', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
        contractRegistry,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
        contractRegistry: GanacheContractAddressRegistry;
      }) => {
        const contract = contractRegistry.getContractAddress(smartContract);
        await loginWithBalanceValidation(driver, ganacheServer);

        // eth_call
        await driver.openNewPage(`http://127.0.0.1:8080`);
        const balanceOf = `0x${keccak(
          Buffer.from('balanceOf(address)'),
        ).toString('hex')}`;
        const walletAddress = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
        const request = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [
            {
              to: `${contract}`,
              data:
                `${balanceOf.slice(0, 10)}` +
                '000000000000000000000000' +
                `${walletAddress.substring(2)}`,
            },
            'latest',
          ],
          id: 0,
        });
        const result = await driver.executeScript(
          `return window.ethereum.request(${request})`,
        );

        assert.equal(
          result,
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        );
      },
    );
  });
});
