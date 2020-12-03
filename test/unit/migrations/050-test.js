import { strict as assert } from 'assert'
import migration50 from '../../../app/scripts/migrations/050'

describe('migration #50', function () {
  it('should update the version metadata', async function () {
    const oldStorage = {
      meta: {
        version: 49,
      },
      data: {},
    }

    const newStorage = await migration50.migrate(oldStorage)
    assert.deepEqual(newStorage.meta, {
      version: 50,
    })
  })
})
