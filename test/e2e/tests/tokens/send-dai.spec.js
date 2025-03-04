const { strict: assert } = require('assert');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const {
  withFixtures,
  openDapp,
  logInWithBalanceValidation,
  openActionMenuAndStartSendFlow,
  unlockWallet,
  editGasFeeForm,
  WINDOW_TITLES,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('from inside MetaMask', function () {
  it('finds the transaction in the transactions list using default gas', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: {
          type: 'anvil',
          options: {
            chainId: 1,
            //loadState: '../../seeder/states/dai.json'
          }
        }
      },
      async ({ driver, localNodes }) => {
        await logInWithBalanceValidation(driver, localNodes[0]);
        await driver.delay(90000)
        await driver.delay(90000)
        await driver.delay(90000)
        await driver.delay(90000)
        await openActionMenuAndStartSendFlow(driver);

        await driver.fill(
          'input[placeholder="Enter public address (0x) or domain name"]',
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );

        const inputAmount = await driver.findElement(
          'input[placeholder="0"]',
        );

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
