import assert from 'node:assert/strict';
import { WALLET_PASSWORD, WINDOW_TITLES, withFixtures } from '../../helpers';
import { PAGES, type Driver } from '../../webdriver/driver';
import {
  completeCreateNewWalletOnboardingFlow,
  completeVaultRecoveryOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import LoginPage from '../../page-objects/pages/login-page';
import MultichainAccountDetailsPage from '../../page-objects/pages/multichain/multichain-account-details-page';
import AddressListModal from '../../page-objects/pages/multichain/address-list-modal';

// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('Vault Corruption', function () {
  this.timeout(120000); // This test is very long, so we need an unusually high timeout
  /**
   * Script template to simulate a broken database.
   *
   * @param code - The code to run after the primary database has been broken.
   */
  const createCorruptionScript = (code: string) => `
    // callback is injected by Selenium
    const callback = arguments[arguments.length - 1];

    // browser and chrome are NOT scuttled in test builds, so we can use them
    // to access the storage API here
    const browser = globalThis.browser ?? globalThis.chrome;

    // corrupt the primary database by deleting the data key
    browser.storage.local.set({ data: null }, () => {
      ${code}
    });
`;

  /**
   * Common code to reload the extension; used by both the primary and backup
   * database corruption scripts.
   */
  const reloadAndCallbackScript = `
    // TODO: should this be a safe reload via the WriteManager?
    browser.runtime.reload();
    callback();
  `;

  /**
   * Script to break the primary database only.
   */
  const breakPrimaryDatabaseOnlyScript = createCorruptionScript(
    reloadAndCallbackScript,
  );

  /**
   * Script to break both the primary and backup databases.
   *
   * @param backupKeyToDelete - The key to delete from the backup database.
   */
  const breakAllDatabasesScript = (
    backupKeyToDelete: 'meta' | 'KeyringController',
  ) => {
    return createCorruptionScript(`
      // indexedDB is not scuttled in test builds, so we can use it to access the
      // backup database here
      const request = globalThis.indexedDB.open('metamask-backup', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore('store', { keyPath: 'id' });
      };
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('store', 'readwrite');
        const store = transaction.objectStore('store');
        // remove the ${backupKeyToDelete} data from the backup database
        store.delete(${JSON.stringify(backupKeyToDelete)});
        transaction.oncomplete = () => {
          ${reloadAndCallbackScript}
        };
      };`);
  };

  /**
   * Returns the common config for these tests.
   *
   * @param title - The title of the test.
   */
  function getConfig(title?: string) {
    return {
      title,
      ignoredConsoleErrors: [
        // expected error caused by breaking the database:
        'PersistenceError: Data error: storage.local does not contain vault data',
      ],
      // This flag ultimately requires that we onboard manually, as we can't use
      // `fixtures` in this test, as the `ExtensionStore` class doesn't use them.
      manifestFlags: {
        testing: {
          forceExtensionStore: true,
        },
      },
    };
  }

  /**
   * Onboard the user.
   *
   * @param driver - The WebDriver instance.
   */
  async function onboard(driver: Driver) {
    return await completeCreateNewWalletOnboardingFlow({
      driver,
      password: WALLET_PASSWORD,
      skipSRPBackup: true,
    });
  }

  /**
   * Since reloading the background restarts the extension the UI isn't
   * available immediately. So we just keep reloading the UI until it is. This
   * is a bit of a hack, but I can't figure out a better way.
   *
   * @param driver - The WebDriver instance.
   */
  async function waitForVaultRestorePage(driver: Driver) {
    await driver.waitUntil(
      async () => {
        await driver.navigate(PAGES.HOME, { waitForControllers: false });
        const title = await driver.driver.getTitle();
        // the browser will return an error message for our UI's HOME page until
        // the extension has restarted
        return title === WINDOW_TITLES.ExtensionInFullScreenView;
      },
      // reload and check title as quickly a possible
      { interval: 100, timeout: 10000 },
    );
    await driver.assertElementNotPresent('.loading-logo', { timeout: 10000 });
  }

  /**
   * Breaks the databases and then begins recovery. Only returns once the
   * background page has reloaded and the UI is available again.
   *
   * @param driver - The WebDriver instance.
   * @param script - The script to break the DB that will be executed in the
   * background page for MV2 or offscreen page for MV3.
   * @returns The initial first account's address.
   */
  async function onboardThenCorruptVault(driver: Driver, script: string) {
    const initialWindow = await driver.driver.getWindowHandle();

    // open a spare tab so the browser doesn't exit once we `reload()` the
    // extension process, as doing so will close all UI tabs we have open when
    // we do -- and that will close the whole browser 😱
    await driver.openNewPage('about:blank');

    await onboard(driver);

    const homePage = new HomePage(driver);
    await homePage.checkPageIsLoaded();
    await homePage.waitForLoadingOverlayToDisappear();

    const headerNavbar = new HeaderNavbar(driver);
    const firstAddress = await getFirstAddress(driver, headerNavbar);
    await headerNavbar.lockMetaMask();
    const loginPage = new LoginPage(driver);
    await loginPage.checkPageIsLoaded();

    // use the home page to destroy the vault
    await driver.executeAsyncScript(script);

    // the previous tab we were using is now closed, so we need to tell Selenium
    // to switch back to the other page (required for Chrome)
    await driver.switchToWindow(initialWindow);

    // get a new tab ready to use (required for Firefox)
    await driver.openNewPage('about:blank');

    // wait for the background page to reload
    await waitForVaultRestorePage(driver);

    return firstAddress;
  }

  /**
   * Click the recovery/reset button then confirm or dismiss the action.
   *
   * @param options - The options
   * @param options.driver - The WebDriver instance.
   * @param options.confirm - Whether to confirm the action or not.
   */
  async function clickRecover({
    driver,
    confirm,
  }: {
    driver: Driver;
    confirm: boolean;
  }) {
    // click the Recovery/Reset button
    await driver.clickElement('#critical-error-button');

    // Confirm we want to recover/reset.
    const prompt = await driver.driver.switchTo().alert();
    if (confirm) {
      await prompt.accept();
    } else {
      await prompt.dismiss();
    }

    if (confirm) {
      // delay needed to mitigate a race condition where the tab is closed and re-opened after confirming, causing to window to become stale
      await driver.delay(3000);
      try {
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
      } catch (error) {
        // to mitigate a race condition where the tab is closed after confirming (issue #36916)
        await driver.openNewPage('about:blank');
        await driver.navigate();
      }
      // the button should be disabled if the user confirmed the prompt, but given this is a transient state that goes very fast
      // it can cause a race condition where the element becomes stale, so we check directly that the element is not present as that's a stable state that occurs eventually
      await driver.assertElementNotPresent('#critical-error-button');
    } else {
      // the button should be enabled if the user dismissed the prompt
      await driver.findClickableElement('#critical-error-button');
    }
  }

  /**
   * Recovers the vault and returns the first account's address.
   *
   * @param driver - The WebDriver instance.
   */
  async function onboardAfterRecovery(driver: Driver) {
    // Log back in to the wallet and complete onboarding
    await completeVaultRecoveryOnboardingFlow({
      driver,
      password: WALLET_PASSWORD,
    });

    // now that we are re-onboarded, get the first account's address
    return await getFirstAddress(driver);
  }

  /**
   * Returns the first (truncated) address from the account list in UI.
   *
   * @param driver - The WebDriver instance.
   * @param headerNavbar
   */
  async function getFirstAddress(
    driver: Driver,
    headerNavbar: HeaderNavbar = new HeaderNavbar(driver),
  ) {
    await headerNavbar.openAccountMenu();

    const accountListPage = new AccountListPage(driver);
    await accountListPage.checkPageIsLoaded();
    await accountListPage.openAccountDetailsModal('Account 1');

    const accountDetailsPage = new MultichainAccountDetailsPage(driver);
    await accountDetailsPage.checkPageIsLoaded();
    await accountDetailsPage.clickNetworksRow();

    const addressListModal = new AddressListModal(driver);
    const accountAddress = await addressListModal.getTruncatedAccountAddress(0);
    await addressListModal.goBack();
    await accountDetailsPage.navigateBack();

    return accountAddress;
  }

  it('recovers metamask vault when primary database is broken but backup is intact', async function () {
    await withFixtures(
      getConfig(this.test?.title),
      async ({ driver }: { driver: Driver }) => {
        const initialFirstAddress = await onboardThenCorruptVault(
          driver,
          breakPrimaryDatabaseOnlyScript,
        );

        // start recovery
        await clickRecover({ driver, confirm: true });

        // onboard again
        const restoredFirstAddress = await onboardAfterRecovery(driver);

        // make sure the address is the same as before
        assert.equal(
          restoredFirstAddress,
          initialFirstAddress,
          'Addresses should match',
        );
      },
    );
  });

  it('resets metamask state when both primary and backup databases are broken', async function () {
    await withFixtures(
      getConfig(this.test?.title),
      async ({ driver }: { driver: Driver }) => {
        const initialFirstAddress = await onboardThenCorruptVault(
          driver,
          breakAllDatabasesScript('KeyringController'),
        );

        // start reset
        await clickRecover({ driver, confirm: true });

        // Now onboard again, like a first-time user :-(
        await onboard(driver);

        // make sure the account is different than the first time we onboarded
        const newFirstAddress = await getFirstAddress(driver);
        assert.notEqual(
          newFirstAddress,
          initialFirstAddress,
          'Addresses should differ',
        );
      },
    );
  });

  it('does *not* reset metamask state when recovery is *not* confirmed', async function () {
    // The `recovers metamask vault when primary database is broken but backup
    // is intact` test verifies that *first* attempts at recovery work, this
    // test verifies that not recovering, then trying to recovering again later
    // works too.
    await withFixtures(
      getConfig(this.test?.title),
      async ({ driver }: { driver: Driver }) => {
        const initialFirstAddress = await onboardThenCorruptVault(
          driver,
          breakPrimaryDatabaseOnlyScript,
        );

        // click recover but dismiss the prompt
        await clickRecover({ driver, confirm: false });
        // make sure the button can be clicked yet again; dismiss again
        await clickRecover({ driver, confirm: false });

        // reload to make sure the UI is still in the same Vault Corrupted state
        await driver.navigate(PAGES.HOME, {
          waitForControllers: false,
        });

        // make sure the button can be clicked yet again; dismiss the prompt
        await clickRecover({ driver, confirm: false });
        // actually recover the vault this time just to make sure
        // it all still works after dismiss the prompt previously
        await clickRecover({ driver, confirm: true });

        // verify that the UI has completed recovery this time
        const restoredFirstAddress = await onboardAfterRecovery(driver);
        assert.equal(
          restoredFirstAddress,
          initialFirstAddress,
          'Addresses should match',
        );
      },
    );
  });

  it('restores a backup that is missing its `meta` property successfully', async function () {
    // this test will run all migrations
    await withFixtures(
      getConfig(this.test?.title),
      async ({ driver }: { driver: Driver }) => {
        const initialFirstAddress = await onboardThenCorruptVault(
          driver,
          breakAllDatabasesScript('meta'),
        );

        // start recovery
        await clickRecover({ driver, confirm: true });

        // onboard again
        const restoredFirstAddress = await onboardAfterRecovery(driver);

        // make sure the address is the same as before
        assert.equal(
          restoredFirstAddress,
          initialFirstAddress,
          'Addresses should match',
        );
      },
    );
  });
});
