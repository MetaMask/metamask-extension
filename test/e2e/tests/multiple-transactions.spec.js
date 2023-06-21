const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Confirm transactions', function () {
  const ganacheOptions = {
    hardfork: 'london',
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should be able to confirm multiple transactions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerMultipleTransactions()
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // confirm multiple transactions
        await driver.waitForSelector({
          text: 'Reject 4 transactions',
          tag: 'a',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitForSelector({
          text: 'Reject 3 transactions',
          tag: 'a',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitForSelector({
          text: 'Reject 2 transactions',
          tag: 'a',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.waitForElementNotPresent('.loading-overlay__spinner');
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .transaction-list-item',
          );
          return confirmedTxes.length === 4;
        }, 10000);
      },
    );
  });

  it('should be able to reject multiple transactions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerMultipleTransactions()
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // confirm multiple transactions
        await driver.waitForSelector({
          text: 'Reject 4 transactions',
          tag: 'a',
        });
        await driver.clickElement({ text: 'Reject', tag: 'button' });
        await driver.waitForSelector({
          text: 'Reject 3 transactions',
          tag: 'a',
        });
        await driver.clickElement({ text: 'Reject', tag: 'button' });
        await driver.waitForSelector({
          text: 'Reject 2 transactions',
          tag: 'a',
        });
        await driver.clickElement({ text: 'Reject', tag: 'button' });

        await driver.waitForElementNotPresent('.loading-overlay__spinner');
        await driver.clickElement({ text: 'Reject', tag: 'button' });

        await driver.waitForSelector('[data-testid="home__activity-tab"]');
      },
    );
  });
});
