import { test as pwTest } from '@playwright/test';
import { E2E_DRIVER, WALLET_PASSWORD } from '../../constants';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import { completeOnboardingWithPasskey } from '../../page-objects/flows/onboarding.flow';
import {
  lockAndWaitForLoginPage,
  login,
} from '../../page-objects/flows/login.flow';
import {
  closeSettings,
  navigateToSecurityAndPassword,
} from '../../page-objects/flows/settings.flow';
import { DUMMY_PASSKEY_RECORD } from '../../webdriver/virtual-authenticator';

pwTest.describe('Passkey settings', () => {
  pwTest(
    'Turns off biometrics with passkey fallback to password',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      // The virtual authenticator (CDP WebAuthn domain) is Chromium-only
      pwTest.skip(
        testInfo.project.name === 'firefox-e2e',
        'Virtual authenticator is not supported on Firefox',
      );

      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withPasskeyController({ passkeyRecord: DUMMY_PASSKEY_RECORD })
            .build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          virtualAuthenticator: true,
        },
        async ({ driver }) => {
          await login(driver, { ignorePasskeyUnlock: true });

          await navigateToSecurityAndPassword(driver);

          const privacySettings = new PrivacySettings(driver);
          await privacySettings.checkPasskeyRowIsDisplayed();
          await privacySettings.clickPasskeyToggle();

          await privacySettings.enterPasswordAndContinueForPasskeyTurnOff(
            WALLET_PASSWORD,
          );

          await privacySettings.checkSecurityAndPasswordPageIsLoaded();

          await closeSettings(driver);

          await lockAndWaitForLoginPage(driver);

          const loginPage = new LoginPage(driver);
          await loginPage.loginToHomepage();
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
        },
      );
    },
  );

  pwTest(
    'Turns on biometrics from settings after passkey was removed',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      // The virtual authenticator (CDP WebAuthn domain) is Chromium-only
      pwTest.skip(
        testInfo.project.name === 'firefox-e2e',
        'Virtual authenticator is not supported on Firefox',
      );

      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          virtualAuthenticator: true,
        },
        async ({
          driver,
          resetVirtualAuthenticator,
        }: {
          driver: Driver;
          resetVirtualAuthenticator: () => Promise<void>;
        }) => {
          await completeOnboardingWithPasskey({ driver });

          // Replace the authenticator with a fresh empty one so the turn-off
          // ceremony fails programmatically (no matching credentials) instead of
          // showing a native Chrome dialog.
          await resetVirtualAuthenticator();

          await navigateToSecurityAndPassword(driver);

          const privacySettings = new PrivacySettings(driver);
          await privacySettings.checkPasskeyRowIsDisplayed();
          await privacySettings.clickPasskeyToggle();

          await privacySettings.enterPasswordAndContinueForPasskeyTurnOff(
            WALLET_PASSWORD,
          );

          await privacySettings.checkSecurityAndPasswordPageIsLoaded();

          await privacySettings.checkPasskeyRowIsDisplayed();
          await privacySettings.clickPasskeyToggle();

          await privacySettings.enterPasswordAndContinueForPasskeyRegister(
            WALLET_PASSWORD,
          );

          await privacySettings.waitForPasskeyEnrollmentSuccess();

          await privacySettings.checkSecurityAndPasswordPageIsLoaded();
        },
      );
    },
  );
});
