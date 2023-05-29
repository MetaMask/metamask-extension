const { strict: assert } = require('assert');

const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');

describe('Send ERC20 token with 0 decimals', function () {
  const smartContract = {
    name: SMART_CONTRACTS.HST,
    customization: {
      decimalUnits: 0,
    },
  };
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('token with 0 decimals is sent successfully from inside MetaMask', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        smartContract,
        title: this.test.title,
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement({ text: 'import tokens', tag: 'a' });
        await driver.clickElement({ text: 'Custom token', tag: 'button' });

        const tokenAddress = contractAddress;
        await driver.fill('#custom-address', tokenAddress);
        await driver.waitForSelector('#custom-symbol-label');
        await driver.clickElement({ text: 'Add custom token', tag: 'button' });
        await driver.clickElement({ text: 'Import tokens', tag: 'button' });

        await driver.clickElement('[data-testid="eth-overview-send"]');
        await driver.pasteIntoField(
          'input[placeholder="Search, public address (0x), or ENS"]',
          '0x1C53dc20D1E36ed8359250dE626ACAe36BD28a29',
        );
        await driver.fill('.unit-input__input', '1');

        await driver.clickElement({ text: 'Next', tag: 'button' });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // finds the transaction in the transactions list
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .transaction-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        const txValues = await driver.findElements(
          '.transaction-list-item__primary-currency',
        );
        assert.equal(txValues.length, 1);
        assert.ok(/-1\s*ETH/u.test(await txValues[0].getText()));
      },
    );
  });
});
