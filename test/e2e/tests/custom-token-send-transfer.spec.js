const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  getWindowHandles,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');

describe('Custom Token', function () {
  const smartContract = SMART_CONTRACTS.HST;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('can be sent from inside MetaMask', async function () {
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
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        // create token
        await driver.openNewPage(
          `http://127.0.0.1:8080/?contract=${contractAddress}`,
        );
        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.findClickableElement('#deployButton');
        await driver.clickElement({
          text: 'Add Token to Wallet',
          tag: 'button',
        });

        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        // switch to popup and add token from dapp
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Add token', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);

        const asset = await driver.waitForSelector({
          css: '.list-item',
          text: '10 TST',
        });
        asset.click();
        // send token from extension
        await driver.waitForSelector('[data-testid="eth-overview-send"]');
        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.fill(
          'input[placeholder="Search, public address (0x), or ENS"]',
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );
        await driver.fill('.unit-input__input', '1');
        // continue to next screen
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        // added wait for selector since it needs some time to load this page
        // otherwise would have to use delays
        await driver.waitForSelector({ text: 'Edit', tag: 'button' });
        await driver.waitForSelector({
          text: '1 TST',
          tag: 'h1',
        });
        // check transaction details
        const estimatedGasFee = await driver.findElements(
          '.currency-display-component__text',
        );
        assert.notEqual(
          await estimatedGasFee[0].getText(),
          '0',
          'Estimated gas fee should not be 0',
        );
        // checks transaction details in hex tab
        await driver.clickElement({
          text: 'Hex',
          tag: 'button',
        });
        const functionType = await driver.findElement(
          '.confirm-page-container-content__function-type',
        );
        const functionTypeText = await functionType.getText();
        assert(functionTypeText.match('Transfer'));

        const tokenAmount = await driver.findElement(
          '.confirm-page-container-summary__title-text',
        );
        const tokenAmountText = await tokenAmount.getText();
        assert.equal(tokenAmountText, '1 TST', 'Token amount is not correct');

        const confirmDataDiv = await driver.findElement(
          '.confirm-page-container-content__data-box',
        );
        const confirmDataText = await confirmDataDiv.getText();
        assert(
          confirmDataText.match(
            /0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c97/u,
          ),
        );
        // clicks on Details tab and Edit button (editing priority)
        await driver.clickElement({ text: 'Details', tag: 'button' });
        await driver.clickElement({ text: 'Edit', tag: 'button' });
        const inputs = await driver.findElements('input[type="number"]');
        const gasLimitInput = inputs[0];
        const gasPriceInput = inputs[1];
        await gasLimitInput.fill('100000');
        await gasPriceInput.fill('100');
        await driver.clickElement({ text: 'Save', tag: 'button' });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitForSelector(
          {
            css: '.transaction-list__completed-transactions .transaction-list-item__primary-currency',
            text: '-1 TST',
          },
          { timeout: 10000 },
        );
        const transactionTxt = await driver.waitForSelector({
          css: '.list-item__heading',
          text: 'Send TST',
        });
        // check if transation finish correctly
        assert(
          transactionTxt.getText(),
          'Send TST',
          'Transaction is not done correctly',
        );
      },
    );
  });

  it('can be transferred from a dapp', async function () {
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
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // create token
        await driver.openNewPage(
          `http://127.0.0.1:8080/?contract=${contractAddress}`,
        );

        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];

        await driver.findClickableElement('#deployButton');

        await driver.clickElement({
          text: 'Add Token to Wallet',
          tag: 'button',
        });
        // switch to popup and add token from dapp
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Add token', tag: 'button' });
        windowHandles = await getWindowHandles(driver, 2);
        // transfer token from dapp
        await driver.clickElement({ text: 'Transfer Tokens', tag: 'button' });
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();

        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.waitForSelector({ text: '1.5 TST', tag: 'h1' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.switchToWindow(extension);
        // checks if transaction is done correctly from extension
        await driver.clickElement({ tag: 'button', text: 'Activity' });
        await driver.findElements('.transaction-list__pending-transactions');
        await driver.waitForSelector(
          {
            css: '.transaction-list-item__primary-currency',
            text: '-1.5 TST',
          },
          { timeout: 10000 },
        );
        await driver.clickElement('.transaction-list-item__primary-currency');

        const transactionAmounts = await driver.findElements(
          '.currency-display-component__text',
        );
        const transactionAmount = transactionAmounts[0];
        assert(
          await transactionAmount.getText(),
          '1.5 TST',
          'Token amount is not correct',
        );
      },
    );
  });

  it('can be transferred from a dapp customizing gas values', async function () {
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
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        // create token
        await driver.openNewPage(
          `http://127.0.0.1:8080/?contract=${contractAddress}`,
        );
        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.findClickableElement('#deployButton');

        // add token from dapp
        await driver.clickElement({
          text: 'Add Token to Wallet',
          tag: 'button',
        });
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Add token', tag: 'button' });
        windowHandles = await getWindowHandles(driver, 2);
        // transfer token from dapp
        await driver.clickElement({ text: 'Transfer Tokens', tag: 'button' });
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();

        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.waitForSelector({ text: '1.5 TST', tag: 'h1' });
        await driver.clickElement({ text: 'Edit', tag: 'button' });

        // customizes gas
        await driver.clickElement(
          { text: 'Edit suggested gas fee', tag: 'button' },
          10000,
        );
        const inputs = await driver.findElements('input[type="number"]');
        const gasLimitInput = inputs[0];
        const gasPriceInput = inputs[1];
        await gasLimitInput.fill('60000');
        await gasPriceInput.fill('10');

        await driver.clickElement({ text: 'Save', tag: 'button' });
        await driver.findElement({ tag: 'span', text: '0.0006' });
        const tokenAmount = await driver.findElement(
          '.confirm-page-container-summary__title-text',
        );
        const tokenAmountText = await tokenAmount.getText();
        assert.equal(
          tokenAmountText,
          '1.5 TST',
          'Token amount should be 1.5 TST',
        );
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.switchToWindow(extension);
        // checks if transaction finish correctly from extension
        await driver.clickElement({ tag: 'button', text: 'Activity' });
        await driver.waitForSelector({
          css: '.transaction-list__completed-transactions .transaction-list-item__primary-currency',
          text: '-1.5 TST',
        });
        await driver.waitForSelector({
          css: '.list-item__heading',
          text: 'Send TST',
        });
        await driver.clickElement({
          text: 'Assets',
          tag: 'button',
        });
        const assets = await driver.findElement('[title="8.5 TST"]');
        assert.ok(assets, 'Token amount is not correct');
      },
    );
  });

  it('can be transferred from a dapp without specifying gas', async function () {
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
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // create token
        await driver.openNewPage(
          `http://127.0.0.1:8080/?contract=${contractAddress}`,
        );
        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.findClickableElement('#deployButton');
        // add token from dapp
        await driver.clickElement({
          text: 'Add Token to Wallet',
          tag: 'button',
        });

        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Add token', tag: 'button' });
        windowHandles = await getWindowHandles(driver, 2);
        // transfer token without gas from dapp
        await driver.clickElement({
          text: 'Transfer Tokens Without Gas',
          tag: 'button',
        });

        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.waitForSelector({
          tag: 'h1',
          text: '1.5 TST',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        // checks transaction finish correctly from extension
        await driver.switchToWindow(extension);
        await driver.clickElement({ tag: 'button', text: 'Activity' });
        await driver.wait(async () => {
          const pendingTxes = await driver.findElements(
            '.transaction-list__pending-transactions .transaction-list-item',
          );
          return pendingTxes.length === 1;
        }, 10000);

        await driver.waitForSelector({
          css: '.transaction-list-item__primary-currency',
          text: '-1.5 TST',
        });
        const transactionTxt = await driver.waitForSelector({
          // Select the heading of the first transaction list item in the
          // completed transaction list with text matching Send TST
          css: '.transaction-list__completed-transactions .transaction-list-item:first-child .list-item__heading',
          text: 'Send TST',
        });
        await driver.waitForSelector({
          css: '.transaction-list__completed-transactions .transaction-list-item:first-child .transaction-list-item__primary-currency',
          text: '-1.5 TST',
        });
        assert(
          transactionTxt.getText(),
          'Send TST',
          'Transaction is not done correctly',
        );
        // check token amount after transaction
        await driver.clickElement({
          text: 'Assets',
          tag: 'button',
        });
        const assets = await driver.findElement('[title="8.5 TST"]');
        assert.ok(assets, 'Token amount is not correct');
      },
    );
  });
});
