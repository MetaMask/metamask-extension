const { strict: assert } = require('assert');
const { keccak } = require('ethereumjs-util');
const { convertToHexValue, withFixtures, unlockWallet } = require('../helpers');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');
const FixtureBuilder = require('../fixture-builder');

describe('eth_call', function () {
  const smartContract = SMART_CONTRACTS.NFTS;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('executes a new message call', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, _, contractRegistry }) => {
        const contract = contractRegistry.getContractAddress(smartContract);
        await unlockWallet(driver);

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
