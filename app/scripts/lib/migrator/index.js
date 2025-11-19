import EventEmitter from 'events';
import log from 'loglevel';

/**
 * @typedef {object} Migration
 * @property {number} version - The migration version
 * @property {Function} migrate - Returns a promise of the migrated data
 */

/**
 * @typedef {object} MigratorOptions
 * @property {Array<Migration>} [migrations] - The list of migrations to apply
 * @property {number} [defaultVersion] - The version to use in the initial state
 */

const MIGRATION_V2_START_VERSION = 177;

export default class Migrator extends EventEmitter {
  /**
   * @param {MigratorOptions} opts
   */
  constructor(opts = {}) {
    super();
    const migrations = opts.migrations || [];
    // sort migrations by version
    this.migrations = migrations.sort((a, b) => a.version - b.version);
    // grab migration with highest version
    const lastMigration = this.migrations.slice(-1)[0];
    // use specified defaultVersion or highest migration version
    this.defaultVersion =
      opts.defaultVersion || (lastMigration && lastMigration.version) || 0;
  }

  // run all pending migrations on meta in place
  async migrateData(initialData = this.generateInitialState()) {
    // legacy migrations (before 177) don't track changed controllers,
    // so we assume all controllers changed
    /** @type {Set<string>} */
    const changedControllers =
      initialData.meta.version < MIGRATION_V2_START_VERSION
        ? new Set(Object.keys(initialData.data))
        : new Set();

    let state = initialData;

    for (const migration of this.migrations) {
      if (!migrationIsPending(migration)) {
        continue;
      }

      try {
        log.info(`Running migration ${migration.version}...`);

        // attempt migration and validate
        /** @type {{data: object, meta: {version: number}}} */
        let migratedData;
        if (migration.version < MIGRATION_V2_START_VERSION) {
          migratedData = await migration.migrate(state);
          assertValidShape(migratedData, migration);
        } else {
          // in version two we expect migrations to report which controllers
          // changed, and two directly mutate the `versionedData` object
          migratedData = structuredClone(state);
          /** @type {Set<string>} */
          const localChangedControllers = new Set();
          const returnValue = await migration.migrate(
            migratedData,
            localChangedControllers,
          );

          // migrations should mutate in place and must not return new state
          assertValidShape(migratedData, migration);

          if (typeof returnValue !== 'undefined') {
            throw new Error(
              'Migrator - migration returned value when none expected',
            );
          }
          // a migration that doesn't change any controllers is invalid
          if (changedControllers.size === 0) {
            throw new Error(
              'Migrator - migration did not report any changed controllers',
            );
          }

          for (const controllerKey of localChangedControllers) {
            changedControllers.add(controllerKey);
          }
        }
        // accept the migration as good
        state = migratedData;

        log.info(`Migration ${migration.version} complete`);
      } catch (err) {
        // rewrite error message to add context without clobbering stack
        const originalErrorMessage = err.message;
        err.message = `MetaMask Migration Error #${migration.version}: ${originalErrorMessage}`;
        // emit error instead of throw so as to not break the run (gracefully fail)
        this.emit('error', err);
        // stop migrating and use state as is
        break;
      }
    }

    const changedKeys =
      initialData.meta.version < MIGRATION_V2_START_VERSION
        ? // we had to run older migrations, so assume all controllers changed
          new Set(Object.keys(state.data))
        : new Set();

    for (const controllerKey of changedControllers) {
      changedKeys.add(controllerKey);
    }

    return { state, changedKeys };

    /**
     * Returns whether or not the migration is pending
     *
     * A migration is considered "pending" if it has a higher
     * version number than the current version.
     *
     * @param {Migration} migration
     * @returns {boolean}
     */
    function migrationIsPending(migration) {
      return migration.version > state.meta.version;
    }

    /**
     * Throws if the migrated data does not have the correct shape.
     *
     * @param {{data: object; meta: { version: number}}} migratedData
     * @param {Migration} migration
     */
    function assertValidShape(migratedData, migration) {
      if (!migratedData.data) {
        throw new Error('Migrator - migration returned empty data');
      }
      if (
        migratedData.version !== undefined &&
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
   * @param {object} [data] - The data for the initial state
   * @returns {{data: object, meta: {version: number}}}
   */
  generateInitialState(data) {
    return {
      data,
      meta: {
        storageKind: 'data',
        version: this.defaultVersion,
      },
    };
  }
}
