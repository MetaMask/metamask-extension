import EventEmitter from 'events';
import log from 'loglevel';
import { isObject } from '@metamask/utils';
import { PersistenceManager } from '../../../../shared/lib/stores/persistence-manager';

const MIGRATION_V2_START_VERSION = 186;

export type MigrationState = {
  data: Record<string, unknown>;
  meta: {
    version: number;
    storageKind?: string;
  };
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

export interface MigratorOptions {
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

  constructor(opts: MigratorOptions = {}) {
    super();
    const migrations = opts.migrations ?? [];
    this.migrations = [...migrations].sort((a, b) => a.version - b.version);
    const lastMigration = this.migrations.slice(-1)[0];
    this.defaultVersion = opts.defaultVersion ?? lastMigration?.version ?? 0;
  }

  async migrateData(
    initialData: MigrationState = this.generateInitialState(),
  ): Promise<MigrateDataResult> {
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

        let migratedData: MigrationState;
        if (isV2Migration(migration)) {
          migratedData = structuredClone(state);
          const localChangedControllers = new Set<string>();
          const returnValue = await migration.migrate(
            migratedData,
            localChangedControllers,
          );
          assertValidShape(migratedData, migration);

          if (typeof returnValue !== 'undefined') {
            throw new Error(
              'Migrator - migration returned value when none expected',
            );
          }

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

        state = migratedData;

        log.info(`Migration ${migration.version} complete`);
      } catch (error) {
        const aggregateError = new AggregateError(
          [error],
          `MetaMask Migration Error #${migration.version}`,
        );
        this.emit('error', aggregateError);
        break;
      }
    }

    const changedKeys =
      initialData.meta.version < MIGRATION_V2_START_VERSION &&
      isObject(state.data)
        ? new Set(Object.keys(state.data))
        : new Set<string>();

    for (const controllerKey of changedControllers) {
      changedKeys.add(controllerKey);
    }

    return { state, changedKeys };

    function migrationIsPending(migration: Migration): boolean {
      return migration.version > state.meta.version;
    }

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

  generateInitialState(
    data: Record<string, unknown> = {},
  ): MigrationState & { meta: { version: number; storageKind: string } } {
    return {
      data,
      meta: {
        storageKind: PersistenceManager.defaultStorageKind,
        version: this.defaultVersion,
      },
    };
  }
}
