const {
  withFixtures,
  openDapp,
  locateAccountBalanceDOM,
  unlockWallet,
  generateGanacheOptions,
  WINDOW_TITLES,
  createDappTransactionTypeTwo,
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
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
        dapp: true,
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await createMultipleTransactions(driver, TRANSACTION_COUNT);

        await clickNextPage(driver);
        await expectPageNumber(driver, 2, 4);

        await clickNextPage(driver);
        await expectPageNumber(driver, 3, 4);

        await clickNextPage(driver);
        await expectPageNumber(driver, 4, 4);

        await clickFirstPage(driver);
        await expectPageNumber(driver, 1, 4);

        await clickLastPage(driver);
        await expectPageNumber(driver, 4, 4);

        await clickPreviousPage(driver);
        await expectPageNumber(driver, 3, 4);

        await clickPreviousPage(driver);
        await expectPageNumber(driver, 2, 4);
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
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await createMultipleTransactions(driver, TRANSACTION_COUNT);

        await clickNextPage(driver);
        await expectPageNumber(driver, 2, 4);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await openDapp(driver);
        await driver.clickElement({ text: 'Send', tag: 'button' });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await expectPageNumber(driver, 2, 5);
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
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
        dapp: true,
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await createMultipleTransactions(driver, TRANSACTION_COUNT);

        // reject transaction
        await driver.clickElement({ text: 'Reject', tag: 'button' });

        await expectPageNumber(driver, 1, 3);
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
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
        dapp: true,
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await createMultipleTransactions(driver, TRANSACTION_COUNT);

        // confirm transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await expectPageNumber(driver, 1, 3);
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
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
        dapp: true,
      },
      async ({ driver, ganacheServer }) => {
        await unlockWallet(driver);
        await createMultipleTransactions(driver, TRANSACTION_COUNT);

        // reject transactions
        await driver.clickElement({ text: 'Reject 4', tag: 'a' });
        await driver.clickElement({ text: 'Reject all', tag: 'button' });
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await locateAccountBalanceDOM(driver, ganacheServer);
      },
    );
  });
});

async function createMultipleTransactions(driver, count) {
  for (let i = 0; i < count; i++) {
    await createDappTransactionTypeTwo(driver);
  }

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  // Wait until total amount is loaded to mitigate flakiness on reject
  await driver.findElement({
    tag: 'span',
    text: '0.001',
  });
}

async function clickFirstPage(driver) {
  await driver.clickElement('[data-testid="first-page"]');
}

async function clickLastPage(driver) {
  await driver.clickElement('[data-testid="last-page"]');
}

async function clickNextPage(driver) {
  await driver.clickElement('[data-testid="next-page"]');
}

async function clickPreviousPage(driver) {
  await driver.clickElement('[data-testid="previous-page"]');
}

async function expectPageNumber(driver, current, total) {
  await driver.findElement({
    css: '.confirm-page-container-navigation',
    text: `${current} of ${total}`,
  });
}
