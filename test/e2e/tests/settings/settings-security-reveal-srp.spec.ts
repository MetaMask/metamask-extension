import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { E2E_SRP } from '../../fixtures/default-fixture';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';

describe('Reveal SRP through settings', function () {
  const testPassword = 'correct horse battery staple';
  const wrongTestPassword = 'test test test test';

  it('should not reveal SRP text with incorrect password', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
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
  });

  it('completes quiz and reveals SRP text', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
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
  });

  it('completes quiz and reveals SRP QR after wrong answers in quiz', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
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
  });
});
