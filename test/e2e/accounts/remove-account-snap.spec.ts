import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../fixture-builder';
import { WINDOW_TITLES, defaultGanacheOptions, withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';
import { installSnapSimpleKeyring, makeNewAccountAndSwitch } from './common';
import { RemoveAccountSnapPage } from '../page-objects/RemoveAccountSnapPage';

describe('Remove Account Snap', function (this: Suite) {
  it('disable a snap and remove it', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const removeAccountSnapPage = new RemoveAccountSnapPage(driver);

        await installSnapSimpleKeyring(driver, false);
        await makeNewAccountAndSwitch(driver);

        // Check accounts after adding the snap account.
        await removeAccountSnapPage.clickAccountMenuIcon();
        const accountMenuItemsWithSnapAdded = await removeAccountSnapPage.getAccountMenuItems();
        await removeAccountSnapPage.closeAccountMenu();

        // Navigate to settings.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await removeAccountSnapPage.clickAccountOptionsMenu();
        await removeAccountSnapPage.navigateToSnaps();
        await removeAccountSnapPage.selectSimpleSnapKeyring();

        // Disable the snap.
        await removeAccountSnapPage.disableSnap();

        // Remove the snap.
        await removeAccountSnapPage.removeSnap();
        await removeAccountSnapPage.confirmRemoval();
        await removeAccountSnapPage.fillRemovalConfirmation('MetaMask Simple Snap Keyring');
        await removeAccountSnapPage.clickRemoveSnapButton();

        // Checking result modal
        await removeAccountSnapPage.verifyRemovalMessage();

        // Assert that the snap was removed.
        await removeAccountSnapPage.verifyNoSnapsInstalled();
        await removeAccountSnapPage.closeAccountMenu();

        // Assert that an account was removed.
        await removeAccountSnapPage.clickAccountMenuIcon();
        const accountMenuItemsAfterRemoval = await removeAccountSnapPage.getAccountMenuItems();
        assert.equal(
          accountMenuItemsAfterRemoval.length,
          accountMenuItemsWithSnapAdded.length - 1,
        );
      },
    );
  });
});
