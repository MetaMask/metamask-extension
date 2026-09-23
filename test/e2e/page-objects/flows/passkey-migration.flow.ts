import { Driver } from '../../webdriver/driver';
import {
  addLegacyUserHandlePasskeyCredential,
  replaceVirtualAuthenticator,
} from '../../webdriver/virtual-authenticator';
import PasskeyPrfMigrationPage from '../pages/onboarding/passkey-prf-migration-page';
import SetupPasskeyPage from '../pages/onboarding/setup-passkey-page';

/**
 * Installs the legacy userHandle credential and waits for the migration prompt
 * that follows automatic passkey unlock.
 *
 * @param driver - WebDriver instance with a virtual authenticator attached.
 * @param extensionId - Unpacked extension id used as the WebAuthn RP ID.
 */
export const openLegacyPasskeyMigration = async (
  driver: Driver,
  extensionId: string,
): Promise<void> => {
  await addLegacyUserHandlePasskeyCredential(driver, extensionId);
  await driver.navigate();

  const passkeyPrfMigrationPage = new PasskeyPrfMigrationPage(driver);
  await passkeyPrfMigrationPage.checkPageIsLoaded();
};

/**
 * Replaces the current legacy passkey with a PRF-backed passkey.
 *
 * @param driver - WebDriver instance on the passkey migration page.
 */
export const replaceLegacyPasskey = async (driver: Driver): Promise<void> => {
  const passkeyPrfMigrationPage = new PasskeyPrfMigrationPage(driver);
  await passkeyPrfMigrationPage.clickReplacePasskey();
  await replaceVirtualAuthenticator(driver);

  const setupPasskeyPage = new SetupPasskeyPage(driver);
  await setupPasskeyPage.checkPageIsLoaded();
  await setupPasskeyPage.clickSetUpPasskey();
  await setupPasskeyPage.waitForEnrollmentSuccess();
};

/**
 * Attempts replacement with an authenticator that does not return PRF and
 * waits for the rejection screen.
 *
 * @param driver - WebDriver instance on the passkey migration page.
 * @param extensionId - Unpacked extension id used as the WebAuthn RP ID.
 */
export const replaceLegacyPasskeyWithNonPrfAuthenticator = async (
  driver: Driver,
  extensionId: string,
): Promise<void> => {
  const passkeyPrfMigrationPage = new PasskeyPrfMigrationPage(driver);
  await passkeyPrfMigrationPage.clickReplacePasskey();
  await replaceVirtualAuthenticator(driver);

  const setupPasskeyPage = new SetupPasskeyPage(driver);
  await setupPasskeyPage.checkPageIsLoaded();
  await setupPasskeyPage.clickSetUpPasskey();
  await setupPasskeyPage.checkPrfRejectionIsDisplayed();
  await addLegacyUserHandlePasskeyCredential(driver, extensionId);
};
