const {
  withFixtures,
  logInWithBalanceValidation,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('from inside MetaMask', function () {
  it('finds the transaction in the transactions list using default gas', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [{
          type: 'anvil',
          options: {
            chainId: 1,
            loadState: './test/e2e/seeder/localNodeStates/withDai.json'
          }
        }
      ]
      },
      async ({ driver, localNodes }) => {
        await logInWithBalanceValidation(driver, localNodes[0]);

        await driver.delay(90000)
        await driver.delay(90000)
        await driver.delay(90000)
        await driver.delay(90000)
        await driver.delay(90000)
        await driver.delay(90000)
        await driver.delay(90000)
      },
    );
  });
})
