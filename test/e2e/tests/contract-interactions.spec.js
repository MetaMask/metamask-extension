const { strict: assert } = require('assert');
const { withFixtures, regularDelayMs } = require('../helpers');

describe('Deploy contract and call contract methods', function () {
  let windowHandles;
  let extension;
  let popup;
  let dapp;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: 25000000000000000000,
      },
    ],
  };
  it('should display the correct account balance after contract interactions', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        console.log(`await driver.navigate();`);
        await driver.navigate();
        console.log(`await driver.fill('#password', 'correct horse battery staple');`);
        await driver.fill('#password', 'correct horse battery staple');
        console.log(`await driver.press('#password', driver.Key.ENTER);`);
        await driver.press('#password', driver.Key.ENTER);

        // connects the dapp
        console.log(`await driver.openNewPage('http://127.0.0.1:8080/');`);
        await driver.openNewPage('http://127.0.0.1:8080/');
        console.log(`await driver.clickElement({ text: 'Connect', tag: 'button' });`);
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        console.log(`await driver.waitUntilXWindowHandles(3);`);
        await driver.waitUntilXWindowHandles(3);
        console.log(`windowHandles = await driver.getAllWindowHandles();`);
        windowHandles = await driver.getAllWindowHandles();
        extension = windowHandles[0];
        console.log(`dapp = await driver.switchToWindowWithTitle(`);
        dapp = await driver.switchToWindowWithTitle(
          'E2E Test Dapp',
          windowHandles,
        );
        popup = windowHandles.find(
          (handle) => handle !== extension && handle !== dapp,
        );
        console.log(`await driver.switchToWindow(popup);`);
        await driver.switchToWindow(popup);
        console.log(`await driver.clickElement({ text: 'Next', tag: 'button' });`);
        await driver.clickElement({ text: 'Next', tag: 'button' });
        console.log(`await driver.clickElement({ text: 'Connect', tag: 'button' });`);
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        console.log(`await driver.waitUntilXWindowHandles(2);`);
        await driver.waitUntilXWindowHandles(2);

        // creates a deploy contract transaction
        console.log(`await driver.switchToWindow(dapp);`);
        await driver.switchToWindow(dapp);
        console.log(`await driver.clickElement('#deployButton');`);
        await driver.clickElement('#deployButton');

        // displays the contract creation data
        console.log(`await driver.switchToWindow(extension);`);
        await driver.switchToWindow(extension);
        console.log(`await driver.clickElement('[data-testid="home__activity-tab"]');`);
        await driver.clickElement('[data-testid="home__activity-tab"]');
        console.log(`await driver.clickElement({ text: 'Contract Deployment', tag: 'h2' });`);
        await driver.clickElement({ text: 'Contract Deployment', tag: 'h2' });
        console.log(`await driver.clickElement({ text: 'Data', tag: 'button' });`);
        await driver.clickElement({ text: 'Data', tag: 'button' });
        console.log(`await driver.findElement({ text: '127.0.0.1', tag: 'div' });`);
        await driver.findElement({ text: '127.0.0.1', tag: 'div' });
        console.log(`const confirmDataDiv = await driver.findElement(`);
        const confirmDataDiv = await driver.findElement(
          '.confirm-page-container-content__data-box',
        );
        const confirmDataText = await confirmDataDiv.getText();
        assert.ok(confirmDataText.includes('Origin:'));
        assert.ok(confirmDataText.includes('127.0.0.1'));
        assert.ok(confirmDataText.includes('Bytes:'));
        assert.ok(confirmDataText.includes('675'));

        // confirms a deploy contract transaction
        console.log(`await driver.clickElement({ text: 'Details', tag: 'button' });`);
        await driver.clickElement({ text: 'Details', tag: 'button' });
        console.log(`await driver.clickElement({ text: 'Confirm', tag: 'button' });`);
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        console.log(`await driver.waitForSelector(`);
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
          { timeout: 10000 },
        );
        console.log(`const completedTx = await driver.findElement('.list-item__title');`);
        const completedTx = await driver.findElement('.list-item__title');
        const completedTxText = await completedTx.getText();
        assert.equal(completedTxText, 'Contract Deployment');

        // calls and confirms a contract method where ETH is sent
        console.log(`await driver.switchToWindow(dapp);`);
        await driver.switchToWindow(dapp);
        console.log(`await driver.clickElement('#depositButton');`);
        await driver.clickElement('#depositButton');
        console.log(`await driver.waitUntilXWindowHandles(3);`);
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        console.log(`await driver.switchToWindowWithTitle(`);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        console.log(`await driver.clickElement({ text: 'Confirm', tag: 'button' });`);
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        console.log(`await driver.switchToWindow(extension);`);
        await driver.switchToWindow(extension);
        console.log(`await driver.waitForSelector(`);
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(2)',
          { timeout: 10000 },
        );
        console.log(`await driver.waitForSelector(`);
        await driver.waitForSelector(
          {
            css: '.transaction-list-item__primary-currency',
            text: '-4 ETH',
          },
          { timeout: 10000 },
        );

        // calls and confirms a contract method where ETH is received
        console.log(`await driver.switchToWindow(dapp);`);
        await driver.switchToWindow(dapp);
        console.log(`await driver.clickElement('#withdrawButton');`);
        await driver.clickElement('#withdrawButton');
        console.log(`await driver.waitUntilXWindowHandles(3);`);
        await driver.waitUntilXWindowHandles(3);
        console.log(`windowHandles = await driver.getAllWindowHandles();`);
        windowHandles = await driver.getAllWindowHandles();
        console.log(`await driver.switchToWindowWithTitle(`);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.delay(regularDelayMs);
        console.log(`await driver.clickElement({ text: 'Confirm', tag: 'button' });`);
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        console.log(`await driver.switchToWindow(extension);`);
        await driver.switchToWindow(extension);
        console.log(`await driver.waitForSelector(`);
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(3)',
          { timeout: 10000 },
        );
        console.log(`await driver.waitForSelector(`);
        await driver.waitForSelector(
          {
            css: '.transaction-list-item__primary-currency',
            text: '-0 ETH',
          },
          { timeout: 10000 },
        );

        // renders the correct ETH balance
        console.log(`await driver.switchToWindow(extension);`);
        await driver.switchToWindow(extension);
        console.log(`const balance = await driver.waitForSelector(`);
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
