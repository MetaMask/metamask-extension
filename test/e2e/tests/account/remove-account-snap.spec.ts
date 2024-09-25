import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import SettingsPage from '../../page-objects/pages/settings-page';
import SnapListPage from '../../page-objects/pages/snap-list-page';

describe('Remove Account Snap', function (this: Suite) {
  it('disable a snap and remove it', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
        await snapSimpleKeyringPage.createNewAccount();

        // Check snap account is displayed after adding the snap account.
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_accountLabel('Snap Account');

        // Navigate to account snaps listpage.
        await headerNavbar.openSnapListPagee();
        const snapListPage = new SnapListPage(driver);

        // Remove the snap.
        await snapListPage.removeSnapByName('MetaMask Simple Snap Keyring');

        await snapListPage.selectSnapByName('MetaMask Simple Snap Keyring');

        // Disable the snap.
        await snapListPage.toggleSnapStatus();

        // Remove the snap.
        await snapListPage.removeSnap();
        await snapListPage.confirmRemoval('MetaMask Simple Snap Keyring');

        // Checking result modal
        await snapListPage.verifySnapRemovalMessage('MetaMask Simple Snap Keyring removed');

        // Assert that the snap was removed.
        await snapListPage.verifyNoSnapsInstalled();
        await headerNavbar.closeModal();

        // Assert that an account was removed.
        await headerNavbar.openAccountMenu();
        const accountMenuItemsAfterRemoval = await accountListPage.getAccountMenuItems();
        assert.equal(
          accountMenuItemsAfterRemoval.length,
          accountMenuItemsWithSnapAdded.length - 1,
        );
      },
    );
  });
});
