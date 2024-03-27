const { strict: assert } = require('assert');
const {
  withFixtures,
  openDapp,
  locateAccountBalanceDOM,
  unlockWallet,
  generateGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Navigate transactions', function () {
  it('should navigate the unapproved transactions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerMultipleTransactions()
          .build(),
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate transactions
        await driver.clickElement('[data-testid="next-page"]');
        let navigationElement = await driver.findElement(
          '.confirm-page-container-navigation',
        );
        let navigationText = await navigationElement.getText();
        assert.equal(
          navigationText.includes('2 of 4'),
          true,
          'changed transaction right',
        );
        await driver.clickElement('[data-testid="next-page"]');
        navigationElement = await driver.findElement(
          '.confirm-page-container-navigation',
        );
        navigationText = await navigationElement.getText();
        assert.equal(
          navigationText.includes('3 of 4'),
          true,
          'changed transaction right',
        );
        await driver.clickElement('[data-testid="next-page"]');
        navigationElement = await driver.findElement(
          '.confirm-page-container-navigation',
        );
        navigationText = await navigationElement.getText();
        assert.equal(
          navigationText.includes('4 of 4'),
          true,
          'changed transaction right',
        );
        await driver.clickElement('[data-testid="first-page"]');
        navigationElement = await driver.findElement(
          '.confirm-page-container-navigation',
        );
        navigationText = await navigationElement.getText();
        assert.equal(
          navigationText.includes('1 of 4'),
          true,
          'navigate to first transaction',
        );
        await driver.clickElement('[data-testid="last-page"]');
        navigationElement = await driver.findElement(
          '.confirm-page-container-navigation',
        );
        navigationText = await navigationElement.getText();
        assert.equal(
          navigationText.includes('4 of 4'),
          true,
          'navigate to last transaction',
        );
        await driver.clickElement('[data-testid="previous-page"]');
        navigationElement = await driver.findElement(
          '.confirm-page-container-navigation',
        );
        navigationText = await navigationElement.getText();
        assert.equal(
          navigationText.includes('3 of 4'),
          true,
          'changed transaction left',
        );
        await driver.clickElement('[data-testid="previous-page"]');
        navigationElement = await driver.findElement(
          '.confirm-page-container-navigation',
        );
        navigationText = await navigationElement.getText();
        assert.equal(
          navigationText.includes('2 of 4'),
          true,
          'changed transaction left',
        );
      },
    );
  });

  it('should add a transaction while the confirm page is in focus', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withTransactionControllerMultipleTransactions()
          .build(),
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="next-page"]');
        let navigationElement = await driver.findElement(
          '.confirm-page-container-navigation',
        );
        let navigationText = await navigationElement.getText();
        assert.equal(
          navigationText.includes('2 of 4'),
          true,
          'second transaction in focus',
        );

        // add transaction
        await openDapp(driver);
        await driver.clickElement({ text: 'Send', tag: 'button' });
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindow(extension);
        navigationElement = await driver.waitForSelector({
          css: '.confirm-page-container-navigation',
          text: '2 of 5',
        });
        navigationText = await navigationElement.getText();
        assert.equal(
          navigationText.includes('2 of 5'),
          true,
          'correct (same) transaction in focus',
        );
      },
    );
  });

  it('should reject and remove an unapproved transaction', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerMultipleTransactions()
          .build(),
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // reject transaction
        await driver.clickElement({ text: 'Reject', tag: 'button' });
        const navigationElement = await driver.waitForSelector({
          css: '.confirm-page-container-navigation',
          text: '1 of 3',
        });
        const navigationText = await navigationElement.getText();
        assert.equal(
          navigationText.includes('1 of 3'),
          true,
          'transaction rejected',
        );
      },
    );
  });

  it('should confirm and remove an unapproved transaction', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerMultipleTransactions()
          .build(),
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // confirm transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        const navigationElement = await driver.waitForSelector({
          css: '.confirm-page-container-navigation',
          text: '1 of 3',
        });
        const navigationText = await navigationElement.getText();
        assert.equal(
          navigationText.includes('1 of 3'),
          true,
          'transaction confirmed',
        );
      },
    );
  });

  it('should reject and remove all unapproved transactions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerMultipleTransactions()
          .build(),
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await unlockWallet(driver);

        // reject transactions
        await driver.clickElement({ text: 'Reject 4', tag: 'a' });
        await driver.clickElement({ text: 'Reject all', tag: 'button' });
        await locateAccountBalanceDOM(driver, ganacheServer);
      },
    );
  });
});
