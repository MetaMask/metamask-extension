const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  getWindowHandles,
} = require('../helpers');

describe('Send token from inside MetaMask', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('starts to send a transaction, transitions to the confirm screen, displays the token transfer data, customizes gas, submits the transaction, finds the transaction in the transactions list', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-state',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // create token
        await driver.openNewPage(`http://127.0.0.1:8080/`);
        await driver.waitForSelector({ text: 'Create Token', tag: 'button' });
        await driver.clickElement({ text: 'Create Token', tag: 'button' });

        let windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.switchToWindow(windowHandles.dapp);

        await driver.waitForSelector({
          css: '#tokenAddress',
          text: '0x',
        });

        await driver.clickElement({
          text: 'Add Token to Wallet',
          tag: 'button',
        });

        windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);
        await driver.clickElement({ text: 'Add Token', tag: 'button' });

        await driver.switchToWindow(windowHandles.extension);

        const asset = await driver.waitForSelector({
          css: '.list-item',
          text: '10 TST',
        });
        asset.click();

        await driver.waitForSelector('[data-testid="eth-overview-send"]');
        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.fill(
          'input[placeholder="Search, public address (0x), or ENS"]',
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );
        await driver.fill('.unit-input__input', '1');
        // Continue to next screen

        await driver.waitForSelector(
          '[data-testid="page-container-footer-next"]',
        );
        await driver.clickElement('[data-testid="page-container-footer-next"]');

        const estimatedGasFee = await driver.waitForSelector({
          css: '.currency-display-component__text',
          text: '0.000154',
        });
        assert.notEqual(
          await estimatedGasFee.getText(),
          '0',
          'Estimated gas fee should not be 0',
        );

        await driver.waitForSelector({
          text: '1 TST',
          tag: 'h1',
        });
        await driver.delay(1000);
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
            css:
              '.transaction-list__completed-transactions .transaction-list-item__primary-currency',
            text: '-1 TST',
          },
          { timeout: 10000 },
        );
        const transactionTxt = await driver.waitForSelector({
          css: '.list-item__heading',
          text: 'Send TST',
        });
        assert(
          transactionTxt.getText(),
          'Send TST',
          'Transaction is not done correctly',
        );
      },
    );
  });
});

describe('Send a custom token from dapp', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('sends an already created token', async function () {
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

        // create token
        await driver.openNewPage(`http://127.0.0.1:8080/`);
        await driver.waitForSelector({ text: 'Create Token', tag: 'button' });
        await driver.clickElement({ text: 'Create Token', tag: 'button' });

        let windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.switchToWindow(windowHandles.dapp);

        await driver.waitForSelector({
          css: '#tokenAddress',
          text: '0x',
        });

        await driver.clickElement({
          text: 'Add Token to Wallet',
          tag: 'button',
        });

        windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);
        await driver.clickElement({ text: 'Add Token', tag: 'button' });

        windowHandles = await getWindowHandles(driver, 2);
        await driver.switchToWindow(windowHandles.dapp);

        await driver.clickElement({ text: 'Transfer Tokens', tag: 'button' });
        windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);

        await driver.waitForSelector({ text: '1.5 TST', tag: 'h1' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.switchToWindow(windowHandles.extension);

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

  it('customizes gas, submits the transaction and finds the transaction in the transactions list', async function () {
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

        // create token
        await driver.openNewPage(`http://127.0.0.1:8080/`);
        await driver.waitForSelector({ text: 'Create Token', tag: 'button' });
        await driver.clickElement({ text: 'Create Token', tag: 'button' });

        let windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.switchToWindow(windowHandles.dapp);

        await driver.waitForSelector({
          css: '#tokenAddress',
          text: '0x',
        });

        await driver.clickElement({
          text: 'Add Token to Wallet',
          tag: 'button',
        });

        windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);
        await driver.clickElement({ text: 'Add Token', tag: 'button' });

        await driver.switchToWindow(windowHandles.dapp);

        await driver.clickElement({ text: 'Transfer Tokens', tag: 'button' });

        windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);

        await driver.waitForSelector({ text: '1.5 TST', tag: 'h1' });
        await driver.clickElement({ text: 'Edit', tag: 'button' });

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

        await driver.switchToWindow(windowHandles.extension);

        await driver.clickElement({ tag: 'button', text: 'Activity' });
        await driver.waitForSelector({
          css:
            '.transaction-list__completed-transactions .transaction-list-item__primary-currency',
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
});

describe('Transfers a custom token from dapp when no gas value is specified', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('transfers an already created token without specifying gas, submits the transaction, finds the transaction in the transactions list', async function () {
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

        // create token
        await driver.openNewPage(`http://127.0.0.1:8080/`);
        await driver.waitForSelector({ text: 'Create Token', tag: 'button' });
        await driver.clickElement({ text: 'Create Token', tag: 'button' });

        let windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.switchToWindow(windowHandles.dapp);

        await driver.waitForSelector({
          css: '#tokenAddress',
          text: '0x',
        });

        await driver.clickElement({
          text: 'Add Token to Wallet',
          tag: 'button',
        });

        windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);
        await driver.clickElement({ text: 'Add Token', tag: 'button' });

        await driver.switchToWindow(windowHandles.dapp);

        await driver.clickElement({
          text: 'Transfer Tokens Without Gas',
          tag: 'button',
        });

        windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);
        await driver.waitForSelector({
          tag: 'h1',
          text: '1.5 TST',
        });
        await driver.waitForSelector({ text: 'Confirm', tag: 'button' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.switchToWindow(windowHandles.extension);
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
          css:
            '.transaction-list__completed-transactions .transaction-list-item:first-child .list-item__heading',
          text: 'Send TST',
        });

        await driver.waitForSelector({
          css:
            '.transaction-list__completed-transactions .transaction-list-item:first-child .transaction-list-item__primary-currency',
          text: '-1.5 TST',
        });

        assert(
          transactionTxt.getText(),
          'Send TST',
          'Transaction is not done correctly',
        );

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
