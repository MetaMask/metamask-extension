const { strict: assert } = require('assert');
const {
  withFixtures,
  defaultGanacheOptions,
  DAPP_URL,
  openDapp,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

const triggerBFCache = async (driver) => {
  await driver.executeScript(`
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        window.restoredFromBFCache = true
      }
    });
  `);

  await driver.driver.get(`chrome://terms/`);

  await driver.driver.navigate().back();

  const restoredFromBFCache = await driver.executeScript(
    `return window.restoredFromBFCache`,
  );

  if (!restoredFromBFCache) {
    assert.fail(new Error('Failed to trigger BFCache'));
  }
};

describe('BFCache', function () {
  it('has a working provider stream when a dapp is restored from BFCache', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await openDapp(driver, undefined, DAPP_URL);

        const request = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 0,
        });

        const initialResult = await driver.executeScript(
          `return window.ethereum.request(${request})`,
        );
        assert.equal(initialResult, '0x539');

        await triggerBFCache(driver);

        const bfcacheResult = await driver.executeScript(
          `return window.ethereum.request(${request})`,
        );
        assert.equal(bfcacheResult, '0x539');
      },
    );
  });
});
