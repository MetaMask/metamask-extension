import { Browser } from 'selenium-webdriver';
import { WALLET_PASSWORD } from '../../constants';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import { completeOnboardingWithPasskey } from '../../page-objects/flows/onboarding.flow';
import {
  lockAndWaitForLoginPage,
  login,
} from '../../page-objects/flows/login.flow';
import { navigateToSecurityAndPassword } from '../../page-objects/flows/settings.flow';
import { DUMMY_PASSKEY_RECORD } from '../../webdriver/virtual-authenticator';

describe('Passkey settings', function () {
  it('Turns off biometrics with passkey fallback to password', async function () {
    // Firefox does not support Selenium's Virtual Authenticator API
    if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
      this.skip();
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPasskeyController({ passkeyRecord: DUMMY_PASSKEY_RECORD })
          .build(),
        title: this.test?.fullTitle(),
        virtualAuthenticator: true,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { ignorePasskeyUnlock: true });

        await navigateToSecurityAndPassword(driver);

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPasskeyRowIsDisplayed();
        await privacySettings.clickPasskeyToggle();

        await privacySettings.enterPasswordAndContinueForPasskeyTurnOff(
          WALLET_PASSWORD,
        );

        await privacySettings.checkSecurityAndPasswordPageIsLoaded();

        const settingsPage = new SettingsPage(driver);
        await settingsPage.clickBackButton();

        await lockAndWaitForLoginPage(driver);

        const loginPage = new LoginPage(driver);
        await loginPage.loginToHomepage();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
      },
    );
  });

  it('Turns on biometrics from settings after passkey was removed', async function () {
    // Firefox does not support Selenium's Virtual Authenticator API
    if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
      this.skip();
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
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
  });
});
