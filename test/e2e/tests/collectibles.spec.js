const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');
const FixtureBuilder = require('../fixture-builder');

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
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
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

        // Open Dapp and wait for deployed contract
        await driver.openNewPage(`http://127.0.0.1:8080/?contract=${contract}`);
        await driver.findClickableElement('#deployButton');

        // Click Transer
        await driver.fill('#transferTokenInput', '1');
        await driver.clickElement('#transferFromButton');
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const [extension] = windowHandles;
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
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
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

        // Open Dapp and wait for deployed contract
        await driver.openNewPage(`http://127.0.0.1:8080/?contract=${contract}`);
        await driver.findClickableElement('#deployButton');

        // Click Approve
        await driver.fill('#approveTokenInput', '1');
        await driver.clickElement('#approveButton');
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const [extension] = windowHandles;
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        // Verify dialog
        const title = await driver.findElement(
          '[data-testid="confirm-approve-title"]',
        );
        await driver.clickElement({
          text: 'View full transaction details',
          css: '.confirm-approve-content__small-blue-text',
        });
        const [func] = await driver.findElements(
          '.confirm-approve-content__data .confirm-approve-content__small-text',
        );
        assert.equal(
          await title.getText(),
          'Allow access to and transfer of your TestDappCollectibles (#1)?',
        );
        assert.equal(await func.getText(), 'Function: Approve');

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
        assert.equal(completedTxText, 'Approve token spending cap');
      },
    );
  });
  it('should enable approval for a third party address to manage all NFTs', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
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

        // Open Dapp and wait for deployed contract
        await driver.openNewPage(`http://127.0.0.1:8080/?contract=${contract}`);
        await driver.findClickableElement('#deployButton');

        // Enable Set approval for all
        await driver.clickElement('#setApprovalForAllButton');
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const [extension] = windowHandles;
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        // Verify dialog
        const title = await driver.findElement(
          '[data-testid="confirm-approve-title"]',
        );
        await driver.clickElement({
          text: 'View full transaction details',
          css: '.confirm-approve-content__small-blue-text',
        });
        const [func, params] = await driver.findElements(
          '.confirm-approve-content__data .confirm-approve-content__small-text',
        );
        assert.equal(
          await title.getText(),
          'Allow access to and transfer of all your TestDappCollectibles?',
        );
        assert.equal(await func.getText(), 'Function: SetApprovalForAll');
        assert.equal(await params.getText(), 'Parameters: true');

        // Confirm enabling set approval for all
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement({ text: 'Approve', tag: 'button' });

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
  it('should disable approval for a third party address to manage all NFTs', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
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

        // Open Dapp and wait for deployed contract
        await driver.openNewPage(`http://127.0.0.1:8080/?contract=${contract}`);
        await driver.findClickableElement('#deployButton');

        // Disable Set approval for all
        await driver.clickElement('#revokeButton');
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const [extension] = windowHandles;
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        // Verify dialog
        const title = await driver.findElement(
          '[data-testid="confirm-approve-title"]',
        );
        await driver.clickElement({
          text: 'View full transaction details',
          css: '.confirm-approve-content__small-blue-text',
        });
        const [func, params] = await driver.findElements(
          '.confirm-approve-content__data .confirm-approve-content__small-text',
        );
        const proceedWithCautionIsDisplayed = await driver.isElementPresent(
          '.dialog--error',
        );
        assert.equal(
          await title.getText(),
          'Revoke permission to access all of your TestDappCollectibles?',
        );
        assert.equal(await func.getText(), 'Function: SetApprovalForAll');
        assert.equal(await params.getText(), 'Parameters: false');
        assert.equal(proceedWithCautionIsDisplayed, false);

        // Confirm disabling set approval for all
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
