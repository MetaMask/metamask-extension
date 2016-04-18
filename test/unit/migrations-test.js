var assert = require('assert')
var path = require('path')

var wallet1 = require(path.join('..', 'lib', 'migrations', '001.json'))
var migration2 = require(path.join('..', '..', 'app', 'scripts', 'migrations', '002'))

describe('wallet1 is migrated successfully', function() {

  it('should convert etherscan provider', function(done) {
    var result = migration2.migrate(wallet1.data)
    assert.equal(result.config.provider.type, 'rpc', 'provider should be rpc')
    assert.equal(result.config.provider.rpcTarget, 'https://rpc.metamask.io/', 'provider should be our rpc')
    done()
  })
})

