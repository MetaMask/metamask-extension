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
 * Gets the size of a file in bytes.
 *
 * @param {string} filePath - The path to the file.
 * @returns {Promise<number>} A promise that resolves to the size of the file in bytes.
 */
async function getFileSize(filePath) {
  const stats = await fs.promises.stat(filePath);
  console.log(`File Size =========================: ${stats.size} bytes`);
  return stats.size;
}

/**
 * Closes the announcements popover if present
 *
 * @param {WebDriver} driver
 */
async function closePopoverIfPresent(driver) {
  const popoverButtonSelector = '[data-testid="popover-close"]';
  // It shows in the Smart Transactions Opt-In Modal.
  const enableButtonSelector = {
    text: 'Enable',
    tag: 'button',
  };
  await driver.clickElementSafe(popoverButtonSelector);
  await driver.clickElementSafe(enableButtonSelector);

  // Token Autodetection Independent Announcement
  const tokenAutodetection = {
    css: '[data-testid="auto-detect-token-modal"] button',
    text: 'Not right now',
  };
  await driver.clickElementSafe(tokenAutodetection);

  // NFT Autodetection Independent Announcement
  const nftAutodetection = {
    css: '[data-testid="auto-detect-nft-modal"] button',
    text: 'Not right now',
  };
  await driver.clickElementSafe(nftAutodetection);
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
    await withFixtures(
      {
        disableServerMochaToBackground: true,
      },
      async ({ driver }) => {
        // we don't need to use navigate
        // since MM will automatically open a new window in prod build
        await driver.waitUntilXWindowHandles(2);

        // we cannot use the customized driver functions
        // as there is no socket for window communications in prod builds
        const windowHandles = await driver.driver.getAllWindowHandles();

        // switch to MetaMask window
        await driver.driver.switchTo().window(windowHandles[2]);

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

        const filePath = await getExtensionStorageFilePath(driver);

        // Retry-logic to ensure the file is ready before uploading it
        // to mitigate flakiness when Chrome hasn't finished writing
        const MAX_RETRIES = 3;
        const MIN_FILE_SIZE = 1000000; // bytes

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          const fileSize = await getFileSize(filePath);
          if (fileSize > MIN_FILE_SIZE) {
            break;
          } else {
            console.log(`File size is too small (${fileSize} bytes)`);
            if (attempt < MAX_RETRIES - 1) {
              console.log(`Waiting for 2 seconds before retrying...`);
              await driver.delay(2000);
            }
          }
        }

        await inputField.press(filePath);

        // fill in the password
        await driver.fill('#passwordinput', WALLET_PASSWORD);
        // decrypt
        await driver.clickElement('.decrypt');
        const decrypted = await driver.findElement('.content div div div');
        const recoveredVault = JSON.parse(await decrypted.getText());

        assert.equal(recoveredVault[0].data.mnemonic, seedPhrase);
      },
    );
  });
});
