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
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';

type UiAddress = `0x${string}${'...' | '…'}${string}`;

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
    const browser =  globalThis.browser ?? globalThis.chrome;
    browser.storage.local.get(({ data }) => {
      // corrupt the primary database by deleting the KeyringController
      delete data.KeyringController;
      browser.storage.local.set({ data }, () => {
        ${code}
      });
  });`;

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
   * Guard against the UI changing in some way that would break this test. Like
   * if we changed the way we display the account address to "Account 1" in
   * which case this test would just always pass since the value here would
   * always* be the same, even if the underlying vault accidentally differed.
   *
   * @param address - The address to check, should be a string.
   * @returns `true` if the address is in the expected format.
   */
  function isAddressFormatExpected(address: unknown): address is UiAddress {
    if (typeof address !== 'string') {
      return false;
    }

    /**
     * The regex used to match the account address in the UI.
     */
    const accountRe = /0x[a-fA-F0-9]{5}(?:...|…)[a-fA-F0-9]{5}/u;

    return accountRe.test(address);
  }

  /**
   * Breaks the databases and then begins recovery.
   *
   * @param driver - The WebDriver instance.
   * @param script - The script to break the DB that will be executed in
   * background page for MV2 or offscreen page for MV3.
   * @returns The initial first account's address.
   */
  async function corruptVault(
    driver: Driver,
    script: string,
  ): Promise<UiAddress> {
    const initialWindow = await driver.driver.getWindowHandle();

    // open a spare tab so the browser doesn't exit once we `reload()` the
    // extension process, as doing so will close all UI tabs we have open when
    // we do -- and that will close the whole browser 😱
    await driver.openNewPage('about:blank');

    await completeCreateNewWalletOnboardingFlow({
      driver,
      password: WALLET_PASSWORD,
    });

    const firstAccountElement = await driver.waitForSelector(
      '[data-testid="app-header-copy-button"]',
    );
    // initialAccount is something like: "0xaBcDe...54321"
    const firstAddress = await firstAccountElement.getAttribute('textContent');
    // check that the address is in the expected format
    assert.ok(isAddressFormatExpected(firstAddress));

    if (isManifestV3) {
      await driver.navigate(PAGES.OFFSCREEN, { waitForControllers: false });
    } else {
      await driver.navigate(PAGES.BACKGROUND, { waitForControllers: false });
    }

    await driver.executeAsyncScript(script);

    await driver.switchToWindow(initialWindow);

    // since reloading the background restarts the extension the UI isn't
    // available immediately. So we just keep reloading the UI until it is.
    // This is a bit of a hack, but I can't figure out a better way.
    let title: string;
    do {
      await driver.navigate(PAGES.HOME, {
        waitForControllers: false,
      });
      title = await driver.driver.getTitle();
      // the browser will return an error message for our UI's HOME page until the
      // extension has restarted
    } while (title !== WINDOW_TITLES.ExtensionInFullScreenView);

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
   * Click the recovery/reset button and confirm or dismiss the action.
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

    // the button should be disabled while the recovery process is in progress
    // and enabled if the user dismissed the prompt
    const status = await recoveryButton.getAttribute('disabled');
    assert.equal(
      status,
      String(confirm),
      confirm
        ? 'Recovery button should be disabled'
        : 'Recovery button should be enabled',
    );
  }

  /**
   * Recovers the vault and returns the first account's address.
   *
   * @param driver - The WebDriver instance.
   */
  async function recoverVault(driver: Driver) {
    // Then log in to the wallet!
    const loginPage = new LoginPage(driver);
    await loginPage.check_pageIsLoaded();
    await loginPage.loginToHomepage();

    // complete metrics onboarding flow
    await onboardingMetricsFlow(driver, {
      participateInMetaMetrics: false,
      dataCollectionForMarketing: false,
    });

    // complete (skip, for test speed reasons only) SRP backup flow
    const secureWalletPage = new SecureWalletPage(driver);
    await secureWalletPage.check_pageIsLoaded();
    await secureWalletPage.skipSRPBackup();

    // finish up onboarding screens
    const onboardingCompletePage = new OnboardingCompletePage(driver);
    await onboardingCompletePage.check_pageIsLoaded();
    await onboardingCompletePage.completeOnboarding();

    return await getFirstAddress(driver);
  }

  /**
   * Returns the first address from the UI.
   *
   * @param driver - The WebDriver instance.
   */
  async function getFirstAddress(driver: Driver) {
    const addressElement = await driver.waitForSelector(
      '[data-testid="app-header-copy-button"]',
    );
    const firstAddress = await addressElement.getAttribute('textContent');
    assert.ok(isAddressFormatExpected(firstAddress));
    return firstAddress;
  }

  it('recovers metamask vault when primary database is broken but backup is intact', async function () {
    await withFixtures(
      getConfig(this.test?.title),
      async ({ driver }: { driver: Driver }) => {
        const initialFirstAddress = await corruptVault(
          driver,
          breakPrimaryDatabaseOnlyScript,
        );

        // recover vault
        await clickRecover(driver, true);

        const restoredFirstAddress = await recoverVault(driver);
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
        const initialFirstAddress = await corruptVault(
          driver,
          breakAllDatabasesScript,
        );

        // reset vault
        await clickRecover(driver, true);

        // Now onboard like a first-time user :-(
        await completeCreateNewWalletOnboardingFlow({
          driver,
          password: WALLET_PASSWORD,
        });

        const newFirstAddress = await getFirstAddress(driver);
        // make sure the account is different than before
        assert.notEqual(
          initialFirstAddress,
          newFirstAddress,
          'Addresses should differ',
        );
      },
    );
  });

  it('does *not* reset metamask state when recovery is *not* confirmed', async function () {
    await withFixtures(
      getConfig(this.test?.title),
      async ({ driver }: { driver: Driver }) => {
        const initialFirstAddress = await corruptVault(
          driver,
          breakPrimaryDatabaseOnlyScript,
        );

        await clickRecover(driver, false);

        // verify that the UI did not reload
        assert.ok(
          await getVaultRecoveryButton(driver),
          'Recovery button should be visible after dismissing the prompt',
        );

        await driver.navigate(PAGES.HOME, {
          waitForControllers: false,
        });

        // verify that the UI is still showing the Vault Corruption page
        assert.ok(
          await getVaultRecoveryButton(driver),
          'Recovery button should be visible after dismissing the prompt',
        );

        await clickRecover(driver, true);

        // verify that the UI can still recover after the prompt was dismissed
        // the first time
        const restoredFirstAddress = await recoverVault(driver);
        assert.equal(
          restoredFirstAddress,
          initialFirstAddress,
          'Addresses should match',
        );
      },
    );
  });
});
