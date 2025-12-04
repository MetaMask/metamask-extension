import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import { DAPP_PATH } from '../../constants';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SnapListPage from '../../page-objects/pages/snap-list-page';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { mockSnapSimpleKeyringAndSite } from './snap-keyring-site-mocks';

describe('Create and remove Snap Account', function (this: Suite) {
  it('create snap account and remove it by removing snap', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockSnapSimpleKeyringAndSite,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
        await snapSimpleKeyringPage.createNewAccount();

        // Check snap account is displayed after adding the snap account.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.checkAccountLabel('SSK Account');

        // Navigate to account snaps list page.
        await headerNavbar.openSnapListPage();
        const snapListPage = new SnapListPage(driver);

        // Remove the snap and check snap is successfully removed
        await snapListPage.removeSnapByName('MetaMask Simple Snap Keyring');
        await snapListPage.checkNoSnapInstalledMessageIsDisplayed();
        await snapListPage.clickBackButton();

        // Assert that the snap account is removed from the account list
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountIsNotDisplayedInAccountList(
          'SSK Account',
        );
      },
    );
  });
});
