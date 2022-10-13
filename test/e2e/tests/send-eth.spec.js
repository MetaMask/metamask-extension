const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Send ETH from inside MetaMask using default gas', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('finds the transaction in the transactions list', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.fill(
          'input[placeholder="Search, public address (0x), or ENS"]',
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );

        const inputAmount = await driver.findElement('.unit-input__input');
        await inputAmount.fill('1000');

        const errorAmount = await driver.findElement('.send-v2__error-amount');
        assert.equal(
          await errorAmount.getText(),
          'Insufficient funds.',
          'send screen should render an insufficient fund error message',
        );

        await inputAmount.press(driver.Key.BACK_SPACE);
        await inputAmount.press(driver.Key.BACK_SPACE);
        await inputAmount.press(driver.Key.BACK_SPACE);
        await driver.wait(async () => {
          const sendDialogMsgs = await driver.findElements(
            '.send-v2__form div.dialog',
          );
          return sendDialogMsgs.length === 1;
        }, 10000);

        await driver.assertElementNotPresent('.send-v2__error-amount');

        const amountMax = await driver.findClickableElement(
          '.send-v2__amount-max',
        );
        await amountMax.click();

        let inputValue = await inputAmount.getProperty('value');

        assert(Number(inputValue) > 24);

        await amountMax.click();

        assert.equal(await inputAmount.isEnabled(), true);

        await inputAmount.fill('1');

        inputValue = await inputAmount.getProperty('value');
        assert.equal(inputValue, '1');

        // Continue to next screen
        await driver.clickElement({ text: 'Next', tag: 'button' });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .transaction-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        await driver.waitForSelector({
          css: '.transaction-list-item__primary-currency',
          text: '-1 ETH',
        });
      },
    );
  });
});

describe('Send ETH non-contract address with data that matches ERC20 transfer data signature', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('renders the correct recipient on the confirmation screen', async function () {
    await withFixtures(
      {
        fixtures: 'special-settings',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.fill(
          'input[placeholder="Search, public address (0x), or ENS"]',
          '0xc427D562164062a23a5cFf596A4a3208e72Acd28',
        );

        await driver.fill(
          'textarea[placeholder="Optional',
          '0xa9059cbb0000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C970000000000000000000000000000000000000000000000000000000000000000a',
        );

        await driver.clickElement({ text: 'Next', tag: 'button' });

        await driver.clickElement({ text: '0xc42...cd28' });

        const recipientAddress = await driver.findElements({
          text: '0xc427D562164062a23a5cFf596A4a3208e72Acd28',
        });

        assert.equal(recipientAddress.length, 1);
      },
    );
  });
});

/* eslint-disable-next-line mocha/max-top-level-suites */
describe('Send ETH from inside MetaMask using advanced gas modal', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('finds the transaction in the transactions list', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.fill(
          'input[placeholder="Search, public address (0x), or ENS"]',
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );

        const inputAmount = await driver.findElement('.unit-input__input');
        await inputAmount.fill('1');

        const inputValue = await inputAmount.getProperty('value');
        assert.equal(inputValue, '1');

        // Continue to next screen
        await driver.clickElement({ text: 'Next', tag: 'button' });

        const transactionAmounts = await driver.findElements(
          '.currency-display-component__text',
        );
        const transactionAmount = transactionAmounts[0];
        assert.equal(await transactionAmount.getText(), '1');

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .transaction-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        await driver.waitForSelector(
          {
            css: '.transaction-list-item__primary-currency',
            text: '-1 ETH',
          },
          { timeout: 10000 },
        );
      },
    );
  });
});

describe('Send ETH from dapp using advanced gas controls', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('should display the correct gas price on the transaction', async function () {
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

        // goes to the settings screen
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Advanced', tag: 'div' });
        await driver.clickElement(
          '[data-testid="advanced-setting-show-testnet-conversion"] .settings-page__content-item-col > label > div',
        );
        const advancedGasTitle = await driver.findElement({
          text: 'Advanced gas controls',
          tag: 'span',
        });
        await driver.scrollToElement(advancedGasTitle);
        await driver.clickElement(
          '[data-testid="advanced-setting-advanced-gas-inline"] .settings-page__content-item-col > label > div',
        );
        await driver.clickElement('.app-header__logo-container');

        // initiates a send from the dapp
        await driver.openNewPage('http://127.0.0.1:8080/');
        await driver.clickElement({ text: 'Send', tag: 'button' });
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.assertElementNotPresent({ text: 'Data', tag: 'li' });
        await driver.clickElement({ text: 'Edit', tag: 'button' });
        await driver.waitForSelector({
          css: '.transaction-total-banner',
          text: '0.00021 ETH',
        });
        await driver.clickElement(
          { text: 'Edit suggested gas fee', tag: 'button' },
          10000,
        );
        await driver.waitForSelector({
          css: '.transaction-total-banner',
          text: '0.00021 ETH',
        });
        const inputs = await driver.findElements('input[type="number"]');
        const gasPriceInput = inputs[1];
        await gasPriceInput.fill('100');
        await driver.waitForSelector({
          css: '.transaction-total-banner',
          text: '0.0021 ETH',
        });
        await driver.clickElement({ text: 'Save', tag: 'button' });
        await driver.waitForSelector({
          css: '.transaction-detail-item:nth-of-type(1) h6:nth-of-type(2)',
          text: '0.0021 ETH',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);

        // finds the transaction in the transactions list
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
          { timeout: 10000 },
        );
        await driver.waitForSelector({
          css: '.transaction-list-item__primary-currency',
          text: '-0 ETH',
        });

        // the transaction has the expected gas price
        const txValue = await driver.findClickableElement(
          '.transaction-list-item__primary-currency',
        );
        await txValue.click();
        const gasPrice = await driver.waitForSelector({
          css: '[data-testid="transaction-breakdown__gas-price"]',
          text: '100',
        });
        assert.equal(await gasPrice.getText(), '100');
      },
    );
  });
});
