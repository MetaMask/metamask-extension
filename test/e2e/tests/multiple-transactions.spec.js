const assert = require('assert');
const {
  convertToHexValue,
  withFixtures,
  openDapp,
  regularDelayMs,
  unlockWallet,
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

  it('creates multiple queued transactions, then confirms', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // initiates a transaction from the dapp
        await openDapp(driver);
        // creates first transaction
        await driver.clickElement({
          text: 'Send EIP 1559 Transaction',
          tag: 'button',
        });
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extensionTab = windowHandles[0];
        const dApp = windowHandles[1];
        const confirmation = windowHandles[2];

        await driver.switchToWindow(dApp);

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
        await driver.switchToWindow(confirmation);

        // wait for the "Reject 2 transactions" to disappear
        await driver.waitForElementNotPresent(
          '.page-container__footer-secondary a',
        );

        // confirms first transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extensionTab);
        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .activity-list-item:nth-of-type(2)',
        );

        const confirmedTxes = await driver.findElements(
          '.transaction-list__completed-transactions .activity-list-item',
        );

        assert.equal(confirmedTxes.length, 2);
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
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

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

        const isTransactionListEmpty = await driver.isElementPresentAndVisible(
          '.transaction-list__empty-text',
        );
        assert.equal(isTransactionListEmpty, true);

        // should not be present
        await driver.assertElementNotPresent(
          '.transaction-list__completed-transactions .activity-list-item',
        );
      },
    );
  });
});
