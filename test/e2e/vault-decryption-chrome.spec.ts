import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import level from 'level';
import { Driver } from './webdriver/driver';
import { WALLET_PASSWORD, WINDOW_TITLES, withFixtures } from './helpers';
import HeaderNavbar from './page-objects/pages/header-navbar';
import HomePage from './page-objects/pages/home/homepage';
import PrivacySettings from './page-objects/pages/settings/privacy-settings';
import SettingsPage from './page-objects/pages/settings/settings-page';
import VaultDecryptorPage from './page-objects/pages/vault-decryptor-page';
import { completeCreateNewWalletOnboardingFlowWithCustomSettings } from './page-objects/flows/onboarding.flow';

const VAULT_DECRYPTOR_PAGE = 'https://metamask.github.io/vault-decryptor';

/**
 * Copies a directory to a temporary location.
 *
 * @param srcDir - The source directory to copy.
 * @returns The path to the copied directory in the temporary location.
 */
async function copyDirectoryToTmp(srcDir: string): Promise<string> {
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
    return '';
  }
}

/**
 * Retrieve the extension's storage file path.
 *
 * Note that this folder is usually unavailable when running e2e tests
 * on a test build, as test builds do not use the real browser storage.
 *
 * @param driver
 * @returns The extension storage path.
 */
async function getExtensionStorageFilePath(driver: Driver): Promise<string> {
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
 * @param extensionStoragePath - The path to the extension's storage.
 * @returns The log file path.
 */
function getExtensionLogFile(extensionStoragePath: string): string {
  const logFiles = fs
    .readdirSync(extensionStoragePath)
    .filter((filename: string) => filename.endsWith('.log'));

  // Use the first of the `.log` files found
  return path.resolve(extensionStoragePath, logFiles[0]);
}

/**
 * Gets the size of a file in bytes.
 *
 * @param filePath - The path to the file.
 * @returns A promise that resolves to the size of the file in bytes.
 */
async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.promises.stat(filePath);
  console.log(`File Size =========================: ${stats.size} bytes`);
  return stats.size;
}

/**
 * Retry logic to ensure Chrome has finish writing into the file.
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param options.filePath - The path to the file.
 * @param options.maxRetries - The maximum number of retries.
 * @param options.minFileSize - The minimum file size in bytes.
 * @returns Resolves if the file meets the size requirement within the retries.
 * @throws {Error} If the file does not reach the minimum size after the maximum retries.
 */
async function waitUntilFileIsWritten({
  driver,
  filePath,
  maxRetries = 5,
  minFileSize = 1000000,
}: {
  driver: Driver;
  filePath: string;
  maxRetries?: number;
  minFileSize?: number;
}): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const fileSize = await getFileSize(filePath);
    if (fileSize > minFileSize) {
      console.log(`File is ready with size ${fileSize} bytes.`);
      return;
    }
    console.log(`File size is too small (${fileSize} bytes)`);
    if (attempt < maxRetries - 1) {
      console.log(`Waiting for 5 seconds before retrying...`);
      await driver.delay(5000);
    }
  }
  // If the loop completes without success, throw an error
  throw new Error(
    `File did not reach the minimum size of ${minFileSize} bytes after ${maxRetries} retries.`,
  );
}

/**
 * Closes the announcements popover if present
 *
 * @param driver
 */
async function closePopoverIfPresent(driver: Driver) {
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

describe('Vault Decryptor Page', function () {
  it('is able to decrypt the vault uploading the log file in the vault-decryptor webapp', async function () {
    await withFixtures(
      {
        disableServerMochaToBackground: true,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        // we don't need to use navigate since MM will automatically open a new window in prod build
        await driver.waitAndSwitchToWindowWithTitle(
          2,
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // switch to MetaMask window and create a new vault through onboarding flow
        await completeCreateNewWalletOnboardingFlowWithCustomSettings({
          driver,
          password: WALLET_PASSWORD,
          needNavigateToNewPage: false,
        });
        // close popover if any (Announcements etc..)
        await closePopoverIfPresent(driver);

        // go to privacy settings page
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('0');
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        // fill password to reveal SRP and get the SRP
        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();
        await privacySettings.openRevealSrpQuiz();
        await privacySettings.completeRevealSrpQuiz();
        await privacySettings.fillPasswordToRevealSrp(WALLET_PASSWORD);
        const seedPhrase = await privacySettings.getSrpInRevealSrpDialog();

        // Retry-logic to ensure the file is ready before uploading itto mitigate flakiness when Chrome hasn't finished writing
        const extensionPath = await getExtensionStorageFilePath(driver);
        const extensionLogFile = getExtensionLogFile(extensionPath);
        await waitUntilFileIsWritten({ driver, filePath: extensionLogFile });

        // navigate to the Vault decryptor webapp and fill the input field with storage recovered from filesystem
        await driver.openNewPage(VAULT_DECRYPTOR_PAGE);
        const vaultDecryptorPage = new VaultDecryptorPage(driver);
        await vaultDecryptorPage.checkPageIsLoaded();
        await vaultDecryptorPage.uploadLogFile(extensionLogFile);

        // fill the password and decrypt
        await vaultDecryptorPage.fillPassword();
        await vaultDecryptorPage.confirmDecrypt();
        await vaultDecryptorPage.checkVaultIsDecrypted(seedPhrase);
      },
    );
  });

  it('is able to decrypt the vault pasting the text in the vault-decryptor webapp', async function () {
    await withFixtures(
      {
        disableServerMochaToBackground: true,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        // we don't need to use navigate since MM will automatically open a new window in prod build

        await driver.waitAndSwitchToWindowWithTitle(
          2,
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // switch to MetaMask window and create a new vault through onboarding flow
        await completeCreateNewWalletOnboardingFlowWithCustomSettings({
          driver,
          password: WALLET_PASSWORD,
          needNavigateToNewPage: false,
        });
        // close popover if any (Announcements etc..)
        await closePopoverIfPresent(driver);

        // go to privacy settings page
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('0');
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        // fill password to reveal SRP and get the SRP
        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();
        await privacySettings.openRevealSrpQuiz();
        await privacySettings.completeRevealSrpQuiz();
        await privacySettings.fillPasswordToRevealSrp(WALLET_PASSWORD);
        const seedPhrase = await privacySettings.getSrpInRevealSrpDialog();

        // retry-logic to ensure the file is written before copying it
        const extensionPath = await getExtensionStorageFilePath(driver);
        const extensionLogFile = getExtensionLogFile(extensionPath);
        await waitUntilFileIsWritten({ driver, filePath: extensionLogFile });

        // copy log file to a temp location, to avoid reading it while the browser is writting it
        type VaultData = {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          KeyringController: {
            vault: string;
          };
        };
        let newDir;
        let vaultObj;
        let db;
        try {
          newDir = await copyDirectoryToTmp(extensionPath);
          db = new level.Level(newDir, { valueEncoding: 'json' });
          await db.open();
          const data = (await db.get('data')) as unknown as VaultData;
          vaultObj = JSON.parse(data.KeyringController.vault);
        } finally {
          if (db) {
            await db.close();
          }
          if (newDir) {
            await fs.remove(newDir);
          }
        }

        // navigate to the Vault decryptor webapp and fill the text input field with the vault text
        await driver.openNewPage(VAULT_DECRYPTOR_PAGE);
        const vaultDecryptorPage = new VaultDecryptorPage(driver);
        await vaultDecryptorPage.checkPageIsLoaded();
        await vaultDecryptorPage.fillVaultText(JSON.stringify(vaultObj));

        // fill the password and decrypt
        await vaultDecryptorPage.fillPassword();
        await vaultDecryptorPage.confirmDecrypt();
        await vaultDecryptorPage.checkVaultIsDecrypted(seedPhrase);
      },
    );
  });
});
