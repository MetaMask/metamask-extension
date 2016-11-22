var assert = require('assert')
var linkGen = require('../../ui/lib/account-link')

describe('account-link', function() {

  it('adds testnet prefix to ropsten test network', function() {
    var result = linkGen('account', '3')
    assert.notEqual(result.indexOf('testnet'), -1, 'testnet injected')
    assert.notEqual(result.indexOf('account'), -1, 'account included')
  })

})
