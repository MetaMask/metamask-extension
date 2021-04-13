const assert = require('assert');

const enLocaleMessages = require('../../app/_locales/en/messages.json');
const { tinyDelayMs, regularDelayMs, largeDelayMs } = require('./helpers');
const { buildWebDriver } = require('./webdriver');
const Ganache = require('./ganache');

const ganacheServer = new Ganache();

describe('MetaMask', function () {
  let driver;

  const testSeedPhrase =
    'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent';

  this.timeout(0);
  this.bail(true);

  before(async function () {
    await ganacheServer.start();
    const result = await buildWebDriver({ responsive: true });
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

    it('clicks the "I Agree" option on the metametrics opt-in screen', async function () {
      await driver.clickElement('.btn-primary');
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
    it('show account details dropdown menu', async function () {
      await driver.clickElement('[data-testid="account-options-menu-button"]');
      const options = await driver.findElements(
        '.account-options-menu .menu-item',
      );
      assert.equal(options.length, 3); // HD Wallet type does not have to show the Remove Account option
      // click outside of menu to dismiss
      // account menu button chosen because the menu never covers it.
      await driver.clickPoint('.account-menu__icon', 0, 0);
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

    it('switches to localhost', async function () {
      await driver.clickElement('.network-display');
      await driver.delay(regularDelayMs);

      await driver.clickElement({
        xpath: `//span[contains(@class, 'network-name-item') and contains(text(), 'Localhost 8545')]`,
      });
      await driver.delay(largeDelayMs * 2);
    });

    it('balance renders', async function () {
      await driver.waitForSelector({
        css: '[data-testid="eth-overview__primary-currency"]',
        text: '100 ETH',
      });
      await driver.delay(regularDelayMs);
    });
  });

  describe('Send ETH from inside MetaMask', function () {
    it('starts to send a transaction', async function () {
      await driver.clickElement('[data-testid="eth-overview-send"]');
      await driver.delay(regularDelayMs);

      await driver.fill(
        'input[placeholder="Search, public address (0x), or ENS"]',
        '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
      );

      const inputAmount = await driver.fill('.unit-input__input', '1');

      const inputValue = await inputAmount.getAttribute('value');
      assert.equal(inputValue, '1');
      await driver.delay(regularDelayMs);
    });

    it('opens and closes the gas modal', async function () {
      // Set the gas limit
      await driver.clickElement('.advanced-gas-options-btn');
      await driver.delay(regularDelayMs);

      // wait for gas modal to be visible
      const gasModal = await driver.findVisibleElement('span .modal');
      await driver.clickElement('.page-container__header-close-text');
      // wait for gas modal to be removed from dom
      await gasModal.waitForElementState('hidden');
      await driver.delay(regularDelayMs);
    });

    it('clicks through to the confirm screen', async function () {
      // Continue to next screen
      await driver.clickElement({ text: 'Next', tag: 'button' });
      await driver.delay(regularDelayMs);
    });

    it('confirms the transaction', async function () {
      await driver.clickElement({ text: 'Confirm', tag: 'button' });
    });

    it('finds the transaction in the transactions list', async function () {
      await driver.clickElement('[data-testid="home__activity-tab"]');
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
    });
  });
});
