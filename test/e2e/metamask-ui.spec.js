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
      await driver.clickElement('.btn-secondary');
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

});
