const assert = require('assert');
const { Key } = require('selenium-webdriver');

const enLocaleMessages = require('../../app/_locales/en/messages.json');
const { tinyDelayMs, regularDelayMs, largeDelayMs } = require('./helpers');
const { buildWebDriver } = require('./webdriver');
const Ganache = require('./ganache');

const ganacheServer = new Ganache();

describe('MetaMask', function () {
  let driver;
  let tokenAddress;

  const testSeedPhrase =
    'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent';

  this.timeout(0);
  this.bail(true);

  before(async function () {
    await ganacheServer.start();
    const result = await buildWebDriver();
    driver = result.driver;
    await driver.navigate();
  });

  afterEach(async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const errors = await driver.checkBrowserForConsoleErrors(driver);
      if (errors.length) {
        const errorReports = errors.map((err) => err.message);
        const errorMessage = `Errors found in browser console:\n${errorReports.join(
          '\n',
        )}`;
        console.error(new Error(errorMessage));
      }
    }
    if (this.currentTest.state === 'failed') {
      await driver.verboseReportOnFailure(this.currentTest.title);
    }
  });

  after(async function () {
    await ganacheServer.quit();
    await driver.quit();
  });

  describe('Going through the first time flow', function () {
    it('clicks the continue button on the welcome screen', async function () {
      await driver.findElement('.welcome-page__header');
      await driver.clickElement({
        text: enLocaleMessages.getStarted.message,
        tag: 'button',
      });
      await driver.delay(largeDelayMs);
    });

    it('clicks the "Create New Wallet" option', async function () {
      await driver.clickElement({ text: 'Create a Wallet', tag: 'button' });
      await driver.delay(largeDelayMs);
    });

    it('clicks the "No thanks" option on the metametrics opt-in screen', async function () {
      await driver.clickElement('.btn-default');
      await driver.delay(largeDelayMs);
    });

    it('accepts a secure password', async function () {
      const passwordBox = await driver.findElement(
        '.first-time-flow__form #create-password',
      );
      const passwordBoxConfirm = await driver.findElement(
        '.first-time-flow__form #confirm-password',
      );

      await passwordBox.sendKeys('correct horse battery staple');
      await passwordBoxConfirm.sendKeys('correct horse battery staple');

      await driver.clickElement('.first-time-flow__checkbox');

      await driver.clickElement('.first-time-flow__form button');
      await driver.delay(regularDelayMs);
    });

    let seedPhrase;

    it('reveals the seed phrase', async function () {
      const byRevealButton =
        '.reveal-seed-phrase__secret-blocker .reveal-seed-phrase__reveal-button';
      await driver.findElement(byRevealButton);
      await driver.clickElement(byRevealButton);
      await driver.delay(regularDelayMs);

      const revealedSeedPhrase = await driver.findElement(
        '.reveal-seed-phrase__secret-words',
      );
      seedPhrase = await revealedSeedPhrase.getText();
      assert.equal(seedPhrase.split(' ').length, 12);
      await driver.delay(regularDelayMs);

      await driver.clickElement({
        text: enLocaleMessages.next.message,
        tag: 'button',
      });
      await driver.delay(regularDelayMs);
    });

    async function clickWordAndWait(word) {
      await driver.clickElement(
        `[data-testid="seed-phrase-sorted"] [data-testid="draggable-seed-${word}"]`,
      );
      await driver.delay(tinyDelayMs);
    }

    it('can retype the seed phrase', async function () {
      const words = seedPhrase.split(' ');

      for (const word of words) {
        await clickWordAndWait(word);
      }

      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('clicks through the success screen', async function () {
      await driver.findElement({ text: 'Congratulations', tag: 'div' });
      await driver.clickElement({
        text: enLocaleMessages.endOfFlowMessage10.message,
        tag: 'button',
      });
      await driver.delay(regularDelayMs);
    });
  });

  describe('Show account information', function () {
    it('shows the QR code for the account', async function () {
      await driver.clickElement('[data-testid="account-options-menu-button"]');
      await driver.clickElement(
        '[data-testid="account-options-menu__account-details"]',
      );
      await driver.findVisibleElement('.qr-code__wrapper');
      await driver.delay(regularDelayMs);

      // wait for permission modal to be visible.
      await driver.waitForSelector('span .modal');
      await driver.clickElement('.account-modal__close');

      // wait for account modal to be removed from DOM.
      await driver.waitForSelector('span .modal', { state: 'detached' });
      await driver.delay(regularDelayMs);
    });
  });

  describe('Lock an unlock', function () {
    it('logs out of the account', async function () {
      await driver.clickElement('.account-menu__icon');
      await driver.delay(regularDelayMs);

      const lockButton = await driver.findClickableElement(
        '.account-menu__lock-button',
      );
      assert.equal(await lockButton.getText(), 'Lock');
      await lockButton.click();
      await driver.delay(regularDelayMs);
    });

    it('accepts the account password after lock', async function () {
      const passwordField = await driver.findElement('#password');
      await passwordField.sendKeys('correct horse battery staple');
      await passwordField.sendKeys(Key.ENTER);
      await driver.delay(largeDelayMs * 4);
    });
  });

  describe('Add account', function () {
    it('choose Create Account from the account menu', async function () {
      await driver.clickElement('.account-menu__icon');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Create Account', tag: 'div' });
      await driver.delay(regularDelayMs);
    });

    it('set account name', async function () {
      const accountName = await driver.findElement(
        '.new-account-create-form input',
      );
      await accountName.sendKeys('2nd account');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Create', tag: 'button' });
      await driver.delay(largeDelayMs);
    });

    it('should display correct account name', async function () {
      const accountName = await driver.findElement('.selected-account__name');
      assert.equal(await accountName.getText(), '2nd account');
      await driver.delay(regularDelayMs);
    });
  });

  describe('Import seed phrase', function () {
    it('logs out of the vault', async function () {
      await driver.clickElement('.account-menu__icon');
      await driver.delay(regularDelayMs);

      const lockButton = await driver.findClickableElement(
        '.account-menu__lock-button',
      );
      assert.equal(await lockButton.getText(), 'Lock');
      await lockButton.click();
      await driver.delay(regularDelayMs);
    });

    it('imports seed phrase', async function () {
      const restoreSeedLink = await driver.findClickableElement(
        '.unlock-page__link--import',
      );
      assert.equal(
        await restoreSeedLink.getText(),
        'Import using account seed phrase',
      );
      await restoreSeedLink.click();
      await driver.delay(regularDelayMs);

      await driver.clickElement('.import-account__checkbox-container');

      const seedTextArea = await driver.findElement('textarea');
      await seedTextArea.sendKeys(testSeedPhrase);
      await driver.delay(regularDelayMs);

      const passwordInputs = await driver.findElements('input');
      await driver.delay(regularDelayMs);

      await passwordInputs[0].sendKeys('correct horse battery staple');
      await passwordInputs[1].sendKeys('correct horse battery staple');
      await driver.clickElement({
        text: enLocaleMessages.restore.message,
        tag: 'button',
      });
      await driver.delay(regularDelayMs);
    });

    it('balance renders', async function () {
      await driver.waitForSelector({
        css: '[data-testid="wallet-balance"] .list-item__heading',
        text: '100 ETH',
      });
      await driver.delay(regularDelayMs);
    });
  });

  describe('Send ETH from inside MetaMask using default gas', function () {
    it('starts a send transaction', async function () {
      await driver.clickElement('[data-testid="eth-overview-send"]');
      await driver.delay(regularDelayMs);

      const inputAddress = await driver.findElement(
        'input[placeholder="Search, public address (0x), or ENS"]',
      );
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970');

      const inputAmount = await driver.findElement('.unit-input__input');
      await inputAmount.sendKeys('1000');

      const errorAmount = await driver.findElement('.send-v2__error-amount');
      assert.equal(
        await errorAmount.getText(),
        'Insufficient funds.',
        'send screen should render an insufficient fund error message',
      );

      await inputAmount.sendKeys(Key.BACK_SPACE);
      await driver.delay(50);
      await inputAmount.sendKeys(Key.BACK_SPACE);
      await driver.delay(50);
      await inputAmount.sendKeys(Key.BACK_SPACE);
      await driver.delay(tinyDelayMs);

      await driver.assertElementNotPresent('.send-v2__error-amount');

      const amountMax = await driver.findClickableElement(
        '.send-v2__amount-max',
      );
      await amountMax.click();

      let inputValue = await inputAmount.getAttribute('value');

      assert(Number(inputValue) > 99);

      await amountMax.click();

      assert.equal(await inputAmount.isEnabled(), true);

      await inputAmount.sendKeys('1');

      inputValue = await inputAmount.getAttribute('value');
      assert.equal(inputValue, '1');
      await driver.delay(regularDelayMs);

      // Continue to next screen
      await driver.clickElement({ text: 'Next', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('confirms the transaction', async function () {
      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(largeDelayMs * 2);
    });

    it('finds the transaction in the transactions list', async function () {
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
    });
  });

  describe('Send ETH from inside MetaMask using fast gas option', function () {
    it('starts a send transaction', async function () {
      await driver.clickElement('[data-testid="eth-overview-send"]');
      await driver.delay(regularDelayMs);

      const inputAddress = await driver.findElement(
        'input[placeholder="Search, public address (0x), or ENS"]',
      );
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970');

      const inputAmount = await driver.findElement('.unit-input__input');
      await inputAmount.sendKeys('1');

      const inputValue = await inputAmount.getAttribute('value');
      assert.equal(inputValue, '1');

      // Set the gas price
      await driver.clickElement({ text: 'Fast', tag: 'button/div/div' });
      await driver.delay(regularDelayMs);

      // Continue to next screen
      await driver.clickElement({ text: 'Next', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('confirms the transaction', async function () {
      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(largeDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.waitForSelector(
        '.transaction-list__completed-transactions .transaction-list-item:nth-child(2)',
      );
      await driver.waitForSelector({
        css: '.transaction-list-item__primary-currency',
        text: '-1 ETH',
      });
    });
  });

  describe('Send ETH from inside MetaMask using advanced gas modal', function () {
    it('starts a send transaction', async function () {
      await driver.clickElement('[data-testid="eth-overview-send"]');
      await driver.delay(regularDelayMs);

      const inputAddress = await driver.findElement(
        'input[placeholder="Search, public address (0x), or ENS"]',
      );
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970');

      const inputAmount = await driver.findElement('.unit-input__input');
      await inputAmount.sendKeys('1');

      const inputValue = await inputAmount.getAttribute('value');
      assert.equal(inputValue, '1');

      // Set the gas limit
      await driver.clickElement('.advanced-gas-options-btn');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Save', tag: 'button' });

      // Wait for gas modal to be removed from DOM
      await driver.waitForSelector('span .modal', {
        state: 'detached',
      });
      await driver.delay(regularDelayMs);

      // Continue to next screen
      await driver.clickElement({ text: 'Next', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('confirms the transaction', async function () {
      const transactionAmounts = await driver.findElements(
        '.currency-display-component__text',
      );
      const transactionAmount = transactionAmounts[0];
      assert.equal(await transactionAmount.getText(), '1');

      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(largeDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          '.transaction-list__completed-transactions .transaction-list-item',
        );
        return confirmedTxes.length === 3;
      }, 10000);

      await driver.waitForSelector(
        {
          css: '.transaction-list-item__primary-currency',
          text: '-1 ETH',
        },
        { timeout: 10000 },
      );
    });
  });

  describe('Send ETH from dapp using advanced gas controls', function () {
    let windowHandles;
    let extension;
    let popup;
    let dapp;

    it('goes to the settings screen', async function () {
      await driver.clickElement('.account-menu__icon');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Settings', tag: 'div' });

      // await driver.findElement('.tab-bar')

      await driver.clickElement({ text: 'Advanced', tag: 'div' });
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        '[data-testid="advanced-setting-show-testnet-conversion"] .settings-page__content-item-col > div > div',
      );

      const advancedGasTitle = await driver.findElement({
        text: 'Advanced gas controls',
        tag: 'span',
      });
      await driver.scrollToElement(advancedGasTitle);

      await driver.clickElement(
        '[data-testid="advanced-setting-advanced-gas-inline"] .settings-page__content-item-col > div > div',
      );
      windowHandles = await driver.getAllWindowHandles();
      extension = windowHandles[0];
      await driver.closeAllWindowHandlesExcept([extension]);

      await driver.clickElement('.app-header__logo-container');

      await driver.delay(largeDelayMs);
    });

    it('connects the dapp', async function () {
      await driver.openNewPage('http://127.0.0.1:8080/');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Connect', tag: 'button' });

      await driver.delay(regularDelayMs);

      await driver.waitUntilXWindowHandles(3);
      windowHandles = await driver.getAllWindowHandles();

      extension = windowHandles[0];
      dapp = await driver.switchToWindowWithTitle(
        'E2E Test Dapp',
        windowHandles,
      );
      popup = windowHandles.find(
        (handle) => handle !== extension && handle !== dapp,
      );

      await driver.switchToWindow(popup);

      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Next', tag: 'button' });
      await driver.clickElement({ text: 'Connect', tag: 'button' });

      await driver.waitUntilXWindowHandles(2);
      await driver.switchToWindow(dapp);
      await driver.delay(regularDelayMs);
    });

    it('initiates a send from the dapp', async function () {
      await driver.clickElement({ text: 'Send', tag: 'button' }, 10000);
      await driver.delay(2000);

      windowHandles = await driver.getAllWindowHandles();
      await driver.switchToWindowWithTitle(
        'MetaMask Notification',
        windowHandles,
      );
      await driver.delay(regularDelayMs);

      await driver.assertElementNotPresent({ text: 'Data', tag: 'li' });

      const [gasPriceInput, gasLimitInput] = await driver.findElements(
        '.advanced-gas-inputs__gas-edit-row__input',
      );

      await gasPriceInput.clear();
      await driver.delay(50);
      await gasPriceInput.sendKeys('10');
      await driver.delay(50);
      await driver.delay(tinyDelayMs);
      await driver.delay(50);

      await gasLimitInput.clear();
      await driver.delay(50);
      await gasLimitInput.sendKeys('25000');

      await driver.delay(1000);

      await driver.clickElement({ text: 'Confirm', tag: 'button' }, 10000);
      await driver.delay(regularDelayMs);

      await driver.waitUntilXWindowHandles(2);
      await driver.switchToWindow(extension);
      await driver.delay(regularDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          '.transaction-list__completed-transactions .transaction-list-item',
        );
        return confirmedTxes.length === 4;
      }, 10000);

      await driver.waitForSelector({
        css: '.transaction-list-item__primary-currency',
        text: '-3 ETH',
      });
    });

    it('the transaction has the expected gas price', async function () {
      const txValue = await driver.findClickableElement(
        '.transaction-list-item__primary-currency',
      );
      await txValue.click();
      const popoverCloseButton = await driver.findClickableElement(
        '.popover-header__button',
      );
      await driver.waitForSelector({
        css: '[data-testid="transaction-breakdown__gas-price"]',
        text: '10',
      });
      await popoverCloseButton.click();
    });
  });

  describe('Navigate transactions', function () {
    it('adds multiple transactions', async function () {
      await driver.delay(regularDelayMs);

      await driver.waitUntilXWindowHandles(2);
      const windowHandles = await driver.getAllWindowHandles();
      const extension = windowHandles[0];
      const dapp = windowHandles[1];

      await driver.switchToWindow(dapp);
      await driver.delay(largeDelayMs);

      const send3eth = await driver.findClickableElement({
        text: 'Send',
        tag: 'button',
      });
      await send3eth.click();
      await driver.delay(largeDelayMs);

      const contractDeployment = await driver.findClickableElement({
        text: 'Deploy Contract',
        tag: 'button',
      });
      await contractDeployment.click();
      await driver.delay(largeDelayMs);

      await send3eth.click();
      await driver.delay(largeDelayMs);
      await contractDeployment.click();
      await driver.delay(largeDelayMs);

      await driver.switchToWindow(extension);
      await driver.delay(regularDelayMs);

      await driver.clickElement('.transaction-list-item');
      await driver.delay(largeDelayMs);
    });

    it('navigates the transactions', async function () {
      await driver.clickElement('[data-testid="next-page"]');
      let navigationElement = await driver.findElement(
        '.confirm-page-container-navigation',
      );
      let navigationText = await navigationElement.getText();
      assert.equal(
        navigationText.includes('2'),
        true,
        'changed transaction right',
      );

      await driver.clickElement('[data-testid="next-page"]');
      navigationElement = await driver.findElement(
        '.confirm-page-container-navigation',
      );
      navigationText = await navigationElement.getText();
      assert.equal(
        navigationText.includes('3'),
        true,
        'changed transaction right',
      );

      await driver.clickElement('[data-testid="next-page"]');
      navigationElement = await driver.findElement(
        '.confirm-page-container-navigation',
      );
      navigationText = await navigationElement.getText();
      assert.equal(
        navigationText.includes('4'),
        true,
        'changed transaction right',
      );

      await driver.clickElement('[data-testid="first-page"]');
      navigationElement = await driver.findElement(
        '.confirm-page-container-navigation',
      );
      navigationText = await navigationElement.getText();
      assert.equal(
        navigationText.includes('1'),
        true,
        'navigate to first transaction',
      );

      await driver.clickElement('[data-testid="last-page"]');
      navigationElement = await driver.findElement(
        '.confirm-page-container-navigation',
      );
      navigationText = await navigationElement.getText();
      assert.equal(
        navigationText.split('4').length,
        3,
        'navigate to last transaction',
      );

      await driver.clickElement('[data-testid="previous-page"]');
      navigationElement = await driver.findElement(
        '.confirm-page-container-navigation',
      );
      navigationText = await navigationElement.getText();
      assert.equal(
        navigationText.includes('3'),
        true,
        'changed transaction left',
      );

      await driver.clickElement('[data-testid="previous-page"]');
      navigationElement = await driver.findElement(
        '.confirm-page-container-navigation',
      );
      navigationText = await navigationElement.getText();
      assert.equal(
        navigationText.includes('2'),
        true,
        'changed transaction left',
      );
    });

    it('adds a transaction while confirm screen is in focus', async function () {
      let navigationElement = await driver.findElement(
        '.confirm-page-container-navigation',
      );
      let navigationText = await navigationElement.getText();
      assert.equal(
        navigationText.includes('2'),
        true,
        'second transaction in focus',
      );

      const windowHandles = await driver.getAllWindowHandles();
      const extension = windowHandles[0];
      const dapp = windowHandles[1];

      await driver.switchToWindow(dapp);
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Send', tag: 'button' });
      await driver.delay(regularDelayMs);

      await driver.switchToWindow(extension);
      await driver.delay(regularDelayMs);

      navigationElement = await driver.findElement(
        '.confirm-page-container-navigation',
      );
      navigationText = await navigationElement.getText();
      assert.equal(
        navigationText.includes('2'),
        true,
        'correct (same) transaction in focus',
      );
    });

    it('rejects a transaction', async function () {
      await driver.delay(tinyDelayMs);
      await driver.clickElement({ text: 'Reject', tag: 'button' });
      await driver.delay(largeDelayMs * 2);

      const navigationElement = await driver.findElement(
        '.confirm-page-container-navigation',
      );
      await driver.delay(tinyDelayMs);
      const navigationText = await navigationElement.getText();
      assert.equal(navigationText.includes('4'), true, 'transaction rejected');
    });

    it('confirms a transaction', async function () {
      await driver.delay(tinyDelayMs / 2);
      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(regularDelayMs);

      const navigationElement = await driver.findElement(
        '.confirm-page-container-navigation',
      );
      await driver.delay(tinyDelayMs / 2);
      const navigationText = await navigationElement.getText();
      await driver.delay(tinyDelayMs / 2);
      assert.equal(navigationText.includes('3'), true, 'transaction confirmed');
    });

    it('rejects the rest of the transactions', async function () {
      await driver.clickElement({ text: 'Reject 3', tag: 'a' });
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Reject All', tag: 'button' });
      await driver.delay(largeDelayMs * 2);

      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          '.transaction-list__completed-transactions .transaction-list-item',
        );
        return confirmedTxes.length === 5;
      }, 10000);
    });
  });

  describe('Deploy contract and call contract methods', function () {
    let extension;
    let dapp;
    it('creates a deploy contract transaction', async function () {
      const windowHandles = await driver.getAllWindowHandles();
      extension = windowHandles[0];
      dapp = windowHandles[1];
      await driver.delay(tinyDelayMs);

      await driver.switchToWindow(dapp);
      await driver.delay(regularDelayMs);

      await driver.clickElement('#deployButton');
      await driver.delay(regularDelayMs);

      await driver.switchToWindow(extension);
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Contract Deployment', tag: 'h2' });
      await driver.delay(largeDelayMs);
    });

    it('displays the contract creation data', async function () {
      await driver.clickElement({ text: 'Data', tag: 'button' });
      await driver.delay(regularDelayMs);

      await driver.findElement({ text: '127.0.0.1', tag: 'div' });

      const confirmDataDiv = await driver.findElement(
        '.confirm-page-container-content__data-box',
      );
      const confirmDataText = await confirmDataDiv.getText();
      assert.ok(confirmDataText.includes('Origin:'));
      assert.ok(confirmDataText.includes('127.0.0.1'));
      assert.ok(confirmDataText.includes('Bytes:'));
      assert.ok(confirmDataText.includes('675'));

      await driver.clickElement({ text: 'Details', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('confirms a deploy contract transaction', async function () {
      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(largeDelayMs);

      await driver.waitForSelector(
        '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(6)',
      );

      await driver.waitForSelector(
        {
          css: '.list-item__title',
          text: 'Contract Deployment',
        },
        { timeout: 10000 },
      );
      await driver.delay(regularDelayMs);
    });

    it('calls and confirms a contract method where ETH is sent', async function () {
      await driver.switchToWindow(dapp);
      await driver.delay(regularDelayMs);

      await driver.waitForSelector(
        {
          css: '#contractStatus',
          text: 'Deployed',
        },
        { timeout: 15000 },
      );

      await driver.clickElement('#depositButton');
      await driver.delay(largeDelayMs);

      await driver.waitForSelector(
        {
          css: '#contractStatus',
          text: 'Deposit initiated',
        },
        { timeout: 10000 },
      );

      await driver.switchToWindow(extension);
      await driver.delay(largeDelayMs * 2);

      await driver.findElements('.transaction-list-item--unconfirmed');
      const txListValue = await driver.findClickableElement(
        '.transaction-list-item__primary-currency',
      );
      await driver.waitForSelector(
        {
          css: '.transaction-list-item__primary-currency',
          text: '-4 ETH',
        },
        { timeout: 10000 },
      );
      await txListValue.click();
      await driver.delay(regularDelayMs);

      // Set the gas limit
      await driver.clickElement('.confirm-detail-row__header-text--edit');
      // wait for gas modal to be detached from DOM
      await driver.waitForSelector('span .modal');
      await driver.clickElement('.page-container__tab:nth-of-type(2)');
      await driver.delay(regularDelayMs);

      const [gasPriceInput, gasLimitInput] = await driver.findElements(
        '.advanced-gas-inputs__gas-edit-row__input',
      );
      const gasLimitValue = await gasLimitInput.getAttribute('value');
      assert(Number(gasLimitValue) < 100000, 'Gas Limit too high');

      await gasPriceInput.clear();
      await driver.delay(50);
      await gasPriceInput.sendKeys('10');
      await driver.delay(50);

      await gasLimitInput.clear();
      await driver.delay(50);
      await gasLimitInput.sendKeys('60001');

      await driver.delay(1000);

      await driver.clickElement({ text: 'Save', tag: 'button' });

      // wait for gas modal to be detached from DOM
      await driver.waitForSelector('span .modal', { state: 'detached' });

      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(regularDelayMs);

      await driver.waitForSelector(
        '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(7)',
        { timeout: 10000 },
      );
      await driver.waitForSelector(
        {
          css:
            '.transaction-list__completed-transactions .transaction-list-item__primary-currency',
          text: '-4 ETH',
        },
        { timeout: 10000 },
      );
    });

    it('calls and confirms a contract method where ETH is received', async function () {
      await driver.switchToWindow(dapp);
      await driver.delay(regularDelayMs);

      await driver.clickElement('#withdrawButton');
      await driver.delay(regularDelayMs);

      await driver.switchToWindow(extension);
      await driver.delay(largeDelayMs * 2);

      await driver.clickElement(
        '.transaction-list__pending-transactions  .transaction-list-item',
      );
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(regularDelayMs);

      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          '.transaction-list__completed-transactions .transaction-list-item',
        );
        return confirmedTxes.length === 8;
      }, 10000);

      await driver.waitForSelector(
        {
          css: '.transaction-list-item__primary-currency',
          text: '-0 ETH',
        },
        { timeout: 10000 },
      );

      await driver.closeAllWindowHandlesExcept([extension, dapp]);
      await driver.switchToWindow(extension);
    });

    it('renders the correct ETH balance', async function () {
      const balance = await driver.waitForSelector(
        {
          css: '[data-testid="eth-overview__primary-currency"]',
          text: '87.',
        },
        { timeout: 10000 },
      );
      const tokenAmount = await balance.getText();
      assert.ok(/^87.*\s*ETH.*$/u.test(tokenAmount));
      await driver.delay(regularDelayMs);
    });
  });

  describe('Add a custom token from a dapp', function () {
    it('creates a new token', async function () {
      let windowHandles = await driver.getAllWindowHandles();
      const extension = windowHandles[0];
      const dapp = windowHandles[1];
      await driver.delay(regularDelayMs * 2);

      await driver.switchToWindow(dapp);
      await driver.delay(regularDelayMs * 2);

      await driver.clickElement({ text: 'Create Token', tag: 'button' });
      windowHandles = await driver.waitUntilXWindowHandles(3);

      const popup = windowHandles[2];
      await driver.switchToWindow(popup);
      await driver.delay(regularDelayMs);

      await driver.clickElement('.confirm-detail-row__header-text--edit');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Advanced', tag: 'button' });
      await driver.delay(tinyDelayMs);

      const [gasPriceInput, gasLimitInput] = await driver.findElements(
        '.advanced-gas-inputs__gas-edit-row__input',
      );
      assert(gasPriceInput.getAttribute('value'), 20);
      assert(gasLimitInput.getAttribute('value'), 4700000);

      await driver.clickElement({ text: 'Save', tag: 'button' });
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(regularDelayMs);

      await driver.switchToWindow(dapp);
      await driver.delay(tinyDelayMs);

      const tokenContractAddress = await driver.waitForSelector({
        css: '#tokenAddress',
        text: '0x',
      });
      tokenAddress = await tokenContractAddress.getText();

      await driver.delay(regularDelayMs);
      await driver.closeAllWindowHandlesExcept([extension, dapp]);
      await driver.delay(regularDelayMs);
      await driver.switchToWindow(extension);
      await driver.delay(largeDelayMs);
    });

    it('clicks on the Add Token button', async function () {
      await driver.clickElement(`[data-testid="home__asset-tab"]`);
      await driver.clickElement({ text: 'Add Token', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('picks the newly created Test token', async function () {
      await driver.clickElement({
        text: 'Custom Token',
        tag: 'button',
      });
      await driver.delay(regularDelayMs);

      const newTokenAddress = await driver.findElement('#custom-address');
      await newTokenAddress.sendKeys(tokenAddress);
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Next', tag: 'button' });
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Add Tokens', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('renders the balance for the new token', async function () {
      await driver.waitForSelector({
        css: '.wallet-overview .token-overview__primary-balance',
        text: '10 TST',
      });
      await driver.delay(regularDelayMs);
    });
  });

  describe('Send token from inside MetaMask', function () {
    it('starts to send a transaction', async function () {
      await driver.clickElement('[data-testid="eth-overview-send"]');
      await driver.delay(regularDelayMs);

      const inputAddress = await driver.findElement(
        'input[placeholder="Search, public address (0x), or ENS"]',
      );
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970');

      const inputAmount = await driver.findElement('.unit-input__input');
      await inputAmount.sendKeys('1');
    });

    it('opens customize gas modal and saves options to continue', async function () {
      await driver.clickElement('.advanced-gas-options-btn');

      // Wait for gas modal to be visible
      await driver.waitForSelector('span .modal');
      await driver.findElement('.page-container__title');
      await driver.clickElement({ text: 'Save', tag: 'button' });
      // wait for gas modal to be removed from DOM.
      await driver.waitForSelector('span .modal', { state: 'detached' });
    });

    it('transitions to the confirm screen', async function () {
      // Continue to next screen
      await driver.clickElement({ text: 'Next', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('displays the token transfer data', async function () {
      await driver.clickElement({ text: 'Data', tag: 'button' });
      await driver.delay(regularDelayMs);

      const functionType = await driver.findElement(
        '.confirm-page-container-content__function-type',
      );
      const functionTypeText = await functionType.getText();
      assert.equal(functionTypeText, 'Transfer');

      const tokenAmount = await driver.findElement(
        '.confirm-page-container-summary__title-text',
      );
      const tokenAmountText = await tokenAmount.getText();
      assert.equal(tokenAmountText, '1 TST');

      const confirmDataDiv = await driver.findElement(
        '.confirm-page-container-content__data-box',
      );
      const confirmDataText = await confirmDataDiv.getText();

      await driver.delay(regularDelayMs);
      assert(
        confirmDataText.match(
          /0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c97/u,
        ),
      );

      await driver.clickElement({ text: 'Details', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('submits the transaction', async function () {
      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          '.transaction-list__completed-transactions .transaction-list-item',
        );
        return confirmedTxes.length === 1;
      }, 10000);

      await driver.waitForSelector(
        {
          css: '.transaction-list-item__primary-currency',
          text: '-1 TST',
        },
        { timeout: 10000 },
      );

      await driver.waitForSelector({
        css: '.list-item__heading',
        text: 'Send TST',
      });
    });
  });

  describe('Send a custom token from dapp', function () {
    it('sends an already created token', async function () {
      const windowHandles = await driver.getAllWindowHandles();
      const extension = windowHandles[0];
      const dapp = await driver.switchToWindowWithTitle(
        'E2E Test Dapp',
        windowHandles,
      );
      await driver.delay(regularDelayMs);

      await driver.switchToWindow(dapp);
      await driver.delay(tinyDelayMs);

      await driver.clickElement({ text: 'Transfer Tokens', tag: 'button' });

      await driver.switchToWindow(extension);
      await driver.delay(largeDelayMs);

      await driver.findElements('.transaction-list__pending-transactions');
      await driver.waitForSelector(
        {
          css: '.transaction-list-item__primary-currency',
          text: '-1.5 TST',
        },
        { timeout: 10000 },
      );
      await driver.clickElement('.transaction-list-item__primary-currency');
      await driver.delay(regularDelayMs);

      const transactionAmounts = await driver.findElements(
        '.currency-display-component__text',
      );
      const transactionAmount = transactionAmounts[0];
      assert(await transactionAmount.getText(), '1.5 TST');

      // Set the gas limit
      await driver.clickElement('.confirm-detail-row__header-text--edit');
      await driver.delay(regularDelayMs);

      // wait for gas modal to be visible
      await driver.waitForSelector('span .modal');
    });

    it('customizes gas', async function () {
      await driver.clickElement('.page-container__tab:nth-of-type(2)');
      await driver.delay(regularDelayMs);

      const [gasPriceInput, gasLimitInput] = await driver.findElements(
        '.advanced-gas-inputs__gas-edit-row__input',
      );

      await gasPriceInput.clear();
      await driver.delay(50);
      await gasPriceInput.sendKeys('10');
      await driver.delay(50);

      await gasLimitInput.clear();
      await driver.delay(50);
      await gasLimitInput.sendKeys('60000');

      await driver.delay(1000);

      await driver.clickElement('.page-container__footer-button');

      // Wait for gas modal to be removed from DOM.
      await driver.waitForSelector('span .modal', {
        state: 'detached',
      });

      const gasFeeInputs = await driver.findElements(
        '.confirm-detail-row__primary',
      );
      const renderedGasFee = await gasFeeInputs[0].getText();
      assert.equal(renderedGasFee, '0.0006');
    });

    it('submits the transaction', async function () {
      const tokenAmount = await driver.findElement(
        '.confirm-page-container-summary__title-text',
      );
      const tokenAmountText = await tokenAmount.getText();
      assert.equal(tokenAmountText, '1.5 TST');

      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          '.transaction-list__completed-transactions .transaction-list-item',
        );
        return confirmedTxes.length === 2;
      }, 10000);

      await driver.waitForSelector({
        css: '.transaction-list-item__primary-currency',
        text: '-1.5 TST',
      });

      await driver.waitForSelector({
        css: '.list-item__heading',
        text: 'Send TST',
      });

      await driver.waitForSelector({
        css: '.token-overview__primary-balance',
        text: '7.5 TST',
      });
    });
  });

  describe('Approves a custom token from dapp', function () {
    it('approves an already created token', async function () {
      const windowHandles = await driver.getAllWindowHandles();
      const extension = windowHandles[0];
      const dapp = await driver.switchToWindowWithTitle(
        'E2E Test Dapp',
        windowHandles,
      );
      await driver.closeAllWindowHandlesExcept([extension, dapp]);
      await driver.delay(regularDelayMs);

      await driver.switchToWindow(dapp);
      await driver.delay(tinyDelayMs);

      await driver.clickElement({ text: 'Approve Tokens', tag: 'button' });

      await driver.switchToWindow(extension);
      await driver.delay(regularDelayMs);

      await driver.wait(async () => {
        const pendingTxes = await driver.findElements(
          '.transaction-list__pending-transactions .transaction-list-item',
        );
        return pendingTxes.length === 1;
      }, 10000);

      await driver.waitForSelector({
        // Selects only the very first transaction list item immediately following the 'Pending' header
        css:
          '.transaction-list__pending-transactions .transaction-list__header + .transaction-list-item .list-item__heading',
        text: 'Approve TST spend limit',
      });

      await driver.clickElement('.transaction-list-item');
      await driver.delay(regularDelayMs);
    });

    it('displays the token approval data', async function () {
      await driver.clickElement(
        '.confirm-approve-content__view-full-tx-button',
      );
      await driver.delay(regularDelayMs);

      const functionType = await driver.findElement(
        '.confirm-approve-content__data .confirm-approve-content__small-text',
      );
      const functionTypeText = await functionType.getText();
      assert.equal(functionTypeText, 'Function: Approve');

      const confirmDataDiv = await driver.findElement(
        '.confirm-approve-content__data__data-block',
      );
      const confirmDataText = await confirmDataDiv.getText();
      assert(
        confirmDataText.match(
          /0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef4/u,
        ),
      );
    });

    it('opens the gas edit modal', async function () {
      await driver.clickElement(
        '.confirm-approve-content__small-blue-text.cursor-pointer',
      );
      await driver.delay(regularDelayMs);

      // Wait for the gas modal to be visible
      await driver.waitForSelector('span .modal');
    });

    it('customizes gas', async function () {
      await driver.clickElement('.page-container__tab:nth-of-type(2)');
      await driver.delay(regularDelayMs);

      const [gasPriceInput, gasLimitInput] = await driver.findElements(
        '.advanced-gas-inputs__gas-edit-row__input',
      );

      await gasPriceInput.clear();
      await driver.delay(50);
      await gasPriceInput.sendKeys('10');
      await driver.delay(50);

      await gasLimitInput.clear();
      await driver.delay(50);
      await gasLimitInput.sendKeys('60001');

      await driver.delay(1000);

      await driver.clickElement('.page-container__footer-button');

      // wait for the gas modal to be removed from DOM.
      await driver.waitForSelector('span .modal', {
        state: 'detached',
      });

      const gasFeeInEth = await driver.findElement(
        '.confirm-approve-content__transaction-details-content__secondary-fee',
      );
      assert.equal(await gasFeeInEth.getText(), '0.0006 ETH');
    });

    it('edits the permission', async function () {
      const editButtons = await driver.findClickableElements(
        '.confirm-approve-content__small-blue-text.cursor-pointer',
      );
      await editButtons[1].click();

      // wait for permission modal to be visible
      await driver.waitForSelector('span .modal');
      const radioButtons = await driver.findClickableElements(
        '.edit-approval-permission__edit-section__radio-button',
      );
      await radioButtons[1].click();

      const customInput = await driver.findElement('input');
      await driver.delay(50);
      await customInput.sendKeys('5');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Save', tag: 'button' });

      // wait for permission modal to be removed from DOM.
      await driver.waitForSelector('span .modal', { state: 'detached' });

      const permissionInfo = await driver.findElements(
        '.confirm-approve-content__medium-text',
      );
      const amountDiv = permissionInfo[0];
      assert.equal(await amountDiv.getText(), '5 TST');
    });

    it('submits the transaction', async function () {
      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          '.transaction-list__completed-transactions .transaction-list-item',
        );
        return confirmedTxes.length === 3;
      }, 10000);

      await driver.waitForSelector({
        // Select only the heading of the first entry in the transaction list.
        css:
          '.transaction-list__completed-transactions .transaction-list-item:first-child .list-item__heading',
        text: 'Approve TST spend limit',
      });
    });
  });

  describe('Transfers a custom token from dapp when no gas value is specified', function () {
    it('transfers an already created token, without specifying gas', async function () {
      const windowHandles = await driver.getAllWindowHandles();
      const extension = windowHandles[0];
      const dapp = await driver.switchToWindowWithTitle(
        'E2E Test Dapp',
        windowHandles,
      );
      await driver.closeAllWindowHandlesExcept([extension, dapp]);
      await driver.delay(regularDelayMs);

      await driver.switchToWindow(dapp);

      await driver.clickElement({
        text: 'Transfer Tokens Without Gas',
        tag: 'button',
      });

      await driver.switchToWindow(extension);
      await driver.delay(regularDelayMs);

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
      await driver.clickElement('.transaction-list-item');
      await driver.delay(regularDelayMs);
    });

    it('submits the transaction', async function () {
      await driver.delay(largeDelayMs * 2);
      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(largeDelayMs * 2);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          '.transaction-list__completed-transactions .transaction-list-item',
        );
        return confirmedTxes.length === 4;
      }, 10000);

      await driver.waitForSelector({
        // Select the heading of the first transaction list item in the
        // completed transaction list with text matching Send TST
        css:
          '.transaction-list__completed-transactions .transaction-list-item:first-child .list-item__heading',
        text: 'Send TST',
      });

      await driver.waitForSelector({
        css: '.transaction-list-item__primary-currency',
        text: '-1.5 TST',
      });
    });
  });

  describe('Approves a custom token from dapp when no gas value is specified', function () {
    it('approves an already created token', async function () {
      const windowHandles = await driver.getAllWindowHandles();
      const extension = windowHandles[0];
      const dapp = await driver.switchToWindowWithTitle(
        'E2E Test Dapp',
        windowHandles,
      );
      await driver.closeAllWindowHandlesExcept([extension, dapp]);
      await driver.delay(regularDelayMs);

      await driver.switchToWindow(dapp);
      await driver.delay(tinyDelayMs);

      await driver.clickElement({
        text: 'Approve Tokens Without Gas',
        tag: 'button',
      });

      await driver.switchToWindow(extension);
      await driver.delay(regularDelayMs);

      await driver.wait(async () => {
        const pendingTxes = await driver.findElements(
          '.transaction-list__pending-transactions .transaction-list-item',
        );
        return pendingTxes.length === 1;
      }, 10000);

      await driver.waitForSelector({
        // Selects only the very first transaction list item immediately following the 'Pending' header
        css:
          '.transaction-list__pending-transactions .transaction-list__header + .transaction-list-item .list-item__heading',
        text: 'Approve TST spend limit',
      });

      await driver.clickElement('.transaction-list-item');
      await driver.delay(regularDelayMs);
    });

    it('shows the correct recipient', async function () {
      await driver.clickElement(
        '.confirm-approve-content__view-full-tx-button',
      );
      await driver.delay(regularDelayMs);

      const permissionInfo = await driver.findElements(
        '.confirm-approve-content__medium-text',
      );
      const recipientDiv = permissionInfo[1];
      assert.equal(await recipientDiv.getText(), '0x2f318C33...C970');
    });

    it('submits the transaction', async function () {
      await driver.delay(1000);
      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          '.transaction-list__completed-transactions .transaction-list-item',
        );
        return confirmedTxes.length === 5;
      }, 10000);

      await driver.waitForSelector({
        css:
          '.transaction-list__completed-transactions .transaction-list-item:first-child .list-item__heading',
        text: 'Approve TST spend limit',
      });
    });
  });

  describe('Hide token', function () {
    it('hides the token when clicked', async function () {
      await driver.clickElement('[data-testid="token-options__button"]');

      await driver.clickElement('[data-testid="token-options__hide"]');

      // wait for confirm hide modal to be visible
      await driver.waitForSelector('span .modal');

      await driver.clickElement(
        '[data-testid="hide-token-confirmation__hide"]',
      );

      // wait for confirm hide modal to be removed from DOM.
      await driver.waitForSelector('span .modal', { state: 'detached' });
    });
  });

  describe('Add existing token using search', function () {
    it('clicks on the Add Token button', async function () {
      await driver.clickElement({ text: 'Add Token', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('can pick a token from the existing options', async function () {
      const tokenSearch = await driver.findElement('#search-tokens');
      await tokenSearch.sendKeys('BAT');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'BAT', tag: 'span' });
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Next', tag: 'button' });
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Add Tokens', tag: 'button' });
      await driver.delay(largeDelayMs);
    });

    it('renders the balance for the chosen token', async function () {
      await driver.waitForSelector({
        css: '.token-overview__primary-balance',
        text: '0 BAT',
      });
      await driver.delay(regularDelayMs);
    });
  });

  describe('Stores custom RPC history', function () {
    it(`creates first custom RPC entry`, async function () {
      const rpcUrl = 'http://127.0.0.1:8545/1';
      const chainId = '0x539'; // Ganache default, decimal 1337

      await driver.clickElement('.network-display');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Custom RPC', tag: 'span' });
      await driver.delay(regularDelayMs);

      await driver.findElement('.settings-page__sub-header-text');

      const customRpcInputs = await driver.findElements('input[type="text"]');
      const rpcUrlInput = customRpcInputs[1];
      const chainIdInput = customRpcInputs[2];

      await rpcUrlInput.clear();
      await rpcUrlInput.sendKeys(rpcUrl);

      await chainIdInput.clear();
      await chainIdInput.sendKeys(chainId);

      await driver.clickElement('.network-form__footer .btn-secondary');
      await driver.findElement({ text: rpcUrl, tag: 'div' });
    });

    it(`creates second custom RPC entry`, async function () {
      const rpcUrl = 'http://127.0.0.1:8545/2';
      const chainId = '0x539'; // Ganache default, decimal 1337

      await driver.clickElement('.network-display');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Custom RPC', tag: 'span' });
      await driver.delay(regularDelayMs);

      await driver.findElement('.settings-page__sub-header-text');

      const customRpcInputs = await driver.findElements('input[type="text"]');
      const rpcUrlInput = customRpcInputs[1];
      const chainIdInput = customRpcInputs[2];

      await rpcUrlInput.clear();
      await rpcUrlInput.sendKeys(rpcUrl);

      await chainIdInput.clear();
      await chainIdInput.sendKeys(chainId);

      await driver.clickElement('.network-form__footer .btn-secondary');
      await driver.findElement({ text: rpcUrl, tag: 'div' });
    });

    it('selects another provider', async function () {
      await driver.clickElement('.network-display');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'span' });
      await driver.delay(largeDelayMs * 2);
    });

    it('finds all recent RPCs in history', async function () {
      await driver.clickElement('.network-display');
      await driver.delay(regularDelayMs);

      // only recent 3 are found and in correct order (most recent at the top)
      const customRpcs = await driver.findElements({
        text: 'http://127.0.0.1:8545/',
        tag: 'span',
      });

      // click Mainnet to dismiss network dropdown
      await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'span' });

      assert.equal(customRpcs.length, 2);
    });

    it('deletes a custom RPC', async function () {
      const networkListItems = await driver.findClickableElements(
        '.networks-tab__networks-list-name',
      );
      const lastNetworkListItem = networkListItems[networkListItems.length - 1];
      await lastNetworkListItem.click();
      await driver.delay(100);

      await driver.clickElement('.btn-danger');
      await driver.delay(regularDelayMs);

      // wait for confirm delete modal to be visible.
      await driver.waitForSelector('span .modal');

      await driver.clickElement(
        '.button.btn-danger.modal-container__footer-button',
      );

      // wait for confirm delete modal to be removed from DOM.
      await driver.waitForSelector('span .modal', { state: 'detached' });

      const newNetworkListItems = await driver.findElements(
        '.networks-tab__networks-list-name',
      );

      assert.equal(networkListItems.length - 1, newNetworkListItems.length);
    });
  });
});
