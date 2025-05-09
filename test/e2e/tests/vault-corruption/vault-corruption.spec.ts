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

describe('Vault Corruption', function () {
  /**
   * Script template to simulate a broken database.
   *
   * @param code - The code to run after the primary database has been broken.
   */
  const makeScript = (code: string) => `return new Promise((resolve) => {
    const browser = globalThis.browser || chrome;
    browser.storage.local.get(({ data, meta }) => {
      delete data.KeyringController;
      browser.storage.local.set({ data: data, meta }, () => {
        ${code}
      });
    });
  });`;

  /**
   * Script to break the primary database only.
   */
  const breakPrimaryOnlyScript = makeScript(`
    browser.runtime.reload();
    resolve();
  `);

  /**
   * Script to break both the primary and backup databases.
   */
  const breakAllScript = makeScript(`
    const request = indexedDB.open('metamask-backup', 1);
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
        browser.runtime.reload();
        resolve();
      };
    };`);

  /**
   * Onboards the user to the extension from the beginning
   *
   * @param driver - The WebDriver instance.
   */
  async function onboard(driver: Driver) {
    await completeCreateNewWalletOnboardingFlow({
      driver,
      password: WALLET_PASSWORD,
    });
  }

  /**
   * Returns the common config for these tests.
   *
   * @param title - The title of the test.
   */
  function getConfig(title?: string) {
    return {
      title,
      ignoredConsoleErrors: [
        'PersistenceError: Data error: storage.local does not contain vault data',
      ],
      // This flag ultimately requires that we onboard manually, as we can't use
      // `fixtures` in this test -- the `ExtensionStore` class doesn't use them.
      manifestFlags: {
        testing: {
          forceExtensionStore: true,
        },
      },
    };
  }

  /**
   * Breaks the databases and then begins recovery.
   *
   * @param driver - The WebDriver instance.
   * @param script - The script to execute in the background page.
   * @returns
   */
  async function breakAndRecover(driver: Driver, script: string) {
    const initialWindow = await driver.driver.getWindowHandle();

    // open a spare tab so the browser doesn't exit once we `reload()` the
    // extension process, as doing so will close all UI tabs we have open when
    // we do -- and that will close the whole browser
    await driver.openNewPage('about:blank');

    await onboard(driver);

    const firstAccountDiv = await driver.waitForSelector(
      '[data-testid="app-header-copy-button"]',
    );
    const initialAccount = await firstAccountDiv.getAttribute('textContent');

    await driver.navigate(PAGES.BACKGROUND);
    await driver.executeScript(script);

    // TODO: how can we detect when it has reloaded?
    // await driver.delay(10000);

    await driver.driver.switchTo().window(initialWindow);

    // since reloading the background restarts the extension the UI isn't
    // available immediately. So we just keep reloading the UI until it is.
    // This is a bit of a hack, but I can't figure out a better way.
    let title: string;
    do {
      await driver.navigate(PAGES.HOME, {
        waitForControllers: false,
      });
      title = await driver.driver.getTitle();
    } while (title !== WINDOW_TITLES.ExtensionInFullScreenView);

    // click the Recovery button
    const recoveryButton = await driver.waitForSelector(
      '#critical-error-button',
      {
        state: 'enabled',
      },
    );
    await recoveryButton.click();

    // Confirm we want to recover.
    const prompt = await driver.driver.switchTo().alert();
    await prompt.accept();

    return initialAccount;
  }

  it('restores metamask state when primary database is broken but vault is in tact', async function () {
    await withFixtures(getConfig(this.test?.title), async ({ driver }) => {
      const initialAccount = await breakAndRecover(
        driver,
        breakPrimaryOnlyScript,
      );

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

      // make sure the account is the same as before
      const accountDiv = await driver.waitForSelector(
        '[data-testid="app-header-copy-button"]',
      );
      const actualAccount = await accountDiv.getAttribute('textContent');
      assert.equal(initialAccount, actualAccount);
    });
  });

  it('resets metamask state when both primary and backup databases are broken', async function () {
    await withFixtures(getConfig(this.test?.title), async ({ driver }) => {
      const initialAccount = await breakAndRecover(driver, breakAllScript);

      // Now onboard like a first-time user :-(
      await onboard(driver);

      // make sure the account is different than before
      const accountDiv = await driver.waitForSelector(
        '[data-testid="app-header-copy-button"]',
      );
      const actualAccount = await accountDiv.getAttribute('textContent');
      assert.notEqual(initialAccount, actualAccount);
    });
  });
});
