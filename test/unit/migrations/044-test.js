import { strict as assert } from 'assert'
import migration44 from '../../../app/scripts/migrations/044'

describe('migration #44', function () {
  it('should update the version metadata', async function () {
    const oldStorage = {
      meta: {
        version: 43,
      },
      data: {},
    }

    const newStorage = await migration44.migrate(oldStorage)
    assert.deepEqual(newStorage.meta, {
      version: 44,
    })
  })

  it('should delete mkrMigrationReminderTimestamp state', async function () {
    const oldStorage = {
      meta: {},
      data: {
        AppStateController: {
          mkrMigrationReminderTimestamp: 'some timestamp',
          bar: 'baz',
        },
        foo: 'bar',
      },
    }

    const newStorage = await migration44.migrate(oldStorage)
    assert.deepEqual(newStorage.data, {
      AppStateController: {
        bar: 'baz',
      },
      foo: 'bar',
    })
  })

  it('should delete mkrMigrationReminderTimestamp state if it is null', async function () {
    const oldStorage = {
      meta: {},
      data: {
        AppStateController: {
          mkrMigrationReminderTimestamp: null,
          bar: 'baz',
        },
        foo: 'bar',
      },
    }

    const newStorage = await migration44.migrate(oldStorage)
    assert.deepEqual(newStorage.data, {
      AppStateController: {
        bar: 'baz',
      },
      foo: 'bar',
    })
  })

  it('should do nothing if mkrMigrationReminderTimestamp state does not exist', async function () {
    const oldStorage = {
      meta: {},
      data: {
        AppStateController: {
          bar: 'baz',
        },
        foo: 'bar',
      },
    }

    const newStorage = await migration44.migrate(oldStorage)
    assert.deepEqual(oldStorage.data, newStorage.data)
  })
})
