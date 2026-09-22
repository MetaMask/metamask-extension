import { test as pwTest } from '@playwright/test';
import { E2E_DRIVER, E2E_SRP } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import ResetPasswordPage from '../../page-objects/pages/onboarding/reset-password-page';
import {
  lockAndWaitForLoginPage,
  lockAndWaitForPasskeyUnlockPage,
  login,
} from '../../page-objects/flows/login.flow';
import SetupPasskeyPage from '../../page-objects/pages/onboarding/setup-passkey-page';

const newPassword = 'this is the best password ever';

pwTest.describe('Forgot password', () => {
  pwTest(
    'resets password and then unlock wallet with new password',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          ignoredConsoleErrors: [
            'The snap "npm:@metamask/message-signing-snap" has been terminated during execution',
            'npm:@metamask/message-signing-snap was stopped and the request was cancelled. This is likely because the Snap crashed.',
            'Legacy syncing failed for wallet',
          ],
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver, localNodes }) => {
          await login(driver, { localNode: localNodes[0] });
          await driver.delay(3000);

          const homePage = new HomePage(driver);
          await homePage.headerNavbar.checkPageIsLoaded();
          await lockAndWaitForLoginPage(driver);

          await new LoginPage(driver).gotoResetPasswordPage();

          const resetPasswordPage = new ResetPasswordPage(driver);
          await resetPasswordPage.checkPageIsLoaded();

          await resetPasswordPage.resetPassword(E2E_SRP, newPassword);
          await resetPasswordPage.waitForPasswordInputToNotBeVisible();

          // Passkey setup is shown on Chrome after password reset
          if (testInfo.project.name !== 'firefox-e2e') {
            const setupPasskeyPage = new SetupPasskeyPage(driver);
            await setupPasskeyPage.checkPageIsLoaded();
            await setupPasskeyPage.skipPasskeySetup();
          }

          await homePage.headerNavbar.checkPageIsLoaded();
          await driver.delay(1000);
          await lockAndWaitForLoginPage(driver);

          await login(driver, {
            localNode: localNodes[0],
            password: newPassword,
          });
        },
      );
    },
  );

  pwTest(
    'resets password and sets up biometrics with passkey',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      pwTest.skip(
        testInfo.project.name === 'firefox-e2e',
        'Virtual authenticator is not supported on Firefox',
      );

      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          ignoredConsoleErrors: [
            'The snap "npm:@metamask/message-signing-snap" has been terminated during execution',
            'npm:@metamask/message-signing-snap was stopped and the request was cancelled. This is likely because the Snap crashed.',
            'Legacy syncing failed for wallet',
          ],
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          virtualAuthenticator: true,
        },
        async ({ driver, localNodes }) => {
          await login(driver, { localNode: localNodes[0] });
          await driver.delay(3000);

          const homePage = new HomePage(driver);
          await homePage.headerNavbar.checkPageIsLoaded();
          await lockAndWaitForLoginPage(driver);

          await new LoginPage(driver).gotoResetPasswordPage();

          const resetPasswordPage = new ResetPasswordPage(driver);
          await resetPasswordPage.checkPageIsLoaded();
          await resetPasswordPage.resetPassword(E2E_SRP, newPassword);
          await resetPasswordPage.waitForPasswordInputToNotBeVisible();

          const setupPasskeyPage = new SetupPasskeyPage(driver);
          await setupPasskeyPage.checkPageIsLoaded();
          await setupPasskeyPage.clickSetUpPasskey();
          await setupPasskeyPage.waitForEnrollmentSteps();
          await setupPasskeyPage.waitForEnrollmentSuccess();

          await homePage.headerNavbar.checkPageIsLoaded();
          await lockAndWaitForPasskeyUnlockPage(driver);

          const loginPage = new LoginPage(driver);
          await loginPage.checkPasskeyUnlockPageIsLoaded();
        },
      );
    },
  );
});
