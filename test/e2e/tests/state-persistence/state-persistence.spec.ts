import assert from 'node:assert/strict';
import { WINDOW_TITLES } from '../../constants';
import { WALLET_PASSWORD, unlockWallet, withFixtures } from '../../helpers';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import { setManifestFlags } from '../../set-manifest-flags';
import { PAGES, type Driver } from '../../webdriver/driver';

type DataStorage = {
  meta: {
    version: string;
    storageKind?: 'data';
    platformSplitStateGradualRolloutAttempted?: true;
  };
  data: Record<string, Record<string, unknown>>;
};

type SplitStateStorage = Record<string, unknown> & {
  meta: { version: string; storageKind?: 'split' };
  manifest?: ('meta' | string)[];
};

type StoredState = SplitStateStorage | DataStorage;

const SPLIT_FLAG = {
  value: { enabled: 1, maxAccounts: 9999999, maxNetworks: 9999999 },
};
const MIGRATION_OVERRIDE_KEYS = [
  'splitStateMigrationEnabled',
  'splitStateMigrationMaxAccounts',
  'splitStateMigrationMaxNetworks',
];
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
 * Seeds the split-state migration flags directly into extension storage.
 *
 * @param driver - WebDriver instance.
 */
const setLocalStorageFlags = async (driver: Driver) => {
  const migrationFlags = JSON.stringify({
    splitStateMigrationEnabled: SPLIT_FLAG.value.enabled.toString(),
    splitStateMigrationMaxAccounts: SPLIT_FLAG.value.maxAccounts.toString(),
    splitStateMigrationMaxNetworks: SPLIT_FLAG.value.maxNetworks.toString(),
  });

  const result = await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const browser = globalThis.browser ?? globalThis.chrome;

    browser.storage.local
      .set(${migrationFlags})
      .then(() => callback({ ok: true }))
      .catch((error) =>
        callback({
          error: error?.message ?? error?.toString?.() ?? error,
        }),
      );
  `);

  if (result?.error) {
    throw new Error(result.error);
  }
};

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

/**
 * Validates the expected shape of split state storage.
 *
 * @param storage - Parsed storage snapshot.
 */
const assertSplitStateStorage = (storage: SplitStateStorage) => {
  assert.ok(
    Array.isArray(storage.manifest),
    'manifest should be written in split state storage',
  );
  assert.equal(
    storage.meta?.storageKind,
    'split',
    'meta.storageKind should be split',
  );
  assert.ok(
    !('data' in storage),
    `data key should be removed in split state; keys: ${Object.keys(storage).join(', ')}`,
  );
  assert.ok(
    storage.manifest.includes('meta'),
    `meta should be part of the manifest; manifest: ${JSON.stringify(storage.manifest)}`,
  );

  for (const key of storage.manifest) {
    assert.ok(
      key === 'manifest' || key in storage,
      `manifest key ${key} should be present in storage`,
    );
  }

  if (typeof storage['temp-cronjob-storage'] === 'undefined') {
    // temp-cronjob-storage is a temporary key added in a hotfix and is
    // supposed to be removed at some point. Once it is removed from the codebase,
    // this block should be removed, which is why removing it causes this test
    // to fail.
    assert.fail(
      'Yay! You removed temp-cronjob-storage from the db. Now update this test by removing this block.',
    );
  } else {
    delete storage['temp-cronjob-storage']; // <- don't forget to delete this line if you remove temp-cronjob-storage
  }

  for (const key of Object.keys(storage)) {
    if (MIGRATION_OVERRIDE_KEYS.includes(key)) {
      continue; // these are testing-only keys
    }
    assert.ok(
      key === 'manifest' || storage.manifest.includes(key),
      `storage key ${key} should be present in manifest`,
    );
  }

  // sanity check
  assert(
    storage.manifest.includes('KeyringController'),
    'KeyringController should be in the manifest',
  );
  assert(
    typeof storage.KeyringController !== 'undefined',
    'KeyringController should be in storage',
  );
};

/**
 * Polls extension storage until onboarding/keyring data is written.
 *
 * @param driver - WebDriver instance.
 */
const waitForKeyringControllerToBeSaved = async (driver: Driver) => {
  await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const browser = globalThis.browser ?? globalThis.chrome;
    (async function(){
      // read the db until there is some Onboarding-related data
      while (true) {
        const { data = {}, KeyringController = {} } = await browser.storage.local.get(['data', 'KeyringController']);
        if (
        (data.KeyringController && Object.keys(data.KeyringController).length > 0) ||
        (Object.keys(KeyringController).length > 0)
        ) {
          callback();
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    })();
  `);
};

/**
 * Validates the expected shape of data state storage.
 *
 * @param storage - Parsed storage snapshot.
 */
const assertDataStateStorage = (storage: DataStorage) => {
  assert.ok(storage.meta, 'meta should be present in data storage');
  assert.ok('data' in storage, 'data key should be present in data storage');
  const keyringLength = Object.keys(storage.data.KeyringController).length;
  assert.ok(
    keyringLength > 0,
    `KeyringController should contain persisted data; length=${keyringLength}`,
  );
  assert.ok(
    !('manifest' in storage),
    'manifest should NOT be present in data storage',
  );
  assert.equal(
    storage.meta?.storageKind,
    'data',
    `meta.storageKind should be data for data storage`,
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
  assertSplitStateStorage(storage as SplitStateStorage);
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
  console.log('storage read:', storage);
  assertDataStateStorage(storage as DataStorage);
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
 * @param driver - WebDriver instance.
 * @returns Result object from the executed script.
 */
const reloadExtension = async (driver: Driver) => {
  const extensionWindow = await driver.driver.getWindowHandle();
  const blankWindow = await driver.openNewPage('about:blank');

  await driver.switchToWindow(extensionWindow);
  await driver.executeScript(
    `(globalThis.browser ?? globalThis.chrome).runtime.reload()`,
  );

  await driver.switchToWindow(blankWindow);

  // get a new tab ready to use (required for Firefox)
  await driver.openNewPage('about:blank');

  await waitForRestart(driver);
};

/**
 * Reloads the extension, unlocks, and waits for home readiness.
 *
 * @param driver - WebDriver instance.
 */
const reloadAndUnlock = async (driver: Driver) => {
  await reloadExtension(driver);
  await unlockWallet(driver, {
    password: WALLET_PASSWORD,
  });
  await ensureHomeReady(driver);
};

/**
 * Onboard the user.
 *
 * @param driver - The WebDriver instance.
 */
async function onboard(driver: Driver) {
  await completeCreateNewWalletOnboardingFlow({
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
  await accountListPage.closeMultichainAccountsPage();
};

// these tests are a bit flaky in CI, so i'm skipping them so we can get some
// testing done - David M
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('State Persistence', function () {
  this.timeout(120000);

  describe('data state', function () {
    it('should default to the data state storage', async function () {
      await withFixtures(getFixtureOptions(this), async ({ driver }) => {
        await completeOnboardingAndSync(driver);
        await expectDataStateStorage(driver);
      });
    });
  });

  describe('split state', function () {
    // skipped until "split" state is set as the default
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('should default to the split state storage', async function () {
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
          await accountListPage.checkPageIsLoaded();
          await accountListPage.addMultichainAccount();
          await accountListPage.closeMultichainAccountsPage();
          await assertAccountVisible(
            headerNavbar,
            accountListPage,
            accountName,
          );

          await expectDataStateStorage(driver);

          await setLocalStorageFlags(driver);
          await reloadAndUnlock(driver);
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
          console.log('completing onboarding and sync');
          await completeOnboardingAndSync(driver);

          // sanity
          console.log('expecting data state storage');
          await expectDataStateStorage(driver);

          // Seed a failed prior attempt and the remote flag so the migration would
          // proceed if not for the attempted flag.
          console.log('setting local storage flags');
          await setLocalStorageFlags(driver);
          // sanity
          console.log('STILL expecting data state storage');
          await expectDataStateStorage(driver);

          console.log('setting meta to indicate prior attempted migration');
          await driver.executeAsyncScript(`
            const callback = arguments[arguments.length - 1];
            const browser = globalThis.browser ?? globalThis.chrome;

            const newMeta = {
              platformSplitStateGradualRolloutAttempted: true,
              // an attempted migration would set platformSplitStateGradualRolloutAttempted
              // itself, if it erroneously attempted to migrate (it's not supposed to try in this test)
              // and then failed, so we are setting this extra canary property just so we have something
              // unique.
              canary: 'test-canary',
            };

            browser.storage.local
              .get(['meta'])
              .then(({ meta: existingMeta = {} }) =>
                browser.storage.local.set({
                  meta: { ...existingMeta, ...newMeta },
                }),
              )
              .then(() => callback({ ok: true }))
              .catch((error) =>
                callback({
                  error: error?.message ?? error?.toString?.() ?? error,
                }),
              );
            `);
          await reloadExtension(driver);

          console.log('NO REALLY, we STILL expect data state storage');
          const storage1 = await expectDataStateStorage(driver);
          assert.equal(
            (storage1 as DataStorage).meta
              .platformSplitStateGradualRolloutAttempted,
            true,
            'precondition: platformSplitStateGradualRolloutAttempted should be true',
          );

          console.log('setting manifest flags to use split state');
          // Set the manifest flags to use split state so the migration would be
          // attempted (but should be skipped due to the meta flag).
          await setManifestFlags({
            testing: {
              storageKind: 'split',
            },
          });

          console.log('reloading and unlocking');
          await reloadExtension(driver);
          console.log('unlocking wallet');
          await loginWithoutBalanceValidation(driver);
          console.log('ensuring home is ready');
          await ensureHomeReady(driver);

          // Ensure we are still using the data state and have not migrated.
          console.log('expecting data state storage again!');
          const storage = await expectDataStateStorage(driver);
          // additionally, ensure the attempted flag is still set
          assert.equal(
            (storage as DataStorage).meta
              .platformSplitStateGradualRolloutAttempted,
            true,
          );
          // and the canary value is untouched (just making sure OUR test state
          // is actually being used)
          assert.equal(
            (storage.meta as unknown as { canary: string }).canary,
            'test-canary',
          );
        },
      );
    });
  });
});
