const { strict: assert } = require('assert');
const { withFixtures, defaultGanacheOptions } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('eth_chainId', function () {
  it('returns the chain ID of the current network', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
<<<<<<< HEAD
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
=======
        ganacheOptions,
        title: this.test.fullTitle(),
>>>>>>> upstream/multichain-swaps-controller
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // eth_chainId
        await driver.openNewPage(`http://127.0.0.1:8080`);
        const request = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 0,
        });
        const result = await driver.executeScript(
          `return window.ethereum.request(${request})`,
        );

        assert.equal(result, '0x539');
      },
    );
  });
});
