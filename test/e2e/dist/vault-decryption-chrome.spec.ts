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
 * Simulates the vault-decryptor webapp's extractVaultFromFile function to
 * check whether it would successfully extract the vault from the given content.
 *
 * This mirrors the exact behaviour of the vault-decryptor, including its bug:
 * attempt 3 has no try-catch, so a regex match with an invalid JSON.parse
 * throws and prevents attempts 4-7 from running.
 *
 * @param data - File content read as UTF-8 text.
 * @returns true if the vault-decryptor would successfully extract a vault.
 */
function canVaultDecryptorExtract(data: string): boolean {
  // attempt 1: raw json
  try {
    const parsed = JSON.parse(data);
    if (
      typeof parsed === 'object' &&
      typeof parsed?.data === 'string' &&
      typeof parsed?.iv === 'string' &&
      typeof parsed?.salt === 'string'
    ) {
      return true;
    }
  } catch {
    // Not valid JSON: continue
  }

  // attempt 3: NO try-catch in the vault-decryptor — if this regex matches
  // but JSON.parse fails, the error propagates and attempts 4-7 never run.
  {
    const matches = data.match(/"KeyringController":{"vault":"{[^{}]*}"/);
    if (matches && matches.length) {
      try {
        const vaultBody = matches[0].substring(29);
        JSON.parse(JSON.parse(vaultBody));
        return true;
      } catch {
        // The vault-decryptor would throw here and stop — attempts 4-7 unreachable
        return false;
      }
    }
  }

  // attempt 4
  {
    const matches = data.match(
      /KeyringController":(\{"vault":".*?=\\"\}"\})/,
    );
    if (matches && matches.length) {
      try {
        const frag = matches[1];
        const dataMatch = frag.match(/\\"data\\":\\"([A-Za-z0-9+/]*=*)/u);
        const ivMatch = frag.match(
          /,\\"iv\\":\\"([A-Za-z0-9+/]{10,40}=*)/u,
        );
        const saltMatch = frag.match(
          /,\\"salt\\":\\"([A-Za-z0-9+/]{10,100}=*)\\"/,
        );
        if (dataMatch && ivMatch && saltMatch) {
          return true;
        }
      } catch {
        // continue
      }
    }
  }

  // attempt 5
  {
    const matches = data.match(
      /"KeyringController":(\{.*?"vault":".*?=\\"\}"\})/,
    );
    if (matches && matches.length) {
      try {
        const frag = matches[1];
        const dataMatch = frag.match(/\\"data\\":\\"([A-Za-z0-9+/]*=*)/u);
        const ivMatch = frag.match(
          /,\\"iv\\":\\"([A-Za-z0-9+/]{10,40}=*)/u,
        );
        const saltMatch = frag.match(
          /,\\"salt\\":\\"([A-Za-z0-9+/]{10,100}=*)\\"/,
        );
        if (dataMatch && ivMatch && saltMatch) {
          return true;
        }
      } catch {
        // continue
      }
    }
  }

  // attempt 7 (most flexible pattern)
  {
    const vaultRegex =
      /KeyringController[\s\S]*?"vault":"((?:[^"\\]|\\.)*)"/g;
    let match;
    while ((match = vaultRegex.exec(data)) !== null) {
      try {
        const vaultString = JSON.parse(`"${match[1]}"`);
        const json = JSON.parse(vaultString);
        if (
          typeof json === 'object' &&
          typeof json?.data === 'string' &&
          typeof json?.iv === 'string' &&
          typeof json?.salt === 'string'
        ) {
          return true;
        }
      } catch {
        // continue to next match
      }
    }
  }

  return false;
}

/**
 * Returns the best file to upload to the vault-decryptor from the LevelDB
 * directory. Tries each database file (.log first, then .ldb) and picks
 * the first one the vault-decryptor can actually parse.
 *
 * If no raw database file is parseable (due to binary data interfering with
 * the vault-decryptor's regex-based extraction), falls back to extracting
 * the vault via the `level` library and writing it as a standalone JSON file.
 *
 * @param extensionStoragePath - The copied LevelDB directory.
 * @param originalExtensionPath - The original (live) extension storage path,
 *   used for a separate LevelDB read if needed (opening LevelDB mutates files).
 * @returns The path to the file to upload.
 */
async function getUploadableVaultFile(
  extensionStoragePath: string,
  originalExtensionPath: string,
  testTitle: string,
): Promise<string> {
  const allFiles = fs.readdirSync(extensionStoragePath);
  const logFiles = allFiles.filter((f: string) => f.endsWith('.log'));
  const ldbFiles = allFiles.filter((f: string) => f.endsWith('.ldb'));

  console.log('Log Files =========================:', logFiles.length);

  for (const file of [...logFiles, ...ldbFiles]) {
    const filePath = path.resolve(extensionStoragePath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const size = fs.statSync(filePath).size;

    if (canVaultDecryptorExtract(content)) {
      console.log(`Vault data found in ${file} (${size} bytes)`);
      return filePath;
    }
    console.log(`${file} (${size} bytes): vault-decryptor cannot parse`);
  }

  // Save unparseable database files as test artifacts so they can be
  // downloaded from CI and used to reproduce the vault-decryptor bug.
  const artifactDir = `./test-artifacts/chrome/${testTitle.replace(/\s+/g, '_')}`;
  await fs.mkdir(artifactDir, { recursive: true });
  for (const file of [...logFiles, ...ldbFiles]) {
    const src = path.resolve(extensionStoragePath, file);
    const dest = path.join(artifactDir, file);
    await fs.copy(src, dest);
    console.log(`Saved unparseable DB file as artifact: ${dest}`);
  }

  // Fallback: extract the vault via the level library and write as JSON.
  // This is needed when the vault-decryptor's attempt 3 regex matches
  // binary garbage and throws before the more robust attempts 4-7 can run
  // (a known bug in the vault-decryptor's extractVaultFromFile function).
  console.log(
    'No raw database file is parseable by vault-decryptor, extracting vault via LevelDB',
  );
  let diagDir;
  let db;
  try {
    diagDir = await copyDirectoryToTmp(originalExtensionPath);
    db = new level.Level(diagDir, { valueEncoding: 'json' });
    await db.open();
    const keyringController = (await db.get(
      'KeyringController',
    )) as unknown as { vault: string };
    const vaultFilePath = path.join(extensionStoragePath, 'vault.json');
    await fs.writeFile(vaultFilePath, keyringController.vault);
    console.log(`Vault extracted from LevelDB to ${vaultFilePath}`);
    return vaultFilePath;
  } finally {
    if (db) {
      await db.close();
    }
    if (diagDir) {
      await fs.remove(diagDir);
    }
  }
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
/**
 * Returns the first .log file from the extension's LevelDB directory.
 */
function getExtensionLogFile(extensionStoragePath: string): string {
  const logFiles = fs
    .readdirSync(extensionStoragePath)
    .filter((f: string) => f.endsWith('.log'));
  console.log('Log Files =========================:', logFiles.length);
  return path.resolve(extensionStoragePath, logFiles[0]);
}

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
    const logFile = getExtensionLogFile(extensionPath);
    const fileSize = await getFileSize(logFile);
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
  throw new Error(
    `File did not reach the minimum size of ${minFileSize} bytes after ${maxRetries} retries.`,
  );
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

        // copy LevelDB directory to a temp location, to avoid reading it while the browser is writing it
        let copiedDir;
        try {
          copiedDir = await copyDirectoryToTmp(extensionPath);
          const dbFileCopy = await getUploadableVaultFile(
            copiedDir,
            extensionPath,
            this.test?.fullTitle() ?? 'vault-decryption',
          );

          // navigate to the Vault decryptor webapp and fill the input field with storage recovered from filesystem
          await driver.openNewPage(VAULT_DECRYPTOR_PAGE);
          const vaultDecryptorPage = new VaultDecryptorPage(driver);
          await vaultDecryptorPage.checkPageIsLoaded();
          await vaultDecryptorPage.uploadLogFile(dbFileCopy);

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

        // copy LevelDB to a temp location, to avoid reading it while the browser is writing it
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
