import { test as pwTest } from '@playwright/test';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { E2E_DRIVER, E2E_SRP } from '../../constants';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';

pwTest.describe('Reveal SRP through settings', () => {
  const testPassword = 'correct horse battery staple';
  const wrongTestPassword = 'test test test test';

  pwTest(
    'should not reveal SRP text with incorrect password',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await login(driver);

          // navigate to security and password settings
          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToSecurityAndPasswordSettings();

          const privacySettings = new PrivacySettings(driver);
          await privacySettings.checkSecurityAndPasswordPageIsLoaded();
          await privacySettings.openRevealSrpQuiz();
          await privacySettings.completeRevealSrpQuiz();
          await privacySettings.fillPasswordToRevealSrp(
            wrongTestPassword,
            'Incorrect password',
          );
        },
      );
    },
  );

  pwTest(
    'completes quiz and reveals SRP text',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await login(driver);

          // navigate to security and password settings
          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToSecurityAndPasswordSettings();

          const privacySettings = new PrivacySettings(driver);
          await privacySettings.checkSecurityAndPasswordPageIsLoaded();

          // fill password to reveal SRP and check the displayed SRP
          await privacySettings.openRevealSrpQuiz();
          await privacySettings.completeRevealSrpQuiz();
          await privacySettings.fillPasswordToRevealSrp(testPassword);
          await privacySettings.checkSrpTextIsDisplayed(E2E_SRP);
          await privacySettings.checkDisplayedSrpCanBeCopied();

          // check that closing the reveal SRP dialog navigates user back to srp list page
          await privacySettings.backToSrpList();
          await privacySettings.checkSrpListIsLoaded();
        },
      );
    },
  );

  pwTest(
    'completes quiz and reveals SRP QR after wrong answers in quiz',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await login(driver);

          // Navigate to security and password settings
          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToSecurityAndPasswordSettings();

          const privacySettings = new PrivacySettings(driver);
          await privacySettings.checkSecurityAndPasswordPageIsLoaded();

          // fill password to reveal SRP and check the displayed SRP QR code
          await privacySettings.openRevealSrpQuiz();
          await privacySettings.completeRevealSrpQuiz(true);
          await privacySettings.fillPasswordToRevealSrp(testPassword);
          await privacySettings.checkSrpTextIsDisplayed(E2E_SRP);
          await privacySettings.checkSrpQrCodeIsDisplayed();

          // check that closing the reveal SRP dialog navigates user back to srp list page
          await privacySettings.backToSrpList();
          await privacySettings.checkSrpListIsLoaded();
        },
      );
    },
  );
});
