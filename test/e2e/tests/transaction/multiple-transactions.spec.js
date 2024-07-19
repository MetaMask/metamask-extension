const {
  withFixtures,
  openDapp,
  unlockWallet,
  generateGanacheOptions,
  WINDOW_TITLES,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
import HomePage from '../../page-objects/pages/homepage';

describe('Multiple transactions', function () {
  it('creates multiple queued transactions, then confirms', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
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

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // creates second transaction
        await driver.clickElement({
          text: 'Send EIP 1559 Transaction',
          tag: 'button',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // confirms second transaction
        await driver.waitForSelector({
          text: 'Reject 2 transactions',
          tag: 'a',
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

        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        await homePage.check_confirmedTxNumberDisplayedInActivity(2);
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
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
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

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // creates second transaction
        await driver.clickElement({
          text: 'Send EIP 1559 Transaction',
          tag: 'button',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // rejects second transaction
        await driver.waitForSelector({
          text: 'Reject 2 transactions',
          tag: 'a',
        });
        await driver.clickElement({ text: 'Reject', tag: 'button' });
        await driver.assertElementNotPresent('.loading-overlay__spinner');
        // rejects first transaction
        await driver.clickElement({ text: 'Reject', tag: 'button' });

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        await homePage.check_activityListIsEmpty();
        await homePage.check_completedTxNumberDisplayedInActivity(0);
      },
    );
  });
});
