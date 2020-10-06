import { strict as assert } from 'assert'
import migration48 from '../../../app/scripts/migrations/048'

describe('migration #48', function () {
  it('should update the version metadata', async function () {
    const oldStorage = {
      'meta': {
        'version': 47,
      },
      'data': {},
    }

    const newStorage = await migration48.migrate(oldStorage)
    assert.deepEqual(newStorage.meta, {
      'version': 48,
    })
  })

  it('should delete NetworkController.settings', async function () {
    const oldStorage = {
      meta: {},
      data: {
        NetworkController: {
          settings: {
            fizz: 'buzz',
          },
          provider: {
            type: 'notRpc',
          },
        },
        foo: 'bar',
      },
    }

    const newStorage = await migration48.migrate(oldStorage)
    assert.deepEqual(newStorage.data, {
      NetworkController: {
        provider: {
          type: 'notRpc',
        },
      },
      foo: 'bar',
    })
  })

  it('should delete NetworkController.provider if the type is "rpc"', async function () {
    const oldStorage = {
      meta: {},
      data: {
        NetworkController: {
          provider: {
            type: 'rpc',
            fizz: 'buzz',
          },
          foo: 'bar',
        },
        foo: 'bar',
      },
    }

    const newStorage = await migration48.migrate(oldStorage)
    assert.deepEqual(newStorage.data, {
      NetworkController: {
        foo: 'bar',
      },
      foo: 'bar',
    })
  })

  it('should re-key NetworkController.provider.rpcTarget to rpcUrl if the type is not "rpc"', async function () {
    const oldStorage = {
      meta: {},
      data: {
        NetworkController: {
          provider: {
            type: 'someType',
            rpcTarget: 'foo.xyz',
            fizz: 'buzz',
          },
          foo: 'bar',
        },
        foo: 'bar',
      },
    }

    const newStorage = await migration48.migrate(oldStorage)
    assert.deepEqual(newStorage.data, {
      NetworkController: {
        foo: 'bar',
        provider: {
          type: 'someType',
          rpcUrl: 'foo.xyz',
          fizz: 'buzz',
        },
      },
      foo: 'bar',
    })
  })

  it('should do nothing if affected state does not exist', async function () {
    const oldStorage = {
      meta: {},
      data: {
        NetworkController: {
          provider: {
            type: 'notRpc',
          },
        },
        foo: 'bar',
      },
    }

    const newStorage = await migration48.migrate(oldStorage)
    assert.deepEqual(oldStorage.data, newStorage.data)
  })

  it('should do nothing if state is empty', async function () {
    const oldStorage = {
      meta: {},
      data: {},
    }

    const newStorage = await migration48.migrate(oldStorage)
    assert.deepEqual(oldStorage.data, newStorage.data)
  })
})
