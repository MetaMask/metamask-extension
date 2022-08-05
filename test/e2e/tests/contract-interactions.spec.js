const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Deploy contract and call contract methods', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should display the correct account balance after contract interactions', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-state',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // deploy contract
        await driver.openNewPage('http://127.0.0.1:8080/');
        await driver.clickElement('#deployButton');
        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        const dapp = await driver.switchToWindowWithTitle(
          'E2E Test Dapp',
          windowHandles,
        );
        // displays the contract creation data
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Data', tag: 'button' });
        await driver.findElement({ text: '127.0.0.1', tag: 'div' });
        const confirmDataDiv = await driver.findElement(
          '.confirm-page-container-content__data-box',
        );
        const confirmDataText = await confirmDataDiv.getText();
        assert.ok(confirmDataText.includes('Origin:'));
        assert.ok(confirmDataText.includes('127.0.0.1'));
        assert.ok(confirmDataText.includes('Bytes:'));
        assert.ok(confirmDataText.includes('675'));

        // confirms a deploy contract transaction
        await driver.clickElement({ text: 'Details', tag: 'button' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
          { timeout: 10000 },
        );
        const completedTx = await driver.findElement('.list-item__title');
        const completedTxText = await completedTx.getText();
        assert.equal(completedTxText, 'Contract Deployment');

        // calls and confirms a contract method where ETH is sent
        await driver.switchToWindow(dapp);
        await driver.clickElement('#depositButton');
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.waitForSelector({
          css: '.confirm-page-container-summary__action__name',
          text: 'Deposit',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(2)',
          { timeout: 10000 },
        );
        await driver.waitForSelector(
          {
            css: '.transaction-list-item__primary-currency',
            text: '-4 ETH',
          },
          { timeout: 10000 },
        );

        // calls and confirms a contract method where ETH is received
        await driver.switchToWindow(dapp);
        await driver.clickElement('#withdrawButton');
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.waitForSelector({
          css: '.confirm-page-container-summary__action__name',
          text: 'Deposit',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(3)',
          { timeout: 10000 },
        );
        await driver.waitForSelector(
          {
            css: '.transaction-list-item__primary-currency',
            text: '-0 ETH',
          },
          { timeout: 10000 },
        );

        // renders the correct ETH balance
        await driver.switchToWindow(extension);
        const balance = await driver.waitForSelector(
          {
            css: '[data-testid="eth-overview__primary-currency"]',
            text: '21.',
          },
          { timeout: 10000 },
        );
        const tokenAmount = await balance.getText();
        assert.ok(/^21.*\s*ETH.*$/u.test(tokenAmount));
      },
    );
  });
});
