const assert = require('assert');
const { withFixtures, regularDelayMs, unlockWallet } = require('../../helpers');
const { DAPP_URL, WINDOW_TITLES } = require('../../constants');
const FixtureBuilder = require('../../fixtures/fixture-builder');

describe('Multiple transactions', function () {
  it('creates multiple queued transactions, then confirms', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // initiates a transaction from the dapp
        await driver.openNewPage(DAPP_URL);
        // creates first transaction
        await createDappTransaction(driver);
        await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // creates second transaction
        await createDappTransaction(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // confirms second transaction
        await driver.waitForSelector({
          text: 'Reject all',
          tag: 'button',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for the "Reject 2 transactions" to disappear
        await driver.assertElementNotPresent(
          '.page-container__footer-secondary a',
        );

        // confirms first transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.delay(regularDelayMs);
        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
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
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // initiates a transaction from the dapp
        await driver.openNewPage(DAPP_URL);
        // creates first transaction
        await createDappTransaction(driver);
        await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // creates second transaction
        await createDappTransaction(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // rejects second transaction
        await driver.waitForSelector({
          text: 'Reject all',
          tag: 'button',
        });
        await driver.clickElement({ text: 'Cancel', tag: 'button' });
        await driver.assertElementNotPresent('.loading-overlay__spinner');
        // rejects first transaction
        await driver.clickElement({ text: 'Cancel', tag: 'button' });

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.delay(regularDelayMs);
        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );

        // The previous isTransactionListEmpty wait already serves as the guard here for the assertElementNotPresent
        await driver.assertElementNotPresent(
          '.transaction-list__completed-transactions .activity-list-item',
        );
      },
    );
  });
});

async function createDappTransaction(driver) {
  await driver.clickElement({
    text: 'Send EIP 1559 Without Gas',
    tag: 'button',
  });
}
