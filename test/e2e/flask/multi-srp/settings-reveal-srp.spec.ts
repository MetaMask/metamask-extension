import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { E2E_SRP as FIRST_TEST_E2E_SRP } from '../../default-fixture';
import { SECOND_TEST_E2E_SRP, withMultiSRP } from './common-multi-srp';

describe('Multi SRP - Reveal Imported SRP', function (this: Suite) {
  const testPassword = 'correct horse battery staple';
  const firstSRPIndex = 1;
  const secondSRPIndex = 2;

  it.only('successfully exports the default SRP', async function () {
    await withMultiSRP(
      { title: this.test?.fullTitle() },
      async (driver: Driver) => {
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.openRevealSrpQuiz(firstSRPIndex);
        await privacySettings.completeRevealSrpQuiz();
        await privacySettings.fillPasswordToRevealSrp(testPassword);
        await privacySettings.check_srpTextIsDisplayed(FIRST_TEST_E2E_SRP);
      },
    );
  });

  it('successfully exports the imported SRP', async function () {
    await withMultiSRP(
      { title: this.test?.fullTitle() },
      async (driver: Driver) => {
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.openRevealSrpQuiz(secondSRPIndex);
        await privacySettings.completeRevealSrpQuiz();
        await privacySettings.fillPasswordToRevealSrp(testPassword);
        await privacySettings.check_srpTextIsDisplayed(SECOND_TEST_E2E_SRP);
      },
    );
  });
});
