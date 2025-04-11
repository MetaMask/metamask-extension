import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import { WALLET_PASSWORD as testPassword } from '../../helpers';
import { SECOND_TEST_E2E_SRP, withMultiSrp } from './common-multi-srp';

describe('Multi SRP - Import SRP', function (this: Suite) {
  it('successfully imports a new srp', async function () {
    await withMultiSrp(
      { title: this.test?.fullTitle() },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_accountBelongsToSrp('Account 2', 2);
      },
    );
  });

  it('successfully imports a new srp and it matches the srp imported', async function () {
    await withMultiSrp(
      { title: this.test?.fullTitle() },
      async (driver: Driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.startExportSrpForAccount('Account 2');

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.completeRevealSrpQuiz();
        await privacySettings.fillPasswordToRevealSrp(testPassword);
        await privacySettings.check_srpTextIsDisplayed(SECOND_TEST_E2E_SRP);
      },
    );
  });
});
