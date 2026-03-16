import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';

// Hide/unhide is not available in BIP44 stage 2
// eslint-disable-next-line
describe.skip('Account list - hide/unhide functionality', function (this: Suite) {
  it('hide and unhide account by clicking hide and unhide button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        new HeaderNavbar(driver).openAccountMenu();

        // hide account
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openAccountOptionsMenu();
        await accountListPage.hideAccount();
        await accountListPage.checkHiddenAccountsListExists();

        // unhide account
        await accountListPage.openHiddenAccountsList();
        await accountListPage.openHiddenAccountOptions();
        await accountListPage.unhideAccount();
        await accountListPage.checkAccountDisplayedInAccountList();
      },
    );
  });
});
