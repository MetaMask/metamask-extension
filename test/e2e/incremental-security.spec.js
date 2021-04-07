const assert = require('assert');
const { until } = require('selenium-webdriver');

const enLocaleMessages = require('../../app/_locales/en/messages.json');
const { tinyDelayMs, regularDelayMs, largeDelayMs } = require('./helpers');
const { buildWebDriver } = require('./webdriver');
const Ganache = require('./ganache');

const ganacheServer = new Ganache();

describe('MetaMask', function () {
  let driver;
  let publicAddress;

  this.timeout(0);
  this.bail(true);

  before(async function () {
    await ganacheServer.start({
      accounts: [
        {
          secretKey:
            '0x250F458997A364988956409A164BA4E16F0F99F916ACDD73ADCD3A1DE30CF8D1',
          balance: 0,
        },
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

  describe('Going through the first time flow, but skipping the seed phrase challenge', function () {
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

    it('skips the seed phrase challenge', async function () {
      await driver.clickElement({
        text: enLocaleMessages.remindMeLater.message,
        tag: 'button',
      });
      await driver.delay(regularDelayMs);

      await driver.clickElement('[data-testid="account-options-menu-button"]');
      await driver.clickElement(
        '[data-testid="account-options-menu__account-details"]',
      );
    });

    it('gets the current accounts address', async function () {
      const addressInput = await driver.findElement('.readonly-input__input');
      publicAddress = await addressInput.getAttribute('value');

      const accountModal = await driver.findElement('span .modal');

      await driver.clickElement('.account-modal__close');

      await driver.wait(until.stalenessOf(accountModal));
      await driver.delay(regularDelayMs);
    });
  });

  describe('send to current account from dapp with different provider', function () {
    let extension;

    it('switches to dapp screen', async function () {
      const windowHandles = await driver.getAllWindowHandles();
      extension = windowHandles[0];

      await driver.openNewPage('http://127.0.0.1:8080/');
      await driver.delay(regularDelayMs);
    });

    it('sends eth to the current account', async function () {
      const addressInput = await driver.findElement('#address');
      await addressInput.sendKeys(publicAddress);
      await driver.delay(regularDelayMs);

      await driver.clickElement('#send');

      const txStatus = await driver.findElement('#success');
      await driver.wait(until.elementTextMatches(txStatus, /Success/u), 15000);
    });

    it('switches back to MetaMask', async function () {
      await driver.switchToWindow(extension);
    });

    it('should have the correct amount of eth', async function () {
      const balances = await driver.findElements(
        '.currency-display-component__text',
      );
      await driver.wait(until.elementTextMatches(balances[0], /1/u), 15000);
      const balance = await balances[0].getText();

      assert.equal(balance, '1');
    });
  });

  describe('backs up the seed phrase', function () {
    it('should show a backup reminder', async function () {
      const backupReminder = await driver.findElements({
        xpath:
          "//div[contains(@class, 'home-notification__text') and contains(text(), 'Backup your Secret Recovery code to keep your wallet and funds secure')]",
      });
      assert.equal(backupReminder.length, 1);
    });

    it('should take the user to the seedphrase backup screen', async function () {
      await driver.clickElement('.home-notification__accept-button');
      await driver.delay(regularDelayMs);
    });

    let seedPhrase;

    it('reveals the seed phrase', async function () {
      await driver.clickElement(
        '.reveal-seed-phrase__secret-blocker .reveal-seed-phrase__reveal-button',
      );
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

    it('can click through the success screen', async function () {
      await driver.clickElement({ text: 'All Done', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('should have the correct amount of eth', async function () {
      const balances = await driver.findElements(
        '.currency-display-component__text',
      );
      await driver.wait(until.elementTextMatches(balances[0], /1/u), 15000);
      const balance = await balances[0].getText();

      assert.equal(balance, '1');
    });

    it('should not show a backup reminder', async function () {
      await driver.assertElementNotPresent('.backup-notification');
    });
  });
});
