const assert = require('assert');
const { Key, until } = require('selenium-webdriver');

const enLocaleMessages = require('../../app/_locales/en/messages.json');
const { regularDelayMs, largeDelayMs } = require('./helpers');
const { buildWebDriver } = require('./webdriver');
const Ganache = require('./ganache');

const ganacheServer = new Ganache();

describe('Using MetaMask with an existing account', function () {
  let driver;

  const testSeedPhrase =
    'forum vessel pink push lonely enact gentle tail admit parrot grunt dress';
  const testAddress = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';
  const testPrivateKey2 =
    '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';
  const testPrivateKey3 =
    'F4EC2590A0C10DE95FBF4547845178910E40F5035320C516A18C117DE02B5669';

  this.timeout(0);
  this.bail(true);

  before(async function () {
    await ganacheServer.start({
      accounts: [
        {
          secretKey:
            '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: 25000000000000000000,
        },
      ],
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
      await driver.verboseReportOnFailure(this.currentTest.title);
    }
  });

  after(async function () {
    await ganacheServer.quit();
    await driver.quit();
  });

  describe('First time flow starting from an existing seed phrase', function () {
    it('clicks the continue button on the welcome screen', async function () {
      await driver.findElement('.welcome-page__header');
      await driver.clickElement({
        text: enLocaleMessages.getStarted.message,
        tag: 'button',
      });
      await driver.delay(largeDelayMs);
    });

    it('clicks the "Import Wallet" option', async function () {
      await driver.clickElement({ text: 'Import wallet', tag: 'button' });
      await driver.delay(largeDelayMs);
    });

    it('clicks the "No thanks" option on the metametrics opt-in screen', async function () {
      await driver.clickElement('.btn-default');
      await driver.delay(largeDelayMs);
    });

    it('imports a seed phrase', async function () {
      const [seedTextArea] = await driver.findElements(
        'input[placeholder="Paste seed phrase from clipboard"]',
      );
      await seedTextArea.sendKeys(testSeedPhrase);
      await driver.delay(regularDelayMs);

      const [password] = await driver.findElements('#password');
      await password.sendKeys('correct horse battery staple');
      const [confirmPassword] = await driver.findElements('#confirm-password');
      confirmPassword.sendKeys('correct horse battery staple');

      await driver.clickElement('.first-time-flow__terms');

      await driver.clickElement({ text: 'Import', tag: 'button' });
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
    it('shows the correct account address', async function () {
      await driver.clickElement('[data-testid="account-options-menu-button"]');
      await driver.clickElement(
        '[data-testid="account-options-menu__account-details"]',
      );
      await driver.findVisibleElement('.qr-code__wrapper');
      await driver.delay(regularDelayMs);

      const [address] = await driver.findElements('.readonly-input__input');
      assert.equal(await address.getAttribute('value'), testAddress);

      await driver.clickElement('.account-modal__close');
      await driver.delay(largeDelayMs);
    });

    it('shows a QR code for the account', async function () {
      await driver.clickElement('[data-testid="account-options-menu-button"]');
      await driver.clickElement(
        '[data-testid="account-options-menu__account-details"]',
      );
      await driver.findVisibleElement('.qr-code__wrapper');
      const detailModal = await driver.findElement('span .modal');
      await driver.delay(regularDelayMs);

      await driver.clickElement('.account-modal__close');
      await driver.wait(until.stalenessOf(detailModal));
      await driver.delay(regularDelayMs);
    });
  });

  describe('Lock and unlock', function () {
    it('logs out of the account', async function () {
      await driver.clickElement('.account-menu__icon .identicon');
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
      await driver.delay(largeDelayMs);
    });
  });

  describe('Add an account', function () {
    it('switches to localhost', async function () {
      await driver.clickElement('.network-display');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Localhost', tag: 'span' });
      await driver.delay(largeDelayMs);
    });

    it('choose Create Account from the account menu', async function () {
      await driver.clickElement('.account-menu__icon');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Create Account', tag: 'div' });
      await driver.delay(regularDelayMs);
    });

    it('set account name', async function () {
      const [accountName] = await driver.findElements(
        '.new-account-create-form input',
      );
      await accountName.sendKeys('2nd account');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Create', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('should show the correct account name', async function () {
      const accountName = await driver.findElement('.selected-account__name');
      assert.equal(await accountName.getText(), '2nd account');
      await driver.delay(regularDelayMs);
    });
  });

  describe('Switch back to original account', function () {
    it('chooses the original account from the account menu', async function () {
      await driver.clickElement('.account-menu__icon');
      await driver.delay(regularDelayMs);

      await driver.clickElement('.account-menu__name');
      await driver.delay(regularDelayMs);
    });
  });

  describe('Send ETH from inside MetaMask', function () {
    it('starts a send transaction', async function () {
      await driver.clickElement('[data-testid="eth-overview-send"]');
      await driver.delay(regularDelayMs);

      const inputAddress = await driver.findElement(
        'input[placeholder="Search, public address (0x), or ENS"]',
      );
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970');

      const inputAmount = await driver.findElement('.unit-input__input');
      await inputAmount.sendKeys('1');

      // Set the gas limit
      await driver.clickElement('.advanced-gas-options-btn');
      await driver.delay(regularDelayMs);

      const gasModal = await driver.findElement('span .modal');
      await driver.clickElement({ text: 'Save', tag: 'button' });
      await driver.wait(until.stalenessOf(gasModal));
      await driver.delay(regularDelayMs);

      // Continue to next screen
      await driver.clickElement({ text: 'Next', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('confirms the transaction', async function () {
      await driver.clickElement({ text: 'Confirm', tag: 'button' });
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

      const txValues = await driver.findElements(
        '.transaction-list-item__primary-currency',
      );
      assert.equal(txValues.length, 1);
      assert.ok(/-1\s*ETH/u.test(await txValues[0].getText()));
    });
  });

  describe('Imports an account with private key', function () {
    it('choose Create Account from the account menu', async function () {
      await driver.clickElement('.account-menu__icon');
      await driver.delay(regularDelayMs);

      await driver.clickElement({ text: 'Import Account', tag: 'div' });
      await driver.delay(regularDelayMs);
    });

    it('enter private key', async function () {
      const privateKeyInput = await driver.findElement('#private-key-box');
      await privateKeyInput.sendKeys(testPrivateKey2);
      await driver.delay(regularDelayMs);
      await driver.clickElement({ text: 'Import', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('should show the correct account name', async function () {
      const accountName = await driver.findElement('.selected-account__name');
      assert.equal(await accountName.getText(), 'Account 4');
      await driver.delay(regularDelayMs);
    });

    it('should show the imported label', async function () {
      await driver.clickElement('.account-menu__icon');

      // confirm 4th account is account 4, as expected
      const accountMenuItemSelector = '.account-menu__account:nth-child(4)';
      const accountName = await driver.findElement(
        `${accountMenuItemSelector} .account-menu__name`,
      );
      assert.equal(await accountName.getText(), 'Account 4');
      // confirm label is present on the same menu item
      const importedLabel = await driver.findElement(
        `${accountMenuItemSelector} .keyring-label`,
      );
      assert.equal(await importedLabel.getText(), 'IMPORTED');
    });
  });

  describe('Imports and removes an account', function () {
    it('choose Create Account from the account menu', async function () {
      await driver.clickElement({ text: 'Import Account', tag: 'div' });
      await driver.delay(regularDelayMs);
    });

    it('enter private key', async function () {
      const privateKeyInput = await driver.findElement('#private-key-box');
      await privateKeyInput.sendKeys(testPrivateKey3);
      await driver.delay(regularDelayMs);
      await driver.clickElement({ text: 'Import', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('should see new account in account menu', async function () {
      const accountName = await driver.findElement('.selected-account__name');
      assert.equal(await accountName.getText(), 'Account 5');
      await driver.delay(regularDelayMs);

      await driver.clickElement('.account-menu__icon');
      await driver.delay(regularDelayMs);

      const accountListItems = await driver.findElements(
        '.account-menu__account',
      );
      assert.equal(accountListItems.length, 5);

      await driver.clickPoint('.account-menu__icon', 0, 0);
    });

    it('should open the remove account modal', async function () {
      await driver.clickElement('[data-testid="account-options-menu-button"]');

      await driver.clickElement(
        '[data-testid="account-options-menu__remove-account"]',
      );

      await driver.findElement('.confirm-remove-account__account');
    });

    it('should remove the account', async function () {
      await driver.clickElement({ text: 'Remove', tag: 'button' });

      await driver.delay(regularDelayMs);

      const accountName = await driver.findElement('.selected-account__name');
      assert.equal(await accountName.getText(), 'Account 1');
      await driver.delay(regularDelayMs);

      await driver.clickElement('.account-menu__icon');

      const accountListItems = await driver.findElements(
        '.account-menu__account',
      );
      assert.equal(accountListItems.length, 4);
    });
  });

  describe('Connects to a Hardware wallet', function () {
    it('choose Connect Hardware Wallet from the account menu', async function () {
      await driver.clickElement({
        text: 'Connect Hardware Wallet',
        tag: 'div',
      });
      await driver.delay(regularDelayMs);
    });

    it('should open the TREZOR Connect popup', async function () {
      await driver.clickElement('.hw-connect__btn:nth-of-type(2)');
      await driver.delay(regularDelayMs);
      await driver.clickElement({ text: 'Connect', tag: 'button' });
      await driver.delay(regularDelayMs);
      const allWindows = await driver.getAllWindowHandles();
      assert.equal(allWindows.length, 2);
    });
  });
});
