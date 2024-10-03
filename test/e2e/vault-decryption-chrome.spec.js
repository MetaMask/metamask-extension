const { strict: assert } = require('assert');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const level = require('level');
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
 * Copies a directory to a temporary location.
 *
 * @param {string} srcDir - The source directory to copy.
 * @returns {Promise<string>} The path to the copied directory in the temporary location.
 */
async function copyDirectoryToTmp(srcDir) {
  try {
    // Get a temporary directory
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'temp'));

    // Define the destination path in the temporary directory
    const destDir = path.join(tmpDir, path.basename(srcDir));

    // Copy the directory
    await fs.copy(srcDir, destDir);
    console.log(`Directory copied to: ${destDir}`);
    return destDir;
  } catch (err) {
    console.error('Error copying directory:', err);
    return null;
  }
}

/**
 * Retrieve the extension's storage file path.
 *
 * Note that this folder is usually unavailable when running e2e tests
 * on a test build, as test builds do not use the real browser storage.
 *
 * @param {WebDriver} driver
 * @returns {Promise<string>} The extension storage path.
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

  return extensionStoragePath;
}

/**
 * Retrieve the log file from the extension's storage path.
 *
 * @param {string} extensionStoragePath - The path to the extension's storage.
 * @returns {string} The log file path.
 */
function getExtensionLogFile(extensionStoragePath) {
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
 * Retry logic to ensure Chrome has finish writing into the file.
 *
 * @param {object} options - The options object.
 * @param {WebDriver} options.driver - The WebDriver instance.
 * @param {string} options.filePath - The path to the file.
 * @param {number} options.maxRetries - The maximum number of retries.
 * @param {number} options.minFileSize - The minimum file size in bytes.
 * @returns {Promise<void>}
 */
async function waitUntilFileIsWritten({
  driver,
  filePath,
  maxRetries = 3,
  minFileSize = 1000000,
}) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const fileSize = await getFileSize(filePath);
    if (fileSize > minFileSize) {
      break;
    } else {
      console.log(`File size is too small (${fileSize} bytes)`);
      if (attempt < maxRetries - 1) {
        console.log(`Waiting for 2 seconds before retrying...`);
        await driver.delay(2000);
      }
    }
  }
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
  it('is able to decrypt the vault uploading the log file in the vault-decryptor webapp', async function () {
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

        // Retry-logic to ensure the file is ready before uploading it
        // to mitigate flakiness when Chrome hasn't finished writing
        const extensionPath = await getExtensionStorageFilePath(driver);
        const extensionLogFile = getExtensionLogFile(extensionPath);
        await waitUntilFileIsWritten({ driver, filePath: extensionLogFile });

        await inputField.press(extensionLogFile);

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
  it('is able to decrypt the vault pasting the text in the vault-decryptor webapp', async function () {
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

        // retry-logic to ensure the file is written before copying it
        const extensionPath = await getExtensionStorageFilePath(driver);
        const extensionLogFile = getExtensionLogFile(extensionPath);
        await waitUntilFileIsWritten({ driver, filePath: extensionLogFile });

        // copy log file to a temp location, to avoid reading it while the browser is writting it
        let newDir;
        let vaultObj;
        let db;
        try {
          newDir = await copyDirectoryToTmp(extensionPath);
          db = new level.Level(newDir, { valueEncoding: 'json' });
          await db.open();
          const {
            KeyringController: { vault },
          } = await db.get('data');
          vaultObj = JSON.parse(vault);
        } finally {
          if (db) {
            await db.close();
          }
          if (newDir) {
            await fs.remove(newDir);
          }
        }

        await driver.clickElement('#radio-textinput');
        await driver.fill('#textinput', JSON.stringify(vaultObj));

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
