const { strict: assert } = require('assert');
const path = require('path');
const fs = require('fs');
const {
  withFixtures,
  WALLET_PASSWORD,
  openSRPRevealQuiz,
  completeSRPRevealQuiz,
  tapAndHoldToRevealSRP,
  completeCreateNewWalletOnboardingFlowWithOptOut,
} = require('./helpers');

const VAULT_DECRYPTOR_PAGE = 'https://metamask.github.io/vault-decryptor';

/**
 * Retrieve the extension's storage file path that can be used
 * with the Vault decryptor tool.
 *
 * Note that this folder is usually unavailable when running e2e tests
 * on a test build, as test builds do not use the real browser storage.
 *
 * @param {WebDriver} driver
 * @returns {Promise<string>} The SRP
 */
async function getExtensionStorageFilePath(driver) {
  const { userDataDir } = (await driver.driver.getCapabilities()).get('chrome');
  const extensionsStoragePath = path.resolve(
    userDataDir,
    'Default',
    'Local Extension Settings',
  );
  // we expect the extension to have been installed only once
  const extensionName = fs.readdirSync(extensionsStoragePath)[0];
  const extensionStoragePath = path.resolve(
    extensionsStoragePath,
    extensionName,
  );
  const logFiles = fs
    .readdirSync(extensionStoragePath)
    .filter((filename) => filename.endsWith('.log'));

  // Use the first of the `.log` files found
  return path.resolve(extensionStoragePath, logFiles[0]);
}

/**
 * Closes the announcements popover if present
 *
 * @param {WebDriver} driver
 */
async function closePopoverIfPresent(driver) {
  const popoverButtonSelector = '[data-testid="popover-close"]';
  try {
    if (await driver.isElementPresent(popoverButtonSelector)) {
      await driver.clickElement(popoverButtonSelector);
    }
  } catch (_err) {
    // No popover
  }
}

/**
 * Obtain the SRP from the settings
 *
 * @param {WebDriver} driver
 * @returns {Promise<string>} The SRP
 */
async function getSRP(driver) {
  await openSRPRevealQuiz(driver);
  await completeSRPRevealQuiz(driver);
  await driver.fill('[data-testid="input-password"]', WALLET_PASSWORD);
  await driver.press('[data-testid="input-password"]', driver.Key.ENTER);
  await tapAndHoldToRevealSRP(driver);
  return (await driver.findElement('[data-testid="srp_text"]')).getText();
}

describe('Vault Decryptor Page', function () {
  it('is able to decrypt the vault using the vault-decryptor webapp', async function () {
    await withFixtures({}, async ({ driver }) => {
      await driver.navigate();
      // the first app launch opens a new tab, we need to switch the focus
      // to the first one.
      await driver.switchToWindowWithTitle('MetaMask');
      // create a new vault through onboarding flow
      await completeCreateNewWalletOnboardingFlowWithOptOut(
        driver,
        WALLET_PASSWORD,
      );
      // close popover if any (Announcements etc..)
      await closePopoverIfPresent(driver);
      // obtain SRP
      const seedPhrase = await getSRP(driver);

      // navigate to the Vault decryptor webapp
      await driver.openNewPage(VAULT_DECRYPTOR_PAGE);
      // fill the input field with storage recovered from filesystem
      await driver.clickElement('[name="vault-source"]');
      const inputField = await driver.findElement('#fileinput');
      inputField.press(await getExtensionStorageFilePath(driver));
      // fill in the password
      await driver.fill('#passwordinput', WALLET_PASSWORD);
      // decrypt
      await driver.clickElement('.decrypt');
      const decrypted = await driver.findElement('.content div div div');
      const recoveredVault = JSON.parse(await decrypted.getText());

      assert.equal(recoveredVault[0].data.mnemonic, seedPhrase);
    });
  });
});
