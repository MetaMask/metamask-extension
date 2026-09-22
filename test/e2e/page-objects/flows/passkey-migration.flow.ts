import { Driver } from '../../webdriver/driver';
import {
  addLegacyUserHandlePasskeyCredential,
  replaceVirtualAuthenticator,
} from '../../webdriver/virtual-authenticator';
import PasskeyMigrationModal from '../pages/dialog/passkey-migration-modal';
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

  const passkeyMigrationModal = new PasskeyMigrationModal(driver);
  await passkeyMigrationModal.checkPageIsLoaded();
};

/**
 * Replaces the current legacy passkey with a PRF-backed passkey.
 *
 * @param driver - WebDriver instance on the passkey migration modal.
 */
export const replaceLegacyPasskey = async (driver: Driver): Promise<void> => {
  const passkeyMigrationModal = new PasskeyMigrationModal(driver);
  await passkeyMigrationModal.clickReplacePasskey();
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
 * @param driver - WebDriver instance on the passkey migration modal.
 * @param extensionId - Unpacked extension id used as the WebAuthn RP ID.
 */
export const replaceLegacyPasskeyWithNonPrfAuthenticator = async (
  driver: Driver,
  extensionId: string,
): Promise<void> => {
  const passkeyMigrationModal = new PasskeyMigrationModal(driver);
  await passkeyMigrationModal.clickReplacePasskey();
  await replaceVirtualAuthenticator(driver);

  const setupPasskeyPage = new SetupPasskeyPage(driver);
  await setupPasskeyPage.checkPageIsLoaded();
  await setupPasskeyPage.clickSetUpPasskey();
  await setupPasskeyPage.checkPrfRejectionIsDisplayed();
  await addLegacyUserHandlePasskeyCredential(driver, extensionId);
};
