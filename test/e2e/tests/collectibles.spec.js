const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  veryLargeDelayMs,
} = require('../helpers');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');

describe('Collectibles', function () {
  const smartContract = SMART_CONTRACTS.COLLECTIBLES;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should transfer a single NFT from one account to another', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-state',
        ganacheOptions,
        smartContract,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver, _, contractRegistry }) => {
        const contract = contractRegistry.getContractAddress(smartContract);
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Click transfer
        await driver.openNewPage(`http://127.0.0.1:8080/?contract=${contract}`);
        await driver.waitForSelector({
          css: '#collectiblesStatus',
          text: 'Deployed',
        });
        await driver.delay(veryLargeDelayMs);
        await driver.fill('#transferTokenInput', '1');
        await driver.clickElement('#transferFromButton');
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        // Confirm transfer
        await driver.waitForSelector({
          css: '.confirm-page-container-summary__title',
          text: 'TestDappCollectibles',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
          { timeout: 10000 },
        );

        // Verify transaction
        const completedTx = await driver.findElement('.list-item__title');
        const completedTxText = await completedTx.getText();
        assert.equal(completedTxText, 'Send Token');
      },
    );
  });
  it('should approve an address to transfer a single NFT', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-state',
        ganacheOptions,
        smartContract,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver, _, contractRegistry }) => {
        const contract = contractRegistry.getContractAddress(smartContract);
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Click approve
        await driver.openNewPage(`http://127.0.0.1:8080/?contract=${contract}`);
        await driver.waitForSelector({
          css: '#collectiblesStatus',
          text: 'Deployed',
        });
        await driver.delay(veryLargeDelayMs);
        await driver.fill('#approveTokenInput', '1');
        await driver.clickElement('#approveButton');
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        // Verify dialog
        const title = await driver.findElement(
          '[data-testid="confirm-approve-title"]',
        );
        const data = await driver.findElements(
          '.confirm-approve-content__data .confirm-approve-content__small-text',
        );
        assert.equal(
          await title.getText(),
          'Give permission to access your TestDappCollectibles (#1)?',
        );
        assert.equal(await data[0].getText(), 'Function: Approve');

        // Confirm approval
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
          { timeout: 10000 },
        );

        // Verify transaction
        const completedTx = await driver.findElement('.list-item__title');
        const completedTxText = await completedTx.getText();
        assert.equal(completedTxText, 'Approve Token spend limit');
      },
    );
  });
  it('should approve an address to transfer all NFTs', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-state',
        ganacheOptions,
        smartContract,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver, _, contractRegistry }) => {
        const contract = contractRegistry.getContractAddress(smartContract);
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Click set approval for all
        await driver.openNewPage(`http://127.0.0.1:8080/?contract=${contract}`);
        await driver.waitForSelector({
          css: '#collectiblesStatus',
          text: 'Deployed',
        });
        await driver.delay(veryLargeDelayMs);
        await driver.clickElement('#setApprovalForAllButton');
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        // Verify dialog
        const title = await driver.findElement(
          '[data-testid="confirm-approve-title"]',
        );
        const data = await driver.findElements(
          '.confirm-approve-content__data .confirm-approve-content__small-text',
        );
        assert.equal(
          await title.getText(),
          'Give permission to access all of your TestDappCollectibles?',
        );
        assert.equal(await data[0].getText(), 'Function: SetApprovalForAll');
        assert.equal(await data[1].getText(), 'Parameters: true');

        // Confirmation set approval for all
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
          { timeout: 10000 },
        );

        // Verify transaction
        const completedTx = await driver.findElement('.list-item__title');
        const completedTxText = await completedTx.getText();
        assert.equal(completedTxText, 'Approve Token with no spend limit');
      },
    );
  });
});
