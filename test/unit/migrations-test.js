var test = require('tape')
var path = require('path')

var wallet1 = require(path.join('..', 'lib', 'migrations', '001.json'))
var migration2 = require(path.join('..', '..', 'app', 'scripts', 'migrations', '002'))

test('wallet1 is migrated successfully', function(t) {

  var result = migration2.migrate(wallet1.data)
  t.equal(result.config.provider.type, 'rpc', 'provider should be rpc')
  t.equal(result.config.provider.rpcTarget, 'https://rpc.metamask.io/', 'provider should be our rpc')

})

