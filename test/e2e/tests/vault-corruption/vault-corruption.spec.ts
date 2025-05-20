import assert from 'node:assert/strict';
import { WALLET_PASSWORD, WINDOW_TITLES, withFixtures } from '../../helpers';
import { PAGES, type Driver } from '../../webdriver/driver';
import {
  completeCreateNewWalletOnboardingFlow,
  onboardingMetricsFlow,
} from '../../page-objects/flows/onboarding.flow';
import LoginPage from '../../page-objects/pages/login-page';
import SecureWalletPage from '../../page-objects/pages/onboarding/secure-wallet-page';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AccountDetailsModal from '../../page-objects/pages/dialog/account-details-modal';
import TermsOfUseUpdateModal from '../../page-objects/pages/dialog/terms-of-use-update-modal';

describe('Vault Corruption', function () {
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
   */
  const breakAllDatabasesScript = createCorruptionScript(`
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
      // remove the KeyringController data from the backup database
      store.delete('KeyringController');
      transaction.oncomplete = () => {
        ${reloadAndCallbackScript}
      };
    };`);

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
    let title: string;
    do {
      await driver.navigate(PAGES.HOME, {
        waitForControllers: false,
      });
      title = await driver.driver.getTitle();
      // the browser will return an error message for our UI's HOME page until
      // the extension has restarted
    } while (title !== WINDOW_TITLES.ExtensionInFullScreenView);
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
    homePage.check_pageIsLoaded();

    const headerNavbar = new HeaderNavbar(driver);
    const firstAddress = await getFirstAddress(driver, headerNavbar);
    await headerNavbar.lockMetaMask();

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
   * Returns the vault recovery button.
   *
   * @param driver - The WebDriver instance.
   */
  async function getVaultRecoveryButton(driver: Driver) {
    return await driver.waitForSelector('#critical-error-button', {
      // The button is disabled for a timeout period as a precaution, so we
      // need to wait for it to be enabled before continuing.
      state: 'enabled',
    });
  }

  /**
   * Click the recovery/reset button then confirm or dismiss the action.
   *
   * @param driver - The WebDriver instance.
   * @param confirm - Whether to confirm the action or not.
   */
  async function clickRecover(driver: Driver, confirm: boolean) {
    // click the Recovery/Reset button
    const recoveryButton = await getVaultRecoveryButton(driver);
    await recoveryButton.click();

    // Confirm we want to recover/reset.
    const prompt = await driver.driver.switchTo().alert();
    if (confirm) {
      await prompt.accept();
    } else {
      await prompt.dismiss();
    }

    // the button should be disabled while the recovery process is in progress,
    // and enabled if the user dismissed the prompt
    const isEnabled = await recoveryButton.isEnabled();
    assert.equal(
      isEnabled,
      !confirm,
      confirm
        ? 'Recovery button should be disabled when prompt is accepted'
        : 'Recovery button should be enabled when prompt is dismissed',
    );
  }

  /**
   * Recovers the vault and returns the first account's address.
   *
   * @param driver - The WebDriver instance.
   */
  async function onboardAfterRecovery(driver: Driver) {
    // Log back in to the wallet
    const loginPage = new LoginPage(driver);
    await loginPage.check_pageIsLoaded();
    await loginPage.loginToHomepage(WALLET_PASSWORD);

    // complete metrics onboarding flow
    await onboardingMetricsFlow(driver, {
      participateInMetaMetrics: false,
      dataCollectionForMarketing: false,
    });

    const secureWalletPage = new SecureWalletPage(driver);
    await secureWalletPage.check_pageIsLoaded();
    await secureWalletPage.skipSRPBackup();

    // finish up onboarding screens
    const onboardingCompletePage = new OnboardingCompletePage(driver);
    await onboardingCompletePage.check_pageIsLoaded();
    await onboardingCompletePage.completeOnboarding();

    // it should take us to the home page automatically
    const homePage = new HomePage(driver);
    homePage.check_pageIsLoaded();

    // since our state has been reset, but we skip the welcome screen we now
    // need to accept the terms of use again
    const updateTermsOfUseModal = new TermsOfUseUpdateModal(driver);
    await updateTermsOfUseModal.check_pageIsLoaded();
    await updateTermsOfUseModal.confirmAcceptTermsOfUseUpdate();

    // finally, get the first account's address
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
    await accountListPage.check_pageIsLoaded();
    await accountListPage.openAccountDetailsModal('Account 1');

    const accountDetailsModal = new AccountDetailsModal(driver);
    await accountDetailsModal.check_pageIsLoaded();

    const accountAddress = await accountDetailsModal.getAccountAddress();
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
        await clickRecover(driver, true);

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
          breakAllDatabasesScript,
        );

        // start reset
        await clickRecover(driver, true);

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
        await clickRecover(driver, false);
        // make sure the button can be clicked yet again; dismiss again
        await clickRecover(driver, false);

        // reload to make sure the UI is still in the same Vault Corrupted state
        await driver.navigate(PAGES.HOME, {
          waitForControllers: false,
        });

        // make sure the button can be clicked yet again; dismiss the prompt
        await clickRecover(driver, false);
        // actually recover the vault this time just to make sure
        // it all still works after dismiss the prompt previously
        await clickRecover(driver, true);

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
});
