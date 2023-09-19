const util = require('ethereumjs-util');
const { retry } = require('../../../development/lib/retry');
const FixtureBuilder = require('../fixture-builder');
const {
  withFixtures,
  WALLET_PASSWORD,
  convertETHToHexGwei,
  PRIVATE_KEY,
  PRIVATE_KEY_TWO,
  sendTransaction,
} = require('../helpers');
const { TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL } = require('./enums');

describe('Test Snap Account', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey: PRIVATE_KEY,
        balance: convertETHToHexGwei(25),
      },
      {
        secretKey: PRIVATE_KEY_TWO,
        balance: convertETHToHexGwei(25),
      },
    ],
  };

  let windowHandles;

  it('can create a new snap account', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        failOnConsoleError: false,
        title: this.test.title,
      },
      async ({ driver }) => {
        await installSnapSimpleKeyring(driver);

        // create new account on dapp
        await driver.clickElement({
          text: 'Create account',
          tag: 'div',
        });

        await driver.clickElement({
          text: 'Create Account',
          tag: 'button',
        });

        await driver.delay(1000);

        await switchToAccount2(driver);
      },
    );
  });

  it('can import a private key', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        failOnConsoleError: false,
        title: this.test.title,
      },
      async ({ driver }) => {
        await installSnapSimpleKeyring(driver);

        // create new account on dapp
        await driver.clickElement({
          text: 'Import account',
          tag: 'div',
        });

        await driver.fill(
          "[placeholder='0x0000000000000000000000000000000000000000000000000000000000000000']",
          PRIVATE_KEY_TWO,
        );

        await driver.clickElement({
          text: 'Import Account',
          tag: 'button',
        });

        await switchToAccount2(driver);

        // send from Account 2 to Account 1
        await sendTransaction(
          driver,
          util // convert PRIVATE_KEY to public key
            .privateToAddress(Buffer.from(PRIVATE_KEY.slice(2), 'hex'))
            .toString('hex'),
          1,
        );
      },
    );
  });

  async function installSnapSimpleKeyring(driver) {
    driver.navigate();

    // this is flaky without the retry and refresh()
    await retry({ retries: 5 }, async () => {
      try {
        await driver.findElement('#password');
        return true;
      } catch (err) {
        driver.driver.navigate().refresh();
        return false;
      }
    });

    // enter pw into extension
    await driver.fill('#password', WALLET_PASSWORD);
    await driver.press('#password', driver.Key.ENTER);

    // navigate to test snaps page and connect
    await driver.openNewPage(TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL);
    await driver.delay(1000);
    const connectButton = await driver.findElement('#connectButton');
    await driver.scrollToElement(connectButton);
    await driver.delay(1000);
    await driver.clickElement('#connectButton');
    await driver.delay(500);

    // switch to metamask extension and click connect
    windowHandles = await driver.waitUntilXWindowHandles(3, 1000, 10000);
    await driver.switchToWindowWithTitle(
      'MetaMask Notification',
      windowHandles,
    );
    await driver.clickElement({
      text: 'Connect',
      tag: 'button',
    });

    await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

    await driver.waitForSelector({ text: 'Install' });

    await driver.clickElement({
      text: 'Install',
      tag: 'button',
    });

    await driver.waitForSelector({ text: 'OK' });

    await driver.clickElement({
      text: 'OK',
      tag: 'button',
    });

    await driver.switchToWindowWithTitle(
      'SSK - Snap Simple Keyring',
      windowHandles,
    );

    // look for a span that says either `Connected` or `Reconnect`
    await driver.waitForSelector({
      text: 'Connected',
      tag: 'span',
    });
  }

  async function switchToAccount2(driver) {
    // switch to metamask extension
    await driver.switchToWindowWithTitle('MetaMask', windowHandles);

    // click on accounts
    await driver.clickElement('[data-testid="account-menu-icon"]');

    const label = await driver.findElement({ css: '.mm-tag', text: 'Snaps' });

    label.click();

    await driver.waitForElementNotPresent('.mm-tag');
  }
});
