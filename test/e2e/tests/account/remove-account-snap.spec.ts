import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import  SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

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

        // Check accounts after adding the snap account.
        await new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_accountDisplayedInAccountList('Snap Account');
        const accountMenuItemsWithSnapAdded = await driver.findElements('.multichain-account-list-item');

        await driver.clickElement('.mm-box button[aria-label="Close"]');

        // Navigate to settings.

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Snaps', tag: 'div' });
        await driver.clickElement({
          text: 'MetaMask Simple Snap Keyring',
          tag: 'p',
        });

        // Disable the snap.
        await driver.clickElement('.toggle-button > div');

        // Remove the snap.
        const removeButton = await driver.findElement(
          '[data-testid="remove-snap-button"]',
        );
        await driver.scrollToElement(removeButton);
        await driver.clickElement('[data-testid="remove-snap-button"]');

        await driver.clickElement({
          text: 'Continue',
          tag: 'button',
        });

        await driver.fill(
          '[data-testid="remove-snap-confirmation-input"]',
          'MetaMask Simple Snap Keyring',
        );

        await driver.clickElement({
          text: 'Remove Snap',
          tag: 'button',
        });

        // Checking result modal
        await driver.findVisibleElement({
          text: 'MetaMask Simple Snap Keyring removed',
          tag: 'p',
        });

        // Assert that the snap was removed.
        await driver.findElement({
          css: '.mm-box',
          text: "You don't have any snaps installed.",
          tag: 'p',
        });
        await driver.clickElement('.mm-box button[aria-label="Close"]');

        // Assert that an account was removed.
        await driver.clickElement('[data-testid="account-menu-icon"]');
        const accountMenuItemsAfterRemoval = await driver.findElements(
          '.multichain-account-list-item',
        );
        assert.equal(
          accountMenuItemsAfterRemoval.length,
          accountMenuItemsWithSnapAdded.length - 1,
        );
      },
    );
  });
});
