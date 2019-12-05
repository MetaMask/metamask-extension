const assert = require('assert')
const migration36 = require('../../../app/scripts/migrations/036')

describe('migration #36', () => {
  it('should update the version metadata', (done) => {
    const oldStorage = {
      'meta': {
        'version': 35,
      },
      'data': {},
    }

    migration36.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.meta, {
          'version': 36,
        })
        done()
      })
      .catch(done)
  })

  it('should remove privacyMode if featureFlags.privacyMode was false', (done) => {
    const oldStorage = {
      'meta': {},
      'data': {
        'PreferencesController': {
          'featureFlags': {
            'privacyMode': false,
          },
        },
      },
    }

    migration36.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data.PreferencesController, {
          'featureFlags': {
          },
        })
        done()
      })
      .catch(done)
  })

  it('should remove privacyMode if featureFlags.privacyMode was true', (done) => {
    const oldStorage = {
      'meta': {},
      'data': {
        'PreferencesController': {
          'featureFlags': {
            'privacyMode': true,
          },
        },
      },
    }

    migration36.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data.PreferencesController, {
          'featureFlags': {
          },
        })
        done()
      })
      .catch(done)
  })

  it('should NOT change any state if privacyMode does not exist', (done) => {
    const oldStorage = {
      'meta': {},
      'data': {
        'PreferencesController': {
          'migratedPrivacyMode': true,
          'featureFlags': {
          },
        },
      },
    }

    migration36.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, oldStorage.data)
        done()
      })
      .catch(done)
  })

  it('should NOT change any state if PreferencesController is missing', (done) => {
    const oldStorage = {
      'meta': {},
      'data': {},
    }

    migration36.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, oldStorage.data)
        done()
      })
      .catch(done)
  })

  it('should NOT change any state if featureFlags is missing', (done) => {
    const oldStorage = {
      'meta': {},
      'data': {
        'PreferencesController': {
        },
      },
    }

    migration36.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, oldStorage.data)
        done()
      })
      .catch(done)
  })
})
