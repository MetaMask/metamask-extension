const assert = require('assert')
const migrationTemplate = require('../../../app/scripts/migrations/030.js')
const storage = {
  meta: {},
  data: {
    NetworkController: {
      network: 'fail',
      provider: {
        chainId: 'fail',
        nickname: '',
        rpcTarget: 'https://api.myetherwallet.com/eth',
        ticker: 'ETH',
        type: 'rinkeby',
      },
    },
    PreferencesController: {
      frequentRpcListDetail: [
        {chainId: 'fail', nickname: '', rpcUrl: 'http://127.0.0.1:8545', ticker: ''},
        {chainId: '1', nickname: '', rpcUrl: 'https://api.myetherwallet.com/eth', ticker: 'ETH'},
      ],
    },
  },
}

describe('storage is migrated successfully', () => {
  it('should work', (done) => {
    migrationTemplate.migrate(storage)
      .then((migratedData) => {
        assert.equal(migratedData.meta.version, 30)
        assert.equal(migratedData.data.PreferencesController.frequentRpcListDetail[0].chainId, undefined)
        assert.equal(migratedData.data.PreferencesController.frequentRpcListDetail[1].chainId, '1')
        assert.equal(migratedData.data.NetworkController.provider.chainId, undefined)
        assert.equal(migratedData.data.NetworkController.network, undefined)
        done()
      }).catch(done)
  })
})
