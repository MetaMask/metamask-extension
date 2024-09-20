import { Suite } from 'mocha';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { Driver } from '../webdriver/driver';
import AccountSettingsPage from '../page-objects/pages/account-settings-page';
import LoginPage from '../page-objects/pages/login-page';
import HomePage from '../page-objects/pages/homepage';

describe('Add snap account experimental settings', function (this: Suite) {
  it('switch "Enable Add account snap" to on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const loginPage = new LoginPage(driver);
        const homePage = new HomePage(driver);
        const accountSettingsPage = new AccountSettingsPage(driver);

        await loginPage.navigate();
        await loginPage.login('correct horse battery staple');

        // Make sure the "Add snap account" button is not visible.
        await homePage.openAccountMenu();
        await homePage.openAddAccountModal();

        await driver.assertElementNotPresent(
          {
            text: 'Add account Snap',
            tag: 'button',
          },
          {
            findElementGuard: {
              text: 'Add a new Ethereum account',
              tag: 'button',
            },
          },
        );
        await homePage.closeModal();

        // Navigate to experimental settings and enable Add account Snap.
        await accountSettingsPage.navigateToExperimentalSettings();
        await accountSettingsPage.toggleAddAccountSnap();

        // Make sure the "Add account Snap" button is visible.
        await homePage.openAccountMenu();
        await homePage.openAddAccountModal();
        await driver.findElement({
          text: 'Add account Snap',
          tag: 'button',
        });
      },
    );
  });
});
