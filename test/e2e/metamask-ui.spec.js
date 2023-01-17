const { strict: assert } = require('assert');
const path = require('path');

const enLocaleMessages = require('../../app/_locales/en/messages.json');
const createStaticServer = require('../../development/create-static-server');
const {
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
  veryLargeDelayMs,
} = require('./helpers');
const { buildWebDriver } = require('./webdriver');
const Ganache = require('./ganache');
const { ensureXServerIsRunning } = require('./x-server');

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
    if (
      process.env.SELENIUM_BROWSER === 'chrome' &&
      process.env.CI === 'true'
    ) {
      await ensureXServerIsRunning();
    }
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
    it('clicks the "Create New Wallet" button on the welcome screen', async function () {
      await driver.clickElement('[data-testid="onboarding-create-wallet"]');
    });

    it('clicks the "No thanks" option on the metametrics opt-in screen', async function () {
      await driver.clickElement('[data-testid="metametrics-no-thanks"]');
    });

    it('accepts a secure password', async function () {
      const password = 'correct horse battery staple';
      await driver.fill('[data-testid="create-password-new"]', password);
      await driver.fill('[data-testid="create-password-confirm"]', password);
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
        '.unlock-page__link',
      );
      assert.equal(await restoreSeedLink.getText(), 'Forgot password?');
      await restoreSeedLink.click();
      await driver.delay(regularDelayMs);

      await driver.pasteIntoField(
        '[data-testid="import-srp__srp-word-0"]',
        testSeedPhrase,
      );

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
        text: '1000',
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

    it('clicks on the import tokens button', async function () {
      await driver.clickElement(`[data-testid="home__asset-tab"]`);
      await driver.clickElement({ text: 'import tokens', tag: 'a' });
      await driver.delay(regularDelayMs);
    });

    it('picks the newly created Test token', async function () {
      await driver.clickElement({
        text: 'Custom token',
        tag: 'button',
      });
      await driver.delay(regularDelayMs);

      await driver.fill('#custom-address', tokenAddress);
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Add custom token', tag: 'button' });
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Import tokens', tag: 'button' });
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

    it('transitions to the confirm screen', async function () {
      // Continue to next screen
      await driver.delay(largeDelayMs);
      await driver.clickElement({ text: 'Next', tag: 'button' });
      await driver.delay(largeDelayMs);
    });

    it('displays the token transfer data', async function () {
      await driver.delay(largeDelayMs);
      await driver.clickElement({ text: 'Hex', tag: 'button' });
      await driver.delay(regularDelayMs);

      const functionType = await driver.findElement(
        '.confirm-page-container-content__function-type',
      );
      const functionTypeText = await functionType.getText();
      assert(functionTypeText.match('Transfer'));

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
      await driver.waitForSelector(
        {
          css: '.transaction-list__completed-transactions .transaction-list-item__primary-currency',
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
        css: '.transaction-list__completed-transactions .transaction-list-item__primary-currency',
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
        css: '.transaction-list__pending-transactions .transaction-list__header + .transaction-list-item .list-item__heading',
        text: 'Approve TST spend limit',
      });

      await driver.clickElement('.transaction-list-item');
      await driver.delay(regularDelayMs);
    });

    it('displays the token approval data', async function () {
      await driver.clickElement({
        text: 'View full transaction details',
        css: '.confirm-approve-content__small-blue-text',
      });
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
      await driver.clickElement({
        text: 'Edit suggested gas fee',
        tag: 'button',
      });
      await driver.delay(regularDelayMs);

      const [gasLimitInput, gasPriceInput] = await driver.findElements(
        'input[type="number"]',
      );

      await gasPriceInput.fill('10');
      await driver.delay(50);

      await gasLimitInput.fill('60001');

      await driver.delay(veryLargeDelayMs);

      await driver.clickElement({ text: 'Save', tag: 'button' });
      await driver.delay(veryLargeDelayMs);

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
      await driver.delay(veryLargeDelayMs);

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
        css: '.transaction-list__completed-transactions .transaction-list-item:first-child .list-item__heading',
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
        css: '.transaction-list__completed-transactions .transaction-list-item:first-child .list-item__heading',
        text: 'Send TST',
      });

      await driver.waitForSelector({
        css: '.transaction-list__completed-transactions .transaction-list-item:first-child .transaction-list-item__primary-currency',
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
        css: '.transaction-list__pending-transactions .transaction-list__header + .transaction-list-item .list-item__heading',
        text: 'Approve TST spend limit',
      });

      await driver.clickElement('.transaction-list-item');
      await driver.delay(regularDelayMs);
    });

    it('shows the correct recipient', async function () {
      await driver.clickElement({
        text: 'View full transaction details',
        css: '.confirm-approve-content__small-blue-text',
      });
      const permissionInfo = await driver.findElements(
        '.confirm-approve-content__medium-text',
      );
      const recipientDiv = permissionInfo[1];
      assert.equal(await recipientDiv.getText(), '0x2f318C33...C970');
    });

    it('submits the transaction', async function () {
      await driver.delay(veryLargeDelayMs);
      await driver.clickElement({ text: 'Confirm', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.waitForSelector({
        css: '.transaction-list__completed-transactions .transaction-list-item:first-child .list-item__heading',
        text: 'Approve TST spend limit',
      });
    });
  });
});
