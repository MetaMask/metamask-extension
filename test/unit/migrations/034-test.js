const assert = require('assert')
const migration34 = require('../../../app/scripts/migrations/034')

describe('migration #34', () => {
  it('should update the version metadata', (done) => {
    const oldStorage = {
      'meta': {
        'version': 33,
      },
      'data': {},
    }

    migration34.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.meta, {
          'version': 34,
        })
        done()
      })
      .catch(done)
  })

  it('should set migratedPrivacyMode & privacyMode if featureFlags.privacyMode was false', (done) => {
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

    migration34.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data.PreferencesController, {
          'migratedPrivacyMode': true,
          'featureFlags': {
            'privacyMode': true,
          },
        })
        done()
      })
      .catch(done)
  })

  it('should NOT change any state if migratedPrivacyMode is already set to true', (done) => {
    const oldStorage = {
      'meta': {},
      'data': {
        'PreferencesController': {
          'migratedPrivacyMode': true,
          'featureFlags': {
            'privacyMode': true,
          },
        },
      },
    }

    migration34.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, oldStorage.data)
        done()
      })
      .catch(done)
  })

  it('should NOT change any state if migratedPrivacyMode is already set to false', (done) => {
    const oldStorage = {
      'meta': {},
      'data': {
        'PreferencesController': {
          'migratedPrivacyMode': false,
          'featureFlags': {
            'privacyMode': true,
          },
        },
      },
    }

    migration34.migrate(oldStorage)
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

    migration34.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, oldStorage.data)
        done()
      })
      .catch(done)
  })

  it('should NOT change any state if featureFlags.privacyMode is already true', (done) => {
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

    migration34.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, oldStorage.data)
        done()
      })
      .catch(done)
  })
})
