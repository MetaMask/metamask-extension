import EventEmitter from 'events';
import log from 'loglevel';
import { isObject } from '@metamask/utils';
import type {
  MetaData,
  MetaMaskStateType,
} from '../../../../shared/lib/stores/base-store';
import { PersistenceManager } from '../../../../shared/lib/stores/persistence-manager';

const MIGRATION_V2_START_VERSION = 186;

export type MigrationState = {
  data: MetaMaskStateType;
  meta: MetaData;
};

export type LegacyMigration = {
  version: number;
  migrate: (state: MigrationState) => Promise<MigrationState>;
};

export type V2Migration = {
  version: number;
  migrate: (
    state: MigrationState,
    changedControllers: Set<string>,
  ) => Promise<void>;
};

export type Migration = LegacyMigration | V2Migration;

export type MigratorOptions = {
  migrations?: Migration[];
  defaultVersion?: number;
}

export type MigrateDataResult = {
  state: MigrationState;
  changedKeys: Set<string>;
};

type MigratorEventMap = {
  error: [AggregateError];
};

function isV2Migration(migration: Migration): migration is V2Migration {
  return migration.version >= MIGRATION_V2_START_VERSION;
}

export default class Migrator extends EventEmitter<MigratorEventMap> {
  migrations: Migration[];

  defaultVersion: number;

  /**
   * @param opts - Migrator options
   */
  constructor(opts: MigratorOptions = {}) {
    super();
    const migrations = opts.migrations ?? [];
    // sort migrations by version
    this.migrations = [...migrations].sort((a, b) => a.version - b.version);
    // grab migration with highest version
    const lastMigration = this.migrations.slice(-1)[0];
    // use specified defaultVersion or highest migration version
    this.defaultVersion = opts.defaultVersion ?? lastMigration?.version ?? 0;
  }

  // run all pending migrations on meta in place
  async migrateData(
    initialData: MigrationState = this.generateInitialState(),
  ): Promise<MigrateDataResult> {
    // legacy migrations (before MIGRATION_V2_START_VERSION) don't track changed controllers,
    // so we assume all controllers changed
    const changedControllers =
      isObject(initialData.data) &&
      initialData.meta.version < MIGRATION_V2_START_VERSION
        ? new Set(Object.keys(initialData.data))
        : new Set<string>();

    let state = initialData;

    for (const migration of this.migrations) {
      if (!migrationIsPending(migration)) {
        continue;
      }

      try {
        log.info(`Running migration ${migration.version}...`);

        // attempt migration and validate
        let migratedData: MigrationState;
        if (isV2Migration(migration)) {
          // when we have split state we require migrations to report which
          // controllers changed, and to directly mutate the `versionedData`
          // object
          migratedData = structuredClone(state);
          const localChangedControllers = new Set<string>();
          const returnValue = await migration.migrate(
            migratedData,
            localChangedControllers,
          );
          assertValidShape(migratedData, migration);

          // migrations should mutate in place and must not return new state
          // sanity check to ensure a migration isn't returning a state object
          if (typeof returnValue !== 'undefined') {
            throw new Error(
              'Migrator - migration returned value when none expected',
            );
          }

          // a migration that doesn't change any controllers is valid, but it'd
          // be nice to know
          if (localChangedControllers.size === 0) {
            log.debug(
              `Migrator - migration ${migration.version} did not report any changes`,
            );
          } else {
            for (const controllerKey of localChangedControllers) {
              changedControllers.add(controllerKey);
            }
          }
        } else {
          migratedData = await migration.migrate(state);
          assertValidShape(migratedData, migration);
        }

        // accept the migration as good
        state = migratedData;

        log.info(`Migration ${migration.version} complete`);
      } catch (error) {
        // use an AggregateError to add context without clobbering stack
        const aggregateError = new AggregateError(
          [error],
          `MetaMask Migration Error #${migration.version}`,
        );
        // emit error instead of throw so as to not break the run (gracefully fail)
        this.emit('error', aggregateError);
        // stop migrating and use state as is
        break;
      }
    }

    const changedKeys =
      initialData.meta.version < MIGRATION_V2_START_VERSION &&
      isObject(state.data)
        ? // we had to run older migrations, so assume all controllers changed
          new Set(Object.keys(state.data))
        : new Set<string>();

    for (const controllerKey of changedControllers) {
      changedKeys.add(controllerKey);
    }

    return { state, changedKeys };

    /**
     * Returns whether or not the migration is pending
     *
     * A migration is considered "pending" if it has a higher
     * version number than the current version.
     * @param migration
     */
    function migrationIsPending(migration: Migration): boolean {
      return migration.version > state.meta.version;
    }

    /**
     * Throws if the migrated data does not have the correct shape.
     * @param migratedData
     * @param migration
     */
    function assertValidShape(
      migratedData: MigrationState,
      migration: Migration,
    ): void {
      if (!migratedData.data) {
        throw new Error('Migrator - migration returned empty data');
      }

      if (
        'version' in (migratedData as Record<string, unknown>) &&
        migratedData.meta.version !== migration.version
      ) {
        throw new Error(
          'Migrator - Migration did not update version number correctly',
        );
      }
    }
  }

  /**
   * Returns the initial state for the migrator
   *
   * @param data - The data for the initial state
   */
  generateInitialState(data: MetaMaskStateType = {}): MigrationState {
    return {
      data,
      meta: {
        storageKind: PersistenceManager.defaultStorageKind,
        version: this.defaultVersion,
      },
    };
  }
}
