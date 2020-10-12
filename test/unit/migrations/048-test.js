import { strict as assert } from 'assert'
import migration48 from '../../../app/scripts/migrations/048'

const localhostNetwork = {
  rpcUrl: 'http://localhost:8545',
  chainId: '0x539',
  ticker: 'ETH',
  nickname: 'Localhost 8545',
  rpcPrefs: {},
}
const expectedPreferencesState = {
  PreferencesController: {
    frequentRpcListDetail: [{
      ...localhostNetwork,
    }],
  },
}

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
      ...expectedPreferencesState,
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
      ...expectedPreferencesState,
      NetworkController: {
        foo: 'bar',
      },
      foo: 'bar',
    })
  })

  it('should delete NetworkController.provider if the type is "localhost"', async function () {
    const oldStorage = {
      meta: {},
      data: {
        NetworkController: {
          provider: {
            type: 'localhost',
            fizz: 'buzz',
          },
          foo: 'bar',
        },
        foo: 'bar',
      },
    }

    const newStorage = await migration48.migrate(oldStorage)
    assert.deepEqual(newStorage.data, {
      ...expectedPreferencesState,
      NetworkController: {
        foo: 'bar',
      },
      foo: 'bar',
    })
  })

  it('should re-key NetworkController.provider.rpcTarget to rpcUrl if the type is not "rpc" or "localhost"', async function () {
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
      ...expectedPreferencesState,
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

  it('should do nothing to NetworkController if affected state does not exist', async function () {
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
    assert.deepEqual(
      { ...oldStorage.data, ...expectedPreferencesState },
      { ...newStorage.data, ...expectedPreferencesState },
    )
  })

  it('should add frequentRpcListDetail item to beginning of list', async function () {
    const existingList = [
      { rpcUrl: 'foo', chainId: '0x1' },
      { rpcUrl: 'bar', chainId: '0x2' },
    ]

    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          frequentRpcListDetail: [
            ...existingList,
          ],
        },
        foo: 'bar',
      },
    }

    const newStorage = await migration48.migrate(oldStorage)
    assert.deepEqual(newStorage.data, {
      PreferencesController: {
        frequentRpcListDetail: [
          { ...localhostNetwork },
          ...existingList,
        ],
      },
      foo: 'bar',
    })
  })
})
