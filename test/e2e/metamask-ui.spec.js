const { strict: assert } = require('assert');
const path = require('path');

const enLocaleMessages = require('../../app/_locales/en/messages.json');
const createStaticServer = require('../../development/create-static-server');
const {
  TEST_SEED_PHRASE_TWO,
  WALLET_PASSWORD,
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
  veryLargeDelayMs,
  openDapp,
  openActionMenuAndStartSendFlow,
} = require('./helpers');
const { buildWebDriver } = require('./webdriver');
const { Ganache } = require('./ganache');

const ganacheServer = new Ganache();
const dappPort = 8080;

describe('MetaMask @no-mmi', function () {
  let driver;
  let dappServer;
  let tokenAddress;

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
      await driver.checkBrowserForConsoleErrors(false);
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
    it('clicks the "Create New Wallet" button on the welcome screen', async function () {
      await driver.clickElement('[data-testid="onboarding-terms-checkbox"]');
      await driver.clickElement('[data-testid="onboarding-create-wallet"]');
    });

    it('clicks the "No thanks" option on the metametrics opt-in screen', async function () {
      await driver.clickElement('[data-testid="metametrics-no-thanks"]');
    });

    it('accepts a secure password', async function () {
      await driver.fill('[data-testid="create-password-new"]', WALLET_PASSWORD);
      await driver.fill(
        '[data-testid="create-password-confirm"]',
        WALLET_PASSWORD,
      );
      await driver.clickElement('[data-testid="create-password-terms"]');
      await driver.clickElement('[data-testid="create-password-wallet"]');
    });

    it('renders the Secret Recovery Phrase intro screen', async function () {
      await driver.clickElement('[data-testid="secure-wallet-recommended"]');
    });

    let chipTwo, chipThree, chipSeven;

    it('reveals the Secret Recovery Phrase', async function () {
      await driver.clickElement('[data-testid="recovery-phrase-reveal"]');
      chipTwo = await (
        await driver.findElement('[data-testid="recovery-phrase-chip-2"]')
      ).getText();
      chipThree = await (
        await driver.findElement('[data-testid="recovery-phrase-chip-3"]')
      ).getText();
      chipSeven = await (
        await driver.findElement('[data-testid="recovery-phrase-chip-7"]')
      ).getText();
      await driver.clickElement('[data-testid="recovery-phrase-next"]');
    });

    it('can retype the Secret Recovery Phrase', async function () {
      await driver.fill('[data-testid="recovery-phrase-input-2"]', chipTwo);
      await driver.fill('[data-testid="recovery-phrase-input-3"]', chipThree);
      await driver.fill('[data-testid="recovery-phrase-input-7"]', chipSeven);
      await driver.clickElement('[data-testid="recovery-phrase-confirm"]');
    });

    it('clicks through the success screen', async function () {
      await driver.clickElement('[data-testid="onboarding-complete-done"]');
      await driver.clickElement('[data-testid="pin-extension-next"]');
      await driver.clickElement('[data-testid="pin-extension-done"]');
    });
  });

  describe('Import Secret Recovery Phrase', function () {
    it('logs out of the vault', async function () {
      await driver.clickElement('[data-testid="account-options-menu-button"]');
      await driver.delay(regularDelayMs);

      const lockButton = await driver.findClickableElement(
        '[data-testid="global-menu-lock"]',
      );
      assert.equal(await lockButton.getText(), 'Lock MetaMask');
      await lockButton.click();
      await driver.delay(regularDelayMs);
    });

    it('imports Secret Recovery Phrase', async function () {
      const restoreSeedLink = await driver.findClickableElement(
        '.unlock-page__link',
      );
      assert.equal(await restoreSeedLink.getText(), 'Forgot password?');
      await restoreSeedLink.click();
      await driver.delay(regularDelayMs);

      await driver.pasteIntoField(
        '[data-testid="import-srp__srp-word-0"]',
        TEST_SEED_PHRASE_TWO,
      );

      await driver.fill('#password', WALLET_PASSWORD);
      await driver.fill('#confirm-password', WALLET_PASSWORD);
      await driver.clickElement({
        text: enLocaleMessages.restore.message,
        tag: 'button',
      });
      await driver.delay(regularDelayMs);
    });

    it('balance renders', async function () {
      const balanceSelector = process.env.MULTICHAIN
        ? '[data-testid="token-balance-overview-currency-display"]'
        : '[data-testid="eth-overview__primary-currency"]';
      await driver.waitForSelector({
        css: `${balanceSelector} .currency-display-component__text`,
        text: process.env.MULTICHAIN ? '0' : '1000',
      });
      await driver.delay(regularDelayMs);
    });
  });

  describe('Add a custom token from a dapp', function () {
    let windowHandles;
    let extension;
    let popup;
    let dapp;
    it('connects the dapp', async function () {
      await openDapp(driver);
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

    it('creates a new token', async function () {
      await driver.clickElement({ text: 'Create Token', tag: 'button' });
      windowHandles = await driver.waitUntilXWindowHandles(3);

      popup = windowHandles[2];
      await driver.switchToWindow(popup);
      await driver.delay(regularDelayMs);
      await driver.clickElement({ text: 'Edit', tag: 'button' });

      const inputs = await driver.findElements('input[type="number"]');
      const gasLimitInput = inputs[0];
      const gasPriceInput = inputs[1];
      await gasLimitInput.fill('4700000');
      await gasPriceInput.fill('20');
      await driver.delay(veryLargeDelayMs);
      await driver.clickElement({ text: 'Save', tag: 'button' });
      await driver.delay(veryLargeDelayMs);
      await driver.clickElement({ text: 'Confirm', tag: 'button' });

      await driver.delay(regularDelayMs);

      await driver.switchToWindow(dapp);
      await driver.delay(tinyDelayMs);

      const tokenContractAddress = await driver.waitForSelector({
        css: '#tokenAddresses',
        text: '0x',
      });
      tokenAddress = await tokenContractAddress.getText();

      await driver.delay(regularDelayMs);
      await driver.closeAllWindowHandlesExcept([extension, dapp]);
      await driver.delay(regularDelayMs);
      await driver.switchToWindow(extension);
      await driver.delay(largeDelayMs);
    });

    it('clicks on the import tokens button', async function () {
      await driver.clickElement(`[data-testid="home__asset-tab"]`);
      await driver.clickElement({ text: 'Import tokens', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('picks the newly created Test token', async function () {
      await driver.clickElement({
        text: 'Custom token',
        tag: 'button',
      });
      await driver.delay(regularDelayMs);

      await driver.fill(
        '[data-testid="import-tokens-modal-custom-address"]',
        tokenAddress,
      );
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Next', tag: 'button' });
      await driver.delay(regularDelayMs);

      await driver.clickElement(
        '[data-testid="import-tokens-modal-import-button"]',
      );
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
    if (process.env.MULTICHAIN) {
      return;
    }
    it('starts to send a transaction', async function () {
      await openActionMenuAndStartSendFlow(driver);
      if (process.env.MULTICHAIN) {
        return;
      }
      await driver.delay(regularDelayMs);

      await driver.fill(
        'input[placeholder="Enter public address (0x) or ENS name"]',
        '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
      );

      driver.fill('.unit-input__input', '1');
    });

    it('transitions to the confirm screen', async function () {
      // Continue to next screen
      await driver.waitForElementNotPresent('.loading-overlay');
      await driver.clickElement({ text: 'Next', tag: 'button' });
    });

    it('displays the token transfer data', async function () {
      await driver.waitForElementNotPresent('.loading-overlay');
      await driver.clickElement({ text: 'Hex', tag: 'button' });
      await driver.delay(regularDelayMs);

      await driver.findElement({
        tag: 'span',
        text: 'Transfer',
      });

      await driver.findElement({
        tag: 'h1',
        text: '1 TST',
      });

      await driver.waitForSelector({
        tag: 'p',
        text: '0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c97',
      });

      await driver.clickElement({ text: 'Details', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('customizes gas', async function () {
      await driver.clickElement({ text: 'Edit', tag: 'button' });
      await driver.delay(largeDelayMs);
      const inputs = await driver.findElements('input[type="number"]');
      const gasLimitInput = inputs[0];
      const gasPriceInput = inputs[1];
      await gasLimitInput.fill('100000');
      await gasPriceInput.fill('100');
      await driver.delay(veryLargeDelayMs);
      await driver.clickElement({ text: 'Save', tag: 'button' });
      await driver.delay(veryLargeDelayMs);
    });

    it('submits the transaction', async function () {
      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.waitForSelector({
        css: '.transaction-list__completed-transactions [data-testid="transaction-list-item-primary-currency"]',
        text: '-1 TST',
      });

      await driver.waitForSelector({
        css: '[data-testid="activity-list-item-action"]',
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
      await driver.waitForSelector({
        css: '[data-testid="transaction-list-item-primary-currency"]',
        text: '-1.5 TST',
      });
      await driver.clickElement(
        '[data-testid="transaction-list-item-primary-currency"]',
      );
      await driver.delay(regularDelayMs);

      const transactionAmounts = await driver.findElements(
        '.currency-display-component__text',
      );
      const transactionAmount = transactionAmounts[0];
      assert(await transactionAmount.getText(), '1.5 TST');
    });

    it('customizes gas', async function () {
      await driver.delay(veryLargeDelayMs);
      await driver.clickElement({ text: 'Edit', tag: 'button' });
      await driver.delay(veryLargeDelayMs);
      await driver.clickElement({
        text: 'Edit suggested gas fee',
        tag: 'button',
      });
      await driver.delay(veryLargeDelayMs);
      const inputs = await driver.findElements('input[type="number"]');
      const gasLimitInput = inputs[0];
      const gasPriceInput = inputs[1];
      await gasLimitInput.fill('60000');
      await gasPriceInput.fill('10');
      await driver.delay(veryLargeDelayMs);
      await driver.clickElement({ text: 'Save', tag: 'button' });
      await driver.delay(veryLargeDelayMs);
      await driver.findElement({ tag: 'span', text: '0.0006' });
    });

    it('submits the transaction', async function () {
      await driver.findElement({
        tag: 'h1',
        text: '1.5 TST',
      });

      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.waitForSelector({
        css: '.transaction-list__completed-transactions [data-testid="transaction-list-item-primary-currency"]',
        text: '-1.5 TST',
      });

      await driver.waitForSelector({
        css: '[data-testid="activity-list-item-action"]',
        text: 'Send TST',
      });
    });

    it('checks balance', async function () {
      if (process.env.MULTICHAIN) {
        return;
      }
      await driver.clickElement({
        text: 'Tokens',
        tag: 'button',
      });

      await driver.waitForSelector({
        css: '[data-testid="multichain-token-list-item-value"]',
        text: '7.5 TST',
      });

      await driver.clickElement({
        text: 'Activity',
        tag: 'button',
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
      await driver.delay(veryLargeDelayMs);

      await driver.wait(async () => {
        const pendingTxes = await driver.findElements(
          '.transaction-list__pending-transactions .activity-list-item',
        );
        return pendingTxes.length === 1;
      }, 10000);

      await driver.waitForSelector({
        css: '[data-testid="transaction-list-item-primary-currency"]',
        text: '-1.5 TST',
      });
      await driver.clickElement('.activity-list-item');
      await driver.delay(regularDelayMs);
    });

    it('submits the transaction', async function () {
      await driver.waitForElementNotPresent('.loading-overlay');
      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(largeDelayMs * 2);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.waitForSelector({
        // Select the heading of the first transaction list item in the
        // completed transaction list with text matching Send TST
        css: '.transaction-list__completed-transactions .activity-list-item [data-testid="activity-list-item-action"]',
        text: 'Send TST',
      });

      await driver.waitForSelector({
        css: '.transaction-list__completed-transactions .activity-list-item [data-testid="transaction-list-item-primary-currency"]',
        text: '-1.5 TST',
      });
    });
  });
});
