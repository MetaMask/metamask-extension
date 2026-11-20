import { Browser } from 'selenium-webdriver';
import { WALLET_PASSWORD } from '../../constants';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import RegisterPasskeySettings from '../../page-objects/pages/settings/security-and-password/register-passkey-settings';
import SecurityAndPasswordSettings from '../../page-objects/pages/settings/security-and-password/security-and-password-settings';
import TurnOffPasskeySettings from '../../page-objects/pages/settings/security-and-password/turn-off-passkey-settings';
import { completeOnboardingWithPasskey } from '../../page-objects/flows/onboarding.flow';
import {
  lockAndWaitForLoginPage,
  login,
} from '../../page-objects/flows/login.flow';
import {
  closeSettings,
  navigateToSecurityAndPassword,
} from '../../page-objects/flows/settings.flow';
import { MOCK_PASSKEY_RECORD } from '../../webdriver/virtual-authenticator';

describe('Passkey settings', function () {
  it('Turns off biometrics with passkey fallback to password', async function () {
    // Firefox does not support Selenium's Virtual Authenticator API
    if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
      this.skip();
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPasskeyController({ passkeyRecord: MOCK_PASSKEY_RECORD })
          .build(),
        title: this.test?.fullTitle(),
        virtualAuthenticator: true,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { ignorePasskeyUnlock: true });

        await navigateToSecurityAndPassword(driver);

        const securityAndPasswordSettings = new SecurityAndPasswordSettings(
          driver,
        );
        await securityAndPasswordSettings.checkPasskeyRowIsDisplayed();
        await securityAndPasswordSettings.clickPasskeyToggle();

        const turnOffPasskeySettings = new TurnOffPasskeySettings(driver);
        await turnOffPasskeySettings.checkPageIsLoaded();
        await turnOffPasskeySettings.enterPasswordAndContinue(WALLET_PASSWORD);

        await securityAndPasswordSettings.checkPageIsLoaded();

        await closeSettings(driver);

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

        const securityAndPasswordSettings = new SecurityAndPasswordSettings(
          driver,
        );
        await securityAndPasswordSettings.checkPasskeyRowIsDisplayed();
        await securityAndPasswordSettings.clickPasskeyToggle();

        const turnOffPasskeySettings = new TurnOffPasskeySettings(driver);
        await turnOffPasskeySettings.checkPageIsLoaded();
        await turnOffPasskeySettings.enterPasswordAndContinue(WALLET_PASSWORD);

        await securityAndPasswordSettings.checkPageIsLoaded();

        await securityAndPasswordSettings.checkPasskeyRowIsDisplayed();
        await securityAndPasswordSettings.clickPasskeyToggle();

        const registerPasskeySettings = new RegisterPasskeySettings(driver);
        await registerPasskeySettings.checkPageIsLoaded();
        await registerPasskeySettings.enterPasswordAndContinue(WALLET_PASSWORD);
        await registerPasskeySettings.waitForEnrollmentSuccess();

        await securityAndPasswordSettings.checkPageIsLoaded();
      },
    );
  });
});
