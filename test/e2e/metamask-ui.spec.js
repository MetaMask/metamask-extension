const { strict: assert } = require('assert');
const path = require('path');

const enLocaleMessages = require('../../app/_locales/en/messages.json');
const createStaticServer = require('../../development/create-static-server');
const { tinyDelayMs, regularDelayMs, largeDelayMs } = require('./helpers');
const { buildWebDriver } = require('./webdriver');
const Ganache = require('./ganache');

const ganacheServer = new Ganache();
const dappPort = 8080;

describe('MetaMask', function () {
  let driver;
  let dappServer;
  let tokenAddress;

  const testSeedPhrase =
    'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent';

  this.bail(true);

  let failed = false;

  before(async function () {
    await ganacheServer.start();
    const dappDirectory = path.resolve(
      __dirname,
      '..',
      '..',
      'node_modules',
      '@metamask',
      'test-dapp',
      'dist',
    );
    dappServer = createStaticServer(dappDirectory);
    dappServer.listen(dappPort);
    await new Promise((resolve, reject) => {
      dappServer.on('listening', resolve);
      dappServer.on('error', reject);
    });
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
      failed = true;
      await driver.verboseReportOnFailure(this.currentTest.title);
    }
  });

  after(async function () {
    if (process.env.E2E_LEAVE_RUNNING === 'true' && failed) {
      return;
    }
    await ganacheServer.quit();
    await driver.quit();
    await new Promise((resolve, reject) => {
      dappServer.close((error) => {
        if (error) {
          return reject(error);
        }
        return resolve();
      });
    });
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
      await driver.fill(
        '.first-time-flow__form #create-password',
        'correct horse battery staple',
      );
      await driver.fill(
        '.first-time-flow__form #confirm-password',
        'correct horse battery staple',
      );

      await driver.clickElement('.first-time-flow__checkbox');

      await driver.clickElement('.first-time-flow__form button');
      await driver.delay(regularDelayMs);
    });

    let seedPhrase;

    it('renders the Secret Recovery Phrase intro screen', async function () {
      await driver.clickElement('.seed-phrase-intro__left button');
      await driver.delay(regularDelayMs);
    });

    it('reveals the Secret Recovery Phrase', async function () {
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

    it('can retype the Secret Recovery Phrase', async function () {
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

  describe("Close the what's new popup", function () {
    it("should show the what's new popover", async function () {
      const popoverTitle = await driver.findElement(
        '.popover-header__title h2',
      );

      assert.equal(await popoverTitle.getText(), "What's new");
    });

    it("should close the what's new popup", async function () {
      const popover = await driver.findElement('.popover-container');

      await driver.clickElement('[data-testid="popover-close"]');

      await popover.waitForElementState('hidden');
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
      const permissionModal = await driver.findVisibleElement('span .modal');
      await driver.clickElement('.account-modal__close');

      // wait for permission modal to be removed from DOM.
      await permissionModal.waitForElementState('hidden');
      await driver.delay(regularDelayMs);
    });
  });

  describe('Import Secret Recovery Phrase', function () {
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

    it('imports Secret Recovery Phrase', async function () {
      const restoreSeedLink = await driver.findClickableElement(
        '.unlock-page__link--import',
      );
      assert.equal(
        await restoreSeedLink.getText(),
        'import using Secret Recovery Phrase',
      );
      await restoreSeedLink.click();
      await driver.delay(regularDelayMs);

      await driver.clickElement('.import-account__checkbox-container');

      await driver.fill('.import-account__secret-phrase', testSeedPhrase);
      await driver.delay(regularDelayMs);

      await driver.fill('#password', 'correct horse battery staple');
      await driver.fill('#confirm-password', 'correct horse battery staple');
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
      await gasPriceInput.fill('10');
      await driver.delay(50);
      await driver.delay(tinyDelayMs);
      await driver.delay(50);

      await gasLimitInput.fill('');
      await driver.delay(50);
      await gasLimitInput.fill('25000');

      await driver.delay(1000);

      await driver.clickElement({ text: 'Confirm', tag: 'button' }, 10000);
      await driver.delay(regularDelayMs);

      await driver.waitUntilXWindowHandles(2);
      await driver.switchToWindow(extension);
      await driver.delay(regularDelayMs);
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
        return confirmedTxes.length === 2;
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
        '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(3)',
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
      // wait for gas modal to be visible.
      const gasModal = await driver.findVisibleElement('span .modal');
      await driver.clickElement('.page-container__tab:nth-of-type(2)');
      await driver.delay(regularDelayMs);

      const [gasPriceInput, gasLimitInput] = await driver.findElements(
        '.advanced-gas-inputs__gas-edit-row__input',
      );
      const gasLimitValue = await gasLimitInput.getAttribute('value');
      assert(Number(gasLimitValue) < 100000, 'Gas Limit too high');

      await gasPriceInput.fill('10');
      await driver.delay(50);

      await gasLimitInput.fill('60001');

      await driver.delay(1000);

      await driver.clickElement({ text: 'Save', tag: 'button' });

      // wait for gas modal to be detached from DOM
      await gasModal.waitForElementState('hidden');

      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(regularDelayMs);

      await driver.waitForSelector(
        '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(4)',
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
        return confirmedTxes.length === 5;
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
          text: '90.',
        },
        { timeout: 10000 },
      );
      const tokenAmount = await balance.getText();
      assert.ok(/^90.*\s*ETH.*$/u.test(tokenAmount));
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

      await driver.fill('#custom-address', tokenAddress);
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

      await driver.fill(
        'input[placeholder="Search, public address (0x), or ENS"]',
        '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
      );

      driver.fill('.unit-input__input', '1');
    });

    it('opens customize gas modal and saves options to continue', async function () {
      await driver.clickElement('.advanced-gas-options-btn');

      // wait for gas modal to be visible
      const gasModal = await driver.findVisibleElement('span .modal');
      await driver.findElement('.page-container__title');
      await driver.clickElement({ text: 'Save', tag: 'button' });
      // wait for gas modal to be removed from DOM.
      await gasModal.waitForElementState('hidden');
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
      await driver.waitForSelector(
        {
          css:
            '.transaction-list__completed-transactions .transaction-list-item__primary-currency',
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
    });

    it('customizes gas', async function () {
      // Set the gas limit
      await driver.clickElement('.confirm-detail-row__header-text--edit');
      await driver.delay(regularDelayMs);
      // wait for gas modal to be visible
      const gasModal = await driver.findVisibleElement('span .modal');
      await driver.clickElement('.page-container__tab:nth-of-type(2)');
      await driver.delay(regularDelayMs);

      const [gasPriceInput, gasLimitInput] = await driver.findElements(
        '.advanced-gas-inputs__gas-edit-row__input',
      );

      await gasPriceInput.fill('10');
      await driver.delay(50);

      await gasLimitInput.fill('60000');

      await driver.delay(1000);

      await driver.clickElement('.page-container__footer-button');

      // wait for gas modal to be removed from DOM.
      await gasModal.waitForElementState('hidden');

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
      await driver.waitForSelector({
        css:
          '.transaction-list__completed-transactions .transaction-list-item__primary-currency',
        text: '-1.5 TST',
      });

      await driver.waitForSelector({
        css: '.list-item__heading',
        text: 'Send TST',
      });
    });

    it('checks balance', async function () {
      await driver.clickElement({
        text: 'Assets',
        tag: 'button',
      });

      await driver.waitForSelector({
        css: '.asset-list-item__token-button',
        text: '7.5 TST',
      });

      await driver.clickElement({
        text: 'Activity',
        tag: 'button',
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

    it('customizes gas', async function () {
      await driver.clickElement('.confirm-approve-content__small-blue-text');
      await driver.delay(regularDelayMs);

      // wait for gas modal to be visible
      const gasModal = await driver.findVisibleElement('span .modal');
      await driver.clickElement('.page-container__tab:nth-of-type(2)');
      await driver.delay(regularDelayMs);

      const [gasPriceInput, gasLimitInput] = await driver.findElements(
        '.advanced-gas-inputs__gas-edit-row__input',
      );

      await gasPriceInput.fill('10');
      await driver.delay(50);

      await gasLimitInput.fill('60001');

      await driver.delay(1000);

      await driver.clickElement('.page-container__footer-button');

      // wait for gas modal to be removed from DOM.
      await gasModal.waitForElementState('hidden');

      const gasFeeInEth = await driver.findElement(
        '.confirm-approve-content__transaction-details-content__secondary-fee',
      );
      assert.equal(await gasFeeInEth.getText(), '0.0006 ETH');
    });

    it('edits the permission', async function () {
      const editButtons = await driver.findClickableElements(
        '.confirm-approve-content__small-blue-text',
      );
      await editButtons[2].click();

      // wait for permission modal to be visible
      const permissionModal = await driver.findVisibleElement('span .modal');
      const radioButtons = await driver.findClickableElements(
        '.edit-approval-permission__edit-section__radio-button',
      );
      await radioButtons[1].click();

      await driver.fill('input', '5');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Save', tag: 'button' });

      // wait for permission modal to be removed from DOM.
      await permissionModal.waitForElementState('hidden');

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
      await driver.waitForSelector({
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
      await driver.waitForSelector({
        css:
          '.transaction-list__completed-transactions .transaction-list-item:first-child .list-item__heading',
        text: 'Approve TST spend limit',
      });
    });
  });
});
