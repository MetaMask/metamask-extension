const assert = require('assert');
const { until } = require('selenium-webdriver');
const getPort = require('get-port');

const enLocaleMessages = require('../../app/_locales/en/messages.json');
const { tinyDelayMs, regularDelayMs, largeDelayMs } = require('./helpers');
const { buildWebDriver } = require('./webdriver');
const Ganache = require('./ganache');

const ganacheServer = new Ganache();

describe('MetaMask', function () {
  let driver;

  const testSeedPhrase =
    'forum vessel pink push lonely enact gentle tail admit parrot grunt dress';

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
    const result = await buildWebDriver({ port: await getPort() });
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

  describe('set up data to be restored by 3box', function () {
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
        const [confirmPassword] = await driver.findElements(
          '#confirm-password',
        );
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

      it('balance renders', async function () {
        const balance = await driver.findElement(
          '[data-testid="wallet-balance"] .list-item__heading',
        );
        await driver.wait(until.elementTextMatches(balance, /25\s*ETH/u));
        await driver.delay(regularDelayMs);
      });
    });

    describe('turns on threebox syncing', function () {
      it('goes to the settings screen', async function () {
        await driver.clickElement('.account-menu__icon');
        await driver.delay(regularDelayMs);

        await driver.clickElement({ text: 'Settings', tag: 'div' });
      });

      it('turns on threebox syncing', async function () {
        await driver.clickElement({ text: 'Advanced', tag: 'div' });
        await driver.clickElement(
          '[data-testid="advanced-setting-3box"] .toggle-button div',
        );
      });
    });

    describe('updates settings and address book', function () {
      it('navigates to General settings', async function () {
        await driver.clickElement({ text: 'General', tag: 'div' });
      });

      it('turns on use of blockies', async function () {
        await driver.clickElement('.toggle-button > div');
      });

      it('adds an address to the contact list', async function () {
        await driver.clickElement({ text: 'Contacts', tag: 'div' });

        await driver.clickElement('.address-book-add-button__button');
        await driver.delay(tinyDelayMs);

        const addAddressInputs = await driver.findElements('input');
        await addAddressInputs[0].sendKeys('Test User Name 11');

        await driver.delay(tinyDelayMs);

        await addAddressInputs[1].sendKeys(
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );

        await driver.delay(largeDelayMs * 2);

        await driver.clickElement({ text: 'Save', tag: 'button' });

        await driver.findElement({ text: 'Test User Name 11', tag: 'div' });
        await driver.delay(regularDelayMs);
      });
    });
  });

  describe('restoration from 3box', function () {
    let driver2;

    before(async function () {
      const result = await buildWebDriver({ port: await getPort() });
      driver2 = result.driver;
      await driver2.navigate();
    });

    after(async function () {
      await driver2.quit();
    });

    describe('First time flow starting from an existing seed phrase', function () {
      it('clicks the continue button on the welcome screen', async function () {
        await driver2.findElement('.welcome-page__header');
        await driver2.clickElement({
          text: enLocaleMessages.getStarted.message,
          tag: 'button',
        });
        await driver2.delay(largeDelayMs);
      });

      it('clicks the "Import Wallet" option', async function () {
        await driver2.clickElement({ text: 'Import wallet', tag: 'button' });
        await driver2.delay(largeDelayMs);
      });

      it('clicks the "No thanks" option on the metametrics opt-in screen', async function () {
        await driver2.clickElement('.btn-default');
        await driver2.delay(largeDelayMs);
      });

      it('imports a seed phrase', async function () {
        const [seedTextArea] = await driver2.findElements(
          'input[placeholder="Paste seed phrase from clipboard"]',
        );
        await seedTextArea.sendKeys(testSeedPhrase);
        await driver2.delay(regularDelayMs);

        const [password] = await driver2.findElements('#password');
        await password.sendKeys('correct horse battery staple');
        const [confirmPassword] = await driver2.findElements(
          '#confirm-password',
        );
        confirmPassword.sendKeys('correct horse battery staple');

        await driver2.clickElement('.first-time-flow__terms');

        await driver2.clickElement({ text: 'Import', tag: 'button' });
        await driver2.delay(regularDelayMs);
      });

      it('clicks through the success screen', async function () {
        await driver2.findElement({ text: 'Congratulations', tag: 'div' });
        await driver2.clickElement({
          text: enLocaleMessages.endOfFlowMessage10.message,
          tag: 'button',
        });
        await driver2.delay(regularDelayMs);
      });

      it('balance renders', async function () {
        const balance = await driver2.findElement(
          '[data-testid="wallet-balance"] .list-item__heading',
        );
        await driver2.wait(until.elementTextMatches(balance, /25\s*ETH/u));
        await driver2.delay(regularDelayMs);
      });
    });

    describe('restores 3box data', function () {
      it('confirms the 3box restore notification', async function () {
        await driver2.clickElement('.home-notification__accept-button');
      });

      it('goes to the settings screen', async function () {
        await driver2.clickElement('.account-menu__icon');
        await driver2.delay(regularDelayMs);

        await driver2.clickElement({ text: 'Settings', tag: 'div' });
      });

      it('finds the blockies toggle turned on', async function () {
        await driver2.delay(regularDelayMs);
        const toggleLabel = await driver2.findElement('.toggle-button__status');
        const toggleLabelText = await toggleLabel.getText();
        assert.equal(toggleLabelText, 'ON');
      });

      it('finds the restored address in the contact list', async function () {
        await driver2.clickElement({ text: 'Contacts', tag: 'div' });
        await driver2.delay(regularDelayMs);

        await driver2.findElement({ text: 'Test User Name 11', tag: 'div' });
        await driver2.delay(regularDelayMs);
      });
    });
  });
});
