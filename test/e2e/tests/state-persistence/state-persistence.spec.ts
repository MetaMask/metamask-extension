import assert from 'node:assert/strict';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import { Mockttp } from 'mockttp';
import { WALLET_PASSWORD, WINDOW_TITLES } from '../../constants';
import { withFixtures } from '../../helpers';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import { PAGES, type Driver } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

const NON_EVM_ACCOUNT_FLAG_OVERRIDES = [
  { bitcoinAccounts: { enabled: false, minimumVersion: '0.0.0' } },
  { solanaAccounts: { enabled: false, minimumVersion: '0.0.0' } },
  { tronAccounts: { enabled: false, minimumVersion: '0.0.0' } },
  {
    enableMultichainAccounts: {
      enabled: false,
      featureVersion: null,
      minimumVersion: null,
    },
  },
  {
    enableMultichainAccountsState2: {
      enabled: false,
      featureVersion: null,
      minimumVersion: null,
    },
  },
];

async function mockFeatureFlagsWithoutNonEvmAccounts(mockServer: Mockttp) {
  const prodFlags = getProductionRemoteFlagApiResponse();
  return [
    await mockServer
      .forGet(FEATURE_FLAGS_URL)
      .withQuery({
        client: 'extension',
        distribution: 'main',
        environment: 'dev',
      })
      .thenCallback(() => ({
        statusCode: 200,
        json: [...prodFlags, ...NON_EVM_ACCOUNT_FLAG_OVERRIDES],
      })),
  ];
}

type DataStorage = Record<string, unknown> & {
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

type StorageKeyManifest = {
  version: typeof STORAGE_KEY_MANIFEST_VERSION;
  updatedAt: number;
  storageKeys: Record<string, string>;
};

type StorageKeyList = {
  version: typeof STORAGE_KEY_MANIFEST_VERSION;
  updatedAt: number;
  keys: string[];
};

type ChunkedStorageValue = {
  metamaskStorageValue: typeof CHUNKED_VALUE_MARKER;
  version: number;
  chunkKeys: string[];
  stringLength: number;
};

const SPLIT_FLAG = {
  value: { enabled: 1, maxAccounts: 9999999, maxNetworks: 9999999 },
};
const MIGRATION_OVERRIDE_KEYS = [
  'splitStateMigrationEnabled',
  'splitStateMigrationMaxAccounts',
  'splitStateMigrationMaxNetworks',
];
const BASE_MANIFEST_TESTING_FLAGS = { forceExtensionStore: true };
const CHUNK_MANIFEST_KEY = '__metamaskChunkManifest';
const CHUNK_KEY_PREFIX = '__metamaskChunk:';
const CHUNKED_VALUE_MARKER = 'metamask:chunked-storage-value';
const STORAGE_KEY_MANIFEST_KEYS = [
  '__metamaskStorageKeyManifest0',
  '__metamaskStorageKeyManifest1',
  '__metamaskStorageKeyManifest2',
  '__metamaskStorageKeyManifest3',
] as const;
const STORAGE_KEY_LIST_KEYS = [
  '__metamaskStorageKeyList0',
  '__metamaskStorageKeyList1',
  '__metamaskStorageKeyList2',
  '__metamaskStorageKeyList3',
] as const;
const STORAGE_KEY_MANIFEST_VERSION = 1;
const STORAGE_KEY_POINTER_PREFIX = '__metamaskStorageKeyPointer:';
const STATE_STORAGE_KEY_PREFIX = '__metamaskState:';
const TEMP_CRONJOB_STORAGE_KEY = 'temp-cronjob-storage';
const TEMP_CRONJOB_STORAGE_VALUE_KEY_PREFIX = '__metamaskCronjobStorage:';
const TEMP_CRONJOB_STORAGE_POINTER_KEY_PREFIX =
  '__metamaskCronjobStoragePointer';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isStorageKeyManifest = (value: unknown): value is StorageKeyManifest =>
  isObject(value) &&
  value.version === STORAGE_KEY_MANIFEST_VERSION &&
  typeof value.updatedAt === 'number' &&
  isObject(value.storageKeys) &&
  Object.values(value.storageKeys).every(
    (storageKey) => typeof storageKey === 'string',
  );

const isStorageKeyList = (value: unknown): value is StorageKeyList =>
  isObject(value) &&
  value.version === STORAGE_KEY_MANIFEST_VERSION &&
  typeof value.updatedAt === 'number' &&
  Array.isArray(value.keys) &&
  value.keys.every((key) => typeof key === 'string');

const isChunkedStorageValue = (value: unknown): value is ChunkedStorageValue =>
  isObject(value) &&
  value.metamaskStorageValue === CHUNKED_VALUE_MARKER &&
  Array.isArray(value.chunkKeys) &&
  value.chunkKeys.every((chunkKey) => typeof chunkKey === 'string') &&
  typeof value.stringLength === 'number';

const getLatestStorageKeyManifest = (
  storage: Record<string, unknown>,
): StorageKeyManifest | undefined => {
  let latestManifest: StorageKeyManifest | undefined;
  for (const key of STORAGE_KEY_MANIFEST_KEYS) {
    const manifest = storage[key];
    if (
      isStorageKeyManifest(manifest) &&
      (!latestManifest || manifest.updatedAt >= latestManifest.updatedAt)
    ) {
      latestManifest = manifest;
    }
  }
  return latestManifest;
};

const getLatestStorageKeyList = (
  storage: Record<string, unknown>,
): StorageKeyList | undefined => {
  let latestKeyList: StorageKeyList | undefined;
  for (const key of STORAGE_KEY_LIST_KEYS) {
    const keyList = storage[key];
    if (
      isStorageKeyList(keyList) &&
      (!latestKeyList || keyList.updatedAt >= latestKeyList.updatedAt)
    ) {
      latestKeyList = keyList;
    }
  }
  return latestKeyList
    ? {
        ...latestKeyList,
        keys: [...new Set(latestKeyList.keys)],
      }
    : undefined;
};

const resolveStoredValue = (
  storage: Record<string, unknown>,
  logicalKey: string,
): unknown => {
  const storageKey =
    getLatestStorageKeyManifest(storage)?.storageKeys[logicalKey] ?? logicalKey;
  const value = storage[storageKey];
  if (!isChunkedStorageValue(value)) {
    return value;
  }

  const serializedValue = value.chunkKeys
    .map((chunkKey) => {
      const chunk = storage[chunkKey];
      assert.equal(
        typeof chunk,
        'string',
        `chunk ${chunkKey} should be present for ${logicalKey}`,
      );
      return chunk;
    })
    .join('');
  assert.equal(
    serializedValue.length,
    value.stringLength,
    `chunk data for ${logicalKey} should have the expected length`,
  );
  return JSON.parse(serializedValue);
};

const assertLogicalKeyPresent = (
  storage: Record<string, unknown>,
  logicalKey: string,
) => {
  const storageKey =
    getLatestStorageKeyManifest(storage)?.storageKeys[logicalKey] ?? logicalKey;
  assert.ok(
    storageKey in storage,
    `logical key ${logicalKey} should be present at storage key ${storageKey}`,
  );
};

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
  ignoredConsoleErrors: [/getSubscriptions/u],
  title: testContext.test?.title,
  manifestFlags: {
    testing: {
      ...BASE_MANIFEST_TESTING_FLAGS,
      ...manifestTestingOverrides,
    },
  },
  testSpecificMock: mockFeatureFlagsWithoutNonEvmAccounts,
});

const pausePersistence = async (driver: Driver) => {
  const result = await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const browser = globalThis.browser ?? globalThis.chrome;
    browser.runtime
      .sendMessage({ type: 'STOP_PERSISTENCE' })
      .then((response) => callback({ response }))
      .catch((error) =>
        callback({
          error: error?.message ?? error?.toString?.() ?? error,
        }),
      );
  `);

  if (result?.error) {
    throw new Error(result.error);
  }

  return (result?.response ?? {}) as { status: 'PERSISTENCE_STOPPED' };
};

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
  const storageKeyManifest = getLatestStorageKeyManifest(storage);
  assert.ok(
    storageKeyManifest,
    'generated storage key manifest should be written in split state storage',
  );
  const storageKeyList = getLatestStorageKeyList(storage);
  const logicalKeys =
    storageKeyList?.keys ?? Object.keys(storageKeyManifest.storageKeys);
  const meta = resolveStoredValue(storage, 'meta') as
    | SplitStateStorage['meta']
    | undefined;
  assert.equal(meta?.storageKind, 'split', 'meta.storageKind should be split');
  assert.ok(
    !('data' in storage),
    `data key should be removed in split state; keys: ${Object.keys(storage).join(', ')}`,
  );
  assert.ok(
    logicalKeys.includes('meta'),
    `meta should be part of generated storage metadata; keys: ${JSON.stringify(logicalKeys)}`,
  );

  for (const key of logicalKeys) {
    assertLogicalKeyPresent(storage, key);
  }

  const temporaryCronjobStorageKeys = Object.keys(storage).filter(
    (key) =>
      key === TEMP_CRONJOB_STORAGE_KEY ||
      key.startsWith(TEMP_CRONJOB_STORAGE_VALUE_KEY_PREFIX) ||
      key.startsWith(TEMP_CRONJOB_STORAGE_POINTER_KEY_PREFIX),
  );
  if (temporaryCronjobStorageKeys.length === 0) {
    // Temporary cronjob storage is expected until the CronjobController no longer
    // needs its hotfix storage manager. Once it is removed from the codebase,
    // this block should be removed, which is why removing it causes this test
    // to fail.
    assert.fail(
      'Yay! You removed temporary cronjob storage from the db. Now update this test by removing this block.',
    );
  } else {
    for (const key of temporaryCronjobStorageKeys) {
      delete storage[key];
    }
    // Don't forget to delete this block if you remove temporary cronjob storage.
  }

  for (const key of Object.keys(storage)) {
    if (MIGRATION_OVERRIDE_KEYS.includes(key)) {
      continue; // these are testing-only keys
    }
    if (key.startsWith(STORAGE_KEY_PREFIX)) {
      continue; // StorageService keys are managed independently
    }
    if (
      key === 'manifest' ||
      key === CHUNK_MANIFEST_KEY ||
      key.startsWith(CHUNK_KEY_PREFIX) ||
      key.startsWith(STATE_STORAGE_KEY_PREFIX) ||
      key.startsWith(STORAGE_KEY_POINTER_PREFIX) ||
      (STORAGE_KEY_LIST_KEYS as readonly string[]).includes(key) ||
      (STORAGE_KEY_MANIFEST_KEYS as readonly string[]).includes(key)
    ) {
      continue;
    }
    assert.ok(
      logicalKeys.includes(key),
      `storage key ${key} should be present in generated storage metadata`,
    );
  }

  // sanity check
  assert(
    logicalKeys.includes('KeyringController'),
    'KeyringController should be in generated storage metadata',
  );
  assert(
    typeof resolveStoredValue(storage, 'KeyringController') !== 'undefined',
    'KeyringController should be in storage',
  );
};

/**
 * Validates the expected shape of data state storage.
 *
 * @param storage - Parsed storage snapshot.
 */
const assertDataStateStorage = (storage: DataStorage) => {
  const meta = resolveStoredValue(storage, 'meta') as
    | DataStorage['meta']
    | undefined;
  const data = resolveStoredValue(storage, 'data') as
    | DataStorage['data']
    | undefined;
  assert.ok(meta, 'meta should be present in data storage');
  assert.ok(data, 'data key should be present in data storage');
  const keyringLength = Object.keys(data.KeyringController).length;
  assert.ok(
    keyringLength > 0,
    `KeyringController should contain persisted data; length=${keyringLength}`,
  );
  assert.ok(
    !('manifest' in storage),
    'manifest should NOT be present in data storage',
  );
  assert.equal(
    meta?.storageKind,
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

  await driver.waitForControllersLoaded();
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
 * Reloads the extension, and waits for restart.
 *
 * @param driver - WebDriver instance.
 * @returns Result object from the executed script.
 */
const reloadExtension = async (driver: Driver) => {
  const extensionWindow = await driver.driver.getWindowHandle();
  const blankWindow = await driver.openNewPage('about:blank');

  await driver.switchToWindow(extensionWindow);
  await pausePersistence(driver);
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
  const loginPage = new LoginPage(driver);
  await loginPage.checkPageIsLoaded();
  await loginPage.loginToHomepage(WALLET_PASSWORD);
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
  await driver.delay(5000); // ensure things have settled before proceeding
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
  await headerNavbar.checkPageIsLoaded();
  await headerNavbar.openAccountMenu();
  await accountListPage.checkAccountDisplayedInAccountList(accountName);
  await accountListPage.closeMultichainAccountsPage();
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

          await driver.delay(5000); // wait for any background migrations to finish
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

          await driver.delay(5000); // wait for any background migrations to finish
          await expectDataStateStorage(driver);

          await pausePersistence(driver);
          await setLocalStorageFlags(driver);
          await reloadAndUnlock(driver);
          await driver.delay(5000); // wait for any background migrations to finish
          await assertAccountVisible(
            headerNavbar,
            accountListPage,
            accountName,
          );
          await driver.delay(5000); // wait for any background migrations to finish
          await expectSplitStateStorage(driver);

          await reloadAndUnlock(driver);
          await driver.delay(5000); // wait for any background migrations to finish
          await assertAccountVisible(
            headerNavbar,
            accountListPage,
            accountName,
          );
          await expectSplitStateStorage(driver);
        },
      );
    });
  });
});
