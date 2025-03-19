const {
  defaultGanacheOptions,
  withFixtures,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

async function validateEncryptionKey(driver, encryptionKey) {
  await driver.clickElement('#getEncryptionKeyButton');
  let windowHandles = await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog, windowHandles);
  await driver.waitForSelector({
    css: '.request-encryption-public-key__header__text',
    text: 'Request encryption public key',
  });
  await driver.clickElement({ text: 'Provide', tag: 'button' });
  windowHandles = await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
  await driver.findElement({
    css: '#encryptionKeyDisplay',
    text: encryptionKey,
  });
}

async function encryptMessage(driver, message) {
  await driver.fill('#encryptMessageInput', message);
  await driver.clickElement('#encryptButton');
  await driver.waitForSelector({
    css: '#ciphertextDisplay',
    text: '0x',
  });
}

async function decryptMessage(driver) {
  await driver.clickElement('#decryptButton');
  const windowHandles = await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog, windowHandles);
  await driver.waitForSelector({
    css: '.request-decrypt-message__header__text',
    text: 'Decrypt request',
  });
}

async function verifyDecryptedMessageMM(driver, message) {
  await driver.clickElement({ text: 'Decrypt message', tag: 'div' });
  await driver.waitForSelector({
    text: message,
    tag: 'div',
  });
  await driver.clickElement({ text: 'Decrypt', tag: 'button' });
}

async function verifyDecryptedMessageDapp(driver, message) {
  const windowHandles = await driver.getAllWindowHandles();
  await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
  await driver.findElement({
    css: '#cleartextDisplay',
    text: message,
  });
}

describe('Encrypt Decrypt', function () {
  const encryptionKey = 'fxYXfCbun026g5zcCQh7Ia+O0urAEVZWLG8H4Jzu7Xs=';
  const message = 'Hello, Bob!';

  it('should decrypt an encrypted message', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        // ------ Get Encryption key ------
        await validateEncryptionKey(driver, encryptionKey);

        // ------ Encrypt ------
        await encryptMessage(driver, message);

        // ------ Decrypt ------
        await decryptMessage(driver);

        // Account balance is converted properly
        await driver.waitForSelector({
          css: '.request-decrypt-message__balance-value',
          text: '25 ETH',
        });
        // Verify message in MetaMask Notification
        await verifyDecryptedMessageMM(driver, message);

        // Verify message in Test Dapp
        await driver.waitUntilXWindowHandles(2);
        await verifyDecryptedMessageDapp(driver, message);
      },
    );
  });

  it('should encrypt and decrypt multiple messages', async function () {
    const message2 = 'Hello, Alice!';
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        // ------ Get Encryption key ------
        await validateEncryptionKey(driver, encryptionKey);

        // ------ Encrypt Message 1------
        await encryptMessage(driver, message);

        // ------ Decrypt Message 1 ------
        await decryptMessage(driver);

        // ------ Switch to Dapp ------
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

        // ------ Encrypt Message 2------
        await encryptMessage(driver, message2);

        // ------ Decrypt Message 2 ------
        await decryptMessage(driver);

        // Verify message 1 in MetaMask Notification
        await verifyDecryptedMessageMM(driver, message);

        // Verify message 1 in Test Dapp
        await verifyDecryptedMessageDapp(driver, message);

        // ------ Switch to Dapp ------
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        // Verify message 2 in MetaMask Notification
        await verifyDecryptedMessageMM(driver, message2);

        // Verify message 2 in Test Dapp
        await verifyDecryptedMessageDapp(driver, message2);
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
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        // ------ Get Encryption key and display ETH ------
        await driver.clickElement('#getEncryptionKeyButton');
        const windowHandles = await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );
        await driver.waitForSelector({
          css: '.request-encryption-public-key__header__text',
          text: 'Request encryption public key',
        });
        // Account balance is converted properly
        await driver.waitForSelector({
          css: '.request-encryption-public-key__balance-value',
          text: '25 ETH',
        });
      },
    );
  });

  it('should show balance correctly in native tokens', async function () {
    // In component ui/pages/confirm-encryption-public-key/confirm-encryption-public-key.container.js, after removing useNativeCurrencyAsPrimaryCurrency;
    // We will display native balance in the confirm-encryption-public-key.component.js
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            preferences: {
              showNativeTokenAsMainBalance: false,
            },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);

        // ------ Get Encryption key and display ETH ------
        await driver.clickElement('#getEncryptionKeyButton');
        const windowHandles = await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );
        await driver.waitForSelector({
          css: '.request-encryption-public-key__header__text',
          text: 'Request encryption public key',
        });

        // Account balance is converted properly
        await driver.waitForSelector({
          css: '.request-encryption-public-key__balance-value',
          text: '25 ETH',
        });
      },
    );
  });
});
