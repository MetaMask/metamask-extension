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
  async migrateData(versionedData = this.generateInitialState()) {
    // get all migrations that have not yet been run
    const pendingMigrations = this.migrations.filter(migrationIsPending);

    // perform each migration
    for (const migration of pendingMigrations) {
      try {
        log.info(`Running migration ${migration.version}...`);

        // attempt migration and validate
        const migratedData = await migration.migrate(versionedData);
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
        // accept the migration as good
        // eslint-disable-next-line no-param-reassign
        versionedData = migratedData;

        log.info(`Migration ${migration.version} complete`);
      } catch (err) {
        // rewrite error message to add context without clobbering stack
        const originalErrorMessage = err.message;
        err.message = `MetaMask Migration Error #${migration.version}: ${originalErrorMessage}`;
        // emit error instead of throw so as to not break the run (gracefully fail)
        this.emit('error', err);
        // stop migrating and use state as is
        return versionedData;
      }
    }

    return versionedData;

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
      return migration.version > versionedData.meta.version;
    }
  }

  /**
   * Returns the initial state for the migrator
   *
   * @param {object} [data] - The data for the initial state
   * @returns {{meta: {version: number}, data: any}}
   */
  generateInitialState(data) {
    return {
      meta: {
        version: this.defaultVersion,
      },
      data,
    };
  }
}
