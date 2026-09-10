import { strict as assert } from 'assert';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import level from 'level';
import { Driver } from '../webdriver/driver';
import { WALLET_PASSWORD, WINDOW_TITLES } from '../constants';
import { withFixtures } from '../helpers';
import HeaderNavbar from '../page-objects/pages/home/header-navbar';
import HomePage from '../page-objects/pages/home/homepage';
import PrivacySettings from '../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../page-objects/pages/settings/settings-page';
import VaultDecryptorPage from '../page-objects/pages/vault/decryptor-page';
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
 * Returns whether file contents include a vault payload vault-decryptor can parse.
 *
 * @param fileContents - The log file contents.
 * @returns True when both KeyringController and "vault" are present.
 */
function logFileHasVaultContent(fileContents: string): boolean {
  return (
    fileContents.includes('KeyringController') &&
    fileContents.includes('"vault"')
  );
}

/**
 * Finds a Chrome LevelDB `.log` file that contains a parseable vault.
 *
 * @param extensionStoragePath - The path to the extension's storage.
 * @returns The matching log file path, or undefined if none contain vault data.
 */
async function findLogFileWithVault(
  extensionStoragePath: string,
): Promise<string | undefined> {
  const logFiles = (await fs.readdir(extensionStoragePath)).filter(
    (filename: string) => filename.endsWith('.log'),
  );

  for (const filename of logFiles) {
    const filePath = path.resolve(extensionStoragePath, filename);
    try {
      const contents = await fs.readFile(filePath, 'utf8');
      if (logFileHasVaultContent(contents)) {
        return filePath;
      }
    } catch {
      // File may still be locked or mid-write.
    }
  }

  return undefined;
}

/**
 * Waits until a Chrome extension `.log` file contains vault data.
 *
 * @param driver - The WebDriver instance.
 * @returns The path of the log file that contains the vault.
 */
async function waitUntilVaultLogIsWritten(driver: Driver): Promise<string> {
  let vaultLogPath: string | undefined;
  try {
    await driver.waitUntil(
      async () => {
        const extensionPath = await getExtensionStorageFilePath(driver);
        vaultLogPath = await findLogFileWithVault(extensionPath);
        return Boolean(vaultLogPath);
      },
      { timeout: 80000, interval: 1000 },
    );
  } catch {
    throw new Error(
      'No Chrome log file contained KeyringController and "vault" within 80000ms',
    );
  }
  if (!vaultLogPath) {
    throw new Error(
      'No Chrome log file contained KeyringController and "vault"',
    );
  }
  return vaultLogPath;
}

describe('Vault Decryptor Page', function () {
  it('is able to decrypt the vault uploading the log file in the vault-decryptor webapp', async function () {
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

        const extensionPath = await getExtensionStorageFilePath(driver);
        const vaultLogPath = await waitUntilVaultLogIsWritten(driver);

        // copy log file to a temp location, to avoid reading it while the browser is writing it
        let copiedDir;
        try {
          copiedDir = await copyDirectoryToTmp(extensionPath);
          const vaultLogFileCopy = path.join(
            copiedDir,
            path.basename(vaultLogPath),
          );
          const copiedLogContents = await fs.readFile(vaultLogFileCopy, 'utf8');
          assert.ok(
            logFileHasVaultContent(copiedLogContents),
            'copied log file is missing vault content',
          );

          // navigate to the Vault decryptor webapp and fill the input field with storage recovered from filesystem
          await driver.openNewPage(VAULT_DECRYPTOR_PAGE);
          const vaultDecryptorPage = new VaultDecryptorPage(driver);
          await vaultDecryptorPage.checkPageIsLoaded();
          await vaultDecryptorPage.uploadLogFile(vaultLogFileCopy);

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

        const extensionPath = await getExtensionStorageFilePath(driver);
        await waitUntilVaultLogIsWritten(driver);

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
