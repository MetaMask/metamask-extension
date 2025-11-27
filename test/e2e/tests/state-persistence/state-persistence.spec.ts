import assert from 'node:assert/strict';
import { ACCOUNT_TYPE, WINDOW_TITLES } from '../../constants';
import { WALLET_PASSWORD, unlockWallet, withFixtures } from '../../helpers';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import { setManifestFlags } from '../../set-manifest-flags';
import { PAGES, type Driver } from '../../webdriver/driver';

type StoredState = Record<string, any>;

const SPLIT_FLAG = { value: { enabled: true } };
const BASE_MANIFEST_TESTING_FLAGS = { forceExtensionStore: true };

/**
 * Builds fixture options with consistent manifest testing flags.
 *
 * @param testContext - Mocha test context used to set the title.
 * @param manifestTestingOverrides - Optional manifest testing overrides.
 * @returns Options for withFixtures.
 */
const getFixtureOptions = (
  testContext: Mocha.Context,
  manifestTestingOverrides: Record<string, unknown> = {},
) => ({
  title: testContext.test?.title,
  manifestFlags: {
    testing: {
      ...BASE_MANIFEST_TESTING_FLAGS,
      ...manifestTestingOverrides,
    },
  },
});

/**
 * Reads extension storage from the opened page.
 *
 * @param driver - WebDriver instance.
 * @returns Parsed storage snapshot.
 */
const readStorage = async (driver: Driver) => {
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
};

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

/**
 * Ensures the split state storage is present and valid.
 *
 * @param driver - WebDriver instance.
 * @returns Parsed split state storage snapshot.
 */
const expectSplitStateStorage = async (driver: Driver) => {
  const storage = await readStorage(driver);
  assertSplitStateStorage(storage);
  return storage;
};

/**
 * Ensures the data state storage is present and valid.
 *
 * @param driver - WebDriver instance.
 * @returns Parsed data state storage snapshot.
 */
const expectDataStateStorage = async (driver: Driver) => {
  const storage = await readStorage(driver);
  assertDataStateStorage(storage);
  return storage;
};

/**
 * Waits for the extension to reload and the home screen to appear.
 *
 * @param driver - WebDriver instance.
 */
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

/**
 * Ensures the home page is rendered and idle.
 *
 * @param driver - WebDriver instance.
 * @returns Home page object after it is ready.
 */
const ensureHomeReady = async (driver: Driver) => {
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.waitForLoadingOverlayToDisappear();
  return homePage;
};

/**
 * Runs a background script, reloads the extension, and waits for restart.
 *
 * @param runScript - Stringified async script to execute before reload.
 * @param driver - WebDriver instance.
 * @returns Result object or error from the executed script.
 */
const runScriptThenReloadExtension = async (
  runScript: string | null,
  driver: Driver,
) => {
  const extensionWindow = await driver.driver.getWindowHandle();
  const blankWindow = await driver.openNewPage('about:blank');

  await driver.switchToWindow(extensionWindow);
  const result = await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const browser = globalThis.browser ?? globalThis.chrome;
    try {
      const result = await (${runScript || 'Promise.resolve()'});
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

/**
 * Reloads the extension, unlocks, and waits for home readiness.
 *
 * @param driver - WebDriver instance.
 * @param runScript - Optional stringified async script to run pre-reload.
 */
const reloadAndUnlock = async (
  driver: Driver,
  runScript: string | null = null,
) => {
  await runScriptThenReloadExtension(runScript, driver);
  await unlockWallet(driver, { password: WALLET_PASSWORD });
  await ensureHomeReady(driver);
};

/**
 * Stringifies a script that persists the split flag into stored state.
 *
 * @param extra - Optional extra meta values to merge.
 * @returns Stringified async script to execute.
 */
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

/**
 * Completes the onboarding process and syncs the keyring.
 *
 * @param driver - The WebDriver instance.
 */
async function completeOnboardingAndSync(driver: Driver) {
  await onboard(driver);
  await ensureHomeReady(driver);
  await waitForKeyringControllerToBeSaved(driver);
}

/**
 * Asserts that the specified account is visible in the account list.
 *
 * @param headerNavbar - The header navigation bar instance.
 * @param accountListPage - The account list page instance.
 * @param accountName - The name of the account to check.
 */
const assertAccountVisible = async (
  headerNavbar: HeaderNavbar,
  accountListPage: AccountListPage,
  accountName: string,
) => {
  await headerNavbar.openAccountMenu();
  await accountListPage.checkAccountDisplayedInAccountList(accountName);
  await accountListPage.closeAccountModal();
};

describe('State Persistence', function () {
  this.timeout(120000);

  describe('split state', function () {
    it('should default to the split state storage', async function () {
      await withFixtures(getFixtureOptions(this), async ({ driver }) => {
        await completeOnboardingAndSync(driver);
        await expectSplitStateStorage(driver);
      });
    });

    it('should update from data state to split state', async function () {
      const accountName = 'Account 2';

      await withFixtures(
        getFixtureOptions(this, { storageKind: 'data' }),
        async ({ driver }) => {
          const headerNavbar = new HeaderNavbar(driver);
          const accountListPage = new AccountListPage(driver);

          await completeOnboardingAndSync(driver);
          await expectDataStateStorage(driver);

          await headerNavbar.checkPageIsLoaded();
          await headerNavbar.openAccountMenu();
          await accountListPage.addAccount({
            accountType: ACCOUNT_TYPE.Ethereum,
            accountName,
          });
          await assertAccountVisible(
            headerNavbar,
            accountListPage,
            accountName,
          );

          await expectDataStateStorage(driver);

          await reloadAndUnlock(driver, ensureSplitFlagPersisted());
          await assertAccountVisible(
            headerNavbar,
            accountListPage,
            accountName,
          );
          await expectSplitStateStorage(driver);

          await reloadAndUnlock(driver);
          await assertAccountVisible(
            headerNavbar,
            accountListPage,
            accountName,
          );
          await expectSplitStateStorage(driver);
        },
      );
    });

    it('should not attempt to update if an update attempt fails', async function () {
      await withFixtures(
        getFixtureOptions(this, { storageKind: 'data' }),
        async ({ driver }) => {
          await completeOnboardingAndSync(driver);

          // Seed a failed prior attempt and the remote flag so the migration would
          // proceed if not for the attempted flag.
          await runScriptThenReloadExtension(
            ensureSplitFlagPersisted({
              _platformSplitStateGradualRolloutAttempted: true,
              // a migration would set `_platformSplitStateGradualRolloutAttempted`
              // if it proceeded, and then failed, so we set this extra bit
              // just so we have something unique to check.
              canary: 'test-canary',
            }),
            driver,
          );

          const storage1 = await expectDataStateStorage(driver);
          assert.equal(
            storage1.meta._platformSplitStateGradualRolloutAttempted,
            true,
            'precondition: _platformSplitStateGradualRolloutAttempted should be true',
          );

          // Set the manifest flags to use split state so the migration would be
          // attempted (but should be skipped due to the meta flag).
          await setManifestFlags({
            testing: {
              storageKind: 'split',
            },
          });

          await runScriptThenReloadExtension(null, driver);
          await loginWithoutBalanceValidation(driver);
          await ensureHomeReady(driver);

          // Ensure we are still using the data state and have not migrated.
          const storage = await expectDataStateStorage(driver);
          // additionally, ensure the attempted flag is still set
          // and the canary value is untouched
          assert.equal(
            storage.meta._platformSplitStateGradualRolloutAttempted,
            true,
          );
          assert.equal(storage.meta.canary, 'test-canary');
        },
      );
    });
  });
});
