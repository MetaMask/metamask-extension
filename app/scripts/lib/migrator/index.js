const asyncQ = require('async-q')

class Migrator {

  constructor (opts = {}) {
    let migrations = opts.migrations || []
    this.migrations = migrations.sort((a, b) => a.version - b.version)
    let lastMigration = this.migrations.slice(-1)[0]
    // use specified defaultVersion or highest migration version
    this.defaultVersion = opts.defaultVersion || (lastMigration && lastMigration.version) || 0
  }

  // run all pending migrations on meta in place
  migrateData (versionedData = this.generateInitialState()) {
    let remaining = this.migrations.filter(migrationIsPending)
    
    return (
      asyncQ.eachSeries(remaining, (migration) => migration.migrate(versionedData))
      .then(() => versionedData)
    )

    // migration is "pending" if hit has a higher
    // version number than currentVersion
    function migrationIsPending(migration) {
      return migration.version > versionedData.meta.version
    }
  }

  generateInitialState (initState) {
    return {
      meta: {
        version: this.defaultVersion,
      },
      data: initState,
    }
  }

}

module.exports = Migrator
