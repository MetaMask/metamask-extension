const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');

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
  const smartContract = SMART_CONTRACTS.PIGGYBANK;
  it('should display the correct account balance after contract interactions', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-state',
        ganacheOptions,
        smartContract,
        title: this.test.title,
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // deploy contract
        await driver.openNewPage(
          `http://127.0.0.1:8080/?contract=${contractAddress}`,
        );

        // wait for deployed contract, calls and confirms a contract method where ETH is sent
        await driver.findClickableElement('#deployButton');
        await driver.clickElement('#depositButton');
        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        const dapp = await driver.switchToWindowWithTitle(
          'E2E Test Dapp',
          windowHandles,
        );

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
        await driver.clickElement({ text: 'Activity', tag: 'button' });
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
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
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(2)',
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
