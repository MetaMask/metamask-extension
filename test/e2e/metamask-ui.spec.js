const assert = require('assert');
const webdriver = require('selenium-webdriver');

const { By, Key, until } = webdriver;
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
      await driver.findElement(By.css('.welcome-page__header'));
      await driver.clickElement(
        By.xpath(
          `//button[contains(text(), '${enLocaleMessages.getStarted.message}')]`,
        ),
      );
      await driver.delay(largeDelayMs);
    });

    it('clicks the "Create New Wallet" option', async function () {
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Create a Wallet')]`),
      );
      await driver.delay(largeDelayMs);
    });

    it('clicks the "No thanks" option on the metametrics opt-in screen', async function () {
      await driver.clickElement(By.css('.btn-default'));
      await driver.delay(largeDelayMs);
    });

    it('accepts a secure password', async function () {
      const passwordBox = await driver.findElement(
        By.css('.first-time-flow__form #create-password'),
      );
      const passwordBoxConfirm = await driver.findElement(
        By.css('.first-time-flow__form #confirm-password'),
      );

      await passwordBox.sendKeys('correct horse battery staple');
      await passwordBoxConfirm.sendKeys('correct horse battery staple');

      await driver.clickElement(By.css('.first-time-flow__checkbox'));

      await driver.clickElement(By.css('.first-time-flow__form button'));
      await driver.delay(regularDelayMs);
    });

    let seedPhrase;

    it('reveals the seed phrase', async function () {
      const byRevealButton = By.css(
        '.reveal-seed-phrase__secret-blocker .reveal-seed-phrase__reveal-button',
      );
      await driver.findElement(byRevealButton);
      await driver.clickElement(byRevealButton);
      await driver.delay(regularDelayMs);

      const revealedSeedPhrase = await driver.findElement(
        By.css('.reveal-seed-phrase__secret-words'),
      );
      seedPhrase = await revealedSeedPhrase.getText();
      assert.equal(seedPhrase.split(' ').length, 12);
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.xpath(
          `//button[contains(text(), '${enLocaleMessages.next.message}')]`,
        ),
      );
      await driver.delay(regularDelayMs);
    });

    async function clickWordAndWait(word) {
      await driver.clickElement(
        By.css(
          `[data-testid="seed-phrase-sorted"] [data-testid="draggable-seed-${word}"]`,
        ),
      );
      await driver.delay(tinyDelayMs);
    }

    it('can retype the seed phrase', async function () {
      const words = seedPhrase.split(' ');

      for (const word of words) {
        await clickWordAndWait(word);
      }

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`),
      );
      await driver.delay(regularDelayMs);
    });

    it('clicks through the success screen', async function () {
      await driver.findElement(
        By.xpath(`//div[contains(text(), 'Congratulations')]`),
      );
      await driver.clickElement(
        By.xpath(
          `//button[contains(text(), '${enLocaleMessages.endOfFlowMessage10.message}')]`,
        ),
      );
      await driver.delay(regularDelayMs);
    });
  });

  describe('Show account information', function () {
    it('shows the QR code for the account', async function () {
      await driver.clickElement(
        By.css('[data-testid="account-options-menu-button"]'),
      );
      await driver.clickElement(
        By.css('[data-testid="account-options-menu__account-details"]'),
      );
      await driver.findVisibleElement(By.css('.qr-code__wrapper'));
      await driver.delay(regularDelayMs);

      const accountModal = await driver.findElement(By.css('span .modal'));
      await driver.clickElement(By.css('.account-modal__close'));

      await driver.wait(until.stalenessOf(accountModal));
      await driver.delay(regularDelayMs);
    });
  });

  describe('Lock an unlock', function () {
    it('logs out of the account', async function () {
      await driver.clickElement(By.css('.account-menu__icon'));
      await driver.delay(regularDelayMs);

      const lockButton = await driver.findClickableElement(
        By.css('.account-menu__lock-button'),
      );
      assert.equal(await lockButton.getText(), 'Lock');
      await lockButton.click();
      await driver.delay(regularDelayMs);
    });

    it('accepts the account password after lock', async function () {
      const passwordField = await driver.findElement(By.id('password'));
      await passwordField.sendKeys('correct horse battery staple');
      await passwordField.sendKeys(Key.ENTER);
      await driver.delay(largeDelayMs * 4);
    });
  });

  describe('Add account', function () {
    it('choose Create Account from the account menu', async function () {
      await driver.clickElement(By.css('.account-menu__icon'));
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.xpath(`//div[contains(text(), 'Create Account')]`),
      );
      await driver.delay(regularDelayMs);
    });

    it('set account name', async function () {
      const accountName = await driver.findElement(
        By.css('.new-account-create-form input'),
      );
      await accountName.sendKeys('2nd account');
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Create')]`),
      );
      await driver.delay(largeDelayMs);
    });

    it('should display correct account name', async function () {
      const accountName = await driver.findElement(
        By.css('.selected-account__name'),
      );
      assert.equal(await accountName.getText(), '2nd account');
      await driver.delay(regularDelayMs);
    });
  });

  describe('Import seed phrase', function () {
    it('logs out of the vault', async function () {
      await driver.clickElement(By.css('.account-menu__icon'));
      await driver.delay(regularDelayMs);

      const lockButton = await driver.findClickableElement(
        By.css('.account-menu__lock-button'),
      );
      assert.equal(await lockButton.getText(), 'Lock');
      await lockButton.click();
      await driver.delay(regularDelayMs);
    });

    it('imports seed phrase', async function () {
      const restoreSeedLink = await driver.findClickableElement(
        By.css('.unlock-page__link--import'),
      );
      assert.equal(
        await restoreSeedLink.getText(),
        'Import using account seed phrase',
      );
      await restoreSeedLink.click();
      await driver.delay(regularDelayMs);

      await driver.clickElement(By.css('.import-account__checkbox-container'));

      const seedTextArea = await driver.findElement(By.css('textarea'));
      await seedTextArea.sendKeys(testSeedPhrase);
      await driver.delay(regularDelayMs);

      const passwordInputs = await driver.findElements(By.css('input'));
      await driver.delay(regularDelayMs);

      await passwordInputs[0].sendKeys('correct horse battery staple');
      await passwordInputs[1].sendKeys('correct horse battery staple');
      await driver.clickElement(
        By.xpath(
          `//button[contains(text(), '${enLocaleMessages.restore.message}')]`,
        ),
      );
      await driver.delay(regularDelayMs);
    });

    it('balance renders', async function () {
      const balance = await driver.findElement(
        By.css('[data-testid="wallet-balance"] .list-item__heading'),
      );
      await driver.wait(until.elementTextMatches(balance, /100\s*ETH/u));
      await driver.delay(regularDelayMs);
    });
  });

  describe('Send ETH from inside MetaMask using default gas', function () {
    it('starts a send transaction', async function () {
      await driver.clickElement(By.css('[data-testid="eth-overview-send"]'));
      await driver.delay(regularDelayMs);

      const inputAddress = await driver.findElement(
        By.css('input[placeholder="Search, public address (0x), or ENS"]'),
      );
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970');

      const inputAmount = await driver.findElement(
        By.css('.unit-input__input'),
      );
      await inputAmount.sendKeys('1000');

      const errorAmount = await driver.findElement(
        By.css('.send-v2__error-amount'),
      );
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

      await driver.assertElementNotPresent(By.css('.send-v2__error-amount'));

      const amountMax = await driver.findClickableElement(
        By.css('.send-v2__amount-max'),
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
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Next')]`));
      await driver.delay(regularDelayMs);
    });

    it('confirms the transaction', async function () {
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`),
      );
      await driver.delay(largeDelayMs * 2);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.clickElement(By.css('[data-testid="home__activity-tab"]'));
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          By.css(
            '.transaction-list__completed-transactions .transaction-list-item',
          ),
        );
        return confirmedTxes.length === 1;
      }, 10000);

      const txValues = await driver.findElement(
        By.css('.transaction-list-item__primary-currency'),
      );
      await driver.wait(until.elementTextMatches(txValues, /-1\s*ETH/u), 10000);
    });
  });

  describe('Send ETH from inside MetaMask using fast gas option', function () {
    it('starts a send transaction', async function () {
      await driver.clickElement(By.css('[data-testid="eth-overview-send"]'));
      await driver.delay(regularDelayMs);

      const inputAddress = await driver.findElement(
        By.css('input[placeholder="Search, public address (0x), or ENS"]'),
      );
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970');

      const inputAmount = await driver.findElement(
        By.css('.unit-input__input'),
      );
      await inputAmount.sendKeys('1');

      const inputValue = await inputAmount.getAttribute('value');
      assert.equal(inputValue, '1');

      // Set the gas price
      await driver.clickElement(
        By.xpath(`//button/div/div[contains(text(), "Fast")]`),
      );
      await driver.delay(regularDelayMs);

      // Continue to next screen
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Next')]`));
      await driver.delay(regularDelayMs);
    });

    it('confirms the transaction', async function () {
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`),
      );
      await driver.delay(largeDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          By.css(
            '.transaction-list__completed-transactions .transaction-list-item',
          ),
        );
        return confirmedTxes.length === 2;
      }, 10000);

      const txValues = await driver.findElement(
        By.css('.transaction-list-item__primary-currency'),
      );
      await driver.wait(until.elementTextMatches(txValues, /-1\s*ETH/u), 10000);
    });
  });

  describe('Send ETH from inside MetaMask using advanced gas modal', function () {
    it('starts a send transaction', async function () {
      await driver.clickElement(By.css('[data-testid="eth-overview-send"]'));
      await driver.delay(regularDelayMs);

      const inputAddress = await driver.findElement(
        By.css('input[placeholder="Search, public address (0x), or ENS"]'),
      );
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970');

      const inputAmount = await driver.findElement(
        By.css('.unit-input__input'),
      );
      await inputAmount.sendKeys('1');

      const inputValue = await inputAmount.getAttribute('value');
      assert.equal(inputValue, '1');

      // Set the gas limit
      await driver.clickElement(By.css('.advanced-gas-options-btn'));
      await driver.delay(regularDelayMs);

      const gasModal = await driver.findElement(By.css('span .modal'));
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Save')]`));
      await driver.wait(until.stalenessOf(gasModal));
      await driver.delay(regularDelayMs);

      // Continue to next screen
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Next')]`));
      await driver.delay(regularDelayMs);
    });

    it('confirms the transaction', async function () {
      const transactionAmounts = await driver.findElements(
        By.css('.currency-display-component__text'),
      );
      const transactionAmount = transactionAmounts[0];
      assert.equal(await transactionAmount.getText(), '1');

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`),
      );
      await driver.delay(largeDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          By.css(
            '.transaction-list__completed-transactions .transaction-list-item',
          ),
        );
        return confirmedTxes.length === 3;
      }, 10000);

      const txValues = await driver.findElement(
        By.css('.transaction-list-item__primary-currency'),
      );
      await driver.wait(until.elementTextMatches(txValues, /-1\s*ETH/u), 10000);
    });
  });

  describe('Send ETH from dapp using advanced gas controls', function () {
    let windowHandles;
    let extension;
    let popup;
    let dapp;

    it('goes to the settings screen', async function () {
      await driver.clickElement(By.css('.account-menu__icon'));
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.xpath(`//div[contains(text(), 'Settings')]`),
      );

      // await driver.findElement(By.css('.tab-bar'))

      await driver.clickElement(
        By.xpath(`//div[contains(text(), 'Advanced')]`),
      );
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.css(
          '[data-testid="advanced-setting-show-testnet-conversion"] .settings-page__content-item-col > div > div',
        ),
      );

      const advancedGasTitle = await driver.findElement(
        By.xpath(`//span[contains(text(), 'Advanced gas controls')]`),
      );
      await driver.scrollToElement(advancedGasTitle);

      await driver.clickElement(
        By.css(
          '[data-testid="advanced-setting-advanced-gas-inline"] .settings-page__content-item-col > div > div',
        ),
      );
      windowHandles = await driver.getAllWindowHandles();
      extension = windowHandles[0];
      await driver.closeAllWindowHandlesExcept([extension]);

      await driver.clickElement(By.css('.app-header__logo-container'));

      await driver.delay(largeDelayMs);
    });

    it('connects the dapp', async function () {
      await driver.openNewPage('http://127.0.0.1:8080/');
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Connect')]`),
      );

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

      await driver.clickElement(By.xpath(`//button[contains(text(), 'Next')]`));
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Connect')]`),
      );

      await driver.waitUntilXWindowHandles(2);
      await driver.switchToWindow(dapp);
      await driver.delay(regularDelayMs);
    });

    it('initiates a send from the dapp', async function () {
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Send')]`),
        10000,
      );
      await driver.delay(2000);

      windowHandles = await driver.getAllWindowHandles();
      await driver.switchToWindowWithTitle(
        'MetaMask Notification',
        windowHandles,
      );
      await driver.delay(regularDelayMs);

      await driver.assertElementNotPresent(
        By.xpath(`//li[contains(text(), 'Data')]`),
      );

      const [gasPriceInput, gasLimitInput] = await driver.findElements(
        By.css('.advanced-gas-inputs__gas-edit-row__input'),
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

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`),
        10000,
      );
      await driver.delay(regularDelayMs);

      await driver.waitUntilXWindowHandles(2);
      await driver.switchToWindow(extension);
      await driver.delay(regularDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          By.css(
            '.transaction-list__completed-transactions .transaction-list-item',
          ),
        );
        return confirmedTxes.length === 4;
      }, 10000);

      const txValue = await driver.findClickableElement(
        By.css('.transaction-list-item__primary-currency'),
      );
      await driver.wait(until.elementTextMatches(txValue, /-3\s*ETH/u), 10000);
    });

    it('the transaction has the expected gas price', async function () {
      const txValue = await driver.findClickableElement(
        By.css('.transaction-list-item__primary-currency'),
      );
      await txValue.click();
      const popoverCloseButton = await driver.findClickableElement(
        By.css('.popover-header__button'),
      );
      const txGasPrice = await driver.findElement(
        By.css('[data-testid="transaction-breakdown__gas-price"]'),
      );
      await driver.wait(until.elementTextMatches(txGasPrice, /^10$/u), 10000);
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

      const send3eth = await driver.findClickableElement(
        By.xpath(`//button[contains(text(), 'Send')]`),
      );
      await send3eth.click();
      await driver.delay(largeDelayMs);

      const contractDeployment = await driver.findClickableElement(
        By.xpath(`//button[contains(text(), 'Deploy Contract')]`),
      );
      await contractDeployment.click();
      await driver.delay(largeDelayMs);

      await send3eth.click();
      await driver.delay(largeDelayMs);
      await contractDeployment.click();
      await driver.delay(largeDelayMs);

      await driver.switchToWindow(extension);
      await driver.delay(regularDelayMs);

      await driver.clickElement(By.css('.transaction-list-item'));
      await driver.delay(largeDelayMs);
    });

    it('navigates the transactions', async function () {
      await driver.clickElement(By.css('[data-testid="next-page"]'));
      let navigationElement = await driver.findElement(
        By.css('.confirm-page-container-navigation'),
      );
      let navigationText = await navigationElement.getText();
      assert.equal(
        navigationText.includes('2'),
        true,
        'changed transaction right',
      );

      await driver.clickElement(By.css('[data-testid="next-page"]'));
      navigationElement = await driver.findElement(
        By.css('.confirm-page-container-navigation'),
      );
      navigationText = await navigationElement.getText();
      assert.equal(
        navigationText.includes('3'),
        true,
        'changed transaction right',
      );

      await driver.clickElement(By.css('[data-testid="next-page"]'));
      navigationElement = await driver.findElement(
        By.css('.confirm-page-container-navigation'),
      );
      navigationText = await navigationElement.getText();
      assert.equal(
        navigationText.includes('4'),
        true,
        'changed transaction right',
      );

      await driver.clickElement(By.css('[data-testid="first-page"]'));
      navigationElement = await driver.findElement(
        By.css('.confirm-page-container-navigation'),
      );
      navigationText = await navigationElement.getText();
      assert.equal(
        navigationText.includes('1'),
        true,
        'navigate to first transaction',
      );

      await driver.clickElement(By.css('[data-testid="last-page"]'));
      navigationElement = await driver.findElement(
        By.css('.confirm-page-container-navigation'),
      );
      navigationText = await navigationElement.getText();
      assert.equal(
        navigationText.split('4').length,
        3,
        'navigate to last transaction',
      );

      await driver.clickElement(By.css('[data-testid="previous-page"]'));
      navigationElement = await driver.findElement(
        By.css('.confirm-page-container-navigation'),
      );
      navigationText = await navigationElement.getText();
      assert.equal(
        navigationText.includes('3'),
        true,
        'changed transaction left',
      );

      await driver.clickElement(By.css('[data-testid="previous-page"]'));
      navigationElement = await driver.findElement(
        By.css('.confirm-page-container-navigation'),
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
        By.css('.confirm-page-container-navigation'),
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

      await driver.clickElement(By.xpath(`//button[contains(text(), 'Send')]`));
      await driver.delay(regularDelayMs);

      await driver.switchToWindow(extension);
      await driver.delay(regularDelayMs);

      navigationElement = await driver.findElement(
        By.css('.confirm-page-container-navigation'),
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
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Reject')]`),
      );
      await driver.delay(largeDelayMs * 2);

      const navigationElement = await driver.findElement(
        By.css('.confirm-page-container-navigation'),
      );
      await driver.delay(tinyDelayMs);
      const navigationText = await navigationElement.getText();
      assert.equal(navigationText.includes('4'), true, 'transaction rejected');
    });

    it('confirms a transaction', async function () {
      await driver.delay(tinyDelayMs / 2);
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`),
      );
      await driver.delay(regularDelayMs);

      const navigationElement = await driver.findElement(
        By.css('.confirm-page-container-navigation'),
      );
      await driver.delay(tinyDelayMs / 2);
      const navigationText = await navigationElement.getText();
      await driver.delay(tinyDelayMs / 2);
      assert.equal(navigationText.includes('3'), true, 'transaction confirmed');
    });

    it('rejects the rest of the transactions', async function () {
      await driver.clickElement(By.xpath(`//a[contains(text(), 'Reject 3')]`));
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Reject All')]`),
      );
      await driver.delay(largeDelayMs * 2);

      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          By.css(
            '.transaction-list__completed-transactions .transaction-list-item',
          ),
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

      await driver.clickElement(By.css('#deployButton'));
      await driver.delay(regularDelayMs);

      await driver.switchToWindow(extension);
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.xpath(`//h2[contains(text(), 'Contract Deployment')]`),
      );
      await driver.delay(largeDelayMs);
    });

    it('displays the contract creation data', async function () {
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Data')]`));
      await driver.delay(regularDelayMs);

      await driver.findElement(
        By.xpath(`//div[contains(text(), '127.0.0.1')]`),
      );

      const confirmDataDiv = await driver.findElement(
        By.css('.confirm-page-container-content__data-box'),
      );
      const confirmDataText = await confirmDataDiv.getText();
      assert.ok(confirmDataText.includes('Origin:'));
      assert.ok(confirmDataText.includes('127.0.0.1'));
      assert.ok(confirmDataText.includes('Bytes:'));
      assert.ok(confirmDataText.includes('675'));

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Details')]`),
      );
      await driver.delay(regularDelayMs);
    });

    it('confirms a deploy contract transaction', async function () {
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`),
      );
      await driver.delay(largeDelayMs);

      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          By.css(
            '.transaction-list__completed-transactions .transaction-list-item',
          ),
        );
        return confirmedTxes.length === 6;
      }, 10000);

      const txAction = await driver.findElements(By.css('.list-item__heading'));
      await driver.wait(
        until.elementTextMatches(txAction[0], /Contract\sDeployment/u),
        10000,
      );
      await driver.delay(regularDelayMs);
    });

    it('calls and confirms a contract method where ETH is sent', async function () {
      await driver.switchToWindow(dapp);
      await driver.delay(regularDelayMs);

      let contractStatus = await driver.findElement(By.css('#contractStatus'));
      await driver.wait(
        until.elementTextMatches(contractStatus, /Deployed/u),
        15000,
      );

      await driver.clickElement(By.css('#depositButton'));
      await driver.delay(largeDelayMs);

      contractStatus = await driver.findElement(By.css('#contractStatus'));
      await driver.wait(
        until.elementTextMatches(contractStatus, /Deposit\sinitiated/u),
        10000,
      );

      await driver.switchToWindow(extension);
      await driver.delay(largeDelayMs * 2);

      await driver.findElements(By.css('.transaction-list-item--unconfirmed'));
      const txListValue = await driver.findClickableElement(
        By.css('.transaction-list-item__primary-currency'),
      );
      await driver.wait(
        until.elementTextMatches(txListValue, /-4\s*ETH/u),
        10000,
      );
      await txListValue.click();
      await driver.delay(regularDelayMs);

      // Set the gas limit
      await driver.clickElement(
        By.css('.confirm-detail-row__header-text--edit'),
      );
      await driver.delay(regularDelayMs);

      const gasModal = await driver.findElement(By.css('span .modal'));
      await driver.delay(regularDelayMs);
      await driver.clickElement(By.css('.page-container__tab:nth-of-type(2)'));
      await driver.delay(regularDelayMs);

      const [gasPriceInput, gasLimitInput] = await driver.findElements(
        By.css('.advanced-gas-inputs__gas-edit-row__input'),
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

      await driver.clickElement(By.xpath(`//button[contains(text(), 'Save')]`));
      await driver.delay(regularDelayMs);

      await driver.wait(until.stalenessOf(gasModal));

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`),
      );
      await driver.delay(regularDelayMs);

      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          By.css(
            '.transaction-list__completed-transactions .transaction-list-item',
          ),
        );
        return confirmedTxes.length === 7;
      }, 10000);

      const txValues = await driver.findElements(
        By.css('.transaction-list-item__primary-currency'),
      );
      await driver.wait(
        until.elementTextMatches(txValues[0], /-4\s*ETH/u),
        10000,
      );
    });

    it('calls and confirms a contract method where ETH is received', async function () {
      await driver.switchToWindow(dapp);
      await driver.delay(regularDelayMs);

      await driver.clickElement(By.css('#withdrawButton'));
      await driver.delay(regularDelayMs);

      await driver.switchToWindow(extension);
      await driver.delay(largeDelayMs * 2);

      await driver.clickElement(
        By.css(
          '.transaction-list__pending-transactions  .transaction-list-item',
        ),
      );
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`),
      );
      await driver.delay(regularDelayMs);

      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          By.css(
            '.transaction-list__completed-transactions .transaction-list-item',
          ),
        );
        return confirmedTxes.length === 8;
      }, 10000);

      const txValues = await driver.findElement(
        By.css('.transaction-list-item__primary-currency'),
      );
      await driver.wait(until.elementTextMatches(txValues, /-0\s*ETH/u), 10000);

      await driver.closeAllWindowHandlesExcept([extension, dapp]);
      await driver.switchToWindow(extension);
    });

    it('renders the correct ETH balance', async function () {
      const balance = await driver.findElement(
        By.css('[data-testid="eth-overview__primary-currency"]'),
      );
      await driver.delay(regularDelayMs);
      await driver.wait(
        until.elementTextMatches(balance, /^87.*\s*ETH.*$/u),
        10000,
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

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Create Token')]`),
      );
      windowHandles = await driver.waitUntilXWindowHandles(3);

      const popup = windowHandles[2];
      await driver.switchToWindow(popup);
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.css('.confirm-detail-row__header-text--edit'),
      );
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Advanced')]`),
      );
      await driver.delay(tinyDelayMs);

      const [gasPriceInput, gasLimitInput] = await driver.findElements(
        By.css('.advanced-gas-inputs__gas-edit-row__input'),
      );
      assert(gasPriceInput.getAttribute('value'), 20);
      assert(gasLimitInput.getAttribute('value'), 4700000);

      await driver.clickElement(By.xpath(`//button[contains(text(), 'Save')]`));
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`),
      );
      await driver.delay(regularDelayMs);

      await driver.switchToWindow(dapp);
      await driver.delay(tinyDelayMs);

      const tokenContractAddress = await driver.findElement(
        By.css('#tokenAddress'),
      );
      await driver.wait(until.elementTextMatches(tokenContractAddress, /0x/u));
      tokenAddress = await tokenContractAddress.getText();

      await driver.delay(regularDelayMs);
      await driver.closeAllWindowHandlesExcept([extension, dapp]);
      await driver.delay(regularDelayMs);
      await driver.switchToWindow(extension);
      await driver.delay(largeDelayMs);
    });

    it('clicks on the Add Token button', async function () {
      await driver.clickElement(By.css(`[data-testid="home__asset-tab"]`));
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Add Token')]`),
      );
      await driver.delay(regularDelayMs);
    });

    it('picks the newly created Test token', async function () {
      await driver.clickElement(
        By.xpath("//button[contains(text(), 'Custom Token')]"),
      );
      await driver.delay(regularDelayMs);

      const newTokenAddress = await driver.findElement(
        By.css('#custom-address'),
      );
      await newTokenAddress.sendKeys(tokenAddress);
      await driver.delay(regularDelayMs);

      await driver.clickElement(By.xpath(`//button[contains(text(), 'Next')]`));
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Add Tokens')]`),
      );
      await driver.delay(regularDelayMs);
    });

    it('renders the balance for the new token', async function () {
      const balance = await driver.findElement(
        By.css('.wallet-overview .token-overview__primary-balance'),
      );
      await driver.wait(until.elementTextMatches(balance, /^10\s*TST\s*$/u));
      const tokenAmount = await balance.getText();
      assert.ok(/^10\s*TST\s*$/u.test(tokenAmount));
      await driver.delay(regularDelayMs);
    });
  });

  describe('Send token from inside MetaMask', function () {
    let gasModal;
    it('starts to send a transaction', async function () {
      await driver.clickElement(By.css('[data-testid="eth-overview-send"]'));
      await driver.delay(regularDelayMs);

      const inputAddress = await driver.findElement(
        By.css('input[placeholder="Search, public address (0x), or ENS"]'),
      );
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970');

      const inputAmount = await driver.findElement(
        By.css('.unit-input__input'),
      );
      await inputAmount.sendKeys('1');

      // Set the gas limit
      await driver.clickElement(By.css('.advanced-gas-options-btn'));
      await driver.delay(regularDelayMs);

      gasModal = await driver.findElement(By.css('span .modal'));
      await driver.delay(regularDelayMs);
    });

    it('opens customize gas modal', async function () {
      await driver.findElement(By.css('.page-container__title'));
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Save')]`));
      await driver.delay(regularDelayMs);
    });

    it('transitions to the confirm screen', async function () {
      await driver.wait(until.stalenessOf(gasModal));

      // Continue to next screen
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Next')]`));
      await driver.delay(regularDelayMs);
    });

    it('displays the token transfer data', async function () {
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Data')]`));
      await driver.delay(regularDelayMs);

      const functionType = await driver.findElement(
        By.css('.confirm-page-container-content__function-type'),
      );
      const functionTypeText = await functionType.getText();
      assert.equal(functionTypeText, 'Transfer');

      const tokenAmount = await driver.findElement(
        By.css('.confirm-page-container-summary__title-text'),
      );
      const tokenAmountText = await tokenAmount.getText();
      assert.equal(tokenAmountText, '1 TST');

      const confirmDataDiv = await driver.findElement(
        By.css('.confirm-page-container-content__data-box'),
      );
      const confirmDataText = await confirmDataDiv.getText();

      await driver.delay(regularDelayMs);
      assert(
        confirmDataText.match(
          /0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c97/u,
        ),
      );

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Details')]`),
      );
      await driver.delay(regularDelayMs);
    });

    it('submits the transaction', async function () {
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`),
      );
      await driver.delay(regularDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          By.css(
            '.transaction-list__completed-transactions .transaction-list-item',
          ),
        );
        return confirmedTxes.length === 1;
      }, 10000);

      const txValues = await driver.findElements(
        By.css('.transaction-list-item__primary-currency'),
      );
      assert.equal(txValues.length, 1);
      await driver.wait(
        until.elementTextMatches(txValues[0], /-1\s*TST/u),
        10000,
      );

      const txStatuses = await driver.findElements(
        By.css('.list-item__heading'),
      );
      await driver.wait(
        until.elementTextMatches(txStatuses[0], /Send\sTST/u),
        10000,
      );
    });
  });

  describe('Send a custom token from dapp', function () {
    let gasModal;
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

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Transfer Tokens')]`),
      );

      await driver.switchToWindow(extension);
      await driver.delay(largeDelayMs);

      await driver.findElements(
        By.css('.transaction-list__pending-transactions'),
      );
      const txListValue = await driver.findClickableElement(
        By.css('.transaction-list-item__primary-currency'),
      );
      await driver.wait(
        until.elementTextMatches(txListValue, /-1.5\s*TST/u),
        10000,
      );
      await txListValue.click();
      await driver.delay(regularDelayMs);

      const transactionAmounts = await driver.findElements(
        By.css('.currency-display-component__text'),
      );
      const transactionAmount = transactionAmounts[0];
      assert(await transactionAmount.getText(), '1.5 TST');

      // Set the gas limit
      await driver.clickElement(
        By.css('.confirm-detail-row__header-text--edit'),
      );
      await driver.delay(regularDelayMs);

      gasModal = await driver.findElement(By.css('span .modal'));
    });

    it('customizes gas', async function () {
      await driver.clickElement(By.css('.page-container__tab:nth-of-type(2)'));
      await driver.delay(regularDelayMs);

      const [gasPriceInput, gasLimitInput] = await driver.findElements(
        By.css('.advanced-gas-inputs__gas-edit-row__input'),
      );

      await gasPriceInput.clear();
      await driver.delay(50);
      await gasPriceInput.sendKeys('10');
      await driver.delay(50);

      await gasLimitInput.clear();
      await driver.delay(50);
      await gasLimitInput.sendKeys('60000');

      await driver.delay(1000);

      await driver.clickElement(By.css('.page-container__footer-button'));
      await driver.wait(until.stalenessOf(gasModal));

      const gasFeeInputs = await driver.findElements(
        By.css('.confirm-detail-row__primary'),
      );
      const renderedGasFee = await gasFeeInputs[0].getText();
      assert.equal(renderedGasFee, '0.0006');
    });

    it('submits the transaction', async function () {
      const tokenAmount = await driver.findElement(
        By.css('.confirm-page-container-summary__title-text'),
      );
      const tokenAmountText = await tokenAmount.getText();
      assert.equal(tokenAmountText, '1.5 TST');

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`),
      );
      await driver.delay(regularDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          By.css(
            '.transaction-list__completed-transactions .transaction-list-item',
          ),
        );
        return confirmedTxes.length === 2;
      }, 10000);

      const txValues = await driver.findElements(
        By.css('.transaction-list-item__primary-currency'),
      );
      await driver.wait(until.elementTextMatches(txValues[0], /-1.5\s*TST/u));
      const txStatuses = await driver.findElements(
        By.css('.list-item__heading'),
      );
      await driver.wait(
        until.elementTextMatches(txStatuses[0], /Send\sTST/u),
        10000,
      );

      const tokenBalanceAmount = await driver.findElements(
        By.css('.token-overview__primary-balance'),
      );
      await driver.wait(
        until.elementTextMatches(tokenBalanceAmount[0], /7.5\s*TST/u),
        10000,
      );
    });
  });

  describe('Approves a custom token from dapp', function () {
    let gasModal;
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

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Approve Tokens')]`),
      );

      await driver.switchToWindow(extension);
      await driver.delay(regularDelayMs);

      await driver.wait(async () => {
        const pendingTxes = await driver.findElements(
          By.css(
            '.transaction-list__pending-transactions .transaction-list-item',
          ),
        );
        return pendingTxes.length === 1;
      }, 10000);

      const [txtListHeading] = await driver.findElements(
        By.css('.transaction-list-item .list-item__heading'),
      );
      await driver.wait(
        until.elementTextMatches(txtListHeading, /Approve TST spend limit/u),
      );
      await driver.clickElement(By.css('.transaction-list-item'));
      await driver.delay(regularDelayMs);
    });

    it('displays the token approval data', async function () {
      await driver.clickElement(
        By.css('.confirm-approve-content__view-full-tx-button'),
      );
      await driver.delay(regularDelayMs);

      const functionType = await driver.findElement(
        By.css(
          '.confirm-approve-content__data .confirm-approve-content__small-text',
        ),
      );
      const functionTypeText = await functionType.getText();
      assert.equal(functionTypeText, 'Function: Approve');

      const confirmDataDiv = await driver.findElement(
        By.css('.confirm-approve-content__data__data-block'),
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
        By.css('.confirm-approve-content__small-blue-text.cursor-pointer'),
      );
      await driver.delay(regularDelayMs);

      gasModal = await driver.findElement(By.css('span .modal'));
    });

    it('customizes gas', async function () {
      await driver.clickElement(By.css('.page-container__tab:nth-of-type(2)'));
      await driver.delay(regularDelayMs);

      const [gasPriceInput, gasLimitInput] = await driver.findElements(
        By.css('.advanced-gas-inputs__gas-edit-row__input'),
      );

      await gasPriceInput.clear();
      await driver.delay(50);
      await gasPriceInput.sendKeys('10');
      await driver.delay(50);

      await gasLimitInput.clear();
      await driver.delay(50);
      await gasLimitInput.sendKeys('60001');

      await driver.delay(1000);

      await driver.clickElement(By.css('.page-container__footer-button'));
      await driver.wait(until.stalenessOf(gasModal));

      const gasFeeInEth = await driver.findElement(
        By.css(
          '.confirm-approve-content__transaction-details-content__secondary-fee',
        ),
      );
      assert.equal(await gasFeeInEth.getText(), '0.0006 ETH');
    });

    it('edits the permission', async function () {
      const editButtons = await driver.findClickableElements(
        By.css('.confirm-approve-content__small-blue-text.cursor-pointer'),
      );
      await editButtons[1].click();
      await driver.delay(regularDelayMs);

      const permissionModal = await driver.findElement(By.css('span .modal'));

      const radioButtons = await driver.findClickableElements(
        By.css('.edit-approval-permission__edit-section__radio-button'),
      );
      await radioButtons[1].click();

      const customInput = await driver.findElement(By.css('input'));
      await driver.delay(50);
      await customInput.sendKeys('5');
      await driver.delay(regularDelayMs);

      await driver.clickElement(By.xpath(`//button[contains(text(), 'Save')]`));
      await driver.delay(regularDelayMs);

      await driver.wait(until.stalenessOf(permissionModal));

      const permissionInfo = await driver.findElements(
        By.css('.confirm-approve-content__medium-text'),
      );
      const amountDiv = permissionInfo[0];
      assert.equal(await amountDiv.getText(), '5 TST');
    });

    it('submits the transaction', async function () {
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`),
      );
      await driver.delay(regularDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          By.css(
            '.transaction-list__completed-transactions .transaction-list-item',
          ),
        );
        return confirmedTxes.length === 3;
      }, 10000);

      const txStatuses = await driver.findElements(
        By.css('.list-item__heading'),
      );
      await driver.wait(
        until.elementTextMatches(txStatuses[0], /Approve TST spend limit/u),
      );
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

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Transfer Tokens Without Gas')]`),
      );

      await driver.switchToWindow(extension);
      await driver.delay(regularDelayMs);

      await driver.wait(async () => {
        const pendingTxes = await driver.findElements(
          By.css(
            '.transaction-list__pending-transactions .transaction-list-item',
          ),
        );
        return pendingTxes.length === 1;
      }, 10000);

      const [txListValue] = await driver.findElements(
        By.css('.transaction-list-item__primary-currency'),
      );
      await driver.wait(until.elementTextMatches(txListValue, /-1.5\s*TST/u));
      await driver.clickElement(By.css('.transaction-list-item'));
      await driver.delay(regularDelayMs);
    });

    it('submits the transaction', async function () {
      await driver.delay(largeDelayMs * 2);
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`),
      );
      await driver.delay(largeDelayMs * 2);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          By.css(
            '.transaction-list__completed-transactions .transaction-list-item',
          ),
        );
        return confirmedTxes.length === 4;
      }, 10000);

      const txValues = await driver.findElements(
        By.css('.transaction-list-item__primary-currency'),
      );
      await driver.wait(until.elementTextMatches(txValues[0], /-1.5\s*TST/u));
      const txStatuses = await driver.findElements(
        By.css('.list-item__heading'),
      );
      await driver.wait(until.elementTextMatches(txStatuses[0], /Send TST/u));
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

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Approve Tokens Without Gas')]`),
      );

      await driver.switchToWindow(extension);
      await driver.delay(regularDelayMs);

      await driver.wait(async () => {
        const pendingTxes = await driver.findElements(
          By.css(
            '.transaction-list__pending-transactions .transaction-list-item',
          ),
        );
        return pendingTxes.length === 1;
      }, 10000);

      const [txtListHeading] = await driver.findElements(
        By.css('.transaction-list-item .list-item__heading'),
      );
      await driver.wait(
        until.elementTextMatches(txtListHeading, /Approve TST spend limit/u),
      );
      await driver.clickElement(By.css('.transaction-list-item'));
      await driver.delay(regularDelayMs);
    });

    it('shows the correct recipient', async function () {
      await driver.clickElement(
        By.css('.confirm-approve-content__view-full-tx-button'),
      );
      await driver.delay(regularDelayMs);

      const permissionInfo = await driver.findElements(
        By.css('.confirm-approve-content__medium-text'),
      );
      const recipientDiv = permissionInfo[1];
      assert.equal(await recipientDiv.getText(), '0x2f318C33...C970');
    });

    it('submits the transaction', async function () {
      await driver.delay(1000);
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`),
      );
      await driver.delay(regularDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          By.css(
            '.transaction-list__completed-transactions .transaction-list-item',
          ),
        );
        return confirmedTxes.length === 5;
      }, 10000);

      const txStatuses = await driver.findElements(
        By.css('.list-item__heading'),
      );
      await driver.wait(
        until.elementTextMatches(txStatuses[0], /Approve TST spend limit/u),
      );
    });
  });

  describe('Hide token', function () {
    it('hides the token when clicked', async function () {
      await driver.clickElement(
        By.css('[data-testid="token-options__button"]'),
      );

      await driver.clickElement(By.css('[data-testid="token-options__hide"]'));

      const confirmHideModal = await driver.findElement(By.css('span .modal'));

      await driver.clickElement(
        By.css('[data-testid="hide-token-confirmation__hide"]'),
      );

      await driver.wait(until.stalenessOf(confirmHideModal));
    });
  });

  describe('Add existing token using search', function () {
    it('clicks on the Add Token button', async function () {
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Add Token')]`),
      );
      await driver.delay(regularDelayMs);
    });

    it('can pick a token from the existing options', async function () {
      const tokenSearch = await driver.findElement(By.css('#search-tokens'));
      await tokenSearch.sendKeys('BAT');
      await driver.delay(regularDelayMs);

      await driver.clickElement(By.xpath("//span[contains(text(), 'BAT')]"));
      await driver.delay(regularDelayMs);

      await driver.clickElement(By.xpath(`//button[contains(text(), 'Next')]`));
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Add Tokens')]`),
      );
      await driver.delay(largeDelayMs);
    });

    it('renders the balance for the chosen token', async function () {
      const balance = await driver.findElement(
        By.css('.token-overview__primary-balance'),
      );
      await driver.wait(until.elementTextMatches(balance, /0\s*BAT/u));
      await driver.delay(regularDelayMs);
    });
  });

  describe('Stores custom RPC history', function () {
    it(`creates first custom RPC entry`, async function () {
      const rpcUrl = 'http://127.0.0.1:8545/1';
      const chainId = '0x539'; // Ganache default, decimal 1337

      await driver.clickElement(By.css('.network-display'));
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.xpath(`//span[contains(text(), 'Custom RPC')]`),
      );
      await driver.delay(regularDelayMs);

      await driver.findElement(By.css('.settings-page__sub-header-text'));

      const customRpcInputs = await driver.findElements(
        By.css('input[type="text"]'),
      );
      const rpcUrlInput = customRpcInputs[1];
      const chainIdInput = customRpcInputs[2];

      await rpcUrlInput.clear();
      await rpcUrlInput.sendKeys(rpcUrl);

      await chainIdInput.clear();
      await chainIdInput.sendKeys(chainId);

      await driver.clickElement(By.css('.network-form__footer .btn-secondary'));
      await driver.findElement(
        By.xpath(`//div[contains(text(), '${rpcUrl}')]`),
      );
    });

    it(`creates second custom RPC entry`, async function () {
      const rpcUrl = 'http://127.0.0.1:8545/2';
      const chainId = '0x539'; // Ganache default, decimal 1337

      await driver.clickElement(By.css('.network-display'));
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.xpath(`//span[contains(text(), 'Custom RPC')]`),
      );
      await driver.delay(regularDelayMs);

      await driver.findElement(By.css('.settings-page__sub-header-text'));

      const customRpcInputs = await driver.findElements(
        By.css('input[type="text"]'),
      );
      const rpcUrlInput = customRpcInputs[1];
      const chainIdInput = customRpcInputs[2];

      await rpcUrlInput.clear();
      await rpcUrlInput.sendKeys(rpcUrl);

      await chainIdInput.clear();
      await chainIdInput.sendKeys(chainId);

      await driver.clickElement(By.css('.network-form__footer .btn-secondary'));
      await driver.findElement(
        By.xpath(`//div[contains(text(), '${rpcUrl}')]`),
      );
    });

    it('selects another provider', async function () {
      await driver.clickElement(By.css('.network-display'));
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        By.xpath(`//span[contains(text(), 'Ethereum Mainnet')]`),
      );
      await driver.delay(largeDelayMs * 2);
    });

    it('finds all recent RPCs in history', async function () {
      await driver.clickElement(By.css('.network-display'));
      await driver.delay(regularDelayMs);

      // only recent 3 are found and in correct order (most recent at the top)
      const customRpcs = await driver.findElements(
        By.xpath(`//span[contains(text(), 'http://127.0.0.1:8545/')]`),
      );

      // click Mainnet to dismiss network dropdown
      await driver.clickElement(
        By.xpath(`//span[contains(text(), 'Ethereum Mainnet')]`),
      );

      assert.equal(customRpcs.length, 2);
    });

    it('deletes a custom RPC', async function () {
      const networkListItems = await driver.findClickableElements(
        By.css('.networks-tab__networks-list-name'),
      );
      const lastNetworkListItem = networkListItems[networkListItems.length - 1];
      await lastNetworkListItem.click();
      await driver.delay(100);

      await driver.clickElement(By.css('.btn-danger'));
      await driver.delay(regularDelayMs);

      const confirmDeleteNetworkModal = await driver.findElement(
        By.css('span .modal'),
      );

      const byConfirmDeleteNetworkButton = By.css(
        '.button.btn-danger.modal-container__footer-button',
      );
      await driver.clickElement(byConfirmDeleteNetworkButton);

      await driver.wait(until.stalenessOf(confirmDeleteNetworkModal));

      const newNetworkListItems = await driver.findElements(
        By.css('.networks-tab__networks-list-name'),
      );

      assert.equal(networkListItems.length - 1, newNetworkListItems.length);
    });
  });
});
