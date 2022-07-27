const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Navigate transactions', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should navigate the unapproved transactions', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'navigate-transactions',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

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
        fixtures: 'navigate-transactions',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

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
        await driver.openNewPage('http://127.0.0.1:8080/');
        await driver.clickElement({ text: 'Send', tag: 'button' });
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindow(extension);
        navigationElement = await driver.waitForSelector(
          {
            css: '.confirm-page-container-navigation',
            text: '2 of 5',
          },
          { timeout: 10000 },
        );
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
        dapp: true,
        fixtures: 'navigate-transactions',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // reject transaction
        await driver.clickElement({ text: 'Reject', tag: 'button' });
        const navigationElement = await driver.waitForSelector(
          {
            css: '.confirm-page-container-navigation',
            text: '1 of 3',
          },
          { timeout: 10000 },
        );
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
        dapp: true,
        fixtures: 'navigate-transactions',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // confirm transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        const navigationElement = await driver.waitForSelector(
          {
            css: '.confirm-page-container-navigation',
            text: '1 of 3',
          },
          { timeout: 10000 },
        );
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
        dapp: true,
        fixtures: 'navigate-transactions',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // reject transactions
        await driver.clickElement({ text: 'Reject 4', tag: 'a' });
        await driver.clickElement({ text: 'Reject All', tag: 'button' });
        const balance = await driver.findElement(
          '[data-testid="eth-overview__primary-currency"]',
        );
        assert.ok(/^25\sETH$/u.test(await balance.getText()));
      },
    );
  });
});
