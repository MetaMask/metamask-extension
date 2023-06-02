const assert = require('assert');
const {
  convertToHexValue,
  withFixtures,
  openDapp,
  regularDelayMs,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Multiple transactions', function () {
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

  it('creates multiple queued transactions, then confirms', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // initiates a transaction from the dapp
        await openDapp(driver);
        // creates first transaction
        await driver.clickElement({
          text: 'Send EIP 1559 Transaction',
          tag: 'button',
        });
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        const confirmation = windowHandles[2];
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

        // creates second transaction
        await driver.clickElement({
          text: 'Send EIP 1559 Transaction',
          tag: 'button',
        });
        await driver.switchToWindow(confirmation);

        // confirms second transaction
        await driver.waitForSelector({
          text: 'Reject 2 transactions',
          tag: 'a',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitForElementNotPresent('.loading-overlay__spinner');
        // confirms first transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="home__activity-tab"]');

        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .transaction-list-item',
          );
          return confirmedTxes.length === 2;
        }, 10000);
      },
    );
  });

  it('creates multiple queued transactions, then rejects', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // initiates a transaction from the dapp
        await openDapp(driver);
        // creates first transaction
        await driver.clickElement({
          text: 'Send EIP 1559 Transaction',
          tag: 'button',
        });
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        const confirmation = windowHandles[2];
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

        // creates second transaction
        await driver.clickElement({
          text: 'Send EIP 1559 Transaction',
          tag: 'button',
        });
        await driver.switchToWindow(confirmation);

        // rejects second transaction
        await driver.waitForSelector({
          text: 'Reject 2 transactions',
          tag: 'a',
        });
        await driver.clickElement({ text: 'Reject', tag: 'button' });
        await driver.waitForElementNotPresent('.loading-overlay__spinner');
        // rejects first transaction
        await driver.clickElement({ text: 'Reject', tag: 'button' });

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="home__activity-tab"]');

        const noTransactions = await driver.findElements(
          '.transaction-list__empty-text',
        );
        assert.equal(
          await noTransactions[0].getText(),
          'You have no transactions',
        );
      },
    );
  });
});
