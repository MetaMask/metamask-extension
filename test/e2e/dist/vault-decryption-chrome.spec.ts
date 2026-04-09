import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import level from 'level';
import { Driver } from '../webdriver/driver';
import { WALLET_PASSWORD, WINDOW_TITLES } from '../constants';
import { withFixtures } from '../helpers';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import HomePage from '../page-objects/pages/home/homepage';
import PrivacySettings from '../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../page-objects/pages/settings/settings-page';
import VaultDecryptorPage from '../page-objects/pages/vault-decryptor-page';
import { completeCreateNewWalletOnboardingFlowWithCustomSettings } from '../page-objects/flows/onboarding.flow';

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
  const allFiles = fs.readdirSync(extensionStoragePath);
  const logFiles = allFiles.filter((filename: string) =>
    filename.endsWith('.log'),
  );
  const ldbFiles = allFiles.filter((filename: string) =>
    filename.endsWith('.ldb'),
  );

  console.log(
    `[vault-debug] Directory contents: ${allFiles.length} files total — .log: ${logFiles.length}, .ldb: ${ldbFiles.length}`,
  );
  console.log(`[vault-debug] All files: ${allFiles.join(', ')}`);

  for (const file of [...logFiles, ...ldbFiles]) {
    const filePath = path.resolve(extensionStoragePath, file);
    const stats = fs.statSync(filePath);
    console.log(`[vault-debug]   ${file}: ${stats.size} bytes`);
  }

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
 * @param options.maxRetries - The maximum number of retries.
 * @param options.minFileSize - The minimum file size in bytes.
 * @returns Resolves if the file meets the size requirement within the retries.
 * @throws {Error} If the file does not reach the minimum size after the maximum retries.
 */
async function waitUntilFileIsWritten({
  driver,
  maxRetries = 10,
  minFileSize = 30000,
}: {
  driver: Driver;
  maxRetries?: number;
  minFileSize?: number;
}): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const extensionPath = await getExtensionStorageFilePath(driver);
    const extensionLogFile = getExtensionLogFile(extensionPath);
    const fileSize = await getFileSize(extensionLogFile);
    if (fileSize > minFileSize) {
      console.log(`File is ready with size ${fileSize} bytes.`);
      return;
    }
    console.log(`File size is too small (${fileSize} bytes)`);
    if (attempt < maxRetries - 1) {
      console.log(`Waiting for 8 seconds before retrying...`);
      await driver.delay(8000);
    }
  }
  // If the loop completes without success, throw an error
  throw new Error(
    `File did not reach the minimum size of ${minFileSize} bytes after ${maxRetries} retries.`,
  );
}

/**
 * Diagnostic: reads the .log file as text and checks which vault-decryptor
 * regex attempts would match. Also opens the LevelDB to verify the vault
 * key exists. Logs everything so CI failures are debuggable.
 */
async function logVaultDiagnostics(copiedDir: string): Promise<void> {
  const logFile = getExtensionLogFile(copiedDir);
  const logFileData = fs.readFileSync(logFile, 'utf8');
  console.log(
    `[vault-debug] .log file read as UTF-8 text: ${logFileData.length} chars`,
  );

  // Check each regex attempt the vault-decryptor uses (attempts 3–7)
  const attempt3 =
    logFileData.match(/"KeyringController":{"vault":"{[^{}]*}"/);
  console.log(`[vault-debug] vault-decryptor attempt 3 (linux .log): ${attempt3 ? 'MATCH' : 'no match'}`);

  const attempt4 = logFileData.match(
    /KeyringController":(\{"vault":".*?=\\"\}"\})/,
  );
  console.log(`[vault-debug] vault-decryptor attempt 4 (macOS .log): ${attempt4 ? 'MATCH' : 'no match'}`);

  const attempt5 = logFileData.match(
    /"KeyringController":(\{.*?"vault":".*?=\\"\}"\})/,
  );
  console.log(`[vault-debug] vault-decryptor attempt 5 (macOS .log v2): ${attempt5 ? 'MATCH' : 'no match'}`);

  const attempt6 = logFileData.match(
    /Keyring[0-9][^}]*(\{[^\{\}]*\\"\})/u,
  );
  console.log(`[vault-debug] vault-decryptor attempt 6 (windows .ldb): ${attempt6 ? 'MATCH' : 'no match'}`);

  const attempt7Regex =
    /KeyringController[\s\S]*?"vault":"((?:[^"\\]|\\.)*)"/g;
  const attempt7 = attempt7Regex.exec(logFileData);
  console.log(`[vault-debug] vault-decryptor attempt 7 (split state): ${attempt7 ? 'MATCH' : 'no match'}`);

  // Check if the raw string "KeyringController" appears at all
  const kcIndex = logFileData.indexOf('KeyringController');
  console.log(
    `[vault-debug] "KeyringController" found in .log text at index: ${kcIndex}`,
  );
  if (kcIndex !== -1) {
    // Log a small window around it to see what the surrounding data looks like
    const start = Math.max(0, kcIndex - 20);
    const end = Math.min(logFileData.length, kcIndex + 200);
    const snippet = logFileData
      .substring(start, end)
      .replace(/[^\x20-\x7E]/g, '�');
    console.log(`[vault-debug] Context around KeyringController: ${snippet}`);
  }

  // Verify the vault is actually in the LevelDB by reading it properly
  let db;
  try {
    db = new level.Level(copiedDir, { valueEncoding: 'json' });
    await db.open();
    const keyringController = (await db.get('KeyringController')) as {
      vault?: string;
    };
    const hasVault = Boolean(keyringController?.vault);
    console.log(
      `[vault-debug] LevelDB read KeyringController.vault: ${hasVault ? 'EXISTS' : 'MISSING'}`,
    );
    if (hasVault) {
      const vaultStr = keyringController.vault as string;
      console.log(
        `[vault-debug] vault string length: ${vaultStr.length}, starts with: ${vaultStr.substring(0, 80)}...`,
      );
    }
  } catch (err) {
    console.log(`[vault-debug] LevelDB read error: ${err}`);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

describe('Vault Decryptor Page', function () {
  for (let run = 1; run <= 5; run++) {
  it(`[run ${run}/5] is able to decrypt the vault uploading the log file in the vault-decryptor webapp`, async function () {
    if (process.env.SELENIUM_BROWSER !== 'chrome') {
      // TODO: Get this working on Firefox
      this.skip();
    }
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

        // Retry-logic to ensure the file is ready before uploading it to mitigate flakiness when Chrome hasn't finished writing
        const extensionPath = await getExtensionStorageFilePath(driver);
        await waitUntilFileIsWritten({ driver });

        // copy log file to a temp location, to avoid reading it while the browser is writing it
        let copiedDir;
        try {
          copiedDir = await copyDirectoryToTmp(extensionPath);
          const extensionLogFileCopy = getExtensionLogFile(copiedDir);

          // Diagnostic logging to debug flakiness in webpack dist builds
          await logVaultDiagnostics(copiedDir);

          // navigate to the Vault decryptor webapp and fill the input field with storage recovered from filesystem
          await driver.openNewPage(VAULT_DECRYPTOR_PAGE);
          const vaultDecryptorPage = new VaultDecryptorPage(driver);
          await vaultDecryptorPage.checkPageIsLoaded();
          await vaultDecryptorPage.uploadLogFile(extensionLogFileCopy);

          // fill the password and decrypt
          await vaultDecryptorPage.fillPassword();
          await vaultDecryptorPage.confirmDecrypt();

          // go back to MetaMask
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          // go to security and password settings page
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.checkBalanceEmptyStateIsDisplayed();
          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToSecurityAndPasswordSettings();

          // fill password to reveal SRP and get the SRP
          const privacySettings = new PrivacySettings(driver);
          await privacySettings.checkSecurityAndPasswordPageIsLoaded();
          await privacySettings.openRevealSrpQuiz();
          await privacySettings.completeRevealSrpQuiz();
          await privacySettings.fillPasswordToRevealSrp(WALLET_PASSWORD);
          const seedPhrase = await privacySettings.getSrpInRevealSrpDialog();

          // compare the SRP values
          await driver.switchToWindowWithTitle('MetaMask Vault Decryptor');
          await vaultDecryptorPage.checkVaultIsDecrypted(seedPhrase);
        } finally {
          if (copiedDir) {
            await fs.remove(copiedDir);
          }
        }
      },
    );
  });
  } // end for-loop (run x5)

  it('is able to decrypt the vault pasting the text in the vault-decryptor webapp', async function () {
    if (process.env.SELENIUM_BROWSER !== 'chrome') {
      // TODO: Get this working on Firefox
      this.skip();
    }
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

        // Ensure we're on the main extension window after onboarding
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // go to security and password settings page
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkBalanceEmptyStateIsDisplayed();
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToSecurityAndPasswordSettings();

        // fill password to reveal SRP and get the SRP
        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkSecurityAndPasswordPageIsLoaded();
        await privacySettings.openRevealSrpQuiz();
        await privacySettings.completeRevealSrpQuiz();
        await privacySettings.fillPasswordToRevealSrp(WALLET_PASSWORD);
        const seedPhrase = await privacySettings.getSrpInRevealSrpDialog();

        // retry-logic to ensure the file is written before copying it
        const extensionPath = await getExtensionStorageFilePath(driver);
        await waitUntilFileIsWritten({ driver });

        // copy log file to a temp location, to avoid reading it while the browser is writting it
        type VaultData = {
          vault: string;
        };
        let newDir;
        let vaultObj;
        let db;
        try {
          newDir = await copyDirectoryToTmp(extensionPath);
          db = new level.Level(newDir, { valueEncoding: 'json' });
          await db.open();
          const keyringController = (await db.get(
            'KeyringController',
          )) as unknown as VaultData;
          vaultObj = JSON.parse(keyringController.vault);
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
