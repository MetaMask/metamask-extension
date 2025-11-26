import { PAGES, type Driver } from '../../webdriver/driver';
import assert from 'node:assert/strict';
import { ACCOUNT_TYPE, WINDOW_TITLES } from '../../constants';
import { WALLET_PASSWORD, unlockWallet, withFixtures } from '../../helpers';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { setManifestFlags } from '../../set-manifest-flags';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

type StoredState = Record<string, any>;

const SPLIT_FLAG = { value: { enabled: true } };

const readStorage = async (driver: any) => {
  const result = await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const browser = globalThis.browser ?? globalThis.chrome;

    browser.storage.local
      .get(null)
      .then((value) => callback({ value }))
      .catch((error) =>
        callback({
          error: error?.message ?? error?.toString?.() ?? error,
        }),
      );
  `);

  if (result?.error) {
    throw new Error(result.error);
  }

  return (result?.value ?? {}) as StoredState;
};

const assertSplitStateStorage = (storage: StoredState) => {
  assert.ok(
    Array.isArray(storage.manifest),
    'manifest should be written in split state storage',
  );
  assert.ok(
    storage.meta?.storageKind === 'split',
    'meta.storageKind should be split',
  );
  assert.ok(!('data' in storage), 'data key should be removed in split state');
  assert.ok(
    storage.manifest.includes('meta'),
    'meta should be part of the manifest',
  );

  for (const key of storage.manifest) {
    assert.ok(
      key === 'manifest' || key in storage,
      `manifest key ${key} should be present in storage`,
    );
  }

  if (typeof storage['temp-cronjob-storage'] === 'undefined') {
    assert.fail(
      'Yay! You removed temp-cronjob-storage from the db. Now update this test by removing this block.',
    );
  } else {
    delete storage['temp-cronjob-storage']; // <- don't forget to delete this line if if you remove temp-cronjob-storage
  }

  for (const key of Object.keys(storage)) {
    assert.ok(
      key === 'manifest' || storage.manifest.includes(key),
      `storage key ${key} should be present in manifest`,
    );
  }
};

const waitForKeyringControllerToBeSaved = async (driver: Driver) => {
  await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const browser = globalThis.browser ?? globalThis.chrome;
    // read the db until there is a data with data in iteratively
    while (true) {
      const { data = {}, KeyringController = {} } = await browser.storage.local.get(['data', 'KeyringController']);
      if (
      (data.KeyringController && Object.keys(data.KeyringController).length > 0) ||
      (Object.keys(KeyringController).length > 0)
      ) {
        callback();
        break;
      }
      console.log("waiting");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }`);
}

const assertDataStateStorage = (storage: StoredState) => {
  assert.ok(storage.meta, 'meta should be present in data storage');
  assert.ok('data' in storage, 'data key should be present in data storage');
  assert.ok(
    Object.keys(storage.data.KeyringController).length > 0,
    'KeyringContttroller shouldn',
  );
  assert.ok(
    !('manifest' in storage),
    'manifest should NOT be present in data storage',
  );
  assert.ok(
    storage.meta?.storageKind === 'data',
    'meta.storageKind should not be split for data storage',
  );
};

async function waitForRestart(driver: Driver) {
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

const runScriptThenReloadExtension = async (
  runScript: string | null,
  driver: any,
) => {
  const extensionWindow = await driver.driver.getWindowHandle();
  const blankWindow = await driver.openNewPage('about:blank');

  await driver.switchToWindow(extensionWindow);
  const result = await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const browser = globalThis.browser ?? globalThis.chrome;
    try {
      const result = await (${runScript ? runScript : 'Promise.resolve()'});
      callback({ result });
    } catch (error) {
      callback({ error: error?.message ?? error?.toString?.() ?? error });
    }
  `);
  await driver.executeScript(
    `(globalThis.browser ?? globalThis.chrome).runtime.reload()`,
  );

  await driver.switchToWindow(blankWindow);
  await waitForRestart(driver);
  return result;
};

// Persist the remote flag into stored state so reload sees it during migration.
const ensureSplitFlagPersisted = (extra = {}) => {
  return `(globalThis.browser ?? chrome).storage.local
      .get(['data', 'meta'])
      .then(({ data = {}, meta = {} }) => {
        const controller = data.RemoteFeatureFlagController ?? {};
        const state = controller.state ?? {};
        const flags = state.remoteFeatureFlags ?? {};
        flags.platformSplitStateGradualRollout = ${JSON.stringify(SPLIT_FLAG)};
        controller.state = {
          ...state,
          remoteFeatureFlags: flags,
        };
        data.RemoteFeatureFlagController = controller;
        return (globalThis.browser ?? chrome).storage.local.set({ data, meta: {...meta, ...${JSON.stringify(extra)}} });
      })
      .then(() => ({ ok: true }))`;
};

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

describe('State Persistence', function () {
  this.timeout(120000);

  describe('split state', function () {
    it('should default to the split state storage', async function () {
      await withFixtures(
        {
          title: this.test?.title,
          manifestFlags: {
            testing: {
              // We need to test the full onboarding flow with the production
              // ExtensionStore to ensure split state is the default for new users.
              forceExtensionStore: true,
            },
          },
        },
        async ({ driver }) => {
          await onboard(driver);

          // check home page just as a sanity check
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.waitForLoadingOverlayToDisappear();

          await waitForKeyringControllerToBeSaved(driver);

          const storage = await readStorage(driver);
          assertSplitStateStorage(storage);
        },
      );
    });

    it('should update from data state to split state', async function () {
      const accountName = 'Account 2';

      await withFixtures(
        {
          title: this.test?.title,
          manifestFlags: {
            testing: {
              storageKind: 'data',
              // We need to test the full onboarding flow with the production
              // ExtensionStore to ensure split state is the default for new users.
              forceExtensionStore: true,
            },
          },
        },
        async ({ driver }) => {
          await onboard(driver);

          await waitForKeyringControllerToBeSaved(driver);

          let storage = await readStorage(driver);
          assertDataStateStorage(storage);

          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.checkPageIsLoaded();
          await headerNavbar.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.addAccount({
            accountType: ACCOUNT_TYPE.Ethereum,
            accountName,
          });
          await headerNavbar.openAccountMenu();
          console.log(`Added account: ${accountName}`);
          await accountListPage.checkAccountDisplayedInAccountList(accountName);
          await accountListPage.closeAccountModal();

          console.log('Reading storage before migration...');
          storage = await readStorage(driver);
          assertDataStateStorage(storage);

          console.log('Persisting split state flag into storage...');
          await runScriptThenReloadExtension(
            ensureSplitFlagPersisted(),
            driver,
          );
          console.log('Extension reloaded.');
          await unlockWallet(driver, {
            password: WALLET_PASSWORD,
          });
          console.log('Wallet unlocked after reload.');

          await headerNavbar.checkPageIsLoaded();
          await headerNavbar.openAccountMenu();
          await accountListPage.checkAccountDisplayedInAccountList(accountName);
          await accountListPage.closeAccountModal();

          // we should have migrated... check it!
          storage = await readStorage(driver);
          assertSplitStateStorage(storage);

          // reload once more to be sure everything is still good
          await runScriptThenReloadExtension(null, driver);
          await unlockWallet(driver, { password: WALLET_PASSWORD });

          await headerNavbar.checkPageIsLoaded();
          await headerNavbar.openAccountMenu();
          await accountListPage.checkAccountDisplayedInAccountList(accountName);
          await accountListPage.closeAccountModal();

          // and finally, one more sanity check!
          storage = await readStorage(driver);
          assertSplitStateStorage(storage);
        },
      );
    });

    it('should not attempt to update if an update attempt fails', async function () {
      await withFixtures(
        {
          title: this.test?.title,
          manifestFlags: {
            testing: {
              // set the default storage kind to `data`, so that initial
              // onboarding is using the old state
              storageKind: 'data',
              // We need to test the full onboarding flow with the production
              // ExtensionStore to ensure split state is the default for new users.
              forceExtensionStore: true,
            },
          },
        },
        async ({ driver }) => {
          await onboard(driver);

          await waitForKeyringControllerToBeSaved(driver);

          // set the meta flag in the db to simulate a failed prior attempt
          // also set the remote flag to ensure that the migration would be
          // attempted if not for the meta flag
          await runScriptThenReloadExtension(
            ensureSplitFlagPersisted({
              _platformSplitStateGradualRolloutAttempted: true,
              canary: 'test-canary',
            }),
            driver,
          );

          const storage1 = await readStorage(driver);
          assertDataStateStorage(storage1);
          assert.equal(
            storage1.meta._platformSplitStateGradualRolloutAttempted,
            true,
            'precondition: _platformSplitStateGradualRolloutAttempted should be true',
          );

          // set the manifestFlags to use split state, so that on reload
          // the migration *would* be attempted (but should be skipped)
          await setManifestFlags({
            testing: {
              storageKind: 'split',
            },
          });

          console.log(
            'Reloading extension to trigger the migration process (it shouldnt migrate though)',
          );
          await runScriptThenReloadExtension(null, driver);

          await loginWithoutBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.waitForLoadingOverlayToDisappear();

          // make sure we are *still* using the `data` state and that we haven't migrated!
          const storage = await readStorage(driver);
          assertDataStateStorage(storage);
          // sanity check to make sure we still have the `_platformSplitStateGradualRolloutAttempted`
          // flag set to true
          assert.equal(
            storage.meta._platformSplitStateGradualRolloutAttempted,
            true,
          );
        },
      );
    });
  });
});
