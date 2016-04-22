var assert = require('assert')
var path = require('path')

var wallet1 = require(path.join('..', 'lib', 'migrations', '001.json'))

var migration2 = require(path.join('..', '..', 'app', 'scripts', 'migrations', '002'))
var migration3 = require(path.join('..', '..', 'app', 'scripts', 'migrations', '003'))

describe('wallet1 is migrated successfully', function() {

  it('should convert providers', function(done) {

    wallet1.data.config.provider = { type: 'etherscan', rpcTarget: null }

    var firstResult = migration2.migrate(wallet1.data)
    assert.equal(firstResult.config.provider.type, 'rpc', 'provider should be rpc')
    assert.equal(firstResult.config.provider.rpcTarget, 'https://rpc.metamask.io/', 'main provider should be our rpc')

    var oldTestRpc = 'https://rawtestrpc.metamask.io/'
    var newTestRpc = 'https://testrpc.metamask.io/'
    firstResult.config.provider.rpcTarget = oldTestRpc

    var secondResult = migration3.migrate(firstResult)
    assert.equal(secondResult.config.provider.rpcTarget, newTestRpc)

    done()
  })
})

