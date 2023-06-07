const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures, openDapp } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Encrypt Decrypt', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  const encryptionKey = 'fxYXfCbun026g5zcCQh7Ia+O0urAEVZWLG8H4Jzu7Xs=';
  const message = 'Hello, Bob!';
  it('should decrypt an encrypted message', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        await openDapp(driver);

        // ------ Get Encryption key ------
        await driver.clickElement('#getEncryptionKeyButton');
        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.waitForSelector({
          css: '.request-encryption-public-key__header__text',
          text: 'Request encryption public key',
        });
        await driver.clickElement({ text: 'Provide', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
        const encryptionKeyLabel = await driver.findElement(
          '#encryptionKeyDisplay',
        );
        assert.equal(await encryptionKeyLabel.getText(), encryptionKey);

        // ------ Encrypt ------
        await driver.fill('#encryptMessageInput', message);
        await driver.clickElement('#encryptButton');
        await driver.waitForSelector({
          css: '#ciphertextDisplay',
          text: '0x',
        });

        // ------ Decrypt ------
        await driver.clickElement('#decryptButton');
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.waitForSelector({
          css: '.request-decrypt-message__header__text',
          text: 'Decrypt request',
        });
        // Account balance is converted properly
        const decryptAccountBalanceLabel = await driver.findElement(
          '.request-decrypt-message__balance-value',
        );
        assert.equal(await decryptAccountBalanceLabel.getText(), '25 ETH');
        // Verify message in MetaMask Notification
        await driver.clickElement({ text: 'Decrypt message', tag: 'div' });
        const notificationMessage = await driver.isElementPresent({
          text: message,
          tag: 'div',
        });
        assert.equal(notificationMessage, true);
        await driver.clickElement({ text: 'Decrypt', tag: 'button' });

        // Verify message in Test Dapp
        await driver.waitUntilXWindowHandles(2);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
        const clearTextLabel = await driver.findElement('#cleartextDisplay');
        assert.equal(await clearTextLabel.getText(), message);
      },
    );
  });

  it('should show balance correctly as ETH', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        await openDapp(driver);

        // ------ Get Encryption key and display ETH ------
        await driver.clickElement('#getEncryptionKeyButton');
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.waitForSelector({
          css: '.request-encryption-public-key__header__text',
          text: 'Request encryption public key',
        });
        // Account balance is converted properly
        const accountBalanceLabel = await driver.findElement(
          '.request-encryption-public-key__balance-value',
        );
        assert.equal(await accountBalanceLabel.getText(), '25 ETH');
      },
    );
  });

  it('should show balance correctly as Fiat', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            preferences: {
              useNativeCurrencyAsPrimaryCurrency: false,
            },
          })
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await openDapp(driver);

        // ------ Get Encryption key and display ETH ------
        await driver.clickElement('#getEncryptionKeyButton');
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.waitForSelector({
          css: '.request-encryption-public-key__header__text',
          text: 'Request encryption public key',
        });

        // Account balance is converted properly
        const accountBalanceLabel = await driver.findElement(
          '.request-encryption-public-key__balance-value',
        );
        assert.equal(await accountBalanceLabel.getText(), '$42,500.00 USD');
      },
    );
  });
});
