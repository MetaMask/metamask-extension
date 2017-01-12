const asyncQ = require('async-q')

class Migrator {

  constructor (opts = {}) {
    let migrations = opts.migrations || []
    this.migrations = migrations.sort((a, b) => a.version - b.version)
    let lastMigration = this.migrations.slice(-1)[0]
    // use specified defaultVersion or highest migration version
    this.defaultVersion = opts.defaultVersion || lastMigration && lastMigration.version || 0
  }

  // run all pending migrations on meta in place
  migrateData (meta = { version: this.defaultVersion }) {
    let remaining = this.migrations.filter(migrationIsPending)
    
    return (
      asyncQ.eachSeries(remaining, (migration) => migration.migrate(meta))
      .then(() => meta)
    )

    // migration is "pending" if hit has a higher
    // version number than currentVersion
    function migrationIsPending(migration) {
      return migration.version > meta.version
    }
  }

}

module.exports = Migrator
