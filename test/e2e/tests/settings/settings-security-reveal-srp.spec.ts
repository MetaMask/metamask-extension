import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { E2E_SRP } from '../../default-fixture';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Reveal SRP through settings', function () {
  const testPassword = 'correct horse battery staple';
  const wrongTestPassword = 'test test test test';

  it('should not reveal SRP text with incorrect password', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // navigate to security & privacy settings
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.check_pageIsLoaded();
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
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // navigate to security & privacy settings
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.check_pageIsLoaded();

        // fill password to reveal SRP and check the displayed SRP
        await privacySettings.openRevealSrpQuiz();
        await privacySettings.completeRevealSrpQuiz();
        await privacySettings.fillPasswordToRevealSrp(testPassword);
        await privacySettings.check_srpTextIsDisplayed(E2E_SRP);
        await privacySettings.check_displayedSrpCanBeCopied();

        // check that closing the reveal SRP dialog navigates user back to srp list page
        await privacySettings.closeRevealSrpDialog();
        await privacySettings.check_srpListIsLoaded();
      },
    );
  });

  it('completes quiz and reveals SRP QR after wrong answers in quiz', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Navigate to security & privacy settings
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.check_pageIsLoaded();

        // fill password to reveal SRP and check the displayed SRP QR code
        await privacySettings.openRevealSrpQuiz();
        await privacySettings.completeRevealSrpQuiz(true);
        await privacySettings.fillPasswordToRevealSrp(testPassword);
        await privacySettings.check_srpTextIsDisplayed(E2E_SRP);
        await privacySettings.check_srpQrCodeIsDisplayed();

        // check that closing the reveal SRP dialog navigates user back to srp list page
        await privacySettings.closeRevealSrpDialog();
        await privacySettings.check_srpListIsLoaded();
      },
    );
  });
});
