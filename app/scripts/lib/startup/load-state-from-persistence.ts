import log from 'loglevel';
import { hasProperty, isObject } from '@metamask/utils';
import type {
  MetaData,
  MetaMaskStateType,
  MetaMaskStorageStructure,
} from '../../../../shared/lib/stores/base-store';
import {
  backedUpStateKeys,
  type Backup,
} from '../../../../shared/lib/stores/persistence-manager';
import { persistenceManager } from '../setup-initial-state-hooks';
import Migrator from '../migrator';
import migrations from '../../migrations';
import { useSplitStateStorage } from '../use-split-state-storage';
import getObjStructure from '../getObjStructure';
import type rawFirstTimeState from '../../first-time-state';

export type FirstTimeState = typeof rawFirstTimeState;

type MigrationError = Error & {
  sentryTags?: Record<string, string>;
};

type ValidatedVersionedData = {
  data: MetaMaskStateType;
  meta: MetaData;
};

export type LoadStateFromPersistenceResult = {
  versionedData: ValidatedVersionedData;
  firstTimeState: FirstTimeState;
};

function isValidMetaData(value: unknown): value is MetaData {
  return (
    isObject(value) &&
    typeof value.version === 'number' &&
    (value.storageKind === undefined ||
      value.storageKind === 'data' ||
      value.storageKind === 'split') &&
    (value.platformSplitStateGradualRolloutAttempted === undefined ||
      typeof value.platformSplitStateGradualRolloutAttempted === 'boolean')
  );
}

async function validateVersionedData(
  versionedData: unknown,
  createMigrationError: (message: string) => Promise<MigrationError>,
): Promise<ValidatedVersionedData> {
  if (!versionedData) {
    throw await createMigrationError('MetaMask - migrator returned undefined');
  }

  if (!isObject(versionedData) || !isValidMetaData(versionedData.meta)) {
    throw await createMigrationError(
      `MetaMask - migrator metadata has invalid type '${typeof (versionedData as { meta?: unknown }).meta}'`,
    );
  }

  if (typeof versionedData.meta.version !== 'number') {
    throw await createMigrationError(
      `MetaMask - migrator metadata version has invalid type '${typeof versionedData.meta.version}'`,
    );
  }

  if (
    versionedData.meta.storageKind !== undefined &&
    versionedData.meta.storageKind !== 'data' &&
    versionedData.meta.storageKind !== 'split'
  ) {
    throw await createMigrationError(
      `MetaMask - migrator metadata storageKind has invalid value '${String(versionedData.meta.storageKind)}'`,
    );
  }

  if (!isObject(versionedData.data)) {
    throw await createMigrationError(
      `MetaMask - migrator data has invalid type '${typeof (versionedData as { data?: unknown }).data}'`,
    );
  }

  return {
    data: versionedData.data,
    meta: versionedData.meta,
  };
}

function getFirstTimeInfo(
  source: MetaMaskStateType | Backup | null | undefined,
) {
  if (!source) {
    return undefined;
  }

  // Check both new location (AppMetadataController) and old location (top-level)
  // for compatibility with pre-migration-190 state.
  if (
    hasProperty(source, 'AppMetadataController') &&
    isObject(source.AppMetadataController)
  ) {
    if (hasProperty(source.AppMetadataController, 'firstTimeInfo')) {
      return source.AppMetadataController.firstTimeInfo;
    }
  }

  if (hasProperty(source, 'firstTimeInfo')) {
    return source.firstTimeInfo;
  }

  return undefined;
}

/**
 * Loads any stored data, prioritizing the latest storage strategy.
 * Migrates that data schema in case it was last loaded on an older version.
 *
 * @param backup - Optional backup state for recovery flows.
 * @param initialFirstTimeState - Default controller state for brand-new installs.
 * @returns Migrated state and any WITH_STATE overrides applied to first-time state.
 */
export async function loadStateFromPersistence(
  backup: Backup | null,
  initialFirstTimeState: FirstTimeState,
): Promise<LoadStateFromPersistenceResult> {
  let firstTimeState: FirstTimeState = { ...initialFirstTimeState };

  if (process.env.WITH_STATE) {
    const withState = JSON.parse(process.env.WITH_STATE);

    // Load conditionally so this test-only code can be dead-code-eliminated from production builds.
    /* eslint-disable @typescript-eslint/no-require-imports -- dynamic test-only import */
    const {
      generateWalletState,
    } = require('../../fixtures/generate-wallet-state');
    /* eslint-enable @typescript-eslint/no-require-imports */
    const fixtureBuilder = await generateWalletState(withState, false);

    const stateOverrides = fixtureBuilder.fixture.data;
    firstTimeState = { ...firstTimeState, ...stateOverrides };
  }

  // read from disk
  // first from preferred, async API:
  let preMigrationVersionedData: MetaMaskStorageStructure | undefined;
  if (backup) {
    preMigrationVersionedData = {
      data: {},
    };
    for (const key of backedUpStateKeys) {
      if (hasProperty(backup, key)) {
        preMigrationVersionedData.data ??= {};
        preMigrationVersionedData.data[key] = backup[key];
      }
    }
    if (hasProperty(backup, 'meta') && isObject(backup.meta)) {
      preMigrationVersionedData.meta = backup.meta as MetaData;
      // use the meta property from the backup if it exists, that way the
      // migrations will behave correctly.
      // old versions of meta used "data" as the storage kind, without
      // explicitly setting the "storageKind" to data. If it is missing, we just
      // always default to "data" ("data" was the default before "split"
      // existed).
      // We need to set it properly here so that the persistence manager uses
      // the correct storage kind when restoring from the `backup`.
      if (
        backup.meta.storageKind === 'split' ||
        backup.meta.storageKind === 'data'
      ) {
        persistenceManager.storageKind = backup.meta.storageKind;
      } else {
        persistenceManager.storageKind = 'data';
      }
    }
    // sanity check on the meta property
    if (typeof preMigrationVersionedData.meta?.version !== 'number') {
      log.error(
        "The `backup`'s `meta.version` property was missing during backup restore.",
      );
      // the last migration version before we started storing backups was `155`
      // so we can use that version as a fallback.
      preMigrationVersionedData.meta = {
        ...preMigrationVersionedData.meta,
        version: 155,
      };
    }
  } else {
    const validateVault = true;
    preMigrationVersionedData = await persistenceManager.get({ validateVault });
  }

  const migrator = new Migrator({
    migrations,
    defaultVersion: process.env.WITH_STATE
      ? // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../../../../test/e2e/fixtures/default-fixture.json').meta
          .version
      : null,
  });

  // report migration errors to sentry
  migrator.on('error', (err: Error) => {
    console.warn(err);
    // get vault structure without secrets
    const vaultStructure = getObjStructure(preMigrationVersionedData);
    globalThis.sentry?.captureException?.(err, {
      // "extra" key is required by Sentry
      extra: { vaultStructure },
    });
  });

  let writeAllKeysToState = false;
  if (!preMigrationVersionedData?.data && !preMigrationVersionedData?.meta) {
    // brand new state; write all keys!
    writeAllKeysToState = true;
    preMigrationVersionedData = migrator.generateInitialState(
      firstTimeState,
    ) as MetaMaskStorageStructure;
  }

  // migrate data
  const { state: migratedVersionedData, changedKeys } =
    await migrator.migrateData(
      preMigrationVersionedData as {
        data: MetaMaskStateType;
        meta: { version: number };
      },
    );

  /**
   * Creates an Error with sentryTags for migration failures.
   * Tags help identify if user should have had a backup (v12.20.0+, migration 157+),
   * and include installation info for diagnostics.
   * These are captured via the critical error page's "Send error report" checkbox
   * flow (see ui/helpers/utils/display-critical-error.ts).
   *
   * @param message - The error message
   * @returns Error object with sentryTags property
   */
  const createMigrationError = async (
    message: string,
  ): Promise<MigrationError> => {
    const preMigrationVersion = preMigrationVersionedData?.meta?.version;
    const backupShouldExist =
      typeof preMigrationVersion === 'number' && preMigrationVersion >= 157;

    // Try to get firstTimeInfo for Sentry tags (installation version and date)
    // Check in-memory sources first (fast, synchronous checks)
    // Check both new location (AppMetadataController) and old location (top-level)
    // for compatibility with pre-migration-190 state
    let firstTimeInfo =
      getFirstTimeInfo(backup) ??
      getFirstTimeInfo(
        isObject(migratedVersionedData?.data)
          ? migratedVersionedData.data
          : undefined,
      ) ??
      getFirstTimeInfo(preMigrationVersionedData?.data);

    // Fallback to IndexedDB backup if in-memory sources don't have it
    // (handles corruption scenarios where storage.local is damaged)
    if (!firstTimeInfo) {
      try {
        const indexedDbBackup = await persistenceManager.getBackup();
        firstTimeInfo = getFirstTimeInfo(indexedDbBackup);
      } catch {
        // Ignore backup fetch errors - we still want to report the migration error
      }
    }

    const error = new Error(message) as MigrationError;

    // Add sentryTags for searchable/filterable fields in Sentry UI
    // These are extracted by sendErrorToSentry in display-critical-error.ts
    error.sentryTags = {
      'corruption.preMigrationVersion': String(
        preMigrationVersion ?? 'unknown',
      ),
      'corruption.backupShouldExist': String(backupShouldExist),
      'corruption.installVersion': String(
        isObject(firstTimeInfo) && hasProperty(firstTimeInfo, 'version')
          ? firstTimeInfo.version
          : 'unknown',
      ),
      'corruption.installDate': String(
        isObject(firstTimeInfo) && hasProperty(firstTimeInfo, 'date')
          ? firstTimeInfo.date
          : 'unknown',
      ),
    };

    return error;
  };

  let versionedData = await validateVersionedData(
    migratedVersionedData,
    createMigrationError,
  );

  // `yarn start:with-state` builds a local fixture wallet via WITH_STATE.
  // Account/contact sync can otherwise pull remote user-storage for the same
  // SRP and replace the generated local state. Applying this after migration
  // covers both fresh fixture state and existing persisted state before
  // controllers initialize; marking the key changed ensures split-state
  // persistence writes the override.
  if (
    process.env.WITH_STATE &&
    isObject(versionedData.data.UserStorageController)
  ) {
    versionedData.data.UserStorageController.isBackupAndSyncEnabled = false;
    versionedData.data.UserStorageController.isAccountSyncingEnabled = false;
    versionedData.data.UserStorageController.isContactSyncingEnabled = false;
    if (!changedKeys.has('UserStorageController')) {
      changedKeys.add('UserStorageController');
    }
  }

  // this initializes the meta/version data as a class variable to be used for future writes
  persistenceManager.setMetadata(versionedData.meta);

  log.debug(
    "[Split State]: Loaded data from persistence with storageKind '%s'",
    persistenceManager.storageKind,
  );
  if (persistenceManager.storageKind === 'data') {
    const alreadyTried =
      versionedData.meta.platformSplitStateGradualRolloutAttempted === true;
    const shouldUseSplitStateStorage =
      !alreadyTried && (await useSplitStateStorage(versionedData.data));
    log.debug(
      '[Split State]: shouldUseSplitStateStorage: %s (alreadyTried: %s)',
      shouldUseSplitStateStorage,
      alreadyTried,
    );
    if (shouldUseSplitStateStorage) {
      // a sigil to mark that we *tried* to migrate to split state storage
      versionedData.meta.platformSplitStateGradualRolloutAttempted = true;
      persistenceManager.setMetadata(versionedData.meta);
    }

    log.debug(
      "[Split State]: Writing data to persistence with storageKind 'data'",
    );
    // write to disk
    await persistenceManager.set(versionedData.data);

    if (shouldUseSplitStateStorage) {
      await persistenceManager.migrateToSplitState(versionedData.data);
      const migratedMeta = persistenceManager.getMetaData();
      if (migratedMeta !== undefined) {
        versionedData = {
          ...versionedData,
          meta: { ...migratedMeta },
        };
        delete versionedData.meta.platformSplitStateGradualRolloutAttempted;
        // persist the new metadata one more time
        persistenceManager.setMetadata(versionedData.meta);
      }
      await persistenceManager.persist();
    }
  } else if (persistenceManager.storageKind === 'split') {
    if (writeAllKeysToState) {
      // New state needs every controller persisted.
      for (const key of Object.keys(versionedData.data)) {
        persistenceManager.update(key, versionedData.data[key]);
      }
    } else {
      // Existing state starts with explicitly changed controllers.
      for (const key of changedKeys) {
        persistenceManager.update(key, versionedData.data[key]);
      }
      if (backup) {
        // Recovery also needs every backed-up controller.
        for (const key of backedUpStateKeys) {
          const value = versionedData.data[key];
          // Avoid queuing the same key twice.
          // Missing backup values would delete existing state.
          if (!changedKeys.has(key) && value !== undefined) {
            persistenceManager.update(key, value);
          }
        }
      }
    }
    // write to disk
    await persistenceManager.persist();
  } else {
    throw new Error(
      `MetaMask - persistenceManager has invalid storageKind '${String(persistenceManager.storageKind)}'`,
    );
  }
  log.debug('[Split State]: Load complete.');

  return { versionedData, firstTimeState };
}
