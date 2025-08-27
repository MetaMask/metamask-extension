const {
  default: Confirmation,
} = require('../../page-objects/pages/confirmations/redesign/confirmation');
const {
  createDappTransaction,
} = require('../../page-objects/flows/transaction');

const {
  withFixtures,
  openDapp,
  locateAccountBalanceDOM,
  unlockWallet,
  WINDOW_TITLES,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

const TRANSACTION_COUNT = 4;

describe('Navigate transactions', function () {
  it('should navigate the unapproved transactions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerTxSimulationsDisabled()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test.fullTitle(),
        dapp: true,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await createRedesignedMultipleTransactions(driver, TRANSACTION_COUNT);

        const navigation = new Confirmation(driver);

        await navigation.clickNextPage();
        await navigation.checkPageNumbers(2, 4);

        await navigation.clickNextPage();
        await navigation.checkPageNumbers(3, 4);

        await navigation.clickNextPage();
        await navigation.checkPageNumbers(4, 4);

        await navigation.clickPreviousPage();
        await navigation.checkPageNumbers(3, 4);

        await navigation.clickPreviousPage();
        await navigation.checkPageNumbers(2, 4);

        await navigation.clickPreviousPage();
        await navigation.checkPageNumbers(1, 4);
      },
    );
  });

  it('should add a transaction while the confirm page is in focus', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesControllerTxSimulationsDisabled()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await createRedesignedMultipleTransactions(driver, TRANSACTION_COUNT);

        const navigation = new Confirmation(driver);

        await navigation.clickNextPage();
        await navigation.checkPageNumbers(2, 4);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // add transaction
        await openDapp(driver);
        await driver.clickElement({ text: 'Send', tag: 'button' });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await navigation.checkPageNumbers(2, 5);
      },
    );
  });

  it('should reject and remove an unapproved transaction', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerTxSimulationsDisabled()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test.fullTitle(),
        dapp: true,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await createRedesignedMultipleTransactions(driver, TRANSACTION_COUNT);

        // reject transaction
        await driver.clickElement({ text: 'Cancel', tag: 'button' });

        const navigation = new Confirmation(driver);
        await navigation.checkPageNumbers(1, 3);
      },
    );
  });

  it('should confirm and remove an unapproved transaction', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerTxSimulationsDisabled()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test.fullTitle(),
        dapp: true,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await createRedesignedMultipleTransactions(driver, TRANSACTION_COUNT);

        // confirm transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        const navigation = new Confirmation(driver);
        await navigation.checkPageNumbers(1, 3);
      },
    );
  });

  it('should reject and remove all unapproved transactions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerTxSimulationsDisabled()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test.fullTitle(),
        dapp: true,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await createRedesignedMultipleTransactions(driver, TRANSACTION_COUNT);

        // reject transactions
        await driver.clickElement({ text: 'Reject all', tag: 'button' });

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await locateAccountBalanceDOM(driver);
      },
    );
  });
});

async function createRedesignedMultipleTransactions(driver, count) {
  for (let i = 0; i < count; i++) {
    await createDappTransaction(driver);
  }

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  // Wait until total amount is loaded to mitigate flakiness on reject
  await driver.findElement({
    tag: 'h2',
    text: '0.001 ETH',
  });
}
