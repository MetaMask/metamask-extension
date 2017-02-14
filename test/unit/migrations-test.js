const assert = require('assert')
const path = require('path')

const wallet1 = require(path.join('..', 'lib', 'migrations', '001.json'))

const migration2 = require(path.join('..', '..', 'app', 'scripts', 'migrations', '002'))
const migration3 = require(path.join('..', '..', 'app', 'scripts', 'migrations', '003'))
const migration4 = require(path.join('..', '..', 'app', 'scripts', 'migrations', '004'))
const migration11 = require(path.join('..', '..', 'app', 'scripts', 'migrations', '011'))

const oldTestRpc = 'https://rawtestrpc.metamask.io/'
const newTestRpc = 'https://testrpc.metamask.io/'

describe('wallet1 is migrated successfully', function() {
  it('should convert providers', function() {

    wallet1.data.config.provider = { type: 'etherscan', rpcTarget: null }

    return migration2.migrate(wallet1)
    .then((firstResult) => {
      assert.equal(firstResult.data.config.provider.type, 'rpc', 'provider should be rpc')
      assert.equal(firstResult.data.config.provider.rpcTarget, 'https://rpc.metamask.io/', 'main provider should be our rpc')
      firstResult.data.config.provider.rpcTarget = oldTestRpc
      return migration3.migrate(firstResult)
    }).then((secondResult) => {
      assert.equal(secondResult.data.config.provider.rpcTarget, newTestRpc)
      return migration4.migrate(secondResult)
    }).then((thirdResult) => {
      assert.equal(thirdResult.data.config.provider.rpcTarget, null)
      assert.equal(thirdResult.data.config.provider.type, 'testnet')
      return migration11.migrate(thirdResult)
    }).then((eleventhResult) => {
      assert.equal(eleventhResult.data.isDisclaimerConfirmed, null)
      assert.equal(eleventhResult.data.TOSHash, null)
    })

  })
})
