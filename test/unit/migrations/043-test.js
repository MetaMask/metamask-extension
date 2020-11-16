import { strict as assert } from 'assert'
import migration43 from '../../../app/scripts/migrations/043'

describe('migration #43', function () {
  it('should update the version metadata', async function () {
    const oldStorage = {
      meta: {
        version: 42,
      },
      data: {},
    }

    const newStorage = await migration43.migrate(oldStorage)
    assert.deepEqual(newStorage.meta, {
      version: 43,
    })
  })

  it('should delete currentAccountTab state', async function () {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          currentAccountTab: 'history',
          bar: 'baz',
        },
        foo: 'bar',
      },
    }

    const newStorage = await migration43.migrate(oldStorage)
    assert.deepEqual(newStorage.data, {
      PreferencesController: {
        bar: 'baz',
      },
      foo: 'bar',
    })
  })

  it('should do nothing if currentAccountTab state does not exist', async function () {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          bar: 'baz',
        },
        foo: 'bar',
      },
    }

    const newStorage = await migration43.migrate(oldStorage)
    assert.deepEqual(oldStorage.data, newStorage.data)
  })
})
