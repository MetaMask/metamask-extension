import assert from 'node:assert/strict';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import { type Driver } from '../../webdriver/driver';

export type DataStorage = {
  meta: {
    version: string;
    storageKind?: 'data';
    platformSplitStateGradualRolloutAttempted?: true;
  };
  data: Record<string, Record<string, unknown>>;
};

export type SplitStateStorage = Record<string, unknown> & {
  meta: { version: string; storageKind?: 'split' };
  manifest?: ('meta' | string)[];
};

export type StoredState = SplitStateStorage | DataStorage;

export const SPLIT_FLAG = {
  value: { enabled: 1, maxAccounts: 9999999, maxNetworks: 9999999 },
};

export const MIGRATION_OVERRIDE_KEYS = [
  'splitStateMigrationEnabled',
  'splitStateMigrationMaxAccounts',
  'splitStateMigrationMaxNetworks',
];

export const BASE_MANIFEST_TESTING_FLAGS = { forceExtensionStore: true };

/**
 * Seeds the split-state migration flags directly into extension storage.
 *
 * @param driver - WebDriver instance.
 */
export const setLocalStorageFlags = async (driver: Driver) => {
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
export const readStorage = async (driver: Driver) => {
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
export const assertSplitStateStorage = (storage: SplitStateStorage) => {
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
    if (key.startsWith(STORAGE_KEY_PREFIX)) {
      continue; // StorageService keys are managed independently
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
 * Validates the expected shape of data state storage.
 *
 * @param storage - Parsed storage snapshot.
 */
export const assertDataStateStorage = (storage: DataStorage) => {
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
 * Polls extension storage until the provided assertion passes, then returns it.
 *
 * State persistence to `storage.local` is asynchronous and debounced, so reading
 * storage immediately after a UI action can observe a partially written snapshot
 * (for example an empty `KeyringController`). Polling avoids relying on fixed
 * delays, while a final assertion ensures the descriptive error still surfaces
 * if the expected shape is never reached.
 *
 * @param driver - WebDriver instance.
 * @param assertStorage - Assertion to run against each storage snapshot.
 * @param logLabel - Label used when logging the resulting storage keys.
 * @param timeout - Max time (ms) to wait for the assertion to pass.
 * @returns Parsed storage snapshot once the assertion passes.
 */
export const waitForStorage = async <Storage extends StoredState>(
  driver: Driver,
  assertStorage: (storage: Storage) => void,
  logLabel: string,
  timeout = 30000,
): Promise<Storage> => {
  let storage = (await readStorage(driver)) as Storage;
  try {
    await driver.waitUntil(
      async () => {
        storage = (await readStorage(driver)) as Storage;
        try {
          assertStorage(storage);
          return true;
        } catch {
          return false;
        }
      },
      { interval: 1000, timeout },
    );
  } catch {
    // Re-read and assert once more so the descriptive AssertionError surfaces
    // instead of the generic "Condition not met" timeout error.
    storage = (await readStorage(driver)) as Storage;
    assertStorage(storage);
  }
  console.log(`${logLabel}:`, Object.keys(storage));
  return storage;
};

/**
 * Ensures the split state storage is present and valid.
 *
 * @param driver - WebDriver instance.
 * @returns Parsed split state storage snapshot.
 */
export const expectSplitStateStorage = async (driver: Driver) =>
  waitForStorage<SplitStateStorage>(
    driver,
    assertSplitStateStorage,
    'split storage',
  );

/**
 * Ensures the data state storage is present and valid.
 *
 * @param driver - WebDriver instance.
 * @returns Parsed data state storage snapshot.
 */
export const expectDataStateStorage = async (driver: Driver) =>
  waitForStorage<DataStorage>(driver, assertDataStateStorage, 'data storage');
