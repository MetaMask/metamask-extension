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
 * The vault-decryptor regex patterns used to extract the vault from a file.
 * Attempts are tried in order; the first match wins.
 */
const VAULT_DECRYPTOR_REGEXES: { name: string; regex: RegExp }[] = [
  {
    name: 'attempt 3 (linux .log)',
    regex: /"KeyringController":{"vault":"{[^{}]*}"/,
  },
  {
    name: 'attempt 4 (macOS .log)',
    regex: /KeyringController":(\{"vault":".*?=\\"\}"\})/,
  },
  {
    name: 'attempt 5 (macOS .log v2)',
    regex: /"KeyringController":(\{.*?"vault":".*?=\\"\}"\})/,
  },
  {
    name: 'attempt 6 (windows .ldb)',
    regex: /Keyring[0-9][^}]*(\{[^\{\}]*\\"\})/u,
  },
  {
    name: 'attempt 7 (split state)',
    regex: /KeyringController[\s\S]*?"vault":"((?:[^"\\]|\\.)*)"/,
  },
];

/**
 * Checks whether the vault-decryptor would be able to extract the vault
 * from the given file content using its regex-based parsing.
 *
 * @param content - File content read as UTF-8 text.
 * @returns true if at least one vault-decryptor regex matches.
 */
function canVaultDecryptorParseContent(content: string): boolean {
  for (const { regex } of VAULT_DECRYPTOR_REGEXES) {
    if (regex.test(content)) {
      return true;
    }
  }
  return false;
}

/**
 * Logs which vault-decryptor regexes match (or don't) against file content,
 * plus context around KeyringController for debugging binary interference.
 */
function logVaultRegexDiagnostics(content: string, fileName: string): void {
  for (const { name, regex } of VAULT_DECRYPTOR_REGEXES) {
    console.log(
      `[vault-debug] ${fileName} ${name}: ${regex.test(content) ? 'MATCH' : 'no match'}`,
    );
  }

  const kcIndex = content.indexOf('KeyringController');
  console.log(
    `[vault-debug] ${fileName} "KeyringController" at index: ${kcIndex}`,
  );
  if (kcIndex !== -1) {
    const start = Math.max(0, kcIndex - 20);
    const end = Math.min(content.length, kcIndex + 300);
    const snippet = content
      .substring(start, end)
      .replace(/[^\x20-\x7E]/g, '�');
    console.log(`[vault-debug] ${fileName} context: ${snippet}`);
  }
}

/**
 * Returns the database file (.log or .ldb) that contains the vault data.
 *
 * Chrome stores extension data in LevelDB. The vault may live in the WAL
 * (.log file) or, after compaction, in a sorted-string-table (.ldb file).
 * This function checks each file using the same regex patterns the
 * vault-decryptor webapp uses, returning the first file that would
 * successfully parse.
 *
 * @param extensionStoragePath - The path to the extension's storage.
 * @returns The path to the database file containing the vault.
 */
function getExtensionDatabaseFile(extensionStoragePath: string): string {
  const allFiles = fs.readdirSync(extensionStoragePath);
  const logFiles = allFiles.filter((f: string) => f.endsWith('.log'));
  const ldbFiles = allFiles.filter((f: string) => f.endsWith('.ldb'));

  console.log('Log Files =========================:', logFiles.length);

  // Try .log files first (vault lives here before compaction),
  // then .ldb files (vault moves here after compaction).
  for (const file of [...logFiles, ...ldbFiles]) {
    const filePath = path.resolve(extensionStoragePath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const size = fs.statSync(filePath).size;

    if (canVaultDecryptorParseContent(content)) {
      console.log(`Vault data found in ${file} (${size} bytes)`);
      return filePath;
    }
    console.log(
      `[vault-debug] ${file} (${size} bytes): vault-decryptor cannot parse`,
    );
    logVaultRegexDiagnostics(content, file);
  }

  // Fallback: return the first .log file (original behaviour)
  console.log(
    'Vault data not parseable from any individual file, falling back to first .log file',
  );
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
    const dbFile = getExtensionDatabaseFile(extensionPath);
    const fileSize = await getFileSize(dbFile);
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
          const dbFileCopy = getExtensionDatabaseFile(copiedDir);

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
